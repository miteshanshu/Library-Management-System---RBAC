import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute, { getDashboardPath } from '../components/auth/ProtectedRoute';

// Layouts
import MainLayout from '../components/layout/MainLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import UsersPage from '../pages/admin/Users';
import BooksPage from '../pages/admin/Books';
import BookCopiesPage from '../pages/admin/BookCopies';
import MembershipTypesPage from '../pages/admin/MembershipTypes';
import ReportsPage from '../pages/admin/Reports';

// Librarian Pages
import LibrarianDashboard from '../pages/librarian/Dashboard';
import CirculationPage from '../pages/librarian/Circulation';
import StudentSearchPage from '../pages/librarian/StudentSearch';
import LibrarianBooksPage from '../pages/librarian/Books';
import AlertsPage from '../pages/librarian/Alerts';
import ReservationsPage from '../pages/librarian/Reservations';
import BarcodeLookupPage from '../pages/librarian/BarcodeLookup';

// Student Pages
import StudentDashboard from '../pages/student/Dashboard';
import MyLoansPage from '../pages/student/MyLoans';
import MyFeesPage from '../pages/student/MyFees';
import WishlistPage from '../pages/student/Wishlist';
import MyReservationsPage from '../pages/student/MyReservations';
import MyAlertsPage from '../pages/student/MyAlerts';
import BrowseBooksPage from '../pages/student/BrowseBooks';
import BookDetailsPage from '../pages/student/BookDetails';

// Common Pages
import ProfilePage from '../pages/common/Profile';

// Auth store for role-based redirect
import useAuthStore from '../store/authStore';

// Role redirect component
const RoleBasedRedirect = () => {
    const { user, isAuthenticated, isInitialized } = useAuthStore();

    if (!isInitialized) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to={getDashboardPath(user?.role)} replace />;
};

const router = createBrowserRouter([
    // Public routes
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },

    // Root redirect based on role
    {
        path: '/',
        element: <RoleBasedRedirect />,
    },

    // Admin routes
    {
        path: '/admin',
        element: (
            <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="/admin/dashboard" replace /> },
            { path: 'dashboard', element: <AdminDashboard /> },
            { path: 'users', element: <UsersPage /> },
            { path: 'books', element: <BooksPage /> },
            { path: 'book-copies', element: <BookCopiesPage /> },
            { path: 'membership-types', element: <MembershipTypesPage /> },
            { path: 'reports', element: <ReportsPage /> },
        ],
    },

    // Librarian routes
    {
        path: '/librarian',
        element: (
            <ProtectedRoute allowedRoles={['librarian']}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="/librarian/dashboard" replace /> },
            { path: 'dashboard', element: <LibrarianDashboard /> },
            { path: 'circulation', element: <CirculationPage /> },
            { path: 'students', element: <StudentSearchPage /> },
            { path: 'books', element: <LibrarianBooksPage /> },
            { path: 'alerts', element: <AlertsPage /> },
            { path: 'reservations', element: <ReservationsPage /> },
            { path: 'barcode-lookup', element: <BarcodeLookupPage /> },
        ],
    },

    // Student routes
    {
        path: '/student',
        element: (
            <ProtectedRoute allowedRoles={['student']}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="/student/dashboard" replace /> },
            { path: 'dashboard', element: <StudentDashboard /> },
            { path: 'my-loans', element: <MyLoansPage /> },
            { path: 'reservations', element: <MyReservationsPage /> },
            { path: 'my-alerts', element: <MyAlertsPage /> },
            { path: 'my-fees', element: <MyFeesPage /> },
            { path: 'wishlist', element: <WishlistPage /> },
            { path: 'books', element: <BrowseBooksPage /> },
            { path: 'books/:bookId', element: <BookDetailsPage /> },
        ],
    },

    // Common routes for authenticated users
    {
        path: '/profile',
        element: (
            <ProtectedRoute allowedRoles={['admin', 'librarian', 'student']}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <ProfilePage /> }
        ]
    },

    // Catch all - redirect to role-based dashboard
    {
        path: '*',
        element: <RoleBasedRedirect />,
    },
]);

export default router;
