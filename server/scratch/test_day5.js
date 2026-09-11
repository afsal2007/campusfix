import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const SERVER_URL = `http://localhost:${process.env.PORT || 5000}`;

async function runTests() {
  console.log('--- STARTING DAY 5 BACKEND API TESTS VIA SERVER (REAL MONGO ATLAS) ---');
  let tokenA, tokenB;
  let testComplaintId;

  try {
    // Check server health / connection
    const resLoc = await fetch(`${SERVER_URL}/api/locations`);
    if (!resLoc.ok) throw new Error(`Server returned ${resLoc.status} for /api/locations`);
    const dataLoc = await resLoc.json();
    if (!dataLoc.locations || dataLoc.locations.length === 0) {
      throw new Error('No locations returned from backend DB');
    }
    const locationId = dataLoc.locations[0]._id;
    console.log('✓ Connected to running server & fetched location:', locationId);

    // Register Student A
    const regA = `TST_A_${Date.now()}`;
    const emailA = `testA_${Date.now()}@example.com`;
    const resRegA = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student A',
        registerNumber: regA,
        department: 'CSE',
        year: 3,
        className: 'CSE-A',
        email: emailA,
        password: 'Password123!',
      }),
    });
    const dataRegA = await resRegA.json();
    if (!resRegA.ok) throw new Error(`Failed to register Student A: ${JSON.stringify(dataRegA)}`);
    tokenA = dataRegA.token;
    console.log('✓ Registered Student A:', dataRegA.user._id);

    // Register Student B
    const regB = `TST_B_${Date.now()}`;
    const emailB = `testB_${Date.now()}@example.com`;
    const resRegB = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student B',
        registerNumber: regB,
        department: 'ECE',
        year: 2,
        className: 'ECE-B',
        email: emailB,
        password: 'Password123!',
      }),
    });
    const dataRegB = await resRegB.json();
    if (!resRegB.ok) throw new Error(`Failed to register Student B: ${JSON.stringify(dataRegB)}`);
    tokenB = dataRegB.token;
    console.log('✓ Registered Student B:', dataRegB.user._id);

    // Create complaint for Student A
    const resCreate = await fetch(`${SERVER_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        location: locationId,
        title: 'Broken Projector in Room 301',
        description: 'The projector turns off unexpectedly after 5 minutes.',
        category: 'technical',
        priority: 'high',
      }),
    });
    const dataCreate = await resCreate.json();
    if (!resCreate.ok) throw new Error(`Failed to create complaint: ${JSON.stringify(dataCreate)}`);
    testComplaintId = dataCreate.complaint._id;
    console.log('✓ Created complaint for Student A:', testComplaintId);

    // -------------------------------------------------------------
    // TEST 1: Student A fetches their own complaint (Expected 200 OK)
    // -------------------------------------------------------------
    const res1 = await fetch(`${SERVER_URL}/api/complaints/${testComplaintId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data1 = await res1.json();
    console.log('TEST 1 Response status:', res1.status);
    if (res1.status !== 200 || !data1.complaint) {
      throw new Error(`TEST 1 FAILED. Expected 200 OK, got ${res1.status}: ${JSON.stringify(data1)}`);
    }
    const c = data1.complaint;
    if (c.student.password) throw new Error('SECURITY VIOLATION: Password exposed in response!');
    if (!c.location?.name) throw new Error('FAIL: Location not populated!');
    if (!c._id || !c.title || !c.description || !c.category || !c.priority || !c.status || !c.createdAt || !c.updatedAt) {
      throw new Error('FAIL: Missing required complaint fields in response!');
    }
    console.log('✓ TEST 1 PASSED: Authenticated student fetched own complaint details successfully (200 OK)');

    // -------------------------------------------------------------
    // TEST 2: Request without JWT token (Expected 401 Unauthorized)
    // -------------------------------------------------------------
    const res2 = await fetch(`${SERVER_URL}/api/complaints/${testComplaintId}`, {
      method: 'GET',
    });
    console.log('TEST 2 Response status:', res2.status);
    if (res2.status !== 401) {
      throw new Error(`TEST 2 FAILED. Expected 401 Unauthorized, got ${res2.status}`);
    }
    console.log('✓ TEST 2 PASSED: Request without JWT correctly received 401 Unauthorized');

    // -------------------------------------------------------------
    // TEST 3: Nonexistent ObjectId (Expected 404 Not Found)
    // -------------------------------------------------------------
    const fakeObjectId = '507f1f77bcf86cd799439011';
    const res3 = await fetch(`${SERVER_URL}/api/complaints/${fakeObjectId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log('TEST 3 Response status:', res3.status);
    if (res3.status !== 404) {
      throw new Error(`TEST 3 FAILED. Expected 404 Not Found, got ${res3.status}`);
    }
    console.log('✓ TEST 3 PASSED: Nonexistent complaint ID correctly received 404 Not Found');

    // -------------------------------------------------------------
    // TEST 4: Invalid ObjectId format (Expected 404 Not Found)
    // -------------------------------------------------------------
    const res4 = await fetch(`${SERVER_URL}/api/complaints/invalid-id-format-999`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log('TEST 4 Response status:', res4.status);
    if (res4.status !== 404) {
      throw new Error(`TEST 4 FAILED. Expected 404 Not Found, got ${res4.status}`);
    }
    console.log('✓ TEST 4 PASSED: Invalid ObjectId format correctly received 404 Not Found');

    // -------------------------------------------------------------
    // TEST 5: Student B attempts Student A's complaint (Expected 403 Forbidden)
    // -------------------------------------------------------------
    const res5 = await fetch(`${SERVER_URL}/api/complaints/${testComplaintId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log('TEST 5 Response status:', res5.status);
    if (res5.status !== 403) {
      throw new Error(`TEST 5 FAILED. Expected 403 Forbidden, got ${res5.status}`);
    }
    console.log("✓ TEST 5 PASSED: Student B attempting Student A's complaint correctly received 403 Forbidden");

    console.log('\n==================================================');
    console.log('ALL 5 BACKEND ENDPOINT TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
    process.exitCode = 1;
  }
}

runTests();
