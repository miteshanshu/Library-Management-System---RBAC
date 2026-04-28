import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import AppBar from './AppBar';
import Sidebar from './Sidebar';
import StatusSnackbar from '../common/StatusSnackbar';

const DRAWER_WIDTH = 260;

const MainLayout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* AppBar */}
            <AppBar
                drawerWidth={DRAWER_WIDTH}
                onDrawerToggle={handleDrawerToggle}
            />

            {/* Sidebar */}
            <Sidebar
                drawerWidth={DRAWER_WIDTH}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { md: `${DRAWER_WIDTH}px` },
                    mt: '64px', // AppBar height
                    minHeight: 'calc(100vh - 64px)',
                    backgroundColor: 'background.default',
                }}
            >
                <Outlet />
            </Box>
            {/* Status Snackbar - Global Notifications */}
            <StatusSnackbar />
        </Box>
    );
};

export default MainLayout;
