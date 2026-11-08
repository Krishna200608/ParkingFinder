import mongoose from 'mongoose';

/**
 * Payment Transaction Schema
 * Provides immutable audit logs for driver payment checkout sessions,
 * Stripe test mode charges, simulation records, and webhook confirmations.
 */
const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Associated booking reference is required'],
      index: true,
    },
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
      default: () => `PND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer user reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'stripe_card',
    },
    stripeSessionId: {
      type: String,
      index: true,
      default: null,
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
      default: null,
    },
    receiptUrl: {
      type: String,
      default: null,
    },
    mode: {
      type: String,
      enum: ['live', 'test', 'simulation'],
      default: 'test',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });

// Ensure paymentId is populated before saving
paymentSchema.pre('save', function (next) {
  if (!this.paymentId) {
    this.paymentId = `PND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;

