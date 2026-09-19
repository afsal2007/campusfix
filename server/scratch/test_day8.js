/**
 * server/scratch/test_day8.js
 *
 * Day 8 backend verification tests.
 * Uses Node built-in fetch (Node 18+) — no axios required.
 * Connects to real MongoDB Atlas to generate test JWT tokens.
 *
 * Run: node scratch/test_day8.js  (from server/ directory)
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

// ── helpers ──────────────────────────────────────────────────

async function request(path, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_URL}${path}`, { headers });
    let body = null;
    try { body = await res.json(); } catch (_) {}
    return { status: res.status, body };
  } catch (err) {
    return { status: null, body: null, error: err.message };
  }
}

function pass(label) { console.log(`  ✅ ${label}`); }
function fail(label, detail) { console.error(`  ❌ ${label}${detail ? `: ${detail}` : ''}`); }

// ── main ─────────────────────────────────────────────────────

async function runTests() {
  console.log('\n══════════════════════════════════════════');
  console.log('   CampusFix Day 8 — Backend Test Suite');
  console.log('══════════════════════════════════════════\n');

  // ── Step 0: connect to MongoDB Atlas ───────────────────────
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB Atlas\n');
  } catch (err) {
    console.error('MONGODB ATLAS CONNECTION ISSUE — BACKEND TESTING BLOCKED');
    console.error(err.message);
    process.exit(1);
  }

  // ── Step 1: load users and generate tokens ──────────────────
  const User = (await import('../models/User.js')).default;
  const adminUser  = await User.findOne({ role: 'admin' });
  const facultyUser = await User.findOne({ role: 'faculty' });
  const studentUser = await User.findOne({ role: 'student' });

  const signToken = (id) =>
    jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  const adminToken   = adminUser   ? signToken(adminUser._id)   : null;
  const facultyToken = facultyUser ? signToken(facultyUser._id) : null;
  const studentToken = studentUser ? signToken(studentUser._id) : null;

  if (!adminToken)   console.warn('⚠️  No admin user found — some tests will be skipped.');
  if (!facultyToken) console.warn('⚠️  No faculty user found — some tests will be skipped.');
  if (!studentToken) console.warn('⚠️  No student user found — some tests will be skipped.');

  console.log('──────────────────────────────────────────');
  console.log(' /api/admin/dashboard');
  console.log('──────────────────────────────────────────');

  // Test 1: Admin → 200
  if (adminToken) {
    const r = await request('/admin/dashboard', adminToken);
    if (r.status === 200) pass('Test 1: Admin GET /api/admin/dashboard → 200');
    else fail('Test 1: Admin GET /api/admin/dashboard', `status=${r.status}`);
  }

  // Test 2: Faculty → 403
  if (facultyToken) {
    const r = await request('/admin/dashboard', facultyToken);
    if (r.status === 403) pass('Test 2: Faculty GET /api/admin/dashboard → 403');
    else fail('Test 2: Faculty GET /api/admin/dashboard', `status=${r.status}`);
  }

  // Test 3: Student → 403
  if (studentToken) {
    const r = await request('/admin/dashboard', studentToken);
    if (r.status === 403) pass('Test 3: Student GET /api/admin/dashboard → 403');
    else fail('Test 3: Student GET /api/admin/dashboard', `status=${r.status}`);
  }

  // Test 4: Unauthenticated → 401
  {
    const r = await request('/admin/dashboard', null);
    if (r.status === 401) pass('Test 4: Unauthenticated GET /api/admin/dashboard → 401');
    else fail('Test 4: Unauthenticated GET /api/admin/dashboard', `status=${r.status}`);
  }

  console.log('\n──────────────────────────────────────────');
  console.log(' /api/admin/recurring-issues');
  console.log('──────────────────────────────────────────');

  // Test 5: Admin → 200
  if (adminToken) {
    const r = await request('/admin/recurring-issues', adminToken);
    if (r.status === 200) pass('Test 5: Admin GET /api/admin/recurring-issues → 200');
    else fail('Test 5: Admin GET /api/admin/recurring-issues', `status=${r.status}`);
  }

  // Test 6: Faculty → 403
  if (facultyToken) {
    const r = await request('/admin/recurring-issues', facultyToken);
    if (r.status === 403) pass('Test 6: Faculty GET /api/admin/recurring-issues → 403');
    else fail('Test 6: Faculty GET /api/admin/recurring-issues', `status=${r.status}`);
  }

  // Test 7: Student → 403
  if (studentToken) {
    const r = await request('/admin/recurring-issues', studentToken);
    if (r.status === 403) pass('Test 7: Student GET /api/admin/recurring-issues → 403');
    else fail('Test 7: Student GET /api/admin/recurring-issues', `status=${r.status}`);
  }

  console.log('\n──────────────────────────────────────────');
  console.log(' Dashboard response shape');
  console.log('──────────────────────────────────────────');

  if (adminToken) {
    const r = await request('/admin/dashboard', adminToken);
    const d = r.body;
    if (!d) { fail('Cannot verify shape — no response body'); }
    else {
      // Test 8: summary counts exist
      const s = d.summary;
      if (s && typeof s.totalComplaints === 'number' && typeof s.unresolvedComplaints === 'number')
        pass('Test 8: summary counts exist');
      else fail('Test 8: summary counts missing', JSON.stringify(s));

      // Test 9: byCategory exists
      if (Array.isArray(d.byCategory)) pass('Test 9: byCategory exists');
      else fail('Test 9: byCategory missing');

      // Test 10: byLocation exists
      if (Array.isArray(d.byLocation)) pass('Test 10: byLocation exists');
      else fail('Test 10: byLocation missing');

      // Test 13: unresolvedComplaintsList has no resolved/rejected
      if (Array.isArray(d.unresolvedComplaintsList)) {
        const contaminated = d.unresolvedComplaintsList.filter(
          c => c.status === 'resolved' || c.status === 'rejected'
        );
        if (contaminated.length === 0) pass('Test 13: Unresolved list contains no resolved/rejected complaints');
        else fail('Test 13: Unresolved list contains final-status complaints', `count=${contaminated.length}`);
      } else {
        fail('Test 13: unresolvedComplaintsList missing from response');
      }
    }
  }

  console.log('\n──────────────────────────────────────────');
  console.log(' Recurring issue fields & frequency logic');
  console.log('──────────────────────────────────────────');

  if (adminToken) {
    const r = await request('/admin/recurring-issues', adminToken);
    if (r.status === 200 && Array.isArray(r.body)) {
      if (r.body.length === 0) {
        console.log('  ℹ️  Test 11/12: No recurring issues found — logic tests skipped (0 complaints).');
      } else {
        const first = r.body[0];
        // Test 11: check fields exist
        if (
          first.category !== undefined &&
          first.complaintCount !== undefined &&
          first.unresolvedCount !== undefined &&
          first.frequencyLevel !== undefined
        ) pass('Test 11: Recurring entries have required fields');
        else fail('Test 11: Required fields missing', JSON.stringify(first));

        // Test 12: frequency logic
        let freqOk = true;
        for (const item of r.body) {
          if (item.complaintCount <= 4 && item.frequencyLevel !== 'normal')     { freqOk = false; break; }
          if (item.complaintCount >= 5 && item.complaintCount <= 9 && item.frequencyLevel !== 'frequent') { freqOk = false; break; }
          if (item.complaintCount >= 10 && item.frequencyLevel !== 'recurring') { freqOk = false; break; }
        }
        if (freqOk) pass('Test 12: Frequency logic correct (0-4=normal, 5-9=frequent, 10+=recurring)');
        else fail('Test 12: Frequency logic is wrong');
      }
    } else {
      fail('Test 11/12: Could not fetch recurring issues', `status=${r.status}`);
    }
  }

  console.log('\n──────────────────────────────────────────');
  console.log(' Day 7 regression — existing routes');
  console.log('──────────────────────────────────────────');

  // Test 14: Faculty complaint routes still work
  if (facultyToken) {
    const r = await request('/complaints', facultyToken);
    if (r.status === 200) pass('Test 14: Faculty /api/complaints still works');
    else fail('Test 14: Faculty /api/complaints broken', `status=${r.status}`);
  }

  // Test 15: Student complaint routes still work
  if (studentToken) {
    const r = await request('/complaints/my', studentToken);
    if (r.status === 200) pass('Test 15: Student /api/complaints/my still works');
    else fail('Test 15: Student /api/complaints/my broken', `status=${r.status}`);
  }

  console.log('\n══════════════════════════════════════════');
  console.log('   Tests complete');
  console.log('══════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('Unexpected error:', err);
  await mongoose.disconnect();
  process.exit(1);
});
