const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const librarianRoutes = require('./routes/librarian.routes');
const studentRoutes = require('./routes/student.routes');
const circulationRoutes = require('./routes/circulation.routes');
const reportsRoutes = require('./routes/reports.routes');
const featureRoutes = require('./routes/features.routes');
const { globalErrorHandler } = require('./utils/error');
const searchRoutes = require('./routes/search.routes');


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/librarian', librarianRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/circulation', circulationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/features', featureRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(globalErrorHandler);

module.exports = app;
