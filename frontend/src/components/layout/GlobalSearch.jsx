import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    InputBase,
    InputAdornment,
    IconButton,
    Popper,
    Paper,
    List,
    ListItemButton,
    ListItemText,
    ListSubheader,
    Typography,
    CircularProgress,
    ClickAwayListener,
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { featuresApi } from '../../api';
import { useAuthStore } from '../../store';

// Where each result type opens, per role. null means there is no page for it.
const getTarget = (role, type, row) => {
    const staff = role === 'admin' ? 'admin' : 'librarian';
    switch (type) {
        case 'books':
            return role === 'student' ? `/student/books/${row.book_id}` : `/${staff}/books`;
        case 'copies':
            return role === 'admin' ? '/admin/book-copies' : '/librarian/barcode-lookup';
        case 'members':
            return role === 'librarian' ? '/librarian/students' : null;
        case 'loans':
            return role === 'librarian' ? '/librarian/circulation' : null;
        case 'users':
            return '/admin/users';
        default:
            return null;
    }
};

const SECTIONS = [
    {
        key: 'books',
        label: 'Books',
        primary: (r) => r.title,
        secondary: (r) => `ISBN ${r.isbn}${r.publication_year ? ` · ${r.publication_year}` : ''}`,
    },
    {
        key: 'authors',
        label: 'Authors',
        primary: (r) => r.full_name,
    },
    {
        key: 'copies',
        label: 'Copies',
        primary: (r) => r.barcode,
        secondary: (r) => [r.status, r.location_name].filter(Boolean).join(' · '),
    },
    {
        key: 'members',
        label: 'Members',
        primary: (r) => `${r.first_name} ${r.last_name}`,
        secondary: (r) => `${r.card_number} · ${r.email}`,
    },
    {
        key: 'loans',
        label: 'Loans',
        primary: (r) => `Loan #${r.loan_id}`,
        secondary: (r) => `${r.status} · due ${String(r.due_date).slice(0, 10)}`,
    },
    {
        key: 'users',
        label: 'Users',
        primary: (r) => r.full_name,
        secondary: (r) => `${r.email} · ${r.role}`,
    },
];

const rowId = (key, r) =>
    r.book_id && key === 'books' ? r.book_id
        : key === 'authors' ? r.author_id
            : key === 'copies' ? r.copy_id
                : key === 'members' ? r.member_id
                    : key === 'loans' ? r.loan_id
                        : r.user_id;

const GlobalSearch = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const role = user?.role;
    const anchorRef = useRef(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);

    const term = query.trim();

    useEffect(() => {
        if (!term) {
            setResults(null);
            setError('');
            setLoading(false);
            return undefined;
        }
        setResults(null);
        setError('');
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const res = await featuresApi.search(term, controller.signal);
                if (controller.signal.aborted) return;
                setResults(res.data || {});
            } catch (err) {
                if (controller.signal.aborted || err?.code === 'ERR_CANCELED') return;
                setResults(null);
                setError('Search is not available right now. Try again in a moment.');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 300);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [term]);

    const close = () => setOpen(false);

    const handleSelect = (path) => {
        if (!path) return;
        navigate(path);
        close();
        setQuery('');
    };

    const sections = SECTIONS.filter((s) => results?.[s.key]?.length > 0);
    const showPanel = open && term.length > 0;

    return (
        <ClickAwayListener onClickAway={close}>
            <Box
                ref={anchorRef}
                sx={{ display: { xs: 'none', sm: 'block' }, width: { sm: 220, md: 320 }, mr: 2 }}
            >
                <InputBase
                    fullWidth
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') close();
                    }}
                    inputProps={{ 'aria-label': 'Search' }}
                    startAdornment={
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                    }
                    endAdornment={
                        query ? (
                            <InputAdornment position="end">
                                <IconButton size="small" aria-label="Clear search" onClick={() => setQuery('')}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : null
                    }
                    sx={{
                        px: 1.5,
                        py: 0.25,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'action.hover',
                        fontSize: '0.875rem',
                    }}
                />
                <Popper
                    open={showPanel}
                    anchorEl={anchorRef.current}
                    placement="bottom-start"
                    style={{ zIndex: 1300, width: anchorRef.current?.offsetWidth }}
                    modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
                >
                    <Paper
                        sx={{
                            maxHeight: 420,
                            overflowY: 'auto',
                            minWidth: 320,
                            bgcolor: 'background.paper',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        }}
                    >
                        {loading && !results && (
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress size={20} />
                            </Box>
                        )}
                        {error && (
                            <Typography variant="body2" color="error" sx={{ p: 2 }}>
                                {error}
                            </Typography>
                        )}
                        {!error && results && sections.length === 0 && !loading && (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No results for &quot;{term}&quot;
                            </Typography>
                        )}
                        {!error && sections.length > 0 && (
                            <List dense disablePadding>
                                {sections.map((section) => (
                                    <li key={section.key}>
                                        <ListSubheader
                                            disableSticky
                                            sx={{ bgcolor: 'transparent', lineHeight: '32px', fontWeight: 600 }}
                                        >
                                            {section.label}
                                        </ListSubheader>
                                        {results[section.key].map((row) => {
                                            const path = getTarget(role, section.key, row);
                                            return (
                                                <ListItemButton
                                                    key={`${section.key}-${rowId(section.key, row)}`}
                                                    disabled={!path}
                                                    onClick={() => handleSelect(path)}
                                                    sx={{ '&.Mui-disabled': { opacity: 1 } }}
                                                >
                                                    <ListItemText
                                                        primary={section.primary(row)}
                                                        secondary={section.secondary ? section.secondary(row) : null}
                                                        primaryTypographyProps={{ fontWeight: 500, noWrap: true }}
                                                        secondaryTypographyProps={{ noWrap: true }}
                                                    />
                                                </ListItemButton>
                                            );
                                        })}
                                    </li>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Popper>
            </Box>
        </ClickAwayListener>
    );
};

export default GlobalSearch;
