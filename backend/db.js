import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Attempt connection
    const conn = await mongoose.connect(process.env.MONGO_URI, {});
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // --- Connection Event Logging ---
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connected to database');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('🟠 Mongoose disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔴 Mongoose connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
