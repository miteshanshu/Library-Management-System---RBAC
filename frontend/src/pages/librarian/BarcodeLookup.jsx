import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Alert,
    Grid,
    Chip,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
    InputAdornment,
    Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    ContentCopy as CopyIcon,
    QrCode as BarcodeIcon,
    Book as BookIcon,
    CheckCircle as AvailableIcon,
    Cancel as UnavailableIcon
} from '@mui/icons-material';
import { librarianApi } from '../../api';

const BarcodeLookupPage = () => {
    const theme = useTheme();

    const [isbn, setIsbn] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [bookData, setBookData] = useState(null);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSuccess(`Copied: ${text}`);
        setTimeout(() => setSuccess(null), 2000);
    };

    const handleSearch = async () => {
        if (!isbn.trim()) {
            setError('Please enter an ISBN number');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setBookData(null);

            const response = await librarianApi.viewBooks({ search: isbn.trim(), limit: 1 });
            const books = response.data || [];

            if (books.length === 0) {
                setError('No book found with this ISBN');
                return;
            }

            setBookData(books[0]);
        } catch (err) {
            setError('Search failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'success';
            case 'LOANED': return 'warning';
            case 'MAINTENANCE': return 'error';
            case 'LOST': return 'default';
            case 'RESERVED': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
                Barcode Lookup
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                Search by ISBN to view all barcodes and copies for a book
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {/* Search Box */}
            <Card sx={{ borderRadius: 3, mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <TextField
                            label="ISBN Number"
                            placeholder="Enter ISBN (e.g., 978-0-123-45678-9)"
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                sx: { fontFamily: 'monospace', fontSize: '1.1rem' }
                            }}
                        />
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleSearch}
                            disabled={loading}
                            sx={{ minWidth: 120, height: 56 }}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Results */}
            {bookData && (
                <Box>
                    {/* Book Info */}
                    <Card sx={{ borderRadius: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <BookIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h5" fontWeight={700}>{bookData.title}</Typography>
                                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                                        {bookData.publisher_name} • {bookData.publication_year}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '1rem',
                                                    bgcolor: 'action.hover',
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    letterSpacing: '1px',
                                                    fontWeight: 600
                                                }}
                                            >
                                                ISBN: {bookData.isbn}
                                            </Typography>
                                            <Tooltip title="Copy ISBN">
                                                <IconButton size="small" onClick={() => copyToClipboard(bookData.isbn)}>
                                                    <CopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        <Chip
                                            icon={<AvailableIcon />}
                                            label={`${bookData.available_copies || 0} Available`}
                                            color="success"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`${bookData.total_copies || 0} Total Copies`}
                                            variant="outlined"
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Barcodes List */}
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BarcodeIcon /> All Barcodes
                    </Typography>

                    {(!bookData.barcodes || bookData.barcodes.length === 0) ? (
                        <Alert severity="info">No copies exist for this book yet</Alert>
                    ) : (
                        <Grid container spacing={2}>
                            {bookData.barcodes.map((barcode, idx) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                                    <Card sx={{ borderRadius: 2 }}>
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <BarcodeIcon color="action" />
                                                    <Typography
                                                        sx={{
                                                            fontFamily: 'monospace',
                                                            fontSize: '1rem',
                                                            fontWeight: 600,
                                                            letterSpacing: '1px'
                                                        }}
                                                    >
                                                        {barcode}
                                                    </Typography>
                                                </Box>
                                                <Tooltip title="Copy Barcode">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => copyToClipboard(barcode)}
                                                        color="primary"
                                                    >
                                                        <CopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* Copy All Button */}
                    {bookData.barcodes && bookData.barcodes.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="outlined"
                                startIcon={<CopyIcon />}
                                onClick={() => copyToClipboard(bookData.barcodes.join(', '))}
                            >
                                Copy All Barcodes
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default BarcodeLookupPage;
