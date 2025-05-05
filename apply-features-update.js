
const { execSync } = require('child_process');
const path = require('path');

console.log('Applying database schema updates...');
try {
  execSync('node backend/src/db-update-features.js', { stdio: 'inherit' });
  console.log('Database schema updates applied successfully');
} catch (err) {
  console.error('Error applying database schema updates:', err);
  process.exit(1);
}

console.log('All updates have been applied successfully');
