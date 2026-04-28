import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    Avatar,
    Divider,
    Alert,
    CircularProgress,
    Tab,
    Tabs,
    useTheme,
    alpha
} from '@mui/material';
import {
    Person as PersonIcon,
    Security as SecurityIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store';
import { authApi } from '../../api';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

const Profile = () => {
    const theme = useTheme();
    const { user } = useAuthStore();
    const [tabValue, setTabValue] = useState(0);
    const isDemoUser = Boolean(user?.is_demo);

    // Profile Form State
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [email] = useState(user?.email || '');
    const [role] = useState(user?.role || '');

    // Password Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setSuccessMsg('');
        setErrorMsg('');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            if (isDemoUser) {
                setErrorMsg('Demo account profile cannot be edited.');
                return;
            }
            await authApi.updateProfile({ full_name: fullName });
            setSuccessMsg('Profile updated successfully.');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (isDemoUser) {
            setErrorMsg('Demo account password cannot be changed.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMsg("New passwords don't match");
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await authApi.changePassword(currentPassword, newPassword);
            setSuccessMsg('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                    sx={{
                        width: 80,
                        height: 80,
                        bgcolor: theme.palette.primary.main,
                        fontSize: 32,
                        boxShadow: theme.shadows[4]
                    }}
                >
                    {user?.full_name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Account Settings
                    </Typography>
                    <Typography color="text.secondary">
                        Manage your profile and security preferences
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile Details" />
                        <Tab icon={<SecurityIcon />} iconPosition="start" label="Security" />
                    </Tabs>
                </Box>

                {/* Notifications */}
                {(successMsg || errorMsg) && (
                    <Box sx={{ p: 3, pb: 0 }}>
                        {successMsg && <Alert severity="success">{successMsg}</Alert>}
                        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
                    </Box>
                )}

                {/* Profile Tab */}
                <TabPanel value={tabValue} index={0}>
                    <form onSubmit={handleUpdateProfile}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    value={email}
                                    disabled
                                    helperText="Contact admin to change email"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Role"
                                    value={role.toUpperCase()}
                                    disabled
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: (
                                            <Box
                                                sx={{
                                                    mr: 1,
                                                    px: 1,
                                                    py: 0.5,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    color: 'primary.main'
                                                }}
                                            >
                                                {role.toUpperCase()}
                                            </Box>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    type="submit"
                                    disabled={loading || fullName === user?.full_name || isDemoUser}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                >
                                    {isDemoUser ? 'Demo Account Locked' : loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </TabPanel>

                {/* Security Tab */}
                <TabPanel value={tabValue} index={1}>
                    <form onSubmit={handleChangePassword}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>Change Password</Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {isDemoUser
                                        ? 'This demo account uses a fixed shared password and cannot be changed.'
                                        : 'Create a new password that is at least 6 characters long.'}
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label="Current Password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    helperText="Min. 6 characters"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    error={newPassword !== confirmPassword && confirmPassword !== ''}
                                    helperText={newPassword !== confirmPassword && confirmPassword !== '' ? "Passwords don't match" : ""}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    type="submit"
                                    disabled={loading || !currentPassword || !newPassword || isDemoUser}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                >
                                    {isDemoUser ? 'Demo Password Locked' : loading ? 'Updating...' : 'Update Password'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default Profile;
