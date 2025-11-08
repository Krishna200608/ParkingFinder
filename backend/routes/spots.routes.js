import express from 'express';
import {
  createParkingSpot,
  getParkingSpots,
  getParkingSpotById,
  updateParkingSpot,
  deleteParkingSpot,
  createSpotReview,
  getMyParkingSpots, // ✅ New controller
} from '../controllers/spots.controller.js';
import { protect, isHostOrAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- Host Dashboard: Get logged-in host's own spots ---
router.route('/my')
  .get(protect, isHostOrAdmin, getMyParkingSpots); // ✅ New route

// --- Public + Create routes ---
router.route('/available')
  .get(protect, getParkingSpots)
  .post(protect, isHostOrAdmin, createParkingSpot);

// --- Single spot routes ---
router.route('/:id')
  .get(getParkingSpotById)
  .put(protect, isHostOrAdmin, updateParkingSpot)
  .delete(protect, isHostOrAdmin, deleteParkingSpot);

// --- Reviews ---
router.route('/:id/reviews')
  .post(protect, createSpotReview);

export default router;
