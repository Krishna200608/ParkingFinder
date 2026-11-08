import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  switchUserRole,
  getUserFavorites,
  addFavoriteSpot,
  removeFavoriteSpot,
} from '../controllers/auth.controller.js';
import { protect, allowSessionOrUser } from '../middleware/auth.middleware.js';
import {
  validate,
  registerSchema,
  loginSchema,
  switchRoleSchema,
} from '../middleware/validate.middleware.js';

const router = express.Router();

// Public routes with Zod request validation
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

// Private routes (protected by HTTP-only cookie / Bearer auth)
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/switch-role', allowSessionOrUser, validate(switchRoleSchema), switchUserRole);

// Favorites endpoints (authenticated user)
router.get('/favorites', protect, getUserFavorites);
router.post('/favorites/:spotId', protect, addFavoriteSpot);
router.delete('/favorites/:spotId', protect, removeFavoriteSpot);

export default router;
