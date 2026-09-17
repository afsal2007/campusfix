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
  return { token: data.token, userId: data.user._id };
}

// Helper: register test user
async function registerUser(suffix, role, email) {
  const reg = `TST7_${suffix}_${Date.now()}`;
  const password = 'Password123!';
  const res = await fetch(`${SERVER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Test User ${suffix}`,
      registerNumber: reg,
      department: 'CSE',
      year: 2,
      className: 'CSE-A',
      email,
      password,
    }),
  });
  
  if (res.ok) {
      const data = await res.json();
      return { token: data.token, userId: data.user._id };
  }
  
  // If exists, try login
  try {
      return await loginUser(email, password);
  } catch (e) {
      const errorData = await res.json();
      throw new Error(`Register/Login failed for ${suffix}: ${JSON.stringify(errorData)}`);
  }
}

async function runTests() {
  console.log('--- STARTING DAY 7 BACKEND API TESTS (REAL MONGO ATLAS) ---\n');
  let pass = 0;
  let fail = 0;

  try {
    const healthRes = await fetch(`${SERVER_URL}/api/locations`);
    if (!healthRes.ok) throw new Error(`Server not reachable: ${healthRes.status}`);
    const healthData = await healthRes.json();
    if (!healthData.locations?.length) throw new Error('No locations found in DB');
    const locationId = healthData.locations[0]._id;
    console.log('✓ Server reachable, using location:', locationId);

    // Register Student 1
    const s1Email = `student1_day7_${Date.now()}@example.com`;
    const s1 = await registerUser('S1', 'student', s1Email);
    console.log('✓ Student 1 ready');

    // Register Student 2
    const s2Email = `student2_day7_${Date.now()}@example.com`;
    const s2 = await registerUser('S2', 'student', s2Email);
    console.log('✓ Student 2 ready');

    // Since register API only makes students, we need a faculty account. 
    // We'll rely on an existing faculty account or script might fail if none exists.
    let facultyToken = null;
    let adminToken = null;
    let facultyId = null;
    
    const knownFacultyCredentials = [
      { email: 'faculty@campusfix.com', password: 'faculty123' },
      { email: 'faculty1@campusfix.com', password: 'Password123!' },
      { email: 'admin@campusfix.com', password: 'admin123' },
      { email: 'admin@campusfix.com', password: 'Password123!' },
    ];

    for (const cred of knownFacultyCredentials) {
      try {
        const u = await loginUser(cred.email, cred.password);
        if (cred.email.includes('admin')) {
            adminToken = u.token;
        } else {
            facultyToken = u.token;
            facultyId = u.userId;
        }
      } catch (e) { }
    }

    if (!facultyToken) {
        console.log('⚠ No faculty account found. Run DB seed or create one manually.');
        console.log('Many Day 7 tests require a faculty token.');
        return;
    }
    console.log('✓ Faculty account ready:', facultyId);

    // Student 1 creates a complaint
    const cRes = await fetch(`${SERVER_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1.token}` },
      body: JSON.stringify({
        location: locationId,
        title: 'Day 7 Test Complaint',
        description: 'Testing Faculty Management',
        category: 'technical',
        priority: 'high',
      }),
    });
    const cData = await cRes.json();
    if (!cRes.ok) throw new Error(`Failed to create test complaint: ${JSON.stringify(cData)}`);
    const complaintId = cData.complaint._id;
    console.log('✓ Test complaint created by Student 1:', complaintId);
    console.log('');

    // TEST 1: Faculty can get faculty users (200)
    let res = await fetch(`${SERVER_URL}/api/users/faculty`, {
        headers: { Authorization: `Bearer ${facultyToken}` },
    });
    if (res.status === 200) pass++; else fail++;
    console.log(`TEST 1: Faculty can get faculty users -> Expected 200, Got ${res.status}`);

    // TEST 2: Admin can get faculty users (200)
    if (adminToken) {
        res = await fetch(`${SERVER_URL}/api/users/faculty`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.status === 200) pass++; else fail++;
        console.log(`TEST 2: Admin can get faculty users -> Expected 200, Got ${res.status}`);
    } else {
        console.log(`TEST 2: Skipped (no admin account found)`);
    }

    // TEST 3: Student cannot get faculty users (403)
    res = await fetch(`${SERVER_URL}/api/users/faculty`, {
        headers: { Authorization: `Bearer ${s1.token}` },
    });
    if (res.status === 403) pass++; else fail++;
    console.log(`TEST 3: Student cannot get faculty users -> Expected 403, Got ${res.status}`);

    // TEST 4: Unauthenticated request (401)
    res = await fetch(`${SERVER_URL}/api/users/faculty`);
    if (res.status === 401) pass++; else fail++;
    console.log(`TEST 4: Unauthenticated request -> Expected 401, Got ${res.status}`);

    // TEST 5: Faculty assigns complaint (200)
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
        body: JSON.stringify({ assignedTo: facultyId }),
    });
    let data = await res.json();
    if (res.status === 200 && data.complaint.assignedTo === facultyId && data.complaint.status === 'assigned') pass++; else fail++;
    console.log(`TEST 5: Faculty assigns complaint -> Expected 200 & Assigned, Got ${res.status}, Status: ${data.complaint?.status}`);

    // TEST 6: Faculty updates status: assigned -> in_progress (200)
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
        body: JSON.stringify({ status: 'in_progress' }),
    });
    data = await res.json();
    if (res.status === 200 && data.complaint.status === 'in_progress') pass++; else fail++;
    console.log(`TEST 6: Faculty updates status to in_progress -> Expected 200 & In Progress, Got ${res.status}, Status: ${data.complaint?.status}`);

    // TEST 7: Faculty updates status: in_progress -> resolved (200), check resolvedAt
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
        body: JSON.stringify({ status: 'resolved' }),
    });
    data = await res.json();
    if (res.status === 200 && data.complaint.status === 'resolved' && data.complaint.resolvedAt) pass++; else fail++;
    console.log(`TEST 7: Faculty updates status to resolved -> Expected 200 & resolvedAt populated, Got ${res.status}, resolvedAt: ${!!data.complaint?.resolvedAt}`);

    // TEST 8: Faculty adds action/comment (201)
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
        body: JSON.stringify({ action: 'Test Action', comment: 'Testing comment addition' }),
    });
    if (res.status === 201) pass++; else fail++;
    console.log(`TEST 8: Faculty adds action/comment -> Expected 201, Got ${res.status}`);

    // TEST 9: Get complaint details, verify action history
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${facultyToken}` },
    });
    data = await res.json();
    if (res.status === 200 && Array.isArray(data.actionHistory) && data.actionHistory.length >= 4) pass++; else fail++;
    console.log(`TEST 9: Get complaint details verifies action history -> Expected 200 and history.length >= 4, Got ${res.status}, length: ${data.actionHistory?.length}`);

    // TEST 10: Student attempts to assign complaint (403)
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1.token}` },
        body: JSON.stringify({ assignedTo: facultyId }),
    });
    if (res.status === 403) pass++; else fail++;
    console.log(`TEST 10: Student attempts to assign complaint -> Expected 403, Got ${res.status}`);

    // TEST 11: Student attempts to update status (403)
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1.token}` },
        body: JSON.stringify({ status: 'in_progress' }),
    });
    if (res.status === 403) pass++; else fail++;
    console.log(`TEST 11: Student attempts to update status -> Expected 403, Got ${res.status}`);

    // TEST 12: Student attempts to add action (403)
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1.token}` },
        body: JSON.stringify({ action: 'Test', comment: 'Test' }),
    });
    if (res.status === 403) pass++; else fail++;
    console.log(`TEST 12: Student attempts to add action -> Expected 403, Got ${res.status}`);

    // TEST 13: Verify Day 5: student can still view their own complaint
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${s1.token}` },
    });
    if (res.status === 200) pass++; else fail++;
    console.log(`TEST 13: Student can view their own complaint -> Expected 200, Got ${res.status}`);

    // TEST 14: Verify student cannot view another student's complaint
    res = await fetch(`${SERVER_URL}/api/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${s2.token}` },
    });
    if (res.status === 403) pass++; else fail++;
    console.log(`TEST 14: Student cannot view another student's complaint -> Expected 403, Got ${res.status}`);

    // TEST 15: Verify GET /api/complaints/my still works
    res = await fetch(`${SERVER_URL}/api/complaints/my`, {
        headers: { Authorization: `Bearer ${s1.token}` },
    });
    data = await res.json();
    if (res.status === 200 && Array.isArray(data.complaints)) pass++; else fail++;
    console.log(`TEST 15: GET /api/complaints/my still works -> Expected 200 and Array, Got ${res.status}`);

    console.log('\n==================================================');
    console.log(`TESTS COMPLETED. ${pass} PASSED, ${fail} FAILED`);
    console.log('==================================================');
    if (fail > 0) process.exitCode = 1;

  } catch (err) {
    if (err.message.includes('fetch failed')) {
        console.error('\n❌ MongoDB Atlas / Server connection blocked. Tests could not run properly.');
    } else {
        console.error('\n❌ FATAL ERROR:', err.message);
    }
    process.exitCode = 1;
  }
}

runTests();
