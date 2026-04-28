import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    alpha,
    useTheme,
    IconButton,
} from '@mui/material';
import {
    People as PeopleIcon,
    MenuBook as BookIcon,
    ContentCopy as CopyIcon,
    SwapHoriz as LoansIcon,
    AttachMoney as FeesIcon,
    TrendingUp,
    MoreVert,
} from '@mui/icons-material';
import { reportsApi } from '../../api';
import { LoansTrendChart } from '../../components/charts/LoansTrendChart';
import AnnouncementsWidget from '../../components/widgets/AnnouncementsWidget';

// Premium Stat card component
const StatCard = ({ title, value, icon: Icon, color, loading, index }) => {
    const theme = useTheme();

    return (
        <Card
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 20px 25px -5px ${alpha(color, 0.15)}, 0 10px 10px -5px ${alpha(color, 0.1)}`,
                },
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    backgroundColor: alpha(color, 0.1),
                    zIndex: 0,
                }}
            />

            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            backgroundColor: alpha(color, 0.1),
                            color: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon sx={{ fontSize: 26 }} />
                    </Box>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <MoreVert fontSize="small" />
                    </IconButton>
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                        {title}
                    </Typography>
                    {loading ? (
                        <CircularProgress size={24} sx={{ color }} />
                    ) : (
                        <Typography variant="h3" fontWeight={700} sx={{ color: theme.palette.text.primary }}>
                            {value}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 16 }} />
                    <Typography variant="caption" color="success.main" fontWeight={600}>
                        +2.4%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        from last month
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

const AdminDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const results = await Promise.allSettled([
                    reportsApi.getDashboardSummary(),
                    reportsApi.getTurnaroundMetrics()
                ]);

                // Handle Summary
                if (results[0].status === 'fulfilled') {
                    setSummary(results[0].value.data);
                } else {
                    console.error("Summary fetch failed", results[0].reason);
                }

                // Handle Trends
                if (results[1].status === 'fulfilled') {
                    const processedTrend = results[1].value.data.map(item => ({
                        date: `${item.year}-${String(item.month).padStart(2, '0')}`,
                        loans: parseInt(item.total_loans, 10),
                        avgDays: parseFloat(item.avg_loan_days).toFixed(1)
                    })).reverse();
                    setTrendData(processedTrend);
                } else {
                    console.error("Trends fetch failed", results[1].reason);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const stats = [
        {
            title: 'Total Members',
            value: summary?.total_members || 0,
            icon: PeopleIcon,
            color: '#6366f1', // Indigo
        },
        {
            title: 'Total Books',
            value: summary?.total_books || 0,
            icon: BookIcon,
            color: '#10b981', // Emerald
        },
        {
            title: 'Available Copies',
            value: summary?.available_copies || 0,
            icon: CopyIcon,
            color: '#f59e0b', // Amber
        },
        {
            title: 'Active Loans',
            value: summary?.active_loans || 0,
            icon: LoansIcon,
            color: '#3b82f6', // Blue
        },
        {
            title: 'Outstanding Fees',
            value: `₹${parseFloat(summary?.outstanding_fees || 0).toFixed(2)}`,
            icon: FeesIcon,
            color: '#ef4444', // Red
        },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{
                    background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block'
                }}>
                    Admin Dashboard
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                    Overview of library system statistics and performance metrics
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={stat.title}>
                        <StatCard {...stat} loading={loading} index={index} />
                    </Grid>
                ))}
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: 450, borderRadius: 3, overflow: 'visible' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" fontWeight={700}>
                                    Loan Activity Trend
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Monthly checkouts over time
                                </Typography>
                            </Box>

                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <LoansTrendChart data={trendData.length > 0 ? trendData : [{ date: 'No Data', loans: 0 }]} />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Announcements Widget */}
                <Grid item xs={12} md={4}>
                    <AnnouncementsWidget />
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;
