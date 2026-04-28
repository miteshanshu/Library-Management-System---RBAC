# Library Management System

Role-based library management application with a React frontend, an Express REST API, and a PostgreSQL schema under `library_app`. The current codebase supports admin, librarian, and student workflows for authentication, catalog management, circulation, reporting, and a set of optional modern features such as reviews, reservations, announcements, and wishlists.

## Tech Stack

- Frontend: React 18, Vite, React Router, Material UI, Zustand, Axios, Recharts, React Hook Form, Zod, Day.js
- Backend: Node.js, Express, JSON Web Tokens, Helmet, CORS, `pg`
- Database: PostgreSQL with SQL schema, views, functions, procedures, and optional trigram indexes
- Testing and tooling: Jest, Playwright, ESLint, Nodemon

## Features

Only features that are implemented in the current files are listed here.

- JWT login, student self-registration, current-user lookup, profile update, and password change
- Role-protected backend route groups for `admin`, `librarian`, and `student`
- Admin operations for:
  - librarian account creation and activation/deactivation
  - user listing
  - book CRUD
  - book-copy management, including bulk copy creation and bulk deletion
  - membership type management
  - member status override
  - fee waiver and force-closing loans
- Librarian operations for:
  - student lookup by card number or email
  - viewing student loans, overdue loans, fees, and alerts
  - book browsing, copy status lookup, stock status view, and barcode scan
  - overdue alert generation and resolution
  - reservation fulfillment and cancellation
- Student operations for:
  - viewing personal loans, overdue loans, fees, payment history, and alerts
  - browsing books with optional author and genre filters
  - viewing book details and available copies
- Circulation operations for checkout, issue, return, loan details, member loan history, and copy loan history
- Admin reporting for overdue items, circulation, inventory, member activity, debt aging, turnaround metrics, and dashboard summary
- Global search with role-based result sets
- Optional feature routes backed by `db/schema/03_modern_features.sql`:
  - reviews and ratings
  - reservations
  - announcements
  - wishlist

## Project Structure

```text
backend/
  src/
    app.js                      Express app wiring and route registration
    server.js                   HTTP server bootstrap and shutdown handling
    config/
      env.js                    Environment variable loading and validation
      db.js                     PostgreSQL pool, retry helpers, transaction helpers
    controllers/                Route handlers for auth, admin, librarian, student, circulation, reports, and optional features
    middleware/
      auth.js                   JWT authentication and role helper
      requireRole.js            Variadic role guard used by most route groups
    routes/                     Express route modules mounted under /api/*
    services/
      globalSearch.service.js   Role-aware multi-entity search
    utils/
      error.js                  Error classes and global error handler
      response.js               Standard success envelope
  scripts/
    run-migration.js            Runs db/schema/03_modern_features.sql
    fix_book_copies_schema.js   Adds created_by to book_copies if missing
    reset-user-password.js      Resets a user's password by email
  tests/e2e/                    Playwright API tests

frontend/
  src/
    main.jsx                    React entry point
    App.jsx                     Theme, localization, auth bootstrap, router provider
    routes/index.jsx            Public and protected route map
    api/                        Axios client and endpoint wrappers
    store/                      Zustand stores for auth, theme, and UI state
    components/                 Layout, auth, charts, dialogs, widgets
    pages/                      Admin, librarian, student, auth, and shared pages
    theme/                      Material UI theme definitions

db/
  schema/                       Base schema, auth schema, optional feature schema, and search indexes
  functions/                    Standalone SQL function definitions
  procedures/                   Circulation and overdue/fee procedures
  views/                        Analytics and overdue views
  admin/                        Admin helper functions and stock-status view
  reports/                      Ready-to-run reporting SQL
  seeds/                        Sample bootstrap data

docs/images/                    Repository screenshots
```

## Getting Started

### Prerequisites

- Node.js `>=14.0.0` for the backend
- npm
- PostgreSQL
- A PostgreSQL database that can enable `pgcrypto`
- `pg_trgm` if you plan to apply `db/schema/07_fuzzy_search_indexes.sql`

