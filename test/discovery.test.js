import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../backend/app.js';
import connectDB from '../backend/db.js';
import User from '../backend/models/user.model.js';
import ParkingSpot from '../backend/models/parkingSpot.model.js';
import Booking from '../backend/models/booking.model.js';

describe('Stage 4: Parking Discovery, Geocoding & Filters Suite', () => {
  let hostUser;
  let driverUser;
  let driverCookie;
  let spotA;
  let spotB;
  let spotC;

  const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

  beforeAll(async () => {
    await connectDB();

    // Clean up previous test artifacts
    await User.deleteMany({ email: { $in: ['discovery_host@test.com', 'discovery_driver@test.com'] } });
    await ParkingSpot.deleteMany({
      address: {
        $in: [
          'Connaught Place Inner Circle, New Delhi',
          'Cyber City Hub, Gurugram',
          'Aerocity Terminal, New Delhi',
        ],
      },
    });

    // 1. Create Host
    hostUser = await User.create({
      username: 'discovery_host',
      email: 'discovery_host@test.com',
      password: 'Password123!',
      role: 'host',
    });

    // 2. Create Driver
    driverUser = await User.create({
      username: 'discovery_driver',
      email: 'discovery_driver@test.com',
      password: 'Password123!',
      role: 'driver',
    });
    const driverToken = jwt.sign({ userId: driverUser._id }, jwtSecret, { expiresIn: '1d' });
    driverCookie = `jwt=${driverToken}`;

    // 3. Create 3 distinct spots for discovery tests
    // Spot A: Connaught Place (Lat: 28.6328, Lng: 77.2195), price: 15, vehicle: 'any', amenities: ['covered', 'ev_charging']
    spotA = await ParkingSpot.create({
      title: 'Connaught Place Central Bay',
      spotType: 'operator',
      address: 'Connaught Place Inner Circle, New Delhi',
      location: {
        type: 'Point',
        coordinates: [77.2195, 28.6328], // [lng, lat]
      },
      pricePerHour: 15,
      vehicleSize: 'any',
      amenities: ['covered', 'ev_charging', 'cctv'],
      owner: hostUser._id,
      rating: 4.8,
    });

    // Spot B: Cyber City Gurugram (~25km south-west: 28.4950, 77.0888), price: 25, vehicle: 'suv', amenities: ['cctv', 'valet']
    spotB = await ParkingSpot.create({
      title: 'Cyber City Corporate Parking',
      spotType: 'operator',
      address: 'Cyber City Hub, Gurugram',
      location: {
        type: 'Point',
        coordinates: [77.0888, 28.4950],
      },
      pricePerHour: 25,
      vehicleSize: 'suv',
      amenities: ['cctv', 'valet'],
      owner: hostUser._id,
      rating: 4.2,
    });

    // Spot C: Aerocity (~12km: 28.5501, 77.1215), price: 8, vehicle: 'compact', amenities: ['covered']
    spotC = await ParkingSpot.create({
      title: 'Aerocity Budget Bay',
      spotType: 'p2p',
      address: 'Aerocity Terminal, New Delhi',
      location: {
        type: 'Point',
        coordinates: [77.1215, 28.5501],
      },
      pricePerHour: 8,
      vehicleSize: 'compact',
      amenities: ['covered'],
      owner: hostUser._id,
      rating: 3.9,
    });
  });

  afterAll(async () => {
    await ParkingSpot.deleteMany({ _id: { $in: [spotA._id, spotB._id, spotC._id] } });
    await User.deleteMany({ _id: { $in: [hostUser._id, driverUser._id] } });
  });

  it('allows public retrieval of parking spots without an auth cookie', async () => {
    const res = await request(app).get('/api/spots');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('calculates distanceKm and applies geospatial radius filtering', async () => {
    // Search within 5km of Connaught Place (28.6328, 77.2195)
    const res = await request(app)
      .get('/api/spots')
      .query({ lat: 28.6328, lng: 77.2195, radius: 5000 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Spot A should be within 5km, Spot B (25km away) should NOT be in results
    const foundSpotA = res.body.find((s) => s._id.toString() === spotA._id.toString());
    const foundSpotB = res.body.find((s) => s._id.toString() === spotB._id.toString());

    expect(foundSpotA).toBeDefined();
    expect(foundSpotA.distanceKm).toBeDefined();
    expect(foundSpotA.distanceKm).toBeLessThanOrEqual(5.0);
    expect(foundSpotB).toBeUndefined();
  });

  it('filters spots by maxPrice parameter', async () => {
    const res = await request(app)
      .get('/api/spots')
      .query({ maxPrice: 10 });

    expect(res.status).toBe(200);
    const foundSpotC = res.body.find((s) => s._id.toString() === spotC._id.toString());
    const foundSpotB = res.body.find((s) => s._id.toString() === spotB._id.toString());

    expect(foundSpotC).toBeDefined(); // price = 8
    expect(foundSpotB).toBeUndefined(); // price = 25
  });

  it('filters spots by specific required amenities (e.g. ev_charging)', async () => {
    const res = await request(app)
      .get('/api/spots')
      .query({ amenities: 'ev_charging' });

    expect(res.status).toBe(200);
    const spotIds = res.body.map((s) => s._id.toString());
    expect(spotIds).toContain(spotA._id.toString()); // Spot A has ev_charging
    expect(spotIds).not.toContain(spotB._id.toString()); // Spot B does not
    expect(spotIds).not.toContain(spotC._id.toString()); // Spot C does not
  });

  it('filters spots by vehicleSize compatibility', async () => {
    const res = await request(app)
      .get('/api/spots')
      .query({ vehicleSize: 'suv' });

    expect(res.status).toBe(200);
    const spotIds = res.body.map((s) => s._id.toString());
    expect(spotIds).toContain(spotB._id.toString()); // Spot B is suv
    expect(spotIds).toContain(spotA._id.toString()); // Spot A is 'any' (compatible with all)
    expect(spotIds).not.toContain(spotC._id.toString()); // Spot C is 'compact'
  });

  it('filters spots by text keyword search', async () => {
    const res = await request(app)
      .get('/api/spots')
      .query({ search: 'Corporate' });

    expect(res.status).toBe(200);
    const spotIds = res.body.map((s) => s._id.toString());
    expect(spotIds).toContain(spotB._id.toString()); // 'Cyber City Corporate Parking'
    expect(spotIds).not.toContain(spotA._id.toString());
  });

  it('sorts spots by price in ascending order when requested', async () => {
    const res = await request(app)
      .get('/api/spots')
      .query({ sort: 'price_asc' });

    expect(res.status).toBe(200);
    for (let i = 0; i < res.body.length - 1; i++) {
      expect(res.body[i].pricePerHour).toBeLessThanOrEqual(res.body[i + 1].pricePerHour);
    }
  });

  it('fetches a single parking spot by ID with populated owner and reviews', async () => {
    const res = await request(app).get(`/api/spots/${spotA._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Connaught Place Central Bay');
    expect(res.body.owner).toBeDefined();
    expect(res.body.owner.username).toBe('discovery_host');
  });

  it('enforces verified booking prerequisite and allows driver to submit a review', async () => {
    // 1. Attempt review without booking -> Expected 403 Forbidden
    const unverifiedRes = await request(app)
      .post(`/api/spots/${spotA._id}/reviews`)
      .set('Cookie', driverCookie)
      .send({ rating: 5, comment: 'Spam review without booking' });

    expect(unverifiedRes.status).toBe(403);
    expect(unverifiedRes.body.message).toContain('verified drivers');

    // 2. Create confirmed booking for driverUser on spotA
    const bookingStart = new Date(Date.now() + 100000);
    const bookingEnd = new Date(Date.now() + 107200000);
    await Booking.create({
      user: driverUser._id,
      spot: spotA._id,
      host: hostUser._id,
      startTime: bookingStart,
      endTime: bookingEnd,
      durationHours: 2,
      pricePerHourSnapshot: 15,
      totalCost: 30,
      totalAmount: 30,
      status: 'confirmed',
      paymentStatus: 'unpaid_demo',
      paymentMethod: 'demo',
    });

    // 3. Resubmit review as verified driver -> Expected 201 Created
    const res = await request(app)
      .post(`/api/spots/${spotA._id}/reviews`)
      .set('Cookie', driverCookie)
      .send({
        rating: 5,
        comment: 'Excellent parking space, smooth access!',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('Review added successfully');

    // Verify review saved on spot
    const updatedSpot = await ParkingSpot.findById(spotA._id);
    expect(updatedSpot.reviews.length).toBeGreaterThan(0);
    expect(updatedSpot.rating).toBe(5);
  });

  it('runs demo seed endpoint idempotently', async () => {
    const res = await request(app).post('/api/spots/seed');
    expect([200, 201]).toContain(res.status);
    expect(res.body.message).toBeDefined();
  });
});

