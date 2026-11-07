import mongoose from 'mongoose';

/*
This model handles your "Timestamp-based pricing".
The price is calculated based on startTime and endTime.
*/
const bookingSchema = new mongoose.Schema({
  user: { // The 'driver' who is booking
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  spot: { // The spot being booked
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpot',
    required: true,
  },
  host: { // The 'host' or 'operator' who owns the spot
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // --- This is your "Timestamp" logic ---
  startTime: {
    type: Date,
    required: true,
  },
  endTime: { // This can be set on booking, or when the user "checks out"
    type: Date,
    required: true,
  },
  // --- End Timestamp logic ---

  totalCost: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected', 'expired'],
    default: 'confirmed',
  },
  // Payment status lifecycle
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'unpaid_demo', 'not_required'],
    default: 'unpaid_demo',
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
