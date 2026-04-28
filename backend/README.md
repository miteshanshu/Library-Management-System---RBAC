# CircuLib - Backend API

Complete Node.js/Express REST API backend for CircuLib, a role-based library circulation and operations platform.

## 🚀 Features

- **JWT Authentication**: Token-based user authentication with configurable expiry
- **Role-Based Access Control**: Admin, Librarian, and Student roles with granular permissions
- **PostgreSQL Integration**: Complete database integration with stored procedures
- **RESTful API**: Clean, well-organized API endpoints
- **Error Handling**: Comprehensive error handling and validation
- **Security**: JWT tokens, password hashing, CORS, Helmet security headers
- **Testing**: Unit tests and E2E tests with Playwright
- **Code Quality**: ESLint configuration for code consistency

## 📁 Project Structure

```
src/
├── config/
│   ├── db.js                  # PostgreSQL connection pool
│   └── env.js                 # Environment variable configuration
│
├── controllers/               # Request handlers
│   ├── authController.js      # Login & registration
│   ├── adminController.js     # Admin operations
│   ├── librarianController.js # Librarian operations
│   ├── studentController.js   # Student operations
│   ├── circulationController.js # Checkout/return operations
│   ├── reportsController.js   # Analytics & reporting
│   └── globalSearchController.js # Search functionality
│
├── middleware/                # Express middleware
│   ├── auth.js                # JWT verification
│   └── requireRole.js         # Role-based authorization
│
├── routes/                    # API route definitions
│   ├── auth.routes.js         # Auth endpoints
│   ├── admin.routes.js        # Admin endpoints
│   ├── librarian.routes.js    # Librarian endpoints
│   ├── student.routes.js      # Student endpoints
│   ├── circulation.routes.js  # Circulation endpoints
│   ├── reports.routes.js      # Reports endpoints
│   └── search.routes.js       # Search endpoints
│
├── services/                  # Business logic
│   └── globalSearch.service.js # Search service
│
├── utils/                     # Utility functions
│   ├── error.js               # Error handling
│   └── response.js            # Response formatting
│
├── app.js                     # Express app configuration
└── server.js                  # Server entry point

tests/
├── e2e/                       # End-to-end tests
├── auth.json                  # Test authentication state

.env.example                   # Environment template
package.json                   # Dependencies & scripts
```

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js** 14+ and npm
- **PostgreSQL** 12+ (with schema initialized)
- **.env file** configured with database credentials

### Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   ```env
   PORT=5000
   NODE_ENV=development
   
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRY=24h
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=library_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_SCHEMA=library_app
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

