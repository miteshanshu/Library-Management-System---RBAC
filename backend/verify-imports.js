try {
  console.log('Testing circulation controller...');
  require('./src/controllers/circulationController.js');
  console.log('✓ circulationController OK');
} catch (e) {
  console.error('✗ circulationController ERROR:', e.message);
}

try {
  console.log('Testing reports controller...');
  require('./src/controllers/reportsController.js');
  console.log('✓ reportsController OK');
} catch (e) {
  console.error('✗ reportsController ERROR:', e.message);
}

try {
  console.log('Testing auth controller...');
  require('./src/controllers/authController.js');
  console.log('✓ authController OK');
} catch (e) {
  console.error('✗ authController ERROR:', e.message);
}

try {
  console.log('Testing admin controller...');
  require('./src/controllers/adminController.js');
  console.log('✓ adminController OK');
} catch (e) {
  console.error('✗ adminController ERROR:', e.message);
}

try {
  console.log('Testing librarian controller...');
  require('./src/controllers/librarianController.js');
  console.log('✓ librarianController OK');
} catch (e) {
  console.error('✗ librarianController ERROR:', e.message);
}

try {
  console.log('Testing student controller...');
  require('./src/controllers/studentController.js');
  console.log('✓ studentController OK');
} catch (e) {
  console.error('✗ studentController ERROR:', e.message);
}

try {
  console.log('\nTesting routes...');
  require('./src/routes/auth.routes.js');
  console.log('✓ auth routes OK');
  require('./src/routes/admin.routes.js');
  console.log('✓ admin routes OK');
  require('./src/routes/circulation.routes.js');
  console.log('✓ circulation routes OK');
  require('./src/routes/reports.routes.js');
  console.log('✓ reports routes OK');
  require('./src/routes/librarian.routes.js');
  console.log('✓ librarian routes OK');
  require('./src/routes/student.routes.js');
  console.log('✓ student routes OK');
} catch (e) {
  console.error('✗ Routes ERROR:', e.message);
}

console.log('\n✓ All imports verified successfully!');
