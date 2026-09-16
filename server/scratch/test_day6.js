import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SERVER_URL = `http://localhost:${process.env.PORT || 5000}`;

// Helper: login a user and return token
async function loginUser(email, password) {
  const res = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  return data.token;
}

// Helper: register student and return token
async function registerStudent(suffix) {
  const reg = `TST6_${suffix}_${Date.now()}`;
  const email = `test6_${suffix}_${Date.now()}@example.com`;
  const res = await fetch(`${SERVER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Test Student ${suffix}`,
      registerNumber: reg,
      department: 'CSE',
      year: 2,
      className: 'CSE-A',
      email,
      password: 'Password123!',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Register failed for ${suffix}: ${JSON.stringify(data)}`);
  return { token: data.token, userId: data.user._id };
}

async function runTests() {
  console.log('--- STARTING DAY 6 BACKEND API TESTS (REAL MONGO ATLAS) ---\n');
  let pass = 0;
  let fail = 0;

  try {
    // ── Setup: verify server is running ──────────────────────────────────────
    const healthRes = await fetch(`${SERVER_URL}/api/locations`);
    if (!healthRes.ok) throw new Error(`Server not reachable: ${healthRes.status}`);
    const healthData = await healthRes.json();
    if (!healthData.locations?.length) throw new Error('No locations found in DB');
    const locationId = healthData.locations[0]._id;
    console.log('✓ Server reachable, using location:', locationId);

    // ── Setup: register a test student ───────────────────────────────────────
    const { token: studentToken } = await registerStudent('D6S');
    console.log('✓ Test student registered');

    // Student creates a complaint so there is data to list
    const cRes = await fetch(`${SERVER_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        location: locationId,
        title: 'Day 6 Test Complaint',
        description: 'Created by the Day 6 test script.',
        category: 'technical',
        priority: 'high',
      }),
    });
    const cData = await cRes.json();
    if (!cRes.ok) throw new Error(`Failed to create test complaint: ${JSON.stringify(cData)}`);
    const testComplaintId = cData.complaint._id;
    console.log('✓ Test complaint created:', testComplaintId);
    console.log('');

    // ────────────────────────────────────────────────────────────────────────
    // TEST 1: Student GET /api/complaints → 403 Forbidden
    // ────────────────────────────────────────────────────────────────────────
    {
      const res = await fetch(`${SERVER_URL}/api/complaints`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      console.log('TEST 1 - Student GET /api/complaints:', res.status);
      if (res.status === 403) {
        console.log('✓ TEST 1 PASSED: Student correctly received 403 Forbidden\n');
        pass++;
      } else {
        console.error(`✗ TEST 1 FAILED: Expected 403, got ${res.status}\n`);
        fail++;
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // TEST 2: No JWT GET /api/complaints → 401 Unauthorized
    // ────────────────────────────────────────────────────────────────────────
    {
      const res = await fetch(`${SERVER_URL}/api/complaints`);
      console.log('TEST 2 - No JWT GET /api/complaints:', res.status);
      if (res.status === 401) {
        console.log('✓ TEST 2 PASSED: No JWT correctly received 401 Unauthorized\n');
        pass++;
      } else {
        console.error(`✗ TEST 2 FAILED: Expected 401, got ${res.status}\n`);
        fail++;
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // TEST 3: GET /api/complaints/my still works for students
    // ────────────────────────────────────────────────────────────────────────
    {
      const res = await fetch(`${SERVER_URL}/api/complaints/my`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      console.log('TEST 3 - Student GET /api/complaints/my:', res.status);
      if (res.status === 200 && Array.isArray(data.complaints)) {
        console.log('✓ TEST 3 PASSED: /api/complaints/my still works for students (returned', data.complaints.length, 'complaints)\n');
        pass++;
      } else {
        console.error(`✗ TEST 3 FAILED: Expected 200 with complaints array, got ${res.status}: ${JSON.stringify(data)}\n`);
        fail++;
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // TEST 4: GET /api/complaints/:id still works for students (own complaint)
    // ────────────────────────────────────────────────────────────────────────
    {
      const res = await fetch(`${SERVER_URL}/api/complaints/${testComplaintId}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      console.log('TEST 4 - Student GET /api/complaints/:id (own):', res.status);
      if (res.status === 200 && data.complaint?._id === testComplaintId) {
        if (data.complaint.student?.password) {
          console.error('✗ TEST 4 FAILED: SECURITY VIOLATION — password exposed!\n');
          fail++;
        } else {
          console.log('✓ TEST 4 PASSED: /api/complaints/:id works for student (own complaint, no password)\n');
          pass++;
        }
      } else {
        console.error(`✗ TEST 4 FAILED: Expected 200 with complaint, got ${res.status}: ${JSON.stringify(data)}\n`);
        fail++;
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // TESTS 5 & 6 require faculty/admin accounts.
    // These need an existing faculty or admin user to be in the DB.
    // We will attempt to find one. If none exists, we report clearly.
    // ────────────────────────────────────────────────────────────────────────
    
    // Try common faculty/admin credentials from previous day tests
    let facultyToken = null;
    let adminToken = null;
    
    // Try well-known faculty accounts from seeding
    const knownFacultyCredentials = [
      { email: 'faculty@campusfix.com', password: 'faculty123' },
      { email: 'faculty1@campusfix.com', password: 'Password123!' },
      { email: 'admin@campusfix.com', password: 'admin123' },
      { email: 'admin@campusfix.com', password: 'Password123!' },
    ];

    for (const cred of knownFacultyCredentials) {
      try {
        const token = await loginUser(cred.email, cred.password);
        if (!facultyToken) facultyToken = token;
        if (cred.email.includes('admin') && !adminToken) adminToken = token;
        console.log(`✓ Logged in as ${cred.email}`);
      } catch {
        // silently skip non-existent accounts
      }
    }

    if (!facultyToken && !adminToken) {
      console.log('⚠ No faculty/admin accounts found in DB for Tests 5 & 6.');
      console.log('  Create a faculty or admin user and re-run to test those endpoints.\n');
      console.log('  MANUAL VERIFICATION REQUIRED for faculty and admin access.\n');
    }

    // ────────────────────────────────────────────────────────────────────────
    // TEST 5: Faculty GET /api/complaints → 200
    // ────────────────────────────────────────────────────────────────────────
    if (facultyToken) {
      const res = await fetch(`${SERVER_URL}/api/complaints`, {
        headers: { Authorization: `Bearer ${facultyToken}` },
      });
      const data = await res.json();
      console.log('TEST 5 - Faculty GET /api/complaints:', res.status);
      if (res.status === 200 && Array.isArray(data.complaints)) {
        // Verify fields in returned complaints
        const sample = data.complaints[0];
        let fieldsOk = true;
        const required = ['_id', 'title', 'category', 'priority', 'status'];
        for (const f of required) {
          if (sample && sample[f] === undefined) {
            console.error(`  MISSING FIELD: ${f}`);
            fieldsOk = false;
          }
        }
        if (sample?.student?.password) {
          console.error('  SECURITY VIOLATION: password exposed in student!');
          fieldsOk = false;
        }
        if (fieldsOk) {
          console.log(`✓ TEST 5 PASSED: Faculty received 200, ${data.complaints.length} complaints, all required fields present, no passwords\n`);
          pass++;
        } else {
          console.error('✗ TEST 5 FAILED: Field or security check failed\n');
          fail++;
        }
      } else {
        console.error(`✗ TEST 5 FAILED: Expected 200 with complaints array, got ${res.status}: ${JSON.stringify(data)}\n`);
        fail++;
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // TEST 6: Admin GET /api/complaints → 200
    // ────────────────────────────────────────────────────────────────────────
    if (adminToken) {
      const res = await fetch(`${SERVER_URL}/api/complaints`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      console.log('TEST 6 - Admin GET /api/complaints:', res.status);
      if (res.status === 200 && Array.isArray(data.complaints)) {
        console.log(`✓ TEST 6 PASSED: Admin received 200, ${data.complaints.length} complaints\n`);
        pass++;
      } else {
        console.error(`✗ TEST 6 FAILED: Expected 200 with complaints array, got ${res.status}: ${JSON.stringify(data)}\n`);
        fail++;
      }
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('==================================================');
    if (fail === 0) {
      console.log(`ALL TESTS COMPLETED. ${pass} PASSED, ${fail} FAILED`);
      console.log('==================================================');
    } else {
      console.log(`TESTS COMPLETED. ${pass} PASSED, ${fail} FAILED`);
      console.log('==================================================');
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err.message);
    process.exitCode = 1;
  }
}

runTests();
