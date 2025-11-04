import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private routes (require a valid token)
// We add the 'protect' middleware
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);

export default router;
