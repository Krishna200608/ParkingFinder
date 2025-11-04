import express from 'express';
import {
  createParkingSpot,
  getParkingSpots,
  getParkingSpotById,
  updateParkingSpot,
  deleteParkingSpot,
  createSpotReview,
} from '../controllers/spots.controller.js';
import { protect, isHostOrAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- Main Routes for Spots ---
router.route('/')
  .get(getParkingSpots) // Public: Anyone can search for spots
  .post(protect, isHostOrAdmin, createParkingSpot); // Private: Only Hosts/Admins can create

// --- Routes for a Single Spot ---
router.route('/:id')
  .get(getParkingSpotById) // Public: Anyone can view a single spot
  .put(protect, isHostOrAdmin, updateParkingSpot) // Private: Only the Owner/Admin can update
  .delete(protect, isHostOrAdmin, deleteParkingSpot); // Private: Only the Owner/Admin can delete

// --- Route for Reviews ---
router.route('/:id/reviews')
  .post(protect, createSpotReview); // Private: Any logged-in user can review (for now)

export default router;
