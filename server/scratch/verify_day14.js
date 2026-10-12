import supertest from 'supertest';
import app from '../server.js';
import mongoose from 'mongoose';

const request = supertest(app);

async function runVerification() {
  console.log('--- STARTING DAY 14 PRODUCTION READINESS VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log('✅ ' + message);
      passed++;
    } else {
      console.error('❌ FAILED: ' + message);
      failed++;
    }
  };

  try {
    // 1. Root health check
    const rootRes = await request.get('/');
    assert(rootRes.status === 200, 'Root GET / returns 200');
    assert(rootRes.body.status === 'ok', 'Root response contains status: "ok"');
    assert(rootRes.body.message === 'CampusFix API is running', 'Root message matches');

    // Wait briefly for DB connection to establish
    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 10) {
      await new Promise((r) => setTimeout(r, 500));
      attempts++;
    }

    // 2. Database health check
    const healthRes = await request.get('/api/health');
    assert(healthRes.status === 200 || healthRes.status === 503, 'Health endpoint returns HTTP 200 or 503');
    assert(typeof healthRes.body.status === 'string', 'Health endpoint status is a string');
    assert(typeof healthRes.body.database === 'string', 'Health endpoint database is a string');
    assert(typeof healthRes.body.uptime === 'number', 'Health endpoint uptime is a number');
    assert(typeof healthRes.body.timestamp === 'string', 'Health endpoint timestamp is an ISO string');
    assert(healthRes.body.database === 'connected' || healthRes.body.database === 'connecting' || healthRes.body.database === 'disconnected', 'Database state is valid');

    // 3. Ensure sensitive details are not leaked in health endpoint
    const bodyStr = JSON.stringify(healthRes.body);
    assert(!bodyStr.includes('mongodb+srv'), 'Health endpoint does not leak MongoDB URI');
    assert(!bodyStr.includes('password'), 'Health endpoint does not leak password');
    assert(!bodyStr.includes('JWT_SECRET'), 'Health endpoint does not leak JWT secret');

    // 4. CORS verification
    // Origin from allowed list should have Access-Control-Allow-Origin header
    const corsRes = await request.get('/api/locations').set('Origin', 'http://localhost:5173');
    assert(
      corsRes.headers['access-control-allow-origin'] === 'http://localhost:5173',
      'CORS allows configured development origin http://localhost:5173'
    );

    // Disallowed origin should receive 403 or reject CORS
    const badCorsRes = await request.get('/api/locations').set('Origin', 'http://malicious-site.com');
    assert(
      badCorsRes.status === 403 || !badCorsRes.headers['access-control-allow-origin'],
      'CORS restricts unauthorized origin http://malicious-site.com'
    );

    console.log(`\nVerification Summary: ${passed} Passed, ${failed} Failed.`);
  } catch (err) {
    console.error('Verification error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    process.exit(failed === 0 ? 0 : 1);
  }
}

runVerification();
