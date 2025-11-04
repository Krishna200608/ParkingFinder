import mongoose from 'mongoose';

/*
This model is the core of the app. It's designed to handle
all 3 of your solution models:
1. Model 1 (Integration): 'type' is 'operator', 'owner' is an 'admin' or partner User.
2. Model 2 (Smart Hubs): 'type' is 'operator', uses 'timestamp' pricing (logic in booking).
3. Model 3 (P2P): 'type' is 'p2p', 'owner' is a 'host' User.
*/
const parkingSpotSchema = new mongoose.Schema({
  spotType: {
    type: String,
    enum: ['operator', 'p2p'], // 'operator' (commercial), 'p2p' (peer-to-peer)
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the 'host' (p2p) or 'admin' (operator)
    required: true,
  },
  
  // --- Location Info ---
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  // Using GeoJSON for location is CRITICAL for finding "spots near me"
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },

  // --- Details ---
  description: {
    type: String,
    trim: true,
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Price is required (can be 0)'],
  },

  // --- Real-time Status ---
  isAvailable: {
    type: Boolean,
    default: true,
  },
  // We can add more details like spot size, EV charging, etc. later
  
  // --- Reviews (as a sub-document array) ---
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, required: true },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  // Virtual for average rating
  rating: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// --- Mongoose Index ---
// Create a 2dsphere index for geospatial queries (finding spots near a point)
parkingSpotSchema.index({ location: '2dsphere' });

// --- Mongoose Middleware ---
// Calculate average rating before saving
parkingSpotSchema.pre('save', function(next) {
  if (this.reviews.length > 0) {
    const total = this.reviews.reduce((acc, item) => item.rating + acc, 0);
    this.rating = total / this.reviews.length;
  } else {
    this.rating = 0;
  }
  next();
});

const ParkingSpot = mongoose.model('ParkingSpot', parkingSpotSchema);
export default ParkingSpot;
