import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getBookedSlotsForSpot
} from '../controllers/bookings.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All booking routes are private and require a logged-in user
router.use(protect);

router.route('/')
  .post(protect,createBooking); // Create a new booking

router.get("/spot/:spotId", getBookedSlotsForSpot);

router.route('/me')
  .get(protect, getMyBookings); // Get all of the user's own bookings

router.route('/:id')
  .get(protect, getBookingById); // Get a single booking by its ID

router.route('/:id/cancel')
  .put(protect, cancelBooking); // Cancel a booking

export default router;
