import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../backend/app.js';
import connectDB from '../backend/db.js';
import User from '../backend/models/user.model.js';
import ParkingSpot from '../backend/models/parkingSpot.model.js';
import Booking from '../backend/models/booking.model.js';
import Payment from '../backend/models/payment.model.js';

describe('Stage 6: Platform Governance & Admin RBAC Suite', () => {
  let adminUser;
  let adminCookie;
  let driverUser;
  let driverCookie;
  let hostUser;
  let hostCookie;
  let testSpot;

  const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

  beforeAll(async () => {
    await connectDB();

    // Clean up any test residue
    await User.deleteMany({
      email: {
        $in: [
          'admin_test@platform.com',
          'driver_test@platform.com',
          'host_test@platform.com',
        ],
      },
    });
    await ParkingSpot.deleteMany({ address: '99 Governance Way, Admin Center' });

    // 1. Create Admin Account
    adminUser = await User.create({
      username: 'platform_superadmin',
      email: 'admin_test@platform.com',
      password: 'Password123!',
      role: 'admin',
    });
    const adminToken = jwt.sign({ userId: adminUser._id }, jwtSecret, { expiresIn: '1d' });
    adminCookie = `jwt=${adminToken}`;

    // 2. Create Driver Account
    driverUser = await User.create({
      username: 'standard_driver_user',
      email: 'driver_test@platform.com',
      password: 'Password123!',
      role: 'driver',
    });
    const driverToken = jwt.sign({ userId: driverUser._id }, jwtSecret, { expiresIn: '1d' });
    driverCookie = `jwt=${driverToken}`;

    // 3. Create Host Account
    hostUser = await User.create({
      username: 'standard_host_user',
      email: 'host_test@platform.com',
      password: 'Password123!',
      role: 'host',
    });
    const hostToken = jwt.sign({ userId: hostUser._id }, jwtSecret, { expiresIn: '1d' });
    hostCookie = `jwt=${hostToken}`;

    // 4. Create Spot for Moderation Testing
    testSpot = await ParkingSpot.create({
      title: 'Governance Test Bay',
      spotType: 'p2p',
      address: '99 Governance Way, Admin Center',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139],
      },
      pricePerHour: 15,
      isAvailable: true,
      owner: hostUser._id,
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      email: {
        $in: [
          'admin_test@platform.com',
          'driver_test@platform.com',
          'host_test@platform.com',
        ],
      },
    });
    await ParkingSpot.deleteMany({ address: '99 Governance Way, Admin Center' });
  });

  describe('Security & Access Control Enforcement', () => {
    it('rejects unauthenticated requests to /api/admin/metrics with HTTP 401', async () => {
      const res = await request(app).get('/api/admin/metrics');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Not authorized');
    });

    it('rejects driver role with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Cookie', [driverCookie]);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin role required');
    });

    it('rejects host role with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Cookie', [hostCookie]);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin role required');
    });
  });

  describe('Platform Analytics & Executive Metrics', () => {
    it('returns comprehensive platform metrics and economic breakdown for admin', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('metrics');
      expect(res.body.metrics).toHaveProperty('users');
      expect(res.body.metrics).toHaveProperty('inventory');
      expect(res.body.metrics).toHaveProperty('financials');
      expect(res.body.metrics.users.admins).toBeGreaterThanOrEqual(1);
      expect(res.body.metrics.financials).toHaveProperty('grossMerchandiseValue');
      expect(res.body.metrics.financials).toHaveProperty('platformRevenue');
      expect(res.body.metrics.financials).toHaveProperty('hostLiabilities');
      expect(res.body).toHaveProperty('recentActivity');
    });
  });

  describe('User Directory & RBAC Governance', () => {
    it('retrieves paginated user directory with search filtering', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=driver_test&limit=10')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.users[0].email).toBe('driver_test@platform.com');
      // Passwords must never be exposed
      expect(res.body.users[0].password).toBeUndefined();
    });

    it('rejects invalid role assignment with HTTP 400', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${driverUser._id}/role`)
        .set('Cookie', [adminCookie])
        .send({ role: 'super_hacker' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Role must be one of');
    });

    it('prevents administrator self-demotion lockout with HTTP 400', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${adminUser._id}/role`)
        .set('Cookie', [adminCookie])
        .send({ role: 'driver' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot revoke your own administrative privileges');
    });

    it('successfully updates user role from driver to host', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${driverUser._id}/role`)
        .set('Cookie', [adminCookie])
        .send({ role: 'host' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('host');

      // Verify DB persistence
      const updatedUser = await User.findById(driverUser._id);
      expect(updatedUser.role).toBe('host');
    });
  });

  describe('Parking Spot Moderation & Content Safety', () => {
    it('retrieves paginated parking spots across all hosts', async () => {
      const res = await request(app)
        .get('/api/admin/spots?limit=10')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('spots');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.spots)).toBe(true);
    });

    it('allows administrator to suspend a spot listing', async () => {
      const res = await request(app)
        .put(`/api/admin/spots/${testSpot._id}/status`)
        .set('Cookie', [adminCookie])
        .send({ isAvailable: false });

      expect(res.status).toBe(200);
      expect(res.body.spot.isAvailable).toBe(false);

      const dbSpot = await ParkingSpot.findById(testSpot._id);
      expect(dbSpot.isAvailable).toBe(false);
    });

    it('allows administrator to re-activate a suspended spot listing', async () => {
      const res = await request(app)
        .put(`/api/admin/spots/${testSpot._id}/status`)
        .set('Cookie', [adminCookie])
        .send({ isAvailable: true });

      expect(res.status).toBe(200);
      expect(res.body.spot.isAvailable).toBe(true);

      const dbSpot = await ParkingSpot.findById(testSpot._id);
      expect(dbSpot.isAvailable).toBe(true);
    });
  });

  describe('Global Bookings Audit Trail', () => {
    it('retrieves platform booking audit logs with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/bookings?limit=5')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('bookings');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.bookings)).toBe(true);
    });
  });
});

