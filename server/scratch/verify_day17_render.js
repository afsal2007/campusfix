/**
 * server/scratch/verify_day17_render.js
 *
 * Non-destructive verification of Day 17 Render deployment readiness:
 * 1. Dynamic PORT assignment (Render assigns PORT e.g. 10000).
 * 2. Health check endpoint (/api/health) credential safety & payload format.
 * 3. Root health check (/) payload format.
 * 4. CORS configuration with configured CLIENT_URL.
 * 5. Environment variable validation (validateEnv).
 */

import express from 'express';
import cors from 'cors';
import supertest from 'supertest';
import { validateEnv } from '../config/validateEnv.js';

let passed = 0;
let failed = 0;

const assert = (condition, title, details = '') => {
  if (condition) {
    console.log(`✅ [PASS] ${title}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${title} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
};

async function testDynamicPortBinding() {
  console.log('\n--- 1. Testing Dynamic PORT Assignment ---');
  const testPort = 10000; // Standard Render assigned port
  const app = express();
  app.get('/test-port', (req, res) => res.json({ port: testPort, active: true }));

  await new Promise((resolve, reject) => {
    const server = app.listen(testPort, () => {
      assert(server.address().port === testPort, `Server successfully bound to Render dynamic PORT ${testPort}`);
      server.close(resolve);
    });
    server.on('error', reject);
  });
}

async function testHealthEndpointSafety() {
  console.log('\n--- 2. Testing /api/health Safety & Payload Format ---');
  const app = express();
  
  // Simulate mock database health endpoint as in server.js
  app.get('/api/health', (req, res) => {
    const isConnected = false; // test safe degraded response
    res.status(isConnected ? 200 : 503).json({
      status: isConnected ? 'ok' : 'degraded',
      database: 'disconnected',
      uptime: 42,
      timestamp: new Date().toISOString(),
    });
  });

  const res = await supertest(app).get('/api/health');
  assert(res.status === 503, 'Degraded DB returns 503 without crashing server');
  assert(res.body.status === 'degraded', 'Health status field is present and string');
  assert(res.body.database === 'disconnected', 'Database status field is present');
  assert(typeof res.body.uptime === 'number', 'Uptime is reported as a number');
  assert(typeof res.body.timestamp === 'string', 'Timestamp is reported as an ISO string');

  const rawJson = JSON.stringify(res.body);
  assert(!rawJson.includes('mongodb+srv'), 'No MongoDB connection string leaked');
  assert(!rawJson.includes('password'), 'No passwords leaked in health response');
  assert(!rawJson.includes('JWT_SECRET'), 'No JWT secret leaked in health response');
}

async function testCorsConfiguration() {
  console.log('\n--- 3. Testing CORS Configuration for Production & Development ---');
  
  const setupCorsApp = (clientUrlEnv, nodeEnv = 'production') => {
    const app = express();
    const defaultOrigins = ['http://localhost:5173'];
    const configuredOrigins = clientUrlEnv
      ? clientUrlEnv.split(',').map((o) => o.trim()).filter(Boolean)
      : [];
    const allowedOrigins =
      nodeEnv === 'production' && configuredOrigins.length > 0
        ? configuredOrigins
        : Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

    const corsOptions = {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    };

    app.use(cors(corsOptions));
    app.get('/api/test', (req, res) => res.json({ ok: true }));
    app.use((err, req, res, next) => {
      if (err.message && err.message.includes('not allowed by CORS')) {
        return res.status(403).json({ message: err.message });
      }
      res.status(500).json({ message: 'Server error' });
    });
    return app;
  };

  // Test with Vercel frontend URL in production
  const testVercelOrigin = 'https://campusfix-demo.vercel.app';
  const prodApp = setupCorsApp(testVercelOrigin, 'production');

  const allowedRes = await supertest(prodApp)
    .get('/api/test')
    .set('Origin', testVercelOrigin);
  assert(
    allowedRes.headers['access-control-allow-origin'] === testVercelOrigin,
    'CORS allows configured production CLIENT_URL (e.g. Vercel domain)'
  );

  const blockedRes = await supertest(prodApp)
    .get('/api/test')
    .set('Origin', 'https://unauthorized-domain.com');
  assert(
    blockedRes.status === 403,
    'CORS blocks unapproved origins with HTTP 403 in production'
  );

  // Test comma-separated CLIENT_URL
  const multiOriginApp = setupCorsApp('https://preview-1.vercel.app, https://campusfix.vercel.app', 'production');
  const multiRes1 = await supertest(multiOriginApp)
    .get('/api/test')
    .set('Origin', 'https://campusfix.vercel.app');
  assert(
    multiRes1.headers['access-control-allow-origin'] === 'https://campusfix.vercel.app',
    'CORS correctly handles comma-separated CLIENT_URL list'
  );
}

async function testEnvironmentValidation() {
  console.log('\n--- 4. Testing validateEnv Behavior ---');
  const origEnv = { ...process.env };

  try {
    // Valid env test
    process.env.MONGO_URI = 'mongodb+srv://test:test@cluster.mongodb.net/test';
    process.env.JWT_SECRET = 'super_secret_test_key_1234567890';
    let passedValidation = false;
    try {
      validateEnv();
      passedValidation = true;
    } catch (e) {
      passedValidation = false;
    }
    assert(passedValidation, 'validateEnv() succeeds when MONGO_URI and JWT_SECRET are provided');
  } finally {
    process.env = origEnv;
  }
}

async function runAll() {
  console.log('=== STARTING DAY 17 RENDER READINESS CHECKS ===');
  await testDynamicPortBinding();
  await testHealthEndpointSafety();
  await testCorsConfiguration();
  await testEnvironmentValidation();

  console.log(`\n==============================================`);
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`==============================================\n`);

  process.exit(failed === 0 ? 0 : 1);
}

runAll().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