### Installation

This repository has separate frontend and backend packages.

1. Install backend dependencies:

```powershell
Set-Location backend
npm install
```

2. Install frontend dependencies:

```powershell
Set-Location ..\frontend
npm install
```

3. Create the backend environment file:

```powershell
Set-Location ..\backend
Copy-Item .env.example .env
```

4. Initialize the database by applying the SQL files in order:

```sql
db/schema/00_init_schema.sql
db/schema/01_constraints_indexes.sql
db/schema/02_users_and_auth.sql
db/schema/03_modern_features.sql
db/schema/07_fuzzy_search_indexes.sql
db/functions/fn_verify_user_credentials.sql
db/procedures/checkout_and_return.sql
db/procedures/overdue_and_fees.sql
db/admin/admin_functions.sql
db/admin/admin_views.sql
db/views/analytics_views.sql
db/views/vw_overdue_loans.sql
db/reports/inventory_and_member_reports.sql
db/seeds/sample_data.sql
```

Notes:

- `db/schema/03_modern_features.sql` is what creates the tables used by reviews, reservations, announcements, wishlist, and `fn_calculate_book_rating`.
- Controllers for those features check database object existence at runtime, so the API can run without them, but those features will report as unavailable.

### Running the App

Run the backend:

```powershell
Set-Location backend
npm run dev
```

Run the frontend in a second terminal:

```powershell
Set-Location frontend
npm run dev
```

Current local defaults from the code:

- Backend listens on `http://localhost:5000`
- Frontend dev server listens on `http://localhost:5173`
- Vite proxies `/api` to `http://localhost:5000`
- The frontend Axios client is configured with `baseURL: http://localhost:5000/api`

## Environment Variables

