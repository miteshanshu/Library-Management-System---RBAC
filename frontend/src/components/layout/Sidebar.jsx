import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    useTheme,
    useMediaQuery,
    Avatar,
    Chip,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    MenuBook as BookIcon,
    ContentCopy as CopyIcon,
    CardMembership as MembershipIcon,
    Assessment as ReportsIcon,
    SwapHoriz as CirculationIcon,
    Search as SearchIcon,
    Notifications as AlertsIcon,
    LibraryBooks as MyLoansIcon,
    Payment as FeesIcon,
    LocalLibrary as BrowseIcon,
    ChevronRight,
    FavoriteBorder as MyWishlistIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../store';

// Menu items by role
const menuConfig = {
    admin: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: DashboardIcon },
        { label: 'Users', path: '/admin/users', icon: PeopleIcon },
        { label: 'Books', path: '/admin/books', icon: BookIcon },
        { label: 'Book Copies', path: '/admin/book-copies', icon: CopyIcon },
        { label: 'Membership Types', path: '/admin/membership-types', icon: MembershipIcon },
        { label: 'Reports', path: '/admin/reports', icon: ReportsIcon },
    ],
    librarian: [
        { label: 'Dashboard', path: '/librarian/dashboard', icon: DashboardIcon },
        { label: 'Circulation', path: '/librarian/circulation', icon: CirculationIcon },
        { label: 'Student Search', path: '/librarian/students', icon: SearchIcon },
        { label: 'Books', path: '/librarian/books', icon: BookIcon },
        { label: 'Barcode Lookup', path: '/librarian/barcode-lookup', icon: SearchIcon },
        { label: 'Reservations', path: '/librarian/reservations', icon: AlertsIcon },
        { label: 'Alerts', path: '/librarian/alerts', icon: AlertsIcon },
    ],
    student: [
        { label: 'Dashboard', path: '/student/dashboard', icon: DashboardIcon },
        { label: 'My Loans', path: '/student/my-loans', icon: MyLoansIcon },
        { label: 'My Reservations', path: '/student/reservations', icon: AlertsIcon },
        { label: 'My Alerts', path: '/student/my-alerts', icon: AlertsIcon },
        { label: 'My Fees', path: '/student/my-fees', icon: FeesIcon },
        { label: 'My Wishlist', path: '/student/wishlist', icon: MyWishlistIcon },
        { label: 'Browse Books', path: '/student/books', icon: BrowseIcon },
    ],
};

const Sidebar = ({ drawerWidth, mobileOpen, onClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();

    const menuItems = menuConfig[user?.role] || [];

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) {
            onClose();
        }
    };

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Brand & Logo */}
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 8px 16px -4px ${theme.palette.primary.main}40`,
                    }}
                >
                    <BookIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                        Library<span style={{ color: theme.palette.primary.main }}>MS</span>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        System v1.0
                    </Typography>
                </Box>
            </Box>

            {/* Role Badge */}
            <Box sx={{ px: 3, mb: 2 }}>
                <Chip
                    label={`${user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Portal`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{
                        width: '100%',
                        fontWeight: 600,
                        borderRadius: '8px',
                        justifyContent: 'flex-start',
                        pl: 1,
                        '& .MuiChip-label': { width: '100%', textAlign: 'center' }
                    }}
                />
            </Box>

            <Divider sx={{ mx: 3, mb: 2, opacity: 0.5 }} />

            {/* Navigation Menu */}
            <List sx={{ flex: 1, px: 2 }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => handleNavigation(item.path)}
                                selected={isActive}
                                sx={{
                                    borderRadius: '12px',
                                    py: 1.5,
                                    px: 2,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    '&.Mui-selected': {
                                        backgroundColor: 'primary.main',
                                        color: 'white',
                                        boxShadow: `0 8px 16px -4px ${theme.palette.primary.main}60`,
                                        '&:hover': {
                                            backgroundColor: 'primary.dark',
                                        },
                                        '& .MuiListItemIcon-root': {
                                            color: 'white',
                                        },
                                    },
                                    '&:not(.Mui-selected):hover': {
                                        backgroundColor: 'action.hover',
                                        transform: 'translateX(4px)',
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 40,
                                        color: isActive ? 'inherit' : 'text.secondary',
                                        transition: 'color 0.2s',
                                    }}
                                >
                                    <Icon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontWeight: isActive ? 600 : 500,
                                        fontSize: '0.95rem',
                                    }}
                                />
                                {isActive && (
                                    <ChevronRight sx={{ fontSize: 16, opacity: 0.8 }} />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* Footer User Profile */}
            <Box
                sx={{
                    p: 2,
                    mx: 2,
                    mb: 2,
                    borderRadius: '16px',
                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                    }
                }}
                onClick={() => handleNavigation('/profile')}
            >
                <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        fontWeight: 700,
                        fontSize: 14
                    }}
                >
                    {user?.full_name?.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="subtitle2" noWrap fontWeight={700}>
                        {user?.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {user?.email}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <>
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        borderRight: '1px dashed',
                        borderColor: 'divider',
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

export default Sidebar;
