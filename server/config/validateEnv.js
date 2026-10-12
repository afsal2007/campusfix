/**
 * server/config/validateEnv.js
 *
 * Validates that all required environment variables are configured.
 * Exits the process if any required variables are missing without exposing secret values.
 */

export const validateEnv = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter(
    (key) => !process.env[key] || process.env[key].trim() === ''
  );

  if (missing.length > 0) {
    console.error('====================================================');
    console.error('[FATAL] Missing required environment variable(s):');
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error('Please configure these in your environment or .env file.');
    console.error('See server/.env.example for reference.');
    console.error('====================================================');
    process.exit(1);
  }
};

export default validateEnv;
