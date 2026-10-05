import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Location from '../models/Location.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const fetchJson = async (url, options = {}) => {
  options.headers = { 'Content-Type': 'application/json', ...options.headers };
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.response = { status: res.status, data };
    throw error;
  }
  return { status: res.status, data };
};

const testDay10 = async () => {
  console.log('--- STARTING DAY 10 LOCATION VERIFICATION TESTS ---');

  let token = null;
  let testLocation = null;

  try {
    console.log('1. Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    console.log('\n2. Registering a test student...');
    const registerRes = await fetchJson(`${BASE_URL}/users/register`, {
      method: 'POST',
      body: {
        name: 'Test Student',
        email: `teststudent_${Date.now()}@test.com`,
        password: 'password123',
        role: 'student',
        registerNumber: `REG${Date.now()}`,
        department: 'CSE',
        year: 3,
        className: 'A'
      }
    });
    token = registerRes.data.token;
    console.log('Test student registered and token received.');

    console.log('\n3. Fetching locations...');
    const locRes = await fetchJson(`${BASE_URL}/locations`);
    const locations = locRes.data.locations;
    if (locations.length === 0) {
      console.log('No locations found, seeding a test location...');
      testLocation = await Location.create({
        name: 'Test Lab',
        building: 'Test Building',
        latitude: 10.0,
        longitude: 20.0,
        allowedRadius: 100
      });
    } else {
      testLocation = locations[0];
    }
    console.log(`Using location: ${testLocation.name} (${testLocation.latitude}, ${testLocation.longitude}), Radius: ${testLocation.allowedRadius}`);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    console.log('\n4. Testing Unauthenticated request...');
    try {
      await fetchJson(`${BASE_URL}/locations/verify`, {
        method: 'POST',
        body: {
          locationId: testLocation._id,
          latitude: testLocation.latitude,
          longitude: testLocation.longitude
        }
      });
      console.error('FAIL: Unauthenticated request should have failed.');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('PASS: Unauthenticated request returned 401.');
      } else {
        console.error('FAIL: Unauthenticated request failed with wrong status:', err.response?.status);
      }
    }

    console.log('\n5. Testing Invalid location ID...');
    try {
      await fetchJson(`${BASE_URL}/locations/verify`, {
        method: 'POST',
        headers: authHeaders.headers,
        body: {
          locationId: 'invalid-id',
          latitude: testLocation.latitude,
          longitude: testLocation.longitude
        }
      });
      console.error('FAIL: Invalid location ID should have failed.');
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        console.log(`PASS: Invalid location ID returned ${err.response.status}.`);
      } else {
        console.error('FAIL: Invalid location ID failed with wrong status:', err.response?.status);
      }
    }

    console.log('\n6. Testing Nonexistent location...');
    try {
      await fetchJson(`${BASE_URL}/locations/verify`, {
        method: 'POST',
        headers: authHeaders.headers,
        body: {
          locationId: new mongoose.Types.ObjectId().toString(),
          latitude: testLocation.latitude,
          longitude: testLocation.longitude
        }
      });
      console.error('FAIL: Nonexistent location should have failed.');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('PASS: Nonexistent location returned 404.');
      } else {
        console.error('FAIL: Nonexistent location failed with wrong status:', err.response?.status);
      }
    }

    console.log('\n7. Testing Missing coordinates...');
    try {
      await fetchJson(`${BASE_URL}/locations/verify`, {
        method: 'POST',
        headers: authHeaders.headers,
        body: {
          locationId: testLocation._id
        }
      });
      console.error('FAIL: Missing coordinates should have failed.');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('PASS: Missing coordinates returned 400.');
      } else {
        console.error('FAIL: Missing coordinates failed with wrong status:', err.response?.status);
      }
    }

    console.log('\n8. Testing Coordinates inside allowed radius...');
    try {
      const res = await fetchJson(`${BASE_URL}/locations/verify`, {
        method: 'POST',
        headers: authHeaders.headers,
        body: {
          locationId: testLocation._id,
          latitude: testLocation.latitude, // Exact same coordinate
          longitude: testLocation.longitude
        }
      });
      if (res.data.verified === true && typeof res.data.distance === 'number') {
        console.log('PASS: Verification succeeded, distance is numeric.');
        if (res.data.allowedRadius) console.log('PASS: allowedRadius is returned.');
      } else {
        console.error('FAIL: Verification response unexpected:', res.data);
      }
    } catch (err) {
      console.error('FAIL: Valid coordinates failed:', err.response?.data);
    }

    console.log('\n9. Testing Coordinates outside allowed radius...');
    try {
      const res = await fetchJson(`${BASE_URL}/locations/verify`, {
        method: 'POST',
        headers: authHeaders.headers,
        body: {
          locationId: testLocation._id,
          latitude: testLocation.latitude + 0.1, // Far away
          longitude: testLocation.longitude + 0.1
        }
      });
      if (res.data.verified === false) {
        console.log('PASS: Verification returned false for outside radius.');
      } else {
        console.error('FAIL: Verification returned true for outside radius.', res.data);
      }
    } catch (err) {
      console.error('FAIL: Request failed instead of returning verified=false:', err.response?.data);
    }

    console.log('\n10. Testing complaint creation with coordinates outside allowed radius...');
    try {
      await fetchJson(`${BASE_URL}/complaints`, {
        method: 'POST',
        headers: authHeaders.headers,
        body: {
          title: 'Test Issue',
          description: 'Test description',
          category: 'other',
          location: testLocation._id,
          latitude: testLocation.latitude + 0.1,
          longitude: testLocation.longitude + 0.1
        }
      });
      console.error('FAIL: Complaint created even though coordinates were outside radius.');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('PASS: Backend rejected complaint with 403 when outside radius.');
      } else {
        console.error('FAIL: Expected 403 but got:', err.response?.status);
      }
    }

    console.log('\n11. Testing complaint creation with VALID coordinates...');
    let complaintId = null;
    try {
      const res = await fetchJson(`${BASE_URL}/complaints`, {
        method: 'POST',
        headers: authHeaders.headers,
        body: {
          title: 'Test Valid Issue',
          description: 'Test valid description',
          category: 'other',
          location: testLocation._id,
          latitude: testLocation.latitude,
          longitude: testLocation.longitude
        }
      });
      if (res.status === 201) {
        console.log('PASS: Complaint successfully created.');
        complaintId = res.data.complaint._id;
      }
    } catch (err) {
      console.error('FAIL: Valid coordinates failed to create complaint:', err.response?.data);
    }

    console.log('\n12. Verifying existing student complaint retrieval still works...');
    try {
      const res = await fetchJson(`${BASE_URL}/complaints/my`, {
        headers: authHeaders.headers
      });
      if (res.status === 200 && Array.isArray(res.data.complaints)) {
        console.log('PASS: Student complaint retrieval works.');
      } else {
        console.error('FAIL: Student complaint retrieval returned unexpected format.');
      }
    } catch (err) {
      console.error('FAIL: Student complaint retrieval failed:', err.response?.data);
    }

    console.log('\n--- ALL DAY 10 TESTS COMPLETED ---');

  } catch (error) {
    if (error.name === 'MongoServerSelectionError' || error.name === 'MongooseServerSelectionError') {
      console.error('\nMONGODB ATLAS CONNECTION ISSUE — BACKEND TESTING BLOCKED');
    } else {
      console.error('\nTest suite failed due to an error:', error.message);
    }
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

testDay10();
