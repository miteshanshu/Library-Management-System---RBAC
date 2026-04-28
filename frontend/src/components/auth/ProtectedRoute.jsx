import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Box, CircularProgress } from '@mui/material';

/**
 * ProtectedRoute component
 * Wraps routes that require authentication and optionally specific roles
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} [props.allowedRoles] - Optional array of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, isInitialized, user } = useAuthStore();
    const location = useLocation();

    // Show loading spinner while checking auth
    if (isLoading || !isInitialized) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user?.role;
        if (!userRole || !allowedRoles.includes(userRole)) {
            // Redirect to appropriate dashboard based on role
            const dashboardPath = getDashboardPath(userRole);
            return <Navigate to={dashboardPath} replace />;
        }
    }

    return children;
};

/**
 * Get dashboard path based on user role
 */
export const getDashboardPath = (role) => {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'librarian':
            return '/librarian/dashboard';
        case 'student':
            return '/student/dashboard';
        default:
            return '/login';
    }
};

export default ProtectedRoute;
