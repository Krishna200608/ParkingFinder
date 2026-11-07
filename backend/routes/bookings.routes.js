import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getBookedSlotsForSpot,
} from '../controllers/bookings.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route: inspect booked slots and availability for a spot
router.get('/spot/:spotId', getBookedSlotsForSpot);

// Private routes: require authentication
router.post('/', protect, createBooking);
router.get('/me', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

export default router;
