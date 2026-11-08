import mongoose from 'mongoose';

/**
 * Commuter Pass Subscription Schema
 * Represents automated recurring weekday parking reservations with
 * pre-negotiated discount rates, collision fallback tracking, and cron execution audit trails.
 */
const commuterPassSchema = new mongoose.Schema(
  {
    // The driver subscriber
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    // The reserved parking spot
    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      required: [true, 'Parking spot reference is required'],
      index: true,
    },
    // Host owner
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host reference is required'],
      index: true,
    },

    // Days of week (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
    // Default: Monday through Friday [1, 2, 3, 4, 5]
    daysOfWeek: {
      type: [Number],
      default: [1, 2, 3, 4, 5],
      validate: {
        validator: (arr) => arr.length > 0 && arr.every((d) => d >= 0 && d <= 6),
        message: 'Must specify at least one valid day of week (0 to 6)',
      },
    },

    // Recurring daily time interval in 24h format (e.g., "09:00" to "17:00")
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format'],
    },
    durationHours: {
      type: Number,
      required: true,
      min: [0.5, 'Duration must be at least 30 minutes'],
    },

    // Price snapshotting & Commuter discount (15% by default)
    hourlyRateSnapshot: {
      type: Number,
      required: true,
      min: [0, 'Hourly rate cannot be negative'],
    },
    discountPercentage: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    dailyCost: {
      type: Number,
      required: true,
      min: [0, 'Daily cost cannot be negative'],
    },

    // Subscription status
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active',
      index: true,
    },

    // Execution tracking
    lastProcessedDate: {
      type: Date,
      default: null,
    },
    conflictCount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: 'Standard weekday commuter pass',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find active passes for cron execution
commuterPassSchema.index({ status: 1, daysOfWeek: 1 });

const CommuterPass = mongoose.model('CommuterPass', commuterPassSchema);
export default CommuterPass;
