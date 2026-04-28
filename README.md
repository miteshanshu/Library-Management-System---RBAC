# Library Management System

![Node.js](https://img.shields.io/badge/Node.js-14%2B-green)
![Express](https://img.shields.io/badge/Express.js-Backend-black)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-336791)
![Status](https://img.shields.io/badge/Status-Active-success)

A full-stack library management platform with role-based access control for admins, librarians, and students. The project combines a PostgreSQL database layer, a Node.js/Express API, and a React + Vite frontend with dedicated workspaces for each user role.

## Overview

The application supports three primary roles:

- `admin`: manage users, books, membership types, reporting, and operational oversight
- `librarian`: handle circulation, alerts, reservations, barcode lookup, and student support
- `student`: browse books, track loans and fees, manage reservations, wishlist items, and personal profile details

## Current Product Surface

### Frontend experience

- authentication flow with login and registration
- protected routing with role-aware redirects
- admin dashboards for users, books, copies, membership types, and reports
- librarian dashboards for circulation, student search, reservations, alerts, and barcode lookup
- student dashboards for catalog browsing, book details, loans, reservations, alerts, fees, and wishlist management
- shared profile page for authenticated users

### Backend/API

- JWT-based authentication
- role-protected route groups for `admin`, `librarian`, and `student`
- circulation endpoints
- reporting endpoints
- global search endpoints
- feature endpoints used by the frontend
- health check endpoint at `GET /api/health`

### Database layer

- schema initialization and constraints
- authentication objects and credential verification function
- modern feature migration in `db/schema/03_modern_features.sql`
- fuzzy-search indexes
- stored procedures for circulation and overdue/fee handling
- admin views and functions
- analytics and overdue reporting views
- sample seed data

## Screenshots

| Login | Student Dashboard |
| :---: | :---: |
| ![Login Screen](docs/images/login_screen.png) | ![Student Dashboard](docs/images/student_dashboard.png) |

| Admin Dashboard | Librarian Dashboard |
| :---: | :---: |
| ![Admin Dashboard](docs/images/admin_dashboard.png) | ![Librarian Dashboard](docs/images/librarian_dashboard.png) |

## Project Structure

```text
library-management/
|- backend/
|  |- scripts/                  # Utility scripts for migrations and password resets
|  |- src/
|  |  |- config/                # Environment and PostgreSQL setup
|  |  |- controllers/           # Route controllers by domain/role
|  |  |- middleware/            # Auth and role guards
|  |  |- routes/                # Express route modules
|  |  |- services/              # Shared business logic
|  |  `- utils/                 # Error and response helpers
|  |- package.json
|  `- README.md
|- db/
|  |- admin/                    # Admin SQL functions and views
|  |- functions/                # PostgreSQL functions
|  |- procedures/               # Stored procedures
|  |- reports/                  # Reporting queries
|  |- schema/                   # Ordered schema and migration SQL
|  |- seeds/                    # Sample data
|  `- views/                    # Analytics and operational views
|- docs/
|  `- images/                   # README screenshots
|- frontend/
|  |- src/
|  |  |- api/                   # Axios clients and API wrappers
|  |  |- components/            # Layout, auth, charts, dialogs, widgets
|  |  |- pages/                 # Admin, librarian, student, auth, common pages
|  |  |- routes/                # React Router configuration
|  |  |- store/                 # Zustand stores
|  |  `- theme/                 # Material UI theme
|  |- index.html
|  `- package.json
`- README.md
```

## Tech Stack

- backend: Node.js, Express, PostgreSQL, JWT, bcrypt, Helmet, CORS
- frontend: React 18, Vite, Material UI, React Router, Zustand, Axios, Recharts, React Hook Form, Zod
- testing and tooling: Jest, Playwright, ESLint

## Getting Started

### 1. Create the database

Create a PostgreSQL database named `library_db`, then run the SQL files in order.

```bash
psql -U postgres -c "CREATE DATABASE library_db;"

psql -U postgres -d library_db -f db/schema/00_init_schema.sql
psql -U postgres -d library_db -f db/schema/01_constraints_indexes.sql
psql -U postgres -d library_db -f db/schema/02_users_and_auth.sql
psql -U postgres -d library_db -f db/schema/03_modern_features.sql
psql -U postgres -d library_db -f db/schema/07_fuzzy_search_indexes.sql

psql -U postgres -d library_db -f db/functions/fn_verify_user_credentials.sql
psql -U postgres -d library_db -f db/procedures/checkout_and_return.sql
psql -U postgres -d library_db -f db/procedures/overdue_and_fees.sql

psql -U postgres -d library_db -f db/admin/admin_functions.sql
psql -U postgres -d library_db -f db/admin/admin_views.sql
psql -U postgres -d library_db -f db/views/analytics_views.sql
psql -U postgres -d library_db -f db/views/vw_overdue_loans.sql
psql -U postgres -d library_db -f db/reports/inventory_and_member_reports.sql

psql -U postgres -d library_db -f db/seeds/sample_data.sql
```

### 2. Configure and run the backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Update `backend/.env` with your local PostgreSQL credentials and JWT secret.

Typical values:

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

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The default frontend dev server runs on `http://localhost:5173` and expects the backend API at `http://localhost:5000`.

## Available Commands

### Backend

```bash
cd backend

npm run dev          # start the API with nodemon
npm start            # start the API with Node.js
npm test             # run Jest with coverage
npm run test:e2e     # run Playwright end-to-end tests
npm run lint         # lint backend source
npm run reset-password
```

### Frontend

```bash
cd frontend

npm run dev          # start the Vite dev server
npm run build        # create a production build
npm run preview      # preview the production build
npm run lint         # lint frontend source
```

## API Route Groups

- `/api/auth`
- `/api/admin`
- `/api/librarian`
- `/api/student`
- `/api/circulation`
- `/api/reports`
- `/api/search`
- `/api/features`
- `/api/health`

## Security and Architecture Notes

- password hashing is handled with `bcrypt`
- authentication uses signed JWTs
- protected routes are enforced in backend middleware and frontend route guards
- PostgreSQL access is structured around parameterized queries, procedures, functions, and views
- Helmet and CORS are enabled in the Express app

## Repository Notes

- root-level screenshots live in `docs/images/`
- backend-specific implementation details are documented further in `backend/README.md`
- the repository currently tracks both frontend and backend lockfiles for reproducible installs

## License

This repository is currently marked with an MIT badge in package metadata, but the previous README described the project as proprietary. Confirm the intended license before publishing or distributing it externally.
