import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Link,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress,
    useTheme,
    alpha,
    Container,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Email as EmailIcon,
    Lock as LockIcon,
    MenuBook as LogoIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store';
import { getDashboardPath } from '../../components/auth/ProtectedRoute';

// Validation schema
const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading, error, clearError, user } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const fillDemoCredentials = () => {
        setValue('email', 'demoadmin@library.in', { shouldValidate: true });
        setValue('password', 'Admin@123', { shouldValidate: true });
    };

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(getDashboardPath(user.role));
        }
    }, [isAuthenticated, user, navigate]);

    // Clear error on unmount
    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    const onSubmit = async (data) => {
        const result = await login(data.email, data.password);
        if (result.success) {
            navigate(getDashboardPath(result.user.role));
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                // Dynamic decorative background
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-20%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    zIndex: 0,
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-20%',
                    left: '-10%',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    zIndex: 0,
                },
            }}
        >
            <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 2 }}>
                <Card
                    sx={{
                        borderRadius: 4,
                        boxShadow: theme.shadows[20],
                        backdropFilter: 'blur(20px)',
                        background: alpha(theme.palette.background.paper, 0.8),
                        border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    }}
                >
                    <CardContent sx={{ p: 5 }}>
                        {/* Logo */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 72,
                                    height: 72,
                                    borderRadius: '20px',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                    boxShadow: `0 8px 20px -6px ${alpha(theme.palette.primary.main, 0.6)}`,
                                    mb: 2,
                                    transform: 'rotate(-5deg)',
                                }}
                            >
                                <LogoIcon sx={{ fontSize: 36, color: 'white', transform: 'rotate(5deg)' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={800} gutterBottom sx={{
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                backgroundClip: 'text',
                                textFillColor: 'transparent',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                LibraryMS
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Welcome back! Please sign in to continue.
                            </Typography>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={clearError}>
                                {error}
                            </Alert>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <TextField
                                {...register('email')}
                                label="Email Address"
                                type="email"
                                fullWidth
                                margin="normal"
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                {...register('password')}
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                margin="normal"
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={isLoading}
                                sx={{
                                    mt: 4,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                }}
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Register Link */}
                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Typography color="text.secondary" variant="body2">
                                Don't have an account?{' '}
                                <Link
                                    component={RouterLink}
                                    to="/register"
                                    fontWeight={700}
                                    sx={{
                                        color: 'primary.main',
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    Register as Student
                                </Link>
                            </Typography>
                        </Box>

                        {/* Demo Credentials */}
                        <Box
                            sx={{
                                mt: 4,
                                p: 2,
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                borderRadius: 3,
                                border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        >
                            <Typography variant="caption" color="text.primary" fontWeight={700} display="block" mb={0.5}>
                                Demo Credentials:
                            </Typography>
                            <Typography variant="caption" fontFamily="monospace" display="block" color="text.secondary">
                                Demo ID: demoadmin@library.in
                            </Typography>
                            <Typography variant="caption" fontFamily="monospace" display="block" color="text.secondary">
                                Demo Password: Admin@123
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                Demo account is read-only for profile and password changes.
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                fullWidth
                                onClick={fillDemoCredentials}
                                sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700 }}
                            >
                                Use Demo Account
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Login;
