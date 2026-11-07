import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../backend/app.js';
import connectDB from '../backend/db.js';
import User from '../backend/models/user.model.js';
import ParkingSpot from '../backend/models/parkingSpot.model.js';
import Booking from '../backend/models/booking.model.js';

describe('Stage 3: Core Booking Engine & Concurrency Suite', () => {
  let driverUser;
  let driverCookie;
  let hostUser;
  let hostCookie;
  let unauthorizedUser;
  let unauthorizedCookie;
  let testSpot;

  const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

  beforeAll(async () => {
    await connectDB();

    // Clean up previous test artifacts
    await User.deleteMany({ email: { $in: ['engine_driver@test.com', 'engine_host@test.com', 'unauth_driver@test.com'] } });
    await Booking.deleteMany({});
    await ParkingSpot.deleteMany({ address: '42 Engine Concurrency Way, Test City' });

    // 1. Create Host User
    hostUser = await User.create({
      username: 'engine_host',
      email: 'engine_host@test.com',
      password: 'Password123!',
      role: 'host',
    });
    const hostToken = jwt.sign({ userId: hostUser._id }, jwtSecret, { expiresIn: '1d' });
    hostCookie = `jwt=${hostToken}`;

    // 2. Create Driver User
    driverUser = await User.create({
      username: 'engine_driver',
      email: 'engine_driver@test.com',
      password: 'Password123!',
      role: 'driver',
    });
    const driverToken = jwt.sign({ userId: driverUser._id }, jwtSecret, { expiresIn: '1d' });
    driverCookie = `jwt=${driverToken}`;

    // 3. Create Another Driver User (for unauthorized cancellation tests)
    unauthorizedUser = await User.create({
      username: 'unauth_driver',
      email: 'unauth_driver@test.com',
      password: 'Password123!',
      role: 'driver',
    });
    const unauthToken = jwt.sign({ userId: unauthorizedUser._id }, jwtSecret, { expiresIn: '1d' });
    unauthorizedCookie = `jwt=${unauthToken}`;

    // 4. Create Test Parking Spot with pricePerHour = 100
    testSpot = await ParkingSpot.create({
      spotType: 'p2p',
      address: '42 Engine Concurrency Way, Test City',
      location: {
        type: 'Point',
        coordinates: [77.21, 28.61],
      },
      description: 'Dedicated test spot for booking engine verification',
      pricePerHour: 100,
      owner: hostUser._id,
      isAvailable: true,
    });
  });

  afterAll(async () => {
    if (testSpot?._id) {
      await Booking.deleteMany({ spot: testSpot._id });
      await ParkingSpot.deleteOne({ _id: testSpot._id });
    }
    await User.deleteMany({ email: { $in: ['engine_driver@test.com', 'engine_host@test.com', 'unauth_driver@test.com'] } });
  });

  // 1. Normal Booking Creation
  it('creates a normal booking with price snapshot and honest demo status', async () => {
    // Tomorrow from 10:00 to 12:00 (2 hours)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow);
    start.setHours(10, 0, 0, 0);

    const end = new Date(tomorrow);
    end.setHours(12, 0, 0, 0);

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', driverCookie)
      .send({
        spotId: testSpot._id.toString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: 'Reservation verification test',
      });

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.paymentStatus).toBe('unpaid_demo');
    expect(res.body.booking.durationHours).toBe(2);
    expect(res.body.booking.pricePerHourSnapshot).toBe(100);
    expect(res.body.booking.totalCost).toBe(200);
  });

  // 2. Reject Past Booking
  it('rejects reservation attempts in the past with HTTP 400', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const start = new Date(yesterday);
    start.setHours(10, 0, 0, 0);

    const end = new Date(yesterday);
    end.setHours(12, 0, 0, 0);

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', driverCookie)
      .send({
        spotId: testSpot._id.toString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/past/i);
  });

  // 3. Reject End Time Before Start Time
  it('rejects booking when end time is before or equal to start time', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow);
    start.setHours(15, 0, 0, 0);

    const end = new Date(tomorrow);
    end.setHours(14, 0, 0, 0);

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', driverCookie)
      .send({
        spotId: testSpot._id.toString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/after start time/i);
  });

  // 4. Host Restriction: Cannot Book Own Spot
  it('prevents hosts from reserving their own parking spot', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow);
    start.setHours(18, 0, 0, 0);

    const end = new Date(tomorrow);
    end.setHours(19, 0, 0, 0);

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', hostCookie)
      .send({
        spotId: testSpot._id.toString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot reserve your own/i);
  });

  // 5. Half-Open Interval Overlap Rejection
  it('rejects an overlapping booking with HTTP 409 Conflict', async () => {
    // Overlaps with 10:00 to 12:00 booking (11:00 to 13:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow);
    start.setHours(11, 0, 0, 0);

    const end = new Date(tomorrow);
    end.setHours(13, 0, 0, 0);

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', driverCookie)
      .send({
        spotId: testSpot._id.toString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already booked/i);
  });

  // 6. Contiguous Booking (Half-Open Boundary [10:00, 12:00) and [12:00, 14:00))
  it('allows contiguous non-overlapping bookings sharing exact boundary minutes', async () => {
    // Existing is [10:00, 12:00). New is [12:00, 14:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow);
    start.setHours(12, 0, 0, 0);

    const end = new Date(tomorrow);
    end.setHours(14, 0, 0, 0);

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', driverCookie)
      .send({
        spotId: testSpot._id.toString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.durationHours).toBe(2);
  });

  // 7. Dynamic Availability Endpoint
  it('calculates available and booked intervals for any chosen date', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app).get(`/api/bookings/spot/${testSpot._id}/availability?date=${dateStr}&duration=1`);

    expect(res.status).toBe(200);
    expect(res.body.bookedIntervals.length).toBeGreaterThanOrEqual(2);
    expect(res.body.availableSlots.length).toBeGreaterThan(0);
    expect(res.body.spotId).toBe(testSpot._id.toString());
  });

  // 8. Cancellation Flow
  it('allows driver to cancel their reservation with full audit trail', async () => {
    // Book a future slot to cancel
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const start = new Date(dayAfter);
    start.setHours(10, 0, 0, 0);

    const end = new Date(dayAfter);
    end.setHours(11, 0, 0, 0);

    const createRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', driverCookie)
      .send({
        spotId: testSpot._id.toString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

    const bookingId = createRes.body.booking._id;

    // Cancel
    const cancelRes = await request(app)
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Cookie', driverCookie)
      .send({ reason: 'Trip rescheduled' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.booking.status).toBe('cancelled');
    expect(cancelRes.body.booking.cancellationReason).toBe('Trip rescheduled');
    expect(cancelRes.body.booking.cancelledBy).toBe(driverUser._id.toString());

    // Subsequent cancellation should be rejected
    const repeatCancel = await request(app)
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Cookie', driverCookie);

    expect(repeatCancel.status).toBe(400);
    expect(repeatCancel.body.message).toMatch(/already cancelled/i);
  });

  // 9. Unauthorized Cancellation
  it('rejects cancellation attempts from users who do not own the reservation', async () => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const start = new Date(dayAfter);
    start.setHours(14, 0, 0, 0);

    const end = new Date(dayAfter);
    end.setHours(16, 0, 0, 0);

    const createRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', driverCookie)
      .send({
        spotId: testSpot._id.toString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

    const bookingId = createRes.body.booking._id;

    // Unauthorized user attempts cancellation
    const cancelRes = await request(app)
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Cookie', unauthorizedCookie);

    expect(cancelRes.status).toBe(403);
    expect(cancelRes.body.message).toMatch(/not authorized/i);
  });

  // 10. Concurrency Benchmark Test
  it('CONCURRENCY TEST: allows strictly ONE of two simultaneous overlapping requests to succeed', async () => {
    // Target time: 3 days in future from 10:00 to 12:00
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 3);

    const start = new Date(testDate);
    start.setHours(10, 0, 0, 0);

    const end = new Date(testDate);
    end.setHours(12, 0, 0, 0);

    const payload = {
      spotId: testSpot._id.toString(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      notes: 'Simultaneous concurrency battle',
    };

    // Dispatch TWO simultaneous overlapping reservation requests at the exact same millisecond
    const [responseA, responseB] = await Promise.all([
      request(app).post('/api/bookings').set('Cookie', driverCookie).send(payload),
      request(app).post('/api/bookings').set('Cookie', driverCookie).send(payload),
    ]);

    const statusCodes = [responseA.status, responseB.status].sort();

    // Exactly one must be 201 Created and exactly one must be 409 Conflict
    expect(statusCodes).toEqual([201, 409]);

    const successResponse = responseA.status === 201 ? responseA : responseB;
    const conflictResponse = responseA.status === 409 ? responseA : responseB;

    expect(successResponse.body.booking).toBeDefined();
    expect(conflictResponse.body.message).toMatch(/already booked/i);
  });
});

