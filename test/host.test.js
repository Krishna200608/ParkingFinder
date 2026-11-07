import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../backend/app.js';
import connectDB from '../backend/db.js';
import User from '../backend/models/user.model.js';
import ParkingSpot from '../backend/models/parkingSpot.model.js';
import Booking from '../backend/models/booking.model.js';

describe('Stage 5: Host Marketplace & Management Suite', () => {
  let hostUser;
  let hostCookie;
  let driverUser;
  let driverCookie;
  let hostSpot;

  const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

  beforeAll(async () => {
    await connectDB();

    // Clean up previous test artifacts
    await User.deleteMany({ email: { $in: ['marketplace_host@test.com', 'marketplace_driver@test.com'] } });
    await ParkingSpot.deleteMany({ address: '88 Marketplace Plaza, Metro City' });

    // 1. Create Host
    hostUser = await User.create({
      username: 'marketplace_host',
      email: 'marketplace_host@test.com',
      password: 'Password123!',
      role: 'host',
    });
    const hostToken = jwt.sign({ userId: hostUser._id }, jwtSecret, { expiresIn: '1d' });
    hostCookie = `jwt=${hostToken}`;

    // 2. Create Driver
    driverUser = await User.create({
      username: 'marketplace_driver',
      email: 'marketplace_driver@test.com',
      password: 'Password123!',
      role: 'driver',
    });
    const driverToken = jwt.sign({ userId: driverUser._id }, jwtSecret, { expiresIn: '1d' });
    driverCookie = `jwt=${driverToken}`;

    // 3. Create Host's Parking Spot
    hostSpot = await ParkingSpot.create({
      title: 'Plaza Executive Space',
      spotType: 'p2p',
      address: '88 Marketplace Plaza, Metro City',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139],
      },
      pricePerHour: 20,
      isAvailable: true,
      owner: hostUser._id,
    });
  });

  afterAll(async () => {
    await Booking.deleteMany({ host: hostUser._id });
    await ParkingSpot.deleteMany({ owner: hostUser._id });
    await User.deleteMany({ _id: { $in: [hostUser._id, driverUser._id] } });
  });

  it('retrieves host listings with aggregated earnings from GET /api/spots/my', async () => {
    const res = await request(app)
      .get('/api/spots/my')
      .set('Cookie', hostCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const foundSpot = res.body.find((s) => s._id.toString() === hostSpot._id.toString());
    expect(foundSpot).toBeDefined();
    expect(foundSpot.totalEarnings).toBeDefined();
    expect(foundSpot.totalBookings).toBeDefined();
  });

  it('allows host to toggle listing availability via PUT /api/spots/:id', async () => {
    const res = await request(app)
      .put(`/api/spots/${hostSpot._id}`)
      .set('Cookie', hostCookie)
      .send({ isAvailable: false });

    expect(res.status).toBe(200);
    expect(res.body.isAvailable).toBe(false);

    // Verify in DB
    const updated = await ParkingSpot.findById(hostSpot._id);
    expect(updated.isAvailable).toBe(false);

    // Toggle back to active
    await request(app)
      .put(`/api/spots/${hostSpot._id}`)
      .set('Cookie', hostCookie)
      .send({ isAvailable: true });
  });

  it('retrieves incoming reservations for host spots via GET /api/bookings/host', async () => {
    // Create an incoming booking from driverUser on hostSpot
    const startTime = new Date(Date.now() + 200000);
    const endTime = new Date(Date.now() + 207200000);

    const booking = await Booking.create({
      user: driverUser._id,
      spot: hostSpot._id,
      host: hostUser._id,
      startTime,
      endTime,
      durationHours: 2,
      pricePerHourSnapshot: 20,
      totalCost: 40,
      totalAmount: 40,
      status: 'confirmed',
      paymentStatus: 'unpaid_demo',
      paymentMethod: 'demo',
    });

    const res = await request(app)
      .get('/api/bookings/host')
      .set('Cookie', hostCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const foundBooking = res.body.find((b) => b._id.toString() === booking._id.toString());
    expect(foundBooking).toBeDefined();
    expect(foundBooking.user.username).toBe('marketplace_driver');
    expect(foundBooking.totalCost || foundBooking.totalAmount).toBe(40);
  });

  it('prevents deletion of parking spot with active reservations (HTTP 400)', async () => {
    const res = await request(app)
      .delete(`/api/spots/${hostSpot._id}`)
      .set('Cookie', hostCookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('active or upcoming bookings');
  });

  it('allows deletion of parking spot once all bookings are cancelled or removed', async () => {
    // Cancel the active booking
    await Booking.deleteMany({ spot: hostSpot._id });

    const res = await request(app)
      .delete(`/api/spots/${hostSpot._id}`)
      .set('Cookie', hostCookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('removed successfully');

    // Confirm spot is gone from database
    const checkSpot = await ParkingSpot.findById(hostSpot._id);
    expect(checkSpot).toBeNull();
  });
});
