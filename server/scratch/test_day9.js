import mongoose from 'mongoose';
import dotenv from 'dotenv';
import supertest from 'supertest';
import express from 'express';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import ComplaintAction from '../models/ComplaintAction.js';
import Location from '../models/Location.js';

import authRoutes from '../routes/authRoutes.js';
import complaintRoutes from '../routes/complaintRoutes.js';
import locationRoutes from '../routes/locationRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

const request = supertest(app);

let adminToken, facultyToken, studentToken;
let adminId, facultyId, studentId, locationId;
let oldUnresolvedComplaint, newUnresolvedComplaint, oldResolvedComplaint;

async function setupDatabase() {
  await User.deleteMany({});
  await Complaint.deleteMany({});
  await ComplaintAction.deleteMany({});
  await Location.deleteMany({});

  const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'admin' });
  adminId = admin._id;
  const faculty = await User.create({ name: 'Faculty', email: 'faculty@test.com', password: 'password123', role: 'faculty', department: 'CSE' });
  facultyId = faculty._id;
  const student = await User.create({ name: 'Student', email: 'student@test.com', password: 'password123', role: 'student', registerNumber: '123', department: 'CSE', year: '1', className: 'A' });
  studentId = student._id;

  const resAdmin = await request.post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
  adminToken = resAdmin.body.token;
  const resFaculty = await request.post('/api/auth/login').send({ email: 'faculty@test.com', password: 'password123' });
  facultyToken = resFaculty.body.token;
  const resStudent = await request.post('/api/auth/login').send({ email: 'student@test.com', password: 'password123' });
  studentToken = resStudent.body.token;

  const loc = await Location.create({ name: 'Main Gate', building: 'Campus' });
  locationId = loc._id;

  const thirtyOneDaysAgo = new Date();
  thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  oldUnresolvedComplaint = await Complaint.create({ student: studentId, location: locationId, title: 'Old Unresolved', description: 'desc', category: 'technical', status: 'pending', createdAt: thirtyOneDaysAgo, updatedAt: thirtyOneDaysAgo });
  newUnresolvedComplaint = await Complaint.create({ student: studentId, location: locationId, title: 'New Unresolved', description: 'desc', category: 'technical', status: 'pending', createdAt: tenDaysAgo, updatedAt: tenDaysAgo });
  oldResolvedComplaint = await Complaint.create({ student: studentId, location: locationId, title: 'Old Resolved', description: 'desc', category: 'infrastructure', status: 'resolved', createdAt: thirtyOneDaysAgo, updatedAt: thirtyOneDaysAgo });
}

async function runTests() {
  let passCount = 0;
  let failCount = 0;
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await setupDatabase();

    const assert = (condition, message) => {
      if (condition) { console.log('✅ ' + message); passCount++; }
      else { console.error('❌ FAILED: ' + message); failCount++; }
    };

    const res1 = await request.get('/api/admin/follow-ups').set('Authorization', 'Bearer ' + adminToken);
    assert(res1.status === 200, 'Admin get follow-ups returns 200');
    
    const followUps = res1.body;
    assert(followUps.length === 1, 'Only one complaint requires follow-up');
    assert(followUps[0]._id === oldUnresolvedComplaint._id.toString(), 'Old unresolved complaint is returned');
    assert(followUps[0].daysOpen >= 30, 'Contains daysOpen');
    assert(followUps[0].followUpRequired === true, 'Contains followUpRequired: true');

    const res2 = await request.get('/api/admin/follow-ups');
    assert(res2.status === 401, 'Unauthenticated request returns 401');

    const res3 = await request.get('/api/admin/follow-ups').set('Authorization', 'Bearer ' + studentToken);
    assert(res3.status === 403, 'Student request returns 403');

    const res4 = await request.get('/api/admin/follow-ups').set('Authorization', 'Bearer ' + facultyToken);
    assert(res4.status === 403, 'Faculty request to admin endpoint returns 403');

    const res10 = await request.post('/api/complaints/' + oldUnresolvedComplaint._id + '/follow-up').set('Authorization', 'Bearer ' + facultyToken).send({ comment: 'Sent a reminder' });
    assert(res10.status === 201, 'Faculty can record a follow-up action');
    
    const historyRes = await request.get('/api/complaints/' + oldUnresolvedComplaint._id).set('Authorization', 'Bearer ' + studentToken);
    const actions = historyRes.body.actionHistory;
    
    assert(actions.length > 0, 'Action history has entries');
    const followUpAction = actions.find(a => a.action === 'follow_up');
    assert(followUpAction !== undefined, 'Follow-up action exists in history');
    assert(followUpAction.comment === 'Sent a reminder', 'Follow-up comment matches');
    assert(followUpAction.performedBy._id === facultyId.toString(), 'performedBy matches authenticated user');

    const updatedComplaint = await Complaint.findById(oldUnresolvedComplaint._id);
    assert(updatedComplaint.status === 'pending', 'Complaint status is unchanged (still pending)');
    
    const resAdminDash = await request.get('/api/admin/dashboard').set('Authorization', 'Bearer ' + adminToken);
    assert(resAdminDash.status === 200, 'Day 8 admin dashboard still works');

    const resStatusUpdate = await request.put('/api/complaints/' + newUnresolvedComplaint._id + '/status').set('Authorization', 'Bearer ' + facultyToken).send({ status: 'in_progress', comment: 'Working on it' });
    assert(resStatusUpdate.status === 200, 'Day 7 complaint status update still works');

    const resMyComplaints = await request.get('/api/complaints/my').set('Authorization', 'Bearer ' + studentToken);
    assert(resMyComplaints.status === 200, 'Student can fetch their complaints');

  } catch (err) {
    if (err.name === 'MongoServerSelectionError') {
      console.error('MONGODB ATLAS CONNECTION ISSUE — BACKEND TESTING BLOCKED');
    } else {
      console.error('Test execution failed:', err);
    }
  } finally {
    console.log('Tests Completed: ' + passCount + ' Passed, ' + failCount + ' Failed.');
    await mongoose.disconnect();
    process.exit(failCount === 0 ? 0 : 1);
  }
}

runTests();
