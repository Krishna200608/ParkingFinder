import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from '../controllers/bookings.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All booking routes are private and require a logged-in user
router.use(protect);

router.route('/')
  .post(createBooking); // Create a new booking

router.route('/mybookings')
  .get(getMyBookings); // Get all of the user's own bookings

router.route('/:id')
  .get(getBookingById); // Get a single booking by its ID

router.route('/:id/cancel')
  .put(cancelBooking); // Cancel a booking

export default router;
