// server/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    // Monitor runtime connection lifecycle
    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Connection lost. Waiting for reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Successfully reconnected to database.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Runtime connection error:', err.message || 'Database error');
    });

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    // Sanitize error message to prevent logging connection string credentials
    const safeMessage = error.message
      ? error.message.replace(/\/\/.*@/, '//<credentials>@')
      : 'Connection failed';
    console.error('MongoDB connection error:', safeMessage);
    process.exit(1);
  }
};

export default connectDB;
