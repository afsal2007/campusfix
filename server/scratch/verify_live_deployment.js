/**
 * server/scratch/verify_live_deployment.js
 *
 * Verifies a live deployed CampusFix backend API without modifying database data.
 *
 * Usage:
 *   node server/scratch/verify_live_deployment.js <LIVE_BACKEND_URL>
 *
 * Example:
 *   node server/scratch/verify_live_deployment.js https://campusfix-api.onrender.com
 */

const targetUrl = process.argv[2] ? process.argv[2].replace(/\/+$/, '') : null;

if (!targetUrl) {
  console.error('Error: Please provide the live backend URL as an argument.');
  console.error('Usage: node server/scratch/verify_live_deployment.js https://<your-service>.onrender.com');
  process.exit(1);
}

const runChecks = async () => {
  console.log(`\n======================================================`);
  console.log(`CAMPUSFIX LIVE BACKEND DEPLOYMENT VERIFICATION`);
  console.log(`Target URL: ${targetUrl}`);
  console.log(`======================================================\n`);

  let pass = 0;
  let fail = 0;

  const check = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      pass++;
    } else {
      console.error(`❌ [FAIL] ${title} ${details ? '(' + details + ')' : ''}`);
      fail++;
    }
  };

  try {
    // 1. Root Endpoint Check
    console.log('1. Checking root endpoint (GET /)...');
    const rootRes = await fetch(`${targetUrl}/`);
    check(rootRes.status === 200, 'Root endpoint returns HTTP 200', `Got ${rootRes.status}`);
    const rootJson = await rootRes.json().catch(() => ({}));
    check(rootJson.status === 'ok', 'Root payload includes status: "ok"');
    check(
      rootJson.message === 'CampusFix API is running',
      'Root payload includes expected welcome message'
    );

    // 2. Health Endpoint Check
    console.log('\n2. Checking health endpoint (GET /api/health)...');
    const healthRes = await fetch(`${targetUrl}/api/health`);
    check(healthRes.status === 200, 'Health endpoint returns HTTP 200', `Got ${healthRes.status}`);
    const healthJson = await healthRes.json().catch(() => ({}));
    check(healthJson.status === 'ok', 'Health status is "ok"');
    check(healthJson.database === 'connected', 'Database state is "connected"', `Got "${healthJson.database}"`);
    check(typeof healthJson.uptime === 'number', 'Uptime is reported as a number');
    check(typeof healthJson.timestamp === 'string', 'Timestamp is reported in ISO format');

    // 3. Security & Information Leakage Check
    console.log('\n3. Checking information exposure in health payload...');
    const payloadStr = JSON.stringify(healthJson);
    check(!payloadStr.includes('mongodb+srv'), 'MongoDB connection string is not exposed');
    check(!payloadStr.includes('password'), 'Passwords are not exposed');
    check(!payloadStr.includes('secret'), 'Secrets are not exposed');

    // 4. Authentication Protection Check
    console.log('\n4. Checking protected endpoints reject unauthenticated access...');
    const protectedRes = await fetch(`${targetUrl}/api/complaints`);
    check(
      protectedRes.status === 401,
      'GET /api/complaints returns HTTP 401 Unauthorized without token',
      `Got ${protectedRes.status}`
    );

    const adminRes = await fetch(`${targetUrl}/api/admin/dashboard`);
    check(
      adminRes.status === 401,
      'GET /api/admin/dashboard returns HTTP 401 Unauthorized without token',
      `Got ${adminRes.status}`
    );

    // 5. CORS Check
    console.log('\n5. Checking CORS headers for preflight and browser fetch...');
    const corsRes = await fetch(`${targetUrl}/api/health`, {
      method: 'GET',
      headers: { Origin: 'http://localhost:5173' },
    });
    const allowOrigin = corsRes.headers.get('access-control-allow-origin');
    check(
      allowOrigin !== null,
      'CORS headers are present on cross-origin requests',
      `Access-Control-Allow-Origin: ${allowOrigin}`
    );

    console.log(`\n======================================================`);
    console.log(`VERIFICATION SUMMARY: ${pass} Passed, ${fail} Failed`);
    console.log(`======================================================\n`);

    if (fail === 0) {
      console.log('🎉 Live backend is fully healthy, secure, and operational!');
    } else {
      console.error('⚠️ Some checks failed. Please inspect the log above.');
    }

    process.exit(fail === 0 ? 0 : 1);
  } catch (err) {
    console.error(`\n❌ Network/Fetch Error connecting to ${targetUrl}:`, err.message);
    process.exit(1);
  }
};

runChecks();
