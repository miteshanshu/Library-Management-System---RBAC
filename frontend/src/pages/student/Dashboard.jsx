import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    useTheme,
    alpha,
    Avatar,
    IconButton,
    Button
} from '@mui/material';
import {
    LibraryBooks as LoansIcon,
    Warning as OverdueIcon,
    Payment as FeesIcon,
    Notifications as AlertsIcon,
    ArrowForward,
    MenuBook,
    BookmarkBorder,
    TrendingUp
} from '@mui/icons-material';
import { studentApi, featuresApi } from '../../api';
import { useNavigate } from 'react-router-dom';
import AnnouncementsWidget from '../../components/widgets/AnnouncementsWidget';

const StudentDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [loans, setLoans] = useState([]);
    const [overdueLoans, setOverdueLoans] = useState([]);
    const [feesData, setFeesData] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                studentApi.getMyLoans(),
                studentApi.getMyOverdueLoans(),
                studentApi.getMyFees(),
                studentApi.getMyAlerts(),
                featuresApi.getWishlist(),
            ]);

            setLoans(results[0].status === 'fulfilled' ? results[0].value.data : []);
            setOverdueLoans(results[1].status === 'fulfilled' ? results[1].value.data : []);
            setFeesData(results[2].status === 'fulfilled' ? results[2].value.data : null);
            setAlerts(results[3].status === 'fulfilled' ? results[3].value.data : []);
            setWishlist(results[4].status === 'fulfilled' ? results[4].value.data : []);

            results.forEach((res, idx) => {
                if (res.status === 'rejected') console.error(`Fetch ${idx} failed:`, res.reason);
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleFocus = () => fetchData();
        const intervalId = window.setInterval(fetchData, 30000);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.clearInterval(intervalId);
        };
    }, []);

    const activeLoans = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');

    // Premium Glass Stats Card
    const StatCard = ({ title, value, icon: Icon, color, subtitle, delay, onClick }) => (
        <Card
            onClick={onClick}
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(color, 0.2)}`,
                borderRadius: 4,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                animation: `fadeInUp 0.6s ease-out ${delay}s backwards`,
                cursor: onClick ? 'pointer' : 'default',
                '@keyframes fadeInUp': {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                },
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 12px 24px -10px ${alpha(color, 0.3)}`
                }
            }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: '16px',
                        bgcolor: alpha(color, 0.2),
                        color: color,
                        boxShadow: `0 4px 12px ${alpha(color, 0.2)}`
                    }}>
                        <Icon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.text.primary }}>
                            {value}
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="body1" color="text.secondary" fontWeight={600} gutterBottom>
                    {title}
                </Typography>

                {subtitle && (
                    <Chip
                        label={subtitle}
                        size="small"
                        sx={{
                            bgcolor: alpha(color, 0.1),
                            color: color,
                            fontWeight: 700,
                            borderRadius: '8px'
                        }}
                    />
                )}
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header Section */}
            <Box sx={{ mb: 5, textAlign: { xs: 'center', md: 'left' } }}>
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{
                    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                    mb: 1
                }}>
                    Welcome Back, Student
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                    Here's what's happening with your library account today.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {/* Stats Grid */}
            <Grid container spacing={3} mb={6}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Loans"
                        value={activeLoans.length}
                        icon={LoansIcon}
                        color="#6366f1"
                        delay={0.1}
                        onClick={() => navigate('/student/my-loans')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Overdue Books"
                        value={overdueLoans.length}
                        icon={OverdueIcon}
                        color="#ef4444"
                        subtitle={overdueLoans.length > 0 ? 'Action Required' : null}
                        delay={0.2}
                        onClick={() => navigate('/student/my-loans')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Unpaid Fees"
                        value={`₹${(feesData?.unpaid_fees || 0).toFixed(2)}`}
                        icon={FeesIcon}
                        color="#f59e0b"
                        delay={0.3}
                        onClick={() => navigate('/student/my-fees')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="New Alerts"
                        value={alerts.filter((a) => !a.resolved_at).length}
                        icon={AlertsIcon}
                        color="#3b82f6"
                        delay={0.4}
                        onClick={() => navigate('/student/my-alerts')}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={4}>
                {/* Active Loans Section */}
                <Grid item xs={12} md={8}>
                    <Card sx={{
                        borderRadius: 4,
                        boxShadow: theme.shadows[4],
                        overflow: 'hidden',
                        height: '100%'
                    }}>
                        <Box sx={{
                            p: 3,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.03)
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <MenuBook color="primary" />
                                <Typography variant="h6" fontWeight={700}>Current Readings</Typography>
                            </Box>
                            <Button endIcon={<ArrowForward />} onClick={() => navigate('/student/my-loans')}>
                                View All
                            </Button>
                        </Box>

                        <CardContent sx={{ p: 0 }}>
                            {activeLoans.length > 0 ? (
                                <List disablePadding>
                                    {activeLoans.slice(0, 5).map((loan, index) => (
                                        <Box key={loan.loan_id}>
                                            <ListItem
                                                button
                                                sx={{
                                                    p: 3,
                                                    transition: 'all 0.2s',
                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                                                }}
                                                onClick={() => navigate('/student/my-loans')}
                                            >
                                                <Box sx={{
                                                    width: 50,
                                                    height: 70,
                                                    borderRadius: 1,
                                                    bgcolor: 'grey.300',
                                                    mr: 3,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: 2
                                                }}>
                                                    <MenuBook sx={{ color: 'grey.500', opacity: 0.5 }} />
                                                </Box>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                                            {loan.title}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Due: {new Date(loan.due_date).toLocaleDateString()}
                                                            </Typography>
                                                            {loan.status === 'OVERDUE' && typeof loan.days_overdue !== 'undefined' && (
                                                                <Typography variant="caption" color="error.main" fontWeight={700}>
                                                                    {loan.days_overdue} day{loan.days_overdue === 1 ? '' : 's'} overdue
                                                                </Typography>
                                                            )}
                                                            <Chip
                                                                label={loan.status}
                                                                size="small"
                                                                color={loan.status === 'OVERDUE' ? 'error' : 'success'}
                                                                variant="outlined"
                                                                sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
                                                            />
                                                        </Box>
                                                    }
                                                />
                                                <IconButton size="small">
                                                    <ArrowForward fontSize="small" />
                                                </IconButton>
                                            </ListItem>
                                            {index < activeLoans.length - 1 && <Divider variant="inset" component="li" />}
                                        </Box>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center', opacity: 0.6 }}>
                                    <MenuBook sx={{ fontSize: 48, mb: 1, color: 'text.disabled' }} />
                                    <Typography variant="body1">No active loans right now.</Typography>
                                    <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/student/books')}>
                                        Browse Library
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Explore / Quick Actions */}
                <Grid item xs={12} md={4}>
                    {/* Announcements Widget */}
                    <Box sx={{ mb: 3 }}>
                        <AnnouncementsWidget limit={3} />
                    </Box>

                    <Card sx={{
                        borderRadius: 4,
                        background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${theme.palette.background.paper} 100%)`,
                        mb: 3
                    }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                            <Box sx={{ mb: 2, display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'background.paper', boxShadow: 3 }}>
                                <TrendingUp color="secondary" fontSize="large" />
                            </Box>
                            <Typography variant="h6" fontWeight={800} gutterBottom>
                                Discover Something New
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Explore our latest arrivals and trending books selected just for you.
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                fullWidth
                                size="large"
                                onClick={() => navigate('/student/books')}
                                sx={{ borderRadius: 3, fontWeight: 700 }}
                            >
                                Browse Collections
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Wishlist - Dynamic */}
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BookmarkBorder color="primary" />
                                    <Typography variant="h6" fontWeight={700}>My Wishlist</Typography>
                                </Box>
                                <Button size="small" onClick={() => navigate('/student/wishlist')}>View All</Button>
                            </Box>
                            {wishlist.length > 0 ? (
                                <List disablePadding>
                                    {wishlist.slice(0, 3).map((item, index) => (
                                        <Box key={item.wishlist_id || item.book_id}>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemText
                                                    primary={item.title}
                                                    secondary={`Added ${new Date(item.added_at).toLocaleDateString()}`}
                                                    primaryTypographyProps={{ fontWeight: 600 }}
                                                />
                                                <IconButton size="small" onClick={() => navigate('/student/wishlist')}>
                                                    <ArrowForward fontSize="small" />
                                                </IconButton>
                                            </ListItem>
                                            {index < Math.min(wishlist.length, 3) - 1 && <Divider />}
                                        </Box>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                                    No books in your wishlist yet.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default StudentDashboard;
