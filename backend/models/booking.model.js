import mongoose from 'mongoose';

/**
 * Booking Schema with full lifecycle, price snapshotting,
 * cancellation audit trail, and compound indexes for fast concurrency queries.
 */
const bookingSchema = new mongoose.Schema(
  {
    // The driver who made the reservation
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver user reference is required'],
      index: true,
    },
    // The reserved parking spot
    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      required: [true, 'Parking spot reference is required'],
      index: true,
    },
    // The spot owner (host or operator)
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host reference is required'],
      index: true,
    },

    // Reservation Time Interval [startTime, endTime)
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    // Duration snapshot in hours
    durationHours: {
      type: Number,
      required: true,
      min: [0.25, 'Booking duration must be at least 15 minutes'],
    },

    // Price Snapshotting: guarantees future changes to spot price do not alter historical records
    pricePerHourSnapshot: {
      type: Number,
      required: true,
      min: [0, 'Price per hour cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, 'Total cost cannot be negative'],
    },

    // Lifecycle Status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected', 'expired'],
      default: 'confirmed',
      index: true,
    },

    // Payment Status Lifecycle (honest demo-first representation)
    paymentStatus: {
      type: String,
      enum: ['not_required', 'unpaid_demo', 'paid', 'pending', 'failed'],
      default: 'unpaid_demo',
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },

    // Cancellation Audit Trail
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Cancellation reason cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias: totalAmount reflects totalCost
bookingSchema.virtual('totalAmount').get(function () {
  return this.totalCost;
});

// Compound indexes for fast conflict queries and dashboard aggregation
bookingSchema.index({ spot: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ host: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