The backend requires `DATABASE_URL`. These values are defined in [backend/.env.example](D:/libarary%20management/backend/.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Express server port, defaults to `5000` |
| `NODE_ENV` | No | Runtime mode, defaults to `development` |
| `JWT_SECRET` | No in code, but effectively required for production | JWT signing secret |
| `JWT_EXPIRY` | No | JWT expiry window, defaults to `24h` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DB_SCHEMA` | No | Database schema name, defaults to `library_app` |
| `DB_POOL_MAX` | No | Maximum pool size |
| `DB_IDLE_TIMEOUT_MS` | No | Idle timeout for pooled connections |
| `DB_CONNECTION_TIMEOUT_MS` | No | Connection timeout |
| `DB_MAX_USES` | No | Max uses per pooled connection |
| `DB_RETRY_ATTEMPTS` | No | Retry attempts for transient database errors |
| `DB_RETRY_DELAY_MS` | No | Retry delay base in milliseconds |

## API Endpoints

Routes are mounted in [backend/src/app.js](D:/libarary%20management/backend/src/app.js).

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/auth/change-password`

### Admin

- `POST /api/admin/librarians`
- `PATCH /api/admin/librarians/:user_id`
- `GET /api/admin/users`
- `GET /api/admin/login-list`
- `POST /api/admin/books`
- `PATCH /api/admin/books/:book_id`
- `DELETE /api/admin/books/:book_id`
- `POST /api/admin/book-copies`
- `POST /api/admin/book-copies/bulk`
- `POST /api/admin/book-copies/bulk-delete`
- `GET /api/admin/book-copies`
- `PATCH /api/admin/book-copies/:copy_id/status`
- `PATCH /api/admin/book-copies/:copy_id/location`
- `DELETE /api/admin/book-copies/:copy_id`
- `GET /api/admin/membership-types`
- `POST /api/admin/membership-types`
- `PATCH /api/admin/members/:member_id/override`
- `POST /api/admin/fees/:fee_id/waive`
- `POST /api/admin/loans/:loan_id/force-close`

### Librarian

- `GET /api/librarian/students/search`
- `GET /api/librarian/students/:member_id/loans`
- `GET /api/librarian/students/:member_id/overdue-loans`
- `GET /api/librarian/students/:member_id/fees`
- `GET /api/librarian/students/:member_id/alerts`
- `GET /api/librarian/book-copies/:copy_id`
- `PATCH /api/librarian/book-copies/:copy_id/mark-available`
- `POST /api/librarian/book-copies/bulk`
- `POST /api/librarian/alerts/generate-overdue`
- `PATCH /api/librarian/alerts/:alert_id/resolve`
- `POST /api/librarian/alerts`
- `GET /api/librarian/books/stock-status`
- `GET /api/librarian/books/:book_id/copies`
- `GET /api/librarian/books`
- `POST /api/librarian/scan-barcode`
- `GET /api/librarian/reservations`
- `PATCH /api/librarian/reservations/:id/fulfill`
- `PATCH /api/librarian/reservations/:id/cancel`

### Student

- `GET /api/student/my-loans`
- `GET /api/student/my-overdue-loans`
- `GET /api/student/my-fees`
- `GET /api/student/my-alerts`
- `GET /api/student/payment-history`
- `GET /api/student/books/:book_id/available-copies`
- `GET /api/student/books/:book_id`
- `GET /api/student/books`

### Circulation

- `POST /api/circulation/checkout`
- `POST /api/circulation/issue`
- `POST /api/circulation/return`
- `GET /api/circulation/loans/:loan_id`
- `GET /api/circulation/member/:member_id/active-loans`
- `GET /api/circulation/member/:member_id/loans`
- `GET /api/circulation/copy/:copy_id/history`

### Reports

- `GET /api/reports/overdue`
- `GET /api/reports/circulation`
- `GET /api/reports/inventory`
- `GET /api/reports/member-activity`
- `GET /api/reports/debt-aging`
- `GET /api/reports/turnaround-metrics`
- `GET /api/reports/dashboard-summary`

### Search

- `GET /api/search`

### Optional Feature Routes

- `POST /api/features/reviews`
- `GET /api/features/reviews/:bookId`
- `POST /api/features/reservations`
- `GET /api/features/reservations/my`
- `PATCH /api/features/reservations/:id/cancel`
- `GET /api/features/announcements`
- `POST /api/features/announcements`
- `GET /api/features/wishlist`
- `POST /api/features/wishlist`
- `DELETE /api/features/wishlist/:bookId`

## System Design

### High-Level Architecture

The repository is split into three concrete layers:

1. Frontend SPA in `frontend/`
2. REST API in `backend/`
3. PostgreSQL schema, procedures, functions, views, and seed data in `db/`

The frontend is a role-aware single-page app. It boots in [frontend/src/main.jsx](D:/libarary%20management/frontend/src/main.jsx), renders [frontend/src/App.jsx](D:/libarary%20management/frontend/src/App.jsx), and uses [frontend/src/routes/index.jsx](D:/libarary%20management/frontend/src/routes/index.jsx) to gate admin, librarian, student, and shared profile routes through `ProtectedRoute`.

The backend exposes all HTTP entry points from [backend/src/app.js](D:/libarary%20management/backend/src/app.js). Request handling is organized by route module, then delegated into controller modules. Shared database access goes through [backend/src/config/db.js](D:/libarary%20management/backend/src/config/db.js), which provides:

- a pooled PostgreSQL client
- transient-error retries
- transaction helpers
- convenience wrappers for SQL functions and procedures
- runtime checks for optional relations and routines

The database layer is not just storage. It contains part of the application behavior:

- core data model in `db/schema/00_init_schema.sql`
- auth/bootstrap functions in `db/schema/02_users_and_auth.sql`
- optional feature tables in `db/schema/03_modern_features.sql`
- circulation procedures in `db/procedures/checkout_and_return.sql`
- overdue and fee procedures in `db/procedures/overdue_and_fees.sql`
- analytic and stock views in `db/views/` and `db/admin/`

### Request Flow

Typical protected request flow:

1. The frontend calls the Axios client in [frontend/src/api/axios.js](D:/libarary%20management/frontend/src/api/axios.js).
2. The request interceptor reads the JWT from `localStorage` and sets `Authorization: Bearer <token>`.
3. Express receives the request and sends it through `authenticate` and, where configured, a role guard.
4. A controller validates input and performs one of:
   - direct SQL queries
   - a database transaction through `withTransaction`
   - a stored procedure call through `callProcedure`
   - a SQL function call through `selectFunction`
5. The controller returns a standard success envelope using `sendSuccess`.
6. The Axios response interceptor unwraps the `data` payload for the UI.

### Component Interaction

- Auth state lives in [frontend/src/store/authStore.js](D:/libarary%20management/frontend/src/store/authStore.js). It persists `token` and `user` to `localStorage`, revalidates the session with `/api/auth/me`, and drives route access.
- Route protection is enforced twice:
  - client-side by `ProtectedRoute`
  - server-side by JWT auth and role middleware
- The frontend API layer is separated by domain: `auth`, `admin`, `librarian`, `student`, `circulation`, `reports`, and `features`.
- Global search is implemented as a backend service in [backend/src/services/globalSearch.service.js](D:/libarary%20management/backend/src/services/globalSearch.service.js). It runs parallel queries and exposes different result sets by role:
  - `student`: books and authors
  - `librarian`: books, copies, members, and loans
  - `admin`: librarian results plus users

### Data Model

Core tables defined today:

- `membership_types`
- `members`
- `publishers`
- `authors`
- `genres`
- `books`
- `book_authors`
- `book_genres`
- `library_locations`
- `book_copies`
- `loans`
- `loan_fees`
- `fee_payments`
- `member_alerts`
- `users`

Optional feature tables:

- `reviews`
- `reservations`
- `announcements`
- `wishlist`

Important supporting database objects:

- `fn_register_student_user`
- `fn_create_librarian_user`
- `fn_verify_user_credentials`
- `fn_calculate_book_rating`
- `fn_admin_add_book`
- `fn_admin_delete_book`
- `fn_admin_add_copy`
- `fn_admin_delete_copy`
- `sp_checkout_book`
- `sp_return_book`
- `sp_refresh_overdue_status`
- `sp_generate_overdue_alerts`
- `sp_apply_fee_payment`
- `vw_inventory_summary`
- `vw_member_activity`
- `vw_overdue_loans`
- `vw_book_stock_status`

### Practical Design Decisions Visible in Code

- The backend requires a single `DATABASE_URL` connection string instead of discrete host/user/password variables.
- The database pool always connects with SSL enabled and applies `search_path` to the configured schema.
- Circulation logic is split between database procedures and application code:
  - `/api/circulation/checkout` delegates to `sp_checkout_book`
  - `/api/circulation/return` delegates to `sp_return_book`
  - `/api/circulation/issue` performs its own explicit transaction in Node.js with business-rule validation
- Optional features are runtime-tolerant. Controllers for reviews, announcements, and wishlist check whether the relevant tables or functions exist before using them.
- Search and reporting are query-driven rather than being backed by a separate service layer or cache.

## Build, Test, and Maintenance Commands

### Backend

```powershell
Set-Location backend
npm run dev
npm start
npm test
npm run test:e2e
npm run lint
npm run reset-password
```

### Frontend

```powershell
Set-Location frontend
npm run dev
npm run build
npm run preview
npm run lint
```

### Maintenance scripts present in the repo

These scripts exist in `backend/scripts`, but they are not exposed through `package.json` scripts except for password reset.

- `node scripts/run-migration.js`
- `node scripts/fix_book_copies_schema.js`
- `node scripts/reset-user-password.js <email> <new-password>`

## Future Improvements

These are conservative observations from the current repository, not a product roadmap.

- There is no root-level automation script that installs both packages or boots frontend and backend together.
- The backend `.env.example` is the active source of truth, but some older documentation inside the repository still references a different DB variable shape.
- Optional features are conditionally available based on database objects, so deployments need a clear migration policy to avoid mismatches between UI/API behavior and schema state.
