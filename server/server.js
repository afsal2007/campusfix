import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({
    message: 'CampusFix API is running'
  });
});

// Database Health Check Route
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 1 = connected
  const isConnected = dbState === 1;
  res.json({
    status: 'ok',
    database: isConnected ? 'connected' : 'disconnected'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
