import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Chip,
    CircularProgress,
    Alert,
    useTheme,
    alpha,
    TextField,
    IconButton,
    Tooltip,
    Divider
} from '@mui/material';
import {
    Warning as WarningIcon,
    CheckCircle as ResolveIcon,
    Refresh as RefreshIcon,
    NotificationsActive as AlertIcon,
    Person as PersonIcon,
    MenuBook as BookIcon,
    Schedule as ScheduleIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import { librarianApi } from '../../api';

const AlertsPage = () => {
    const theme = useTheme();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [lastGenerated, setLastGenerated] = useState(null);

    // For searching student alerts
    const [searchValue, setSearchValue] = useState('');
    const [studentAlerts, setStudentAlerts] = useState([]);
    const [searchedMemberId, setSearchedMemberId] = useState(null);
    const [searchedStudent, setSearchedStudent] = useState(null);

    // For creating new alerts
    const [showCreateAlert, setShowCreateAlert] = useState(false);
    const [newAlertMessage, setNewAlertMessage] = useState('');
    const [newAlertType, setNewAlertType] = useState('OVERDUE');
    const [creatingAlert, setCreatingAlert] = useState(false);

    const handleGenerateOverdueAlerts = async () => {
        setGenerating(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await librarianApi.generateOverdueAlerts();
            const now = new Date();
            setLastGenerated(now);
            setSuccess(`Alerts generated successfully at ${now.toLocaleTimeString()}`);

            // If we have a student searched, refresh their alerts
            if (searchedMemberId) {
                const alertsRes = await librarianApi.getStudentAlerts(searchedMemberId);
                setStudentAlerts(alertsRes.data || []);
            }
        } catch (err) {
            setError('Failed to generate alerts: ' + (err.response?.data?.message || err.message));
        } finally {
            setGenerating(false);
        }
    };

    const handleSearchStudent = async () => {
        const query = searchValue.trim();
        if (!query) return;

        setLoading(true);
        setError(null);
        try {
            const isEmailSearch = query.includes('@');

            // First search for the student
            const studentRes = await librarianApi.searchStudent({
                card_number: isEmailSearch ? undefined : query,
                email: isEmailSearch ? query : undefined
            });

            if (studentRes.data?.member_id) {
                setSearchedMemberId(studentRes.data.member_id);
                setSearchedStudent(studentRes.data);
                // Then get their alerts
                const alertsRes = await librarianApi.getStudentAlerts(studentRes.data.member_id);
                setStudentAlerts(alertsRes.data || []);
            }
        } catch (err) {
            setError('Student not found or no alerts');
            setStudentAlerts([]);
            setSearchedStudent(null);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveAlert = async (alertId) => {
        try {
            await librarianApi.markAlertResolved(alertId);
            setSuccess('Alert resolved successfully');
            // Refresh alerts
            if (searchedMemberId) {
                const alertsRes = await librarianApi.getStudentAlerts(searchedMemberId);
                setStudentAlerts(alertsRes.data || []);
            }
        } catch (err) {
            setError('Failed to resolve alert: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCreateAlert = async () => {
        if (!searchedMemberId || !newAlertMessage.trim()) return;

        setCreatingAlert(true);
        setError(null);
        try {
            await librarianApi.createAlert({
                member_id: searchedMemberId,
                alert_type: newAlertType,
                message: newAlertMessage
            });

            setSuccess(`Alert created for ${searchedStudent.first_name} ${searchedStudent.last_name}`);
            setNewAlertMessage('');
            setShowCreateAlert(false);

            // Refresh alerts
            const alertsRes = await librarianApi.getStudentAlerts(searchedMemberId);
            setStudentAlerts(alertsRes.data || []);
        } catch (err) {
            setError('Failed to create alert: ' + (err.response?.data?.message || err.message));
        } finally {
            setCreatingAlert(false);
        }
    };

    const getAlertColor = (alertType) => {
        switch (alertType?.toUpperCase()) {
            case 'OVERDUE': return 'error';
            case 'FEE': return 'warning';
            case 'SUSPENSION': return 'error';
            default: return 'info';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Alerts Management
                    </Typography>
                    <Typography color="text.secondary">
                        Generate and manage overdue alerts for library members
                    </Typography>
                </Box>

                {/* Generate Alerts Card */}
                <Card sx={{
                    borderRadius: 3,
                    minWidth: 300,
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}>
                    <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <AlertIcon color="warning" />
                            <Typography variant="h6" fontWeight={700}>Generate Alerts</Typography>
                        </Box>

                        <Button
                            variant="contained"
                            color="warning"
                            fullWidth
                            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                            onClick={handleGenerateOverdueAlerts}
                            disabled={generating}
                            sx={{ borderRadius: 2, mb: 2 }}
                        >
                            Generate Overdue Alerts
                        </Button>

                        {lastGenerated && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <TimeIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    Last generated: {lastGenerated.toLocaleString()}
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {/* Search for Student Alerts */}
            <Card sx={{ borderRadius: 4, mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                        Search Student Alerts
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                        <TextField
                            label="Card Number or Email"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchStudent()}
                            sx={{ flex: 1 }}
                            size="small"
                        />
                        <Button
                            variant="contained"
                            onClick={handleSearchStudent}
                            disabled={loading}
                            sx={{ borderRadius: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Search'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Student Info Banner */}
            {searchedStudent && (
                <Card sx={{
                    borderRadius: 3,
                    mb: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}>
                    <CardContent sx={{ py: 2, px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PersonIcon color="primary" />
                                <Box>
                                    <Typography fontWeight={700}>
                                        {searchedStudent.first_name} {searchedStudent.last_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Card: {searchedStudent.card_number} • {searchedStudent.email}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Chip
                                    icon={<WarningIcon />}
                                    label={`${studentAlerts.length} Active Alert${studentAlerts.length !== 1 ? 's' : ''}`}
                                    color={studentAlerts.length > 0 ? 'error' : 'success'}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="warning"
                                    startIcon={<AlertIcon />}
                                    onClick={() => setShowCreateAlert(!showCreateAlert)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Create Alert
                                </Button>
                            </Box>
                        </Box>

                        {/* Create Alert Form */}
                        {showCreateAlert && (
                            <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                    Create New Alert for {searchedStudent.first_name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <TextField
                                        label="Alert Message"
                                        value={newAlertMessage}
                                        onChange={(e) => setNewAlertMessage(e.target.value)}
                                        size="small"
                                        sx={{ flex: 1, minWidth: 250 }}
                                        placeholder="e.g., Please return overdue books"
                                    />
                                    <TextField
                                        label="Alert Type"
                                        value={newAlertType}
                                        onChange={(e) => setNewAlertType(e.target.value)}
                                        size="small"
                                        select
                                        SelectProps={{ native: true }}
                                        sx={{ width: 150 }}
                                    >
                                        <option value="OVERDUE">OVERDUE</option>
                                        <option value="FEE">FEE</option>
                                    </TextField>
                                    <Button
                                        variant="contained"
                                        color="warning"
                                        onClick={handleCreateAlert}
                                        disabled={!newAlertMessage.trim() || creatingAlert}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {creatingAlert ? <CircularProgress size={20} /> : 'Send Alert'}
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Alerts List */}
            {studentAlerts.length > 0 ? (
                <Grid container spacing={3}>
                    {studentAlerts.map((alert) => (
                        <Grid item xs={12} md={6} lg={4} key={alert.alert_id}>
                            <Card sx={{
                                borderRadius: 3,
                                borderLeft: 4,
                                borderColor: `${getAlertColor(alert.alert_type)}.main`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: theme.shadows[8]
                                }
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Chip
                                            icon={<WarningIcon />}
                                            label={alert.alert_type}
                                            color={getAlertColor(alert.alert_type)}
                                            size="small"
                                        />
                                        {!alert.resolved_at && (
                                            <Tooltip title="Mark as Resolved">
                                                <IconButton
                                                    color="success"
                                                    size="small"
                                                    onClick={() => handleResolveAlert(alert.alert_id)}
                                                >
                                                    <ResolveIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>

                                    <Typography variant="body1" fontWeight={600} gutterBottom>
                                        {alert.alert_message || `${alert.alert_type} Alert`}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                        <Chip
                                            icon={<ScheduleIcon />}
                                            label={new Date(alert.alert_date).toLocaleDateString() + ' ' + new Date(alert.alert_date).toLocaleTimeString()}
                                            size="small"
                                            variant="outlined"
                                        />
                                        {alert.resolved_at && (
                                            <Chip
                                                icon={<ResolveIcon />}
                                                label="Resolved"
                                                size="small"
                                                color="success"
                                            />
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : searchedMemberId ? (
                <Card sx={{ borderRadius: 4, textAlign: 'center', py: 6, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                    <ResolveIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No active alerts for this student
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        All alerts have been resolved or no overdue items found
                    </Typography>
                </Card>
            ) : (
                <Card sx={{ borderRadius: 4, textAlign: 'center', py: 6, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <AlertIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Search for a student to view their alerts
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Or click "Generate Overdue Alerts" to create alerts for all overdue loans
                    </Typography>
                </Card>
            )}
        </Box>
    );
};

export default AlertsPage;

