const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    db.end()
      .catch((err) => console.error('Error closing database pool:', err.message))
      .finally(() => {
        console.log('Server closed');
        process.exit(0);
      });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    db.end()
      .catch((err) => console.error('Error closing database pool:', err.message))
      .finally(() => {
        console.log('Server closed');
        process.exit(0);
      });
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = server;
