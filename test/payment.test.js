import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../backend/app.js';
import connectDB from '../backend/db.js';
import User from '../backend/models/user.model.js';
import ParkingSpot from '../backend/models/parkingSpot.model.js';
import Booking from '../backend/models/booking.model.js';
import Payment from '../backend/models/payment.model.js';

describe('Payment Gateway & Test Mode Suite', () => {
  let hostUser;
  let driverUser;
  let secondDriverUser;
  let driverCookie;
  let secondDriverCookie;
  let testSpot;
  let testBooking;

  const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

  beforeAll(async () => {
    await connectDB();

    // Clean up past test artifacts
    await User.deleteMany({
      email: { $in: ['pay_host@test.com', 'pay_driver@test.com', 'pay_other@test.com'] },
    });
    await ParkingSpot.deleteMany({ address: '123 Payment Gateway Way, Sandbox' });
    await Payment.deleteMany({});

    // 1. Create Host
    hostUser = await User.create({
      username: 'pay_host',
      email: 'pay_host@test.com',
      password: 'Password123!',
      role: 'host',
    });

    // 2. Create Primary Driver
    driverUser = await User.create({
      username: 'pay_driver',
      email: 'pay_driver@test.com',
      password: 'Password123!',
      role: 'driver',
    });
    const driverToken = jwt.sign({ userId: driverUser._id }, jwtSecret, { expiresIn: '1d' });
    driverCookie = `jwt=${driverToken}`;

    // 3. Create Second Driver
    secondDriverUser = await User.create({
      username: 'pay_other',
      email: 'pay_other@test.com',
      password: 'Password123!',
      role: 'driver',
    });
    const otherToken = jwt.sign({ userId: secondDriverUser._id }, jwtSecret, { expiresIn: '1d' });
    secondDriverCookie = `jwt=${otherToken}`;

    // 4. Create Spot
    testSpot = await ParkingSpot.create({
      title: 'Stripe Sandbox Bay',
      spotType: 'p2p',
      address: '123 Payment Gateway Way, Sandbox',
      location: { type: 'Point', coordinates: [77.2, 28.5] },
      pricePerHour: 20,
      owner: hostUser._id,
      isAvailable: true,
    });

    // 5. Create Booking for primary driver
    const startTime = new Date(Date.now() + 2 * 3600 * 1000);
    const endTime = new Date(Date.now() + 4 * 3600 * 1000);
    testBooking = await Booking.create({
      user: driverUser._id,
      spot: testSpot._id,
      host: hostUser._id,
      startTime,
      endTime,
      durationHours: 2,
      pricePerHourSnapshot: 20,
      totalCost: 40,
      status: 'confirmed',
      paymentStatus: 'unpaid_demo',
    });
  });

  afterAll(async () => {
    if (testSpot) await ParkingSpot.findByIdAndDelete(testSpot._id);
    if (testBooking) await Booking.findByIdAndDelete(testBooking._id);
    await Payment.deleteMany({ user: driverUser._id });
    await User.deleteMany({
      email: { $in: ['pay_host@test.com', 'pay_driver@test.com', 'pay_other@test.com'] },
    });
  });

  it('rejects unauthenticated requests to checkout session endpoint with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/payments/create-checkout-session')
      .send({ bookingId: testBooking._id });

    expect(res.status).toBe(401);
  });

  it('rejects non-existent booking IDs with HTTP 404', async () => {
    const fakeId = '66f000000000000000000000';
    const res = await request(app)
      .post('/api/payments/create-checkout-session')
      .set('Cookie', driverCookie)
      .send({ bookingId: fakeId });

    expect(res.status).toBe(404);
  });

  it('rejects users attempting to pay for another driver reservation with HTTP 403', async () => {
    const res = await request(app)
      .post('/api/payments/create-checkout-session')
      .set('Cookie', secondDriverCookie)
      .send({ bookingId: testBooking._id });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Not authorized/i);
  });

  it('creates a checkout session and updates booking paymentStatus to pending', async () => {
    const res = await request(app)
      .post('/api/payments/create-checkout-session')
      .set('Cookie', driverCookie)
      .send({ bookingId: testBooking._id });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
    expect(res.body).toHaveProperty('sessionId');

    const updated = await Booking.findById(testBooking._id);
    expect(updated.paymentStatus).toBe('pending');
    expect(updated.stripeSessionId).toBe(res.body.sessionId);
  });

  it('authorizes simulated payment and writes an immutable Payment record', async () => {
    const updated = await Booking.findById(testBooking._id);
    const res = await request(app)
      .post('/api/payments/simulate-success')
      .set('Cookie', driverCookie)
      .send({
        bookingId: testBooking._id,
        sessionId: updated.stripeSessionId,
        cardNumber: '4242424242424242',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
    expect(res.body.payment.amount).toBe(40);
    expect(res.body.payment.status).toBe('succeeded');

    const finalizedBooking = await Booking.findById(testBooking._id);
    expect(finalizedBooking.paymentStatus).toBe('paid');
    expect(finalizedBooking.paidAt).not.toBeNull();
  });

  it('rejects checkout attempts once reservation is already paid with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/payments/create-checkout-session')
      .set('Cookie', driverCookie)
      .send({ bookingId: testBooking._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already paid/i);
  });

  it('verifies paid status via GET /api/payments/verify-session', async () => {
    const current = await Booking.findById(testBooking._id);
    const res = await request(app)
      .get(`/api/payments/verify-session?sessionId=${current.stripeSessionId}&bookingId=${testBooking._id}`)
      .set('Cookie', driverCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
    expect(res.body.booking.paymentStatus).toBe('paid');
  });

  it('processes webhook notifications and syncs booking status', async () => {
    // Create a fresh booking for webhook test
    const startTime = new Date(Date.now() + 5 * 3600 * 1000);
    const endTime = new Date(Date.now() + 7 * 3600 * 1000);
    const webhookBooking = await Booking.create({
      user: driverUser._id,
      spot: testSpot._id,
      host: hostUser._id,
      startTime,
      endTime,
      durationHours: 2,
      pricePerHourSnapshot: 20,
      totalCost: 40,
      status: 'confirmed',
      paymentStatus: 'pending',
    });

    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_mock_webhook_123',
          payment_intent: 'pi_test_mock_webhook_123',
          amount_total: 4000,
          currency: 'usd',
          client_reference_id: webhookBooking._id.toString(),
          metadata: {
            bookingId: webhookBooking._id.toString(),
            userId: driverUser._id.toString(),
          },
        },
      },
    };

    const res = await request(app)
      .post('/api/payments/webhook')
      .send(mockEvent);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    const verified = await Booking.findById(webhookBooking._id);
    expect(verified.paymentStatus).toBe('paid');
    expect(verified.stripePaymentIntentId).toBe('pi_test_mock_webhook_123');

    await Booking.findByIdAndDelete(webhookBooking._id);
  });

  it('retrieves driver transactions from GET /api/payments/my-transactions', async () => {
    const res = await request(app)
      .get('/api/payments/my-transactions')
      .set('Cookie', driverCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('amount');
    expect(res.body[0]).toHaveProperty('status', 'succeeded');
  });
});
