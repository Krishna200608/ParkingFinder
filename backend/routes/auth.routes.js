import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate, registerSchema, loginSchema } from '../middleware/validate.middleware.js';

const router = express.Router();

// Public routes with Zod request validation
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

// Private routes (protected by HTTP-only cookie / Bearer auth)
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);

export default router;
