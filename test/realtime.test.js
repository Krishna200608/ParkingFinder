import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../backend/app.js';
import connectDB from '../backend/db.js';
import User from '../backend/models/user.model.js';
import ParkingSpot from '../backend/models/parkingSpot.model.js';
import Booking from '../backend/models/booking.model.js';
import * as pusherUtils from '../backend/utils/pusher.js';

describe('Stage 8: Real-Time Availability & Live Events Suite', () => {
  let driverUser;
  let driverCookie;
  let hostUser;
  let hostCookie;
  let adminUser;
  let adminCookie;
  let testSpot;

  const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

  beforeAll(async () => {
    await connectDB();

    // Clean up test residue
    await User.deleteMany({
      email: {
        $in: [
          'realtime_driver@test.com',
          'realtime_host@test.com',
          'realtime_admin@test.com',
        ],
      },
    });
    await ParkingSpot.deleteMany({ address: '200 Live Stream Way, Realtime City' });

    // 1. Create Driver
    driverUser = await User.create({
      username: 'realtime_driver_user',
      email: 'realtime_driver@test.com',
      password: 'Password123!',
      role: 'driver',
    });
    const driverToken = jwt.sign({ userId: driverUser._id }, jwtSecret, { expiresIn: '1d' });
    driverCookie = `jwt=${driverToken}`;

    // 2. Create Host
    hostUser = await User.create({
      username: 'realtime_host_user',
      email: 'realtime_host@test.com',
      password: 'Password123!',
      role: 'host',
    });
    const hostToken = jwt.sign({ userId: hostUser._id }, jwtSecret, { expiresIn: '1d' });
    hostCookie = `jwt=${hostToken}`;

    // 3. Create Admin
    adminUser = await User.create({
      username: 'realtime_admin_user',
      email: 'realtime_admin@test.com',
      password: 'Password123!',
      role: 'admin',
    });
    const adminToken = jwt.sign({ userId: adminUser._id }, jwtSecret, { expiresIn: '1d' });
    adminCookie = `jwt=${adminToken}`;

    // 4. Create Spot
    testSpot = await ParkingSpot.create({
      title: 'Live WebSocket Monitored Bay',
      spotType: 'p2p',
      address: '200 Live Stream Way, Realtime City',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139],
      },
      pricePerHour: 25,
      isAvailable: true,
      owner: hostUser._id,
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      email: {
        $in: [
          'realtime_driver@test.com',
          'realtime_host@test.com',
          'realtime_admin@test.com',
        ],
      },
    });
    await ParkingSpot.deleteMany({ address: '200 Live Stream Way, Realtime City' });
    await Booking.deleteMany({ spot: testSpot._id });
  });

  describe('Pusher Event Infrastructure & Fallback Simulation', () => {
    it('defines standardized channel and event names', () => {
      expect(pusherUtils.CHANNELS.GLOBAL_MARKETPLACE).toBe('marketplace-spots');
      expect(pusherUtils.CHANNELS.spotChannel('spot123')).toBe('spot-spot123');
      expect(pusherUtils.EVENTS.BOOKING_CREATED).toBe('booking:created');
      expect(pusherUtils.EVENTS.BOOKING_CANCELLED).toBe('booking:cancelled');
      expect(pusherUtils.EVENTS.SPOT_UPDATED).toBe('spot:updated');
    });

    it('safely simulates broadcast events without throwing when Pusher keys are absent', async () => {
      const result = await pusherUtils.triggerLiveEvent(
        pusherUtils.CHANNELS.spotChannel(testSpot._id),
        pusherUtils.EVENTS.BOOKING_CREATED,
        { spotId: testSpot._id, action: 'reserved' }
      );

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });
  });

  describe('End-to-End Real-Time Controller Triggers', () => {
    let createdBookingId;

    it('triggers real-time booking:created event on reservation commit', async () => {
      const spy = vi.spyOn(pusherUtils, 'triggerLiveEvent');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(10, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(12, 0, 0, 0);

      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [driverCookie])
        .send({
          spotId: testSpot._id,
          startTime: tomorrow.toISOString(),
          endTime: tomorrowEnd.toISOString(),
        });

      expect(res.status).toBe(201);
      createdBookingId = res.body.booking._id;

      // Verify that triggerLiveEvent was called with BOOKING_CREATED
      expect(spy).toHaveBeenCalledWith(
        pusherUtils.CHANNELS.spotChannel(testSpot._id),
        pusherUtils.EVENTS.BOOKING_CREATED,
        expect.objectContaining({
          spotId: testSpot._id.toString(),
          status: 'confirmed',
        })
      );

      spy.mockRestore();
    });

    it('triggers real-time booking:cancelled event when reservation is cancelled', async () => {
      const spy = vi.spyOn(pusherUtils, 'triggerLiveEvent');

      const res = await request(app)
        .put(`/api/bookings/${createdBookingId}/cancel`)
        .set('Cookie', [driverCookie])
        .send({ reason: 'Trip rescheduled' });

      expect(res.status).toBe(200);

      expect(spy).toHaveBeenCalledWith(
        pusherUtils.CHANNELS.spotChannel(testSpot._id),
        pusherUtils.EVENTS.BOOKING_CANCELLED,
        expect.objectContaining({
          spotId: testSpot._id,
          status: 'cancelled',
        })
      );

      spy.mockRestore();
    });

    it('triggers real-time spot:updated event when host toggles availability', async () => {
      const spy = vi.spyOn(pusherUtils, 'triggerLiveEvent');

      const res = await request(app)
        .put(`/api/spots/${testSpot._id}`)
        .set('Cookie', [hostCookie])
        .send({ isAvailable: false });

      expect(res.status).toBe(200);

      expect(spy).toHaveBeenCalledWith(
        pusherUtils.CHANNELS.spotChannel(testSpot._id),
        pusherUtils.EVENTS.SPOT_UPDATED,
        expect.objectContaining({
          spotId: testSpot._id,
          isAvailable: false,
        })
      );

      spy.mockRestore();
    });

    it('triggers real-time spot:updated event when admin moderates spot status', async () => {
      const spy = vi.spyOn(pusherUtils, 'triggerLiveEvent');

      const res = await request(app)
        .put(`/api/admin/spots/${testSpot._id}/status`)
        .set('Cookie', [adminCookie])
        .send({ isAvailable: true });

      expect(res.status).toBe(200);

      expect(spy).toHaveBeenCalledWith(
        pusherUtils.CHANNELS.spotChannel(testSpot._id),
        pusherUtils.EVENTS.SPOT_UPDATED,
        expect.objectContaining({
          spotId: testSpot._id,
          isAvailable: true,
        })
      );

      spy.mockRestore();
    });
  });
});
