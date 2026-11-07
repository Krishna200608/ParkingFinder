import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getBookedSlotsForSpot,
  getSpotAvailability,
} from '../controllers/bookings.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes: inspect availability and slot intervals for any parking spot
router.get('/spot/:spotId/availability', getSpotAvailability);
router.get('/spot/:spotId', getBookedSlotsForSpot);

// Private routes: require authenticated driver / user session
router.post('/', protect, createBooking);
router.get('/me', protect, getMyBookings);
router.get('/mybookings', protect, getMyBookings); // backwards-compatible alias
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

export default router;