## 📖 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/login` | User login | No |
| POST | `/register` | User registration | No |

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Login Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "student"
  }
}
```

### Admin Routes (`/api/admin`)

Full system management and oversight:
- User management
- System analytics and reports
- Configuration management
- Member and inventory oversight

**Requires**: Admin role

### Librarian Routes (`/api/librarian`)

Daily operational management:
- Inventory management
- Circulation operations
- Member management
- Overdue tracking

**Requires**: Librarian role

### Student Routes (`/api/student`)

Self-service operations:
- My borrowing history
- Available books search
- Account settings
- Book renewals

**Requires**: Student role (authenticated)

### Circulation Routes (`/api/circulation`)

Checkout and return operations:
- Checkout books
- Return books
- Manage renewals
- Track overdue items

**Requires**: Authenticated user

### Reports Routes (`/api/reports`)

Analytics and reporting:
- Inventory reports
- Member statistics
- Overdue analysis
- Performance metrics

**Requires**: Librarian or Admin role

### Search Routes (`/api/search`)

Global book search:
- Full-text search
- Advanced filtering
- Availability checking

**Requires**: Authenticated user

## 🔐 Authentication & Authorization

### JWT Token Flow

1. User submits credentials to `/api/auth/login`
2. Server validates and generates JWT token
3. Client includes token in `Authorization: Bearer <token>` header
4. Server verifies token on protected routes
5. Token expires after configured duration (default: 24h)

### Role-Based Access Control

Three user roles with different permissions:

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, analytics |
| **Librarian** | Circulation operations, inventory management |
| **Student** | Self-service borrowing, account management |

### Protected Route Example

```javascript
router.get(
  '/admin/users',
  authenticate,        // Verify JWT token
  requireRole('admin') // Verify admin role
);
```

## 🗄️ Database Integration

### Connection Configuration

Database connection is configured in `src/config/db.js` using pg library connection pool:

```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
```

### Stored Procedures Used

- `checkout_and_return` - Manage book checkouts and returns
- `overdue_and_fees` - Calculate overdue fines
- `verify_user_credentials` - Authenticate users

### Database Views

- `analytics_views` - Performance and usage analytics
- `vw_overdue_loans` - Overdue items tracking

## 🧪 Testing

### Unit & Integration Tests

```bash
npm test
```

Runs Jest test suite with coverage reporting.

### E2E Tests

```bash
npm run test:e2e
```

Runs Playwright browser automation tests against the running server.

### Code Quality

```bash
npm run lint
```

Validates code against ESLint rules.

## 🚀 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with hot-reload (nodemon) |
| `npm start` | Start production server |
| `npm test` | Run test suite with coverage |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Check code quality |

## 🔒 Security Features

### Implementation

✅ **JWT Authentication**: Secure token-based authentication  
✅ **Password Hashing**: bcrypt for password security  
✅ **Role-Based Middleware**: Granular access control  
✅ **Input Validation**: Request validation and sanitization  
✅ **CORS Protection**: Cross-origin request control  
✅ **Helmet Headers**: Security headers via Helmet  
✅ **SQL Injection Prevention**: Parameterized queries  

### Best Practices

- Never commit `.env` file with secrets
- Use strong JWT_SECRET in production (min 32 chars)
- Validate and sanitize all user inputs
- Use HTTPS in production
- Implement rate limiting for auth endpoints
- Regularly update dependencies

## 📋 Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment (development/production) |
| JWT_SECRET | abc123xyz... | Secret key for JWT signing (keep secure!) |
| JWT_EXPIRY | 24h | Token expiration duration |
| DB_HOST | localhost | Database hostname |
| DB_PORT | 5432 | Database port |
| DB_NAME | library_db | Database name |
| DB_USER | postgres | Database username |
| DB_PASSWORD | password | Database password |
| DB_SCHEMA | library_app | Database schema name |

## 🛠️ Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Express.js** | Web framework |
| **PostgreSQL** | Database |
| **jsonwebtoken** | JWT authentication |
| **bcrypt** | Password hashing |
| **pg** | PostgreSQL client |
| **Helmet** | Security headers |
| **CORS** | Cross-origin support |
| **Jest** | Testing framework |
| **Playwright** | E2E testing |
| **ESLint** | Code quality |
| **nodemon** | Development auto-reload |

## 🐛 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
- Verify PostgreSQL is running
- Check DB_HOST and DB_PORT in .env
- Ensure database exists: `psql -l | grep library_db`
- Verify credentials are correct

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**
- Kill process on port 5000:
  ```bash
  # macOS/Linux
  lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
  
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```
- Or change PORT in .env

### JWT Token Invalid

```
Error: jwt malformed
```

**Solutions:**
- Ensure token is sent in Authorization header: `Bearer <token>`
- Check JWT_SECRET matches between login and verification
- Verify token hasn't expired

### Database Schema Missing

```
Error: relation "users" does not exist
```

**Solutions:**
- Run database initialization scripts from `db/schema/`
- Verify `DB_SCHEMA=library_app` in .env
- Check database user has permissions

## 📞 Support & Documentation

- **Backend Tests**: Check `tests/` directory for examples
- **Database Schema**: See `../db/schema/` for table definitions
- **Stored Procedures**: See `../db/procedures/` for complex operations
- **Main README**: See `../README.md` for full project documentation

## 📄 License

This project is proprietary software for library management systems.

---

**Version**: 1.0.0  
**Last Updated**: December 2024
