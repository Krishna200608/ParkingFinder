import express from 'express';
import {
  createParkingSpot,
  getParkingSpots,
  getParkingSpotById,
  updateParkingSpot,
  deleteParkingSpot,
  createSpotReview,
  getMyParkingSpots,
} from '../controllers/spots.controller.js';
import { protect, isHostOrAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Host dashboard: get logged-in host's listings with earnings
router.get('/my', protect, isHostOrAdmin, getMyParkingSpots);

// Discovery (Public) and Create (Host / Admin)
// Supported on standard REST / and backwards-compatible /available
router.get('/', getParkingSpots);
router.post('/', protect, isHostOrAdmin, createParkingSpot);

router.get('/available', getParkingSpots);
router.post('/available', protect, isHostOrAdmin, createParkingSpot);

// Single spot operations
router.get('/:id', getParkingSpotById);
router.put('/:id', protect, isHostOrAdmin, updateParkingSpot);
router.delete('/:id', protect, isHostOrAdmin, deleteParkingSpot);

// Reviews
router.post('/:id/reviews', protect, createSpotReview);

export default router;
