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
    Person as PersonIcon,
    MenuBook as LogoIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store';
import { getDashboardPath } from '../../components/auth/ProtectedRoute';

// Validation schema
const registerSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

const Register = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { register: registerUser, isAuthenticated, isLoading, error, clearError, user } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            full_name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

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
        const result = await registerUser(data.full_name, data.email, data.password);
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
                    left: '-10%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.15)} 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    zIndex: 0,
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-10%',
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
                    <CardContent sx={{ p: 4 }}>
                        {/* Logo */}
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 64,
                                    height: 64,
                                    borderRadius: '18px',
                                    background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                                    boxShadow: `0 8px 20px -6px ${alpha(theme.palette.success.main, 0.6)}`,
                                    mb: 2,
                                    transform: 'rotate(5deg)',
                                }}
                            >
                                <LogoIcon sx={{ fontSize: 32, color: 'white', transform: 'rotate(-5deg)' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={800} gutterBottom sx={{
                                background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.secondary.main})`,
                                backgroundClip: 'text',
                                textFillColor: 'transparent',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Join Us
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Create your student account
                            </Typography>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={clearError}>
                                {error}
                            </Alert>
                        )}

                        {/* Register Form */}
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <TextField
                                {...register('full_name')}
                                label="Full Name"
                                fullWidth
                                margin="normal"
                                size="small"
                                error={!!errors.full_name}
                                helperText={errors.full_name?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                {...register('email')}
                                label="Email Address"
                                fullWidth
                                margin="normal"
                                size="small"
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
                                size="small"
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

                            <TextField
                                {...register('confirmPassword')}
                                label="Confirm Password"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                margin="normal"
                                size="small"
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon color="action" />
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
                                color="success"
                                sx={{
                                    mt: 3,
                                    py: 1.2,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                                }}
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>

                        {/* Login Link */}
                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Typography color="text.secondary" variant="body2">
                                Already have an account?{' '}
                                <Link
                                    component={RouterLink}
                                    to="/login"
                                    fontWeight={700}
                                    sx={{
                                        color: 'success.main',
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    Sign In
                                </Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Register;
