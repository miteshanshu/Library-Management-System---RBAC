
// Verify that the backend's entry points still import cleanly.
// Each check is independent: one broken module must not hide the
// rest, and a failed check must fail the process so a bad import
// can never print an overall success.

const failures = [];

function requireOk(label, modulePath) {
  console.log('Testing ' + label + '...');
  try {
    require(modulePath);
    console.log('\u2713 ' + label + ' OK');
  } catch (e) {
    failures.push(label);
    console.error('\u2717 ' + label + ' ERROR:', e.message);
  }
}

console.log('Testing controllers...');
requireOk('circulationController', './src/controllers/circulationController.js');
requireOk('reportsController', './src/controllers/reportsController.js');
requireOk('authController', './src/controllers/authController.js');
requireOk('adminController', './src/controllers/adminController.js');
requireOk('librarianController', './src/controllers/librarianController.js');
requireOk('studentController', './src/controllers/studentController.js');

console.log('Testing routes...');
requireOk('auth routes', './src/routes/auth.routes.js');
requireOk('admin routes', './src/routes/admin.routes.js');
requireOk('circulation routes', './src/routes/circulation.routes.js');
requireOk('reports routes', './src/routes/reports.routes.js');
requireOk('librarian routes', './src/routes/librarian.routes.js');
requireOk('student routes', './src/routes/student.routes.js');

if (failures.length > 0) {
  console.error('\n\u2717 ' + failures.length + ' import check(s) failed: ' + failures.join(', '));
  process.exit(1);
}
console.log('\n\u2713 All imports verified successfully!');
