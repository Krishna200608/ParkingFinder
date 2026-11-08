import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const SCREENSHOTS_DIR = path.resolve('screenshots');
const TEMP_PROFILE_DIR = path.join(process.env.TEMP, 'chrome_screenshot_profile_' + Date.now());

async function main() {
  const { default: connectDB } = await import('../backend/db.js');
  await connectDB();
  const { default: User } = await import('../backend/models/user.model.js');
  const { default: ParkingSpot } = await import('../backend/models/parkingSpot.model.js');
  const { default: Booking } = await import('../backend/models/booking.model.js');

  const driverUser = await User.findOne({ email: 'krishnasikheriya001@gmail.com' });
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.findOne({ email: 'krishna@gmail.com' });
    if (adminUser) {
      adminUser.role = 'admin';
      await adminUser.save();
    }
  }

  // Ensure driver has sample reservation cards to showcase on dashboard
  const userBookings = await Booking.find({ user: driverUser._id, status: { $ne: 'cancelled' } });
  if (userBookings.length === 0) {
    const spots = await ParkingSpot.find().limit(2);
    if (spots.length >= 2) {
      const now = new Date();
      const t1Start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const t1End = new Date(t1Start.getTime() + 60 * 60 * 1000);
      const t2Start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const t2End = new Date(t2Start.getTime() + 2 * 60 * 60 * 1000);

      await Booking.create([
        {
          user: driverUser._id,
          spot: spots[0]._id,
          host: spots[0].owner,
          startTime: t1Start,
          endTime: t1End,
          durationHours: 1,
          pricePerHourSnapshot: spots[0].pricePerHour || 8,
          totalCost: spots[0].pricePerHour || 8,
          status: 'confirmed',
          paymentStatus: 'unpaid_demo',
        },
        {
          user: driverUser._id,
          spot: spots[1]._id,
          host: spots[1].owner,
          startTime: t2Start,
          endTime: t2End,
          durationHours: 2,
          pricePerHourSnapshot: spots[1].pricePerHour || 15,
          totalCost: (spots[1].pricePerHour || 15) * 2,
          status: 'confirmed',
          paymentStatus: 'paid',
          paidAt: new Date(),
        }
      ]);
      console.log('Populated sample reservations for dashboard presentation.');
    }
  }

  const driverToken = jwt.sign({ userId: driverUser._id }, JWT_SECRET, { expiresIn: '1d' });
  const adminToken = adminUser ? jwt.sign({ userId: adminUser._id }, JWT_SECRET, { expiresIn: '1d' }) : driverToken;

  console.log('Driver user:', driverUser?.username);
  console.log('Admin user:', adminUser ? adminUser.username : 'None');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${TEMP_PROFILE_DIR}`,
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--disable-gpu',
    '--disable-extensions',
    'about:blank'
  ]);

  let endpoint = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      const data = await res.json();
      const pageTarget = data?.find(d => d.type === 'page' && d.webSocketDebuggerUrl);
      if (pageTarget) {
        endpoint = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!endpoint) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome debugging endpoint');
  }

  console.log('Connected to CDP endpoint');
  const ws = new WebSocket(endpoint);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result || msg.error);
      pending.delete(msg.id);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await send('Page.enable');
  await send('Network.enable');

  const capture = async (url, token, userInfo, filename, waitMs = 3000) => {
    console.log(`Navigating to ${url}...`);

    if (token) {
      await send('Network.setCookie', {
        name: 'jwt',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      });
    } else {
      await send('Network.clearBrowserCookies');
    }

    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1200));

    if (userInfo) {
      await send('Runtime.evaluate', {
        expression: `localStorage.setItem('userInfo', JSON.stringify(${JSON.stringify(userInfo)}))`
      });
      await send('Page.navigate', { url });
    }

    await new Promise(r => setTimeout(r, waitMs));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${filePath} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
  };

  // 1. Homepage
  await capture('http://localhost:3000/', null, null, 'homepage.png', 2000);

  // 2. Map Page
  await capture('http://localhost:3000/find', null, null, 'map-page.png', 4000);

  // 3. Driver Dashboard with active reservation cards
  await capture('http://localhost:3000/dashboard', driverToken, {
    _id: driverUser._id.toString(),
    username: driverUser.username,
    email: driverUser.email,
    role: driverUser.role,
  }, 'dashboard.png', 3500);

  // 4. User Profile
  await capture('http://localhost:3000/profile', driverToken, {
    _id: driverUser._id.toString(),
    username: driverUser.username,
    email: driverUser.email,
    role: driverUser.role,
  }, 'profile.png', 2500);

  // 5. Admin Governance Portal
  if (adminUser) {
    await capture('http://localhost:3000/admin', adminToken, {
      _id: adminUser._id.toString(),
      username: adminUser.username,
      email: adminUser.email,
      role: 'admin',
    }, 'admin-dashboard.png', 3500);
  }

  // 6. Pricing & Simulator
  await capture('http://localhost:3000/pricing', null, null, 'pricing.png', 2500);

  ws.close();
  chromeProc.kill();
  try {
    fs.rmSync(TEMP_PROFILE_DIR, { recursive: true, force: true });
  } catch {}

  console.log('All screenshots captured successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
