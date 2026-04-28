import { useEffect, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import router from './routes';
import { lightTheme, darkTheme } from './theme';
import { useAuthStore, useThemeStore } from './store';

function App() {
    const { mode } = useThemeStore();
    const { checkAuth } = useAuthStore();

    const theme = useMemo(() => {
        return mode === 'dark' ? darkTheme : lightTheme;
    }, [mode]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <RouterProvider
                    router={router}
                    future={{ v7_startTransition: true }}
                />
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
