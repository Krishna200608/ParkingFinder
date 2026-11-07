import mongoose from 'mongoose';

/**
 * Global cache across serverless function invocations.
 * In local development, this prevents duplicate connections during nodemon restarts.
 * In Vercel serverless execution, this reuses existing container connections across invocations.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI environment variable is not defined.');
  }

  // 1. Return active connection if ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. Initiate connection promise if none exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Fail fast rather than buffering commands when offline
      maxPoolSize: 10,       // Conserve connections for MongoDB Atlas Free M0 cluster
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(uri, opts).then((instance) => {
      console.log(`✅ MongoDB Connected: ${instance.connection.host}`);
      return instance;
    });
  }

  // 3. Await connection
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Reset promise on failure so next invocation can retry
    console.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

export default connectDB;
