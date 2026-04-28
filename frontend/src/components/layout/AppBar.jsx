import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar as MuiAppBar,
    Toolbar,
    IconButton,
    Typography,
    Box,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Tooltip,
    Badge,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    Notifications as NotificationsIcon,
    Logout as LogoutIcon,
    Person as PersonIcon,
    Warning as WarningIcon,
    MenuBook as BookIcon,
    Campaign as AnnouncementIcon,
} from '@mui/icons-material';
import { useAuthStore, useThemeStore } from '../../store';
import { studentApi, featuresApi } from '../../api';

const AppBar = ({ drawerWidth, onDrawerToggle }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { mode, toggleMode } = useThemeStore();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifAnchorEl, setNotifAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [notifCount, setNotifCount] = useState(0);

    // Fetch all notifications for students
    useEffect(() => {
        if (user?.role === 'student') {
            const fetchNotifications = async () => {
                try {
                    const results = await Promise.allSettled([
                        studentApi.getMyAlerts(),
                        studentApi.getMyOverdueLoans(),
                        featuresApi.getAnnouncements(),
                    ]);

                    const allNotifications = [];

                    // Alerts
                    if (results[0].status === 'fulfilled') {
                        const activeAlerts = (results[0].value.data || []).filter(a => !a.resolved_at);
                        activeAlerts.forEach(alert => {
                            allNotifications.push({
                                id: `alert-${alert.alert_id}`,
                                type: 'alert',
                                title: alert.alert_type === 'OVERDUE' ? 'Overdue Alert' : 'Fee Alert',
                                message: alert.alert_message,
                                date: alert.alert_date,
                                icon: 'warning',
                                link: '/student/my-alerts'
                            });
                        });
                    }

                    // Overdue Loans
                    if (results[1].status === 'fulfilled') {
                        (results[1].value.data || []).forEach(loan => {
                            allNotifications.push({
                                id: `overdue-${loan.loan_id}`,
                                type: 'overdue',
                                title: 'Overdue Book',
                                message: `"${loan.title}" is overdue by ${loan.days_overdue} days`,
                                date: loan.due_date,
                                icon: 'book',
                                link: '/student/my-loans'
                            });
                        });
                    }

                    // Announcements (recent only)
                    if (results[2].status === 'fulfilled') {
                        const recentAnnouncements = (results[2].value.data || []).slice(0, 3);
                        recentAnnouncements.forEach(ann => {
                            allNotifications.push({
                                id: `ann-${ann.id}`,
                                type: 'announcement',
                                title: 'Announcement',
                                message: ann.title,
                                date: ann.created_at,
                                icon: 'info',
                                link: '/student/dashboard'
                            });
                        });
                    }

                    // Sort by date, newest first
                    allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

                    setNotifications(allNotifications);
                    setNotifCount(allNotifications.length);
                } catch {
                    setNotifications([]);
                    setNotifCount(0);
                }
            };

            fetchNotifications();

            const handleFocus = () => fetchNotifications();
            const intervalId = window.setInterval(fetchNotifications, 30000);
            window.addEventListener('focus', handleFocus);

            return () => {
                window.removeEventListener('focus', handleFocus);
                window.clearInterval(intervalId);
            };
        }
    }, [user]);

    const handleNotificationClick = (event) => {
        setNotifAnchorEl(event.currentTarget);
    };

    const handleNotifClose = () => {
        setNotifAnchorEl(null);
    };

    const handleNotifItemClick = (link) => {
        navigate(link);
        handleNotifClose();
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        handleMenuClose();
    };

    // Get user initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Get role badge color
    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return 'error';
            case 'librarian':
                return 'primary';
            case 'student':
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <MuiAppBar
            position="fixed"
            sx={{
                width: { md: `calc(100% - ${drawerWidth}px)` },
                ml: { md: `${drawerWidth}px` },
                backgroundColor: 'background.paper',
                color: 'text.primary',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
        >
            <Toolbar>
                {/* Mobile menu button */}
                <IconButton
                    color="inherit"
                    edge="start"
                    onClick={onDrawerToggle}
                    sx={{ mr: 2, display: { md: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Page title area */}
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Welcome, {user?.full_name?.split(' ')[0] || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </Typography>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Dark mode toggle */}
                    <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                        <IconButton onClick={toggleMode} color="inherit">
                            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>

                    {/* Notifications */}
                    <Tooltip title={notifCount > 0 ? `${notifCount} Notifications` : 'Notifications'}>
                        <IconButton color="inherit" onClick={handleNotificationClick}>
                            <Badge badgeContent={notifCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* User menu */}
                    <Tooltip title="Account">
                        <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
                            <Avatar
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: `${getRoleColor(user?.role)}.main`,
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                }}
                            >
                                {getInitials(user?.full_name)}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* User dropdown menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    onClick={handleMenuClose}
                    PaperProps={{
                        sx: {
                            mt: 1.5,
                            minWidth: 200,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            {user?.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user?.email}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                color: `${getRoleColor(user?.role)}.main`,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                mt: 0.5,
                            }}
                        >
                            {user?.role}
                        </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={handleMenuClose}>
                        <ListItemIcon>
                            <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        Profile
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        Logout
                    </MenuItem>
                </Menu>

                {/* Notifications dropdown menu */}
                <Menu
                    anchorEl={notifAnchorEl}
                    open={Boolean(notifAnchorEl)}
                    onClose={handleNotifClose}
                    PaperProps={{
                        sx: {
                            mt: 1.5,
                            minWidth: 320,
                            maxHeight: 400,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Notifications ({notifCount})
                        </Typography>
                    </Box>
                    {notifications.length === 0 ? (
                        <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                            <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                No notifications
                            </Typography>
                        </Box>
                    ) : (
                        notifications.slice(0, 8).map((notif) => (
                            <MenuItem
                                key={notif.id}
                                onClick={() => handleNotifItemClick(notif.link)}
                                sx={{ py: 1.5, alignItems: 'flex-start' }}
                            >
                                <ListItemIcon sx={{ mt: 0.5 }}>
                                    {notif.type === 'alert' && <WarningIcon fontSize="small" color="error" />}
                                    {notif.type === 'overdue' && <BookIcon fontSize="small" color="warning" />}
                                    {notif.type === 'announcement' && <AnnouncementIcon fontSize="small" color="info" />}
                                </ListItemIcon>
                                <ListItemText
                                    primary={notif.title}
                                    secondary={notif.message}
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ noWrap: true, fontSize: '0.75rem' }}
                                />
                            </MenuItem>
                        ))
                    )}
                    {notifications.length > 0 && (
                        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                            <MenuItem
                                onClick={() => handleNotifItemClick('/student/my-alerts')}
                                sx={{ justifyContent: 'center', color: 'primary.main' }}
                            >
                                View All Notifications
                            </MenuItem>
                        </Box>
                    )}
                </Menu>
            </Toolbar>
        </MuiAppBar>
    );
};

export default AppBar;
