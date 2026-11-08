import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['driver', 'host', 'admin'], // 'driver' finds parking, 'host' lists parking (for P2P)
    default: 'driver',
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
    },
  ],
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  vehicleInfo: {
    make: { type: String, default: '', trim: true },
    model: { type: String, default: '', trim: true },
    licensePlate: { type: String, default: '', trim: true },
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// --- Mongoose Middleware ---
// Hash password before saving a new user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
