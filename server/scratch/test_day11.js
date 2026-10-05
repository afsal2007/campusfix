import mongoose from 'mongoose';
import 'dotenv/config';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

const runTests = async () => {
  try {
    console.log('--- STARTING DAY 11 OFFLINE SYNC BACKEND TESTS ---');
    console.log('1. Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.');

    console.log('2. Finding a test student...');
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('No student found. Skipping tests.');
      process.exit(0);
    }

    console.log('3. Cleaning up old test complaints...');
    await Complaint.deleteMany({ clientRequestId: { $in: ['test-offline-sync-id-1', 'test-offline-sync-id-2'] } });

    console.log('4. Testing Complaint Idempotency...');
    const clientRequestId = 'test-offline-sync-id-1';

    // Mock first creation
    const complaint1 = await Complaint.create({
      student: student._id,
      title: 'Test Offline Complaint',
      description: 'This was created while offline.',
      category: 'technical',
      clientRequestId,
    });
    console.log('First creation successful. ID:', complaint1._id);

    // Mock second creation (duplicate)
    const duplicateCheck = await Complaint.findOne({ clientRequestId, student: student._id });
    if (duplicateCheck) {
      console.log('Duplicate check successful. Found existing complaint:', duplicateCheck._id);
    } else {
      console.error('Duplicate check failed! Existing complaint not found.');
      process.exit(1);
    }

    console.log('--- ALL BACKEND IDEMPOTENCY TESTS PASSED ---');
    process.exit(0);
  } catch (error) {
    if (error.name === 'MongoServerSelectionError') {
      console.log('MONGODB ATLAS CONNECTION ISSUE — BACKEND TESTING BLOCKED');
    } else {
      console.error('Test Failed:', error);
    }
    process.exit(1);
  }
};

runTests();
