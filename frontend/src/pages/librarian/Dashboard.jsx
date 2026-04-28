import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    useTheme,
    alpha,
    Container,
    Paper,
    Avatar
} from '@mui/material';
import {
    SwapHoriz as CirculationIcon,
    Search as SearchIcon,
    MenuBook as BookIcon,
    Notifications as AlertsIcon,
    QrCodeScanner,
    AssignmentInd,
    ChevronRight,
    LibraryAddCheck
} from '@mui/icons-material';
import AnnouncementsWidget from '../../components/widgets/AnnouncementsWidget';

const LibrarianDashboard = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    const quickActions = [
        {
            title: 'Circulation Desk',
            description: 'Process checkouts and returns efficiently.',
            icon: CirculationIcon,
            path: '/librarian/circulation',
            color: '#6366f1', // Indigo
            bg: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
        },
        {
            title: 'Student Directory',
            description: 'Find students, view profiles, and manage fees.',
            icon: SearchIcon,
            path: '/librarian/students',
            color: '#10b981', // Emerald
            bg: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
        },
        {
            title: 'Book Catalog',
            description: 'Manage inventory, checking stock levels.',
            icon: BookIcon,
            path: '/librarian/books',
            color: '#f59e0b', // Amber
            bg: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
        },
        {
            title: 'System Alerts',
            description: 'Monitor overdue items and system notifications.',
            icon: AlertsIcon,
            path: '/librarian/alerts',
            color: '#ef4444', // Red
            bg: 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)'
        },
    ];

    return (
        <Box>
            {/* Hero Section */}
            <Box sx={{
                mb: 6,
                p: 5,
                borderRadius: 4,
                background: `linear-gradient(120deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: theme.shadows[8]
            }}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.8, fontWeight: 700 }}>
                        Librarian Workspace
                    </Typography>
                    <Typography variant="h3" fontWeight={800} gutterBottom>
                        Good Morning, Librarian
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 600, mb: 3 }}>
                        Ready to manage the library? You have 45 active loans and 3 pending alerts requiring attention today.
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        startIcon={<QrCodeScanner />}
                        onClick={() => navigate('/librarian/circulation')}
                        sx={{
                            fontWeight: 700,
                            bgcolor: 'white',
                            color: 'primary.main',
                            '&:hover': { bgcolor: alpha('#fff', 0.9) }
                        }}
                    >
                        Quick Scan
                    </Button>
                </Box>

                {/* Decorative Pattern */}
                <Box sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    bgcolor: alpha('#fff', 0.1)
                }} />
                <Box sx={{
                    position: 'absolute',
                    bottom: -80,
                    right: 80,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    bgcolor: alpha('#fff', 0.1)
                }} />
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                Operations
            </Typography>

            <Grid container spacing={3}>
                {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <Grid item xs={12} sm={6} md={3} key={action.title}>
                            <Card
                                onClick={() => navigate(action.path)}
                                sx={{
                                    height: '100%',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: theme.shadows[10],
                                        borderColor: action.color,
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: '20px',
                                            background: action.bg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 3,
                                            boxShadow: `0 8px 16px -4px ${alpha(action.color, 0.4)}`
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 32, color: 'white' }} />
                                    </Box>

                                    <Typography variant="h6" fontWeight={800} gutterBottom>
                                        {action.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                                        {action.description}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', color: action.color, fontWeight: 700 }}>
                                        Access
                                        <ChevronRight fontSize="small" />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Recent Activity / Stats Row Placeholder */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                    <AnnouncementsWidget limit={3} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{
                        p: 3,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.dark,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}>
                        <Typography variant="subtitle1" fontWeight={700}>Performance</Typography>
                        <Typography variant="h4" fontWeight={800}>99.9%</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Uptime this month</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default LibrarianDashboard;
