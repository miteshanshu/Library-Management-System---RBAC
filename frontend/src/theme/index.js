import { createTheme, alpha } from '@mui/material/styles';

// Premium Modern Palette
const primaryColor = {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    main: '#6366f1', // Indigo
    dark: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    contrastText: '#ffffff',
};

const secondaryColor = {
    main: '#06b6d4', // Cyan
    light: '#67e8f9',
    dark: '#0891b2',
    contrastText: '#ffffff',
};

const successColor = {
    main: '#10b981', // Emerald
    light: '#34d399',
    dark: '#059669',
};

const warningColor = {
    main: '#f59e0b', // Amber
    light: '#fbbf24',
    dark: '#d97706',
};

const errorColor = {
    main: '#ef4444', // Red
    light: '#f87171',
    dark: '#b91c1c',
};

// Common design tokens generator
const getDesignTokens = (mode) => ({
    palette: {
        mode,
        primary: primaryColor,
        secondary: secondaryColor,
        success: successColor,
        warning: warningColor,
        error: errorColor,
        background: {
            default: mode === 'light' ? '#f8fafc' : '#0f172a', // Keeping it clean, gradients handled in CSS
            paper: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.7)', // Transparent for glassmorphism
        },
        text: {
            primary: mode === 'light' ? '#1e293b' : '#f1f5f9',
            secondary: mode === 'light' ? '#64748b' : '#94a3b8',
        },
        divider: mode === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
    },
    typography: {
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
        h1: {
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 700,
            fontSize: '2.5rem',
            letterSpacing: '-0.02em',
        },
        h2: {
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 700,
            fontSize: '2rem',
            letterSpacing: '-0.01em',
        },
        h3: {
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 600,
            fontSize: '1.75rem',
            letterSpacing: '-0.01em',
        },
        h4: {
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h5: {
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 600,
            fontSize: '1.25rem',
        },
        h6: {
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 600,
            fontSize: '1rem',
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: mode === 'dark' ? '#4b5563 #111827' : '#9ca3af #f3f4f6',
                    '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                        backgroundColor: 'transparent',
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                        borderRadius: 8,
                        backgroundColor: mode === 'dark' ? '#475569' : '#cbd5e1',
                        minHeight: 24,
                        border: '2px solid transparent',
                        backgroundClip: 'content-box',
                    },
                    '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                        backgroundColor: mode === 'dark' ? '#64748b' : '#94a3b8',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    transition: 'all 0.2s ease-in-out',
                },
                contained: {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    },
                },
                containedPrimary: {
                    background: `linear-gradient(135deg, ${primaryColor.main}, ${primaryColor.dark})`,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    backgroundImage: 'none',
                    backdropFilter: 'blur(20px)',
                    border: mode === 'light' ? '1px solid rgba(255, 255, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: mode === 'light'
                        ? '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)'
                        : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        transition: 'all 0.2s',
                        backgroundColor: mode === 'light' ? alpha('#fff', 0.6) : alpha('#000', 0.2),
                        '&.Mui-focused': {
                            backgroundColor: mode === 'light' ? '#fff' : alpha('#000', 0.3),
                            boxShadow: `0 0 0 4px ${alpha(primaryColor.main, 0.1)}`,
                        },
                        '&:hover': {
                            backgroundColor: mode === 'light' ? '#fff' : alpha('#000', 0.3),
                        },
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(12px)',
                    backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)',
                    borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: 'none',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                    backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(12px)',
                },
            },
        },
    },
});

export const lightTheme = createTheme(getDesignTokens('light'));
export const darkTheme = createTheme(getDesignTokens('dark'));
