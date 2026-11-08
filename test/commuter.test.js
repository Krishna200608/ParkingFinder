import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../backend/app.js';
import connectDB from '../backend/db.js';
import User from '../backend/models/user.model.js';
import ParkingSpot from '../backend/models/parkingSpot.model.js';
import Booking from '../backend/models/booking.model.js';
import CommuterPass from '../backend/models/commuterPass.model.js';

describe('Stage 7: Recurring Commuter Pass & Cron Engine Suite', () => {
  let driverUser;
  let driverCookie;
  let hostUser;
  let hostCookie;
  let otherDriver;
  let otherDriverCookie;
  let commuterSpot;

  const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

  beforeAll(async () => {
    await connectDB();

    // Clean up test residue
    await User.deleteMany({
      email: {
        $in: [
          'commuter_driver@platform.com',
          'commuter_host@platform.com',
          'other_driver@platform.com',
        ],
      },
    });
    await ParkingSpot.deleteMany({ address: '100 Metro Transit Blvd, Hub City' });
    await Booking.deleteMany({ notes: /Automated Commuter Pass Renewal/ });

    // 1. Create Driver Account
    driverUser = await User.create({
      username: 'commuter_driver_user',
      email: 'commuter_driver@platform.com',
      password: 'Password123!',
      role: 'driver',
    });
    const driverToken = jwt.sign({ userId: driverUser._id }, jwtSecret, { expiresIn: '1d' });
    driverCookie = `jwt=${driverToken}`;

    // 2. Create Host Account
    hostUser = await User.create({
      username: 'commuter_host_user',
      email: 'commuter_host@platform.com',
      password: 'Password123!',
      role: 'host',
    });
    const hostToken = jwt.sign({ userId: hostUser._id }, jwtSecret, { expiresIn: '1d' });
    hostCookie = `jwt=${hostToken}`;

    // 3. Create Other Driver (for unauthorized tests)
    otherDriver = await User.create({
      username: 'other_driver_user',
      email: 'other_driver@platform.com',
      password: 'Password123!',
      role: 'driver',
    });
    const otherToken = jwt.sign({ userId: otherDriver._id }, jwtSecret, { expiresIn: '1d' });
    otherDriverCookie = `jwt=${otherToken}`;

    // 4. Create Host Parking Spot
    commuterSpot = await ParkingSpot.create({
      title: 'Metro Hub Dedicated Bay',
      spotType: 'p2p',
      address: '100 Metro Transit Blvd, Hub City',
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
    await User.deleteMany({
      email: {
        $in: [
          'commuter_driver@platform.com',
          'commuter_host@platform.com',
          'other_driver@platform.com',
        ],
      },
    });
    await ParkingSpot.deleteMany({ address: '100 Metro Transit Blvd, Hub City' });
    await CommuterPass.deleteMany({ user: driverUser._id });
    await Booking.deleteMany({ notes: /Automated Commuter Pass Renewal/ });
  });

  describe('Pass Activation & Input Validation', () => {
    it('rejects unauthenticated requests to POST /api/commuter with HTTP 401', async () => {
      const res = await request(app).post('/api/commuter').send({
        spotId: commuterSpot._id,
      });
      expect(res.status).toBe(401);
    });

    it('rejects invalid time window where endTime <= startTime with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/commuter')
        .set('Cookie', [driverCookie])
        .send({
          spotId: commuterSpot._id,
          startTime: '17:00',
          endTime: '09:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('End time must be after start time');
    });

    it('prevents host from subscribing to a pass on their own listing with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/commuter')
        .set('Cookie', [hostCookie])
        .send({
          spotId: commuterSpot._id,
          startTime: '09:00',
          endTime: '17:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Hosts cannot subscribe');
    });

    it('successfully activates a commuter pass with 15% discount applied', async () => {
      // 09:00 to 17:00 = 8 hours @ $20/hr = $160 standard. 15% off = $136.00
      const res = await request(app)
        .post('/api/commuter')
        .set('Cookie', [driverCookie])
        .send({
          spotId: commuterSpot._id,
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '09:00',
          endTime: '17:00',
          notes: 'Daily tech commute',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('pass');
      expect(res.body.pass.status).toBe('active');
      expect(res.body.pass.durationHours).toBe(8);
      expect(res.body.pass.hourlyRateSnapshot).toBe(20);
      expect(res.body.pass.discountPercentage).toBe(15);
      expect(res.body.pass.dailyCost).toBe(136);
    });
  });

  describe('Commuter Pass Management (List, Pause, Cancel)', () => {
    let createdPassId;

    beforeAll(async () => {
      const pass = await CommuterPass.findOne({ user: driverUser._id });
      createdPassId = pass._id;
    });

    it('retrieves active driver passes from GET /api/commuter/my', async () => {
      const res = await request(app)
        .get('/api/commuter/my')
        .set('Cookie', [driverCookie]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('passes');
      expect(res.body.passes.length).toBeGreaterThanOrEqual(1);
      expect(res.body.passes[0].spot.title).toBe('Metro Hub Dedicated Bay');
    });

    it('prevents another user from modifying the pass status with HTTP 403', async () => {
      const res = await request(app)
        .put(`/api/commuter/${createdPassId}/toggle`)
        .set('Cookie', [otherDriverCookie]);

      expect(res.status).toBe(403);
    });

    it('toggles pass status from active to paused and back to active', async () => {
      // Pause
      const pauseRes = await request(app)
        .put(`/api/commuter/${createdPassId}/toggle`)
        .set('Cookie', [driverCookie]);

      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.pass.status).toBe('paused');

      // Resume
      const resumeRes = await request(app)
        .put(`/api/commuter/${createdPassId}/toggle`)
        .set('Cookie', [driverCookie]);

      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.pass.status).toBe('active');
    });
  });

  describe('Scheduled Cron Execution & Collision Resolution', () => {
    let activePass;
    const testTargetDate = '2026-11-09T00:00:00.000Z'; // Monday (day 1)

    beforeAll(async () => {
      activePass = await CommuterPass.findOne({ user: driverUser._id, status: 'active' });
    });

    it('executes scheduled commuter cron job and commits confirmed reservation', async () => {
      const res = await request(app)
        .post(`/api/commuter/process-cron?targetDate=${testTargetDate}`)
        .set('x-vercel-cron', '1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.booked).toBe(1);

      // Verify that booking was written to the database
      const booked = await Booking.findOne({
        user: driverUser._id,
        spot: commuterSpot._id,
        notes: new RegExp(`Pass ID: ${activePass._id}`),
      });

      expect(booked).not.toBeNull();
      expect(booked.status).toBe('confirmed');
      expect(booked.paymentStatus).toBe('paid');
      expect(booked.totalCost).toBe(136);
    });

    it('skips redundant booking generation if booking already exists for date', async () => {
      const res = await request(app)
        .post(`/api/commuter/process-cron?targetDate=${testTargetDate}`)
        .set('x-vercel-cron', '1');

      expect(res.status).toBe(200);
      expect(res.body.summary.booked).toBe(0);
      expect(res.body.summary.skipped).toBe(1);
      expect(res.body.results[0].reason).toContain('Booking already created');
    });

    it('detects scheduling collisions gracefully when bay is occupied by another driver', async () => {
      const collisionDate = '2026-11-10T00:00:00.000Z'; // Tuesday (day 2)

      // 1. Another driver books the bay on Tuesday morning (10:00 to 14:00)
      const TuesdayCollisionStart = new Date(collisionDate);
      TuesdayCollisionStart.setHours(10, 0, 0, 0);
      const TuesdayCollisionEnd = new Date(collisionDate);
      TuesdayCollisionEnd.setHours(14, 0, 0, 0);

      await Booking.create({
        user: otherDriver._id,
        spot: commuterSpot._id,
        host: hostUser._id,
        startTime: TuesdayCollisionStart,
        endTime: TuesdayCollisionEnd,
        durationHours: 4,
        pricePerHourSnapshot: 20,
        totalCost: 80,
        status: 'confirmed',
        paymentStatus: 'paid',
      });

      // 2. Cron runs for Tuesday
      const res = await request(app)
        .post(`/api/commuter/process-cron?targetDate=${collisionDate}`)
        .set('x-vercel-cron', '1');

      expect(res.status).toBe(200);
      expect(res.body.summary.conflicts).toBe(1);
      expect(res.body.results[0].status).toBe('conflict');
      expect(res.body.results[0].reason).toContain('occupied by another reservation');

      // Verify conflict count incremented on pass
      const pass = await CommuterPass.findById(activePass._id);
      expect(pass.conflictCount).toBeGreaterThanOrEqual(1);
    });

    it('allows driver to cancel commuter subscription via DELETE /api/commuter/:id', async () => {
      const res = await request(app)
        .delete(`/api/commuter/${activePass._id}`)
        .set('Cookie', [driverCookie]);

      expect(res.status).toBe(200);
      expect(res.body.pass.status).toBe('cancelled');

      const pass = await CommuterPass.findById(activePass._id);
      expect(pass.status).toBe('cancelled');
    });
  });
});

