import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import authRoutes from './routes/auth.routes.js';
import spotRoutes from './routes/spots.routes.js';
import bookingRoutes from './routes/bookings.routes.js';
import cookieParser from 'cookie-parser';


// Load env vars
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: false })); // Body parser for URL-encoded data
app.use(cookieParser());

// Test Route
app.get('/', (req, res) => {
  res.send('Parking Finder API is running...');
});

//--- API Routes (We will build these in Step 2) ---
app.use('/api/auth', authRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/bookings', bookingRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
