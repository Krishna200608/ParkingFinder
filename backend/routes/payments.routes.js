import express from 'express';
import {
  createCheckoutSession,
  verifyCheckoutSession,
  simulatePaymentSuccess,
  handleStripeWebhook,
  getMyTransactions,
} from '../controllers/payments.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Driver Checkout & Simulation routes
router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/verify-session', protect, verifyCheckoutSession);
router.post('/simulate-success', protect, simulatePaymentSuccess);
router.get('/my-transactions', protect, getMyTransactions);

// Webhook endpoint (public callback from Stripe)
router.post('/webhook', handleStripeWebhook);

export default router;

