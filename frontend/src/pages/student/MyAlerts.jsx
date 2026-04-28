import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    useTheme,
    alpha,
    Button,
} from '@mui/material';
import {
    Warning as WarningIcon,
    Notifications as NotificationsIcon,
    AccessTime as TimeIcon,
    CheckCircle as ResolvedIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';
import { studentApi } from '../../api';

const MyAlertsPage = () => {
    const theme = useTheme();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAlerts();
        const handleFocus = () => fetchAlerts();
        const intervalId = window.setInterval(fetchAlerts, 30000);

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.clearInterval(intervalId);
        };
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const res = await studentApi.getMyAlerts();
            setAlerts(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const getAlertIcon = (alertType) => {
        switch (alertType?.toUpperCase()) {
            case 'OVERDUE': return <WarningIcon />;
            case 'FEE': return <ErrorIcon />;
            default: return <NotificationsIcon />;
        }
    };

    const getAlertColor = (alertType) => {
        switch (alertType?.toUpperCase()) {
            case 'OVERDUE': return 'error';
            case 'FEE': return 'warning';
            default: return 'info';
        }
    };

    const activeAlerts = alerts.filter(a => !a.resolved_at);
    const resolvedAlerts = alerts.filter(a => a.resolved_at);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    My Alerts
                </Typography>
                <Typography color="text.secondary">
                    View your library notifications and alerts
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${theme.palette.background.paper} 100%)`,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                    }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <WarningIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                            <Typography variant="h3" fontWeight={800}>{activeAlerts.length}</Typography>
                            <Typography color="text.secondary">Active Alerts</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${theme.palette.background.paper} 100%)`,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <ResolvedIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                            <Typography variant="h3" fontWeight={800}>{resolvedAlerts.length}</Typography>
                            <Typography color="text.secondary">Resolved</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${theme.palette.background.paper} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <NotificationsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h3" fontWeight={800}>{alerts.length}</Typography>
                            <Typography color="text.secondary">Total Alerts</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="error" /> Active Alerts
                    </Typography>
                    <Grid container spacing={2}>
                        {activeAlerts.map((alert) => (
                            <Grid item xs={12} md={6} key={alert.alert_id}>
                                <Card sx={{
                                    borderRadius: 3,
                                    borderLeft: 4,
                                    borderColor: `${getAlertColor(alert.alert_type)}.main`,
                                    '&:hover': { boxShadow: theme.shadows[4] }
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Chip
                                                icon={getAlertIcon(alert.alert_type)}
                                                label={alert.alert_type}
                                                color={getAlertColor(alert.alert_type)}
                                                size="small"
                                            />
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <TimeIcon fontSize="small" color="action" />
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(alert.alert_date).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="body1" fontWeight={600}>
                                            {alert.alert_message}
                                        </Typography>
                                        {alert.loan_id && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Loan ID: {alert.loan_id}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Resolved Alerts */}
            {resolvedAlerts.length > 0 && (
                <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7 }}>
                        <ResolvedIcon color="success" /> Resolved Alerts
                    </Typography>
                    <Grid container spacing={2}>
                        {resolvedAlerts.map((alert) => (
                            <Grid item xs={12} md={6} key={alert.alert_id}>
                                <Card sx={{
                                    borderRadius: 3,
                                    opacity: 0.6,
                                    bgcolor: alpha(theme.palette.success.main, 0.05)
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Chip
                                                icon={<ResolvedIcon />}
                                                label="Resolved"
                                                color="success"
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                Resolved: {new Date(alert.resolved_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
                                            {alert.alert_message}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* No Alerts */}
            {alerts.length === 0 && (
                <Card sx={{ borderRadius: 4, textAlign: 'center', py: 8 }}>
                    <NotificationsIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No alerts yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        You're all caught up! No pending notifications.
                    </Typography>
                </Card>
            )}
        </Box>
    );
};

export default MyAlertsPage;
