import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    InputAdornment,
    Chip,
    CircularProgress,
    Alert,
    Rating,
    Button,
    useTheme,
    alpha,
    IconButton,
    Tooltip,
    Snackbar
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon, MenuBook, Star, FavoriteBorder, Favorite } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { studentApi, featuresApi } from '../../api';

// Modern Book Card with Glassmorphism
const BookCard = ({ book, onAddToWishlist, isInWishlist }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [adding, setAdding] = useState(false);

    const handleWishlistClick = async (e) => {
        e.stopPropagation(); // Prevent card click
        setAdding(true);
        try {
            await onAddToWishlist(book.book_id);
        } finally {
            setAdding(false);
        }
    };

    return (
        <Card
            onClick={() => navigate(`/student/books/${book.book_id}`)}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                background: theme.palette.mode === 'light' ? '#ffffff' : alpha(theme.palette.background.paper, 0.6),
                border: `1px solid ${theme.palette.divider}`,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[10],
                    '& .book-overlay': {
                        opacity: 1
                    }
                },
            }}
        >
            <Box sx={{ position: 'relative', pt: '140%', bgcolor: 'action.hover' }}>
                {/* Placeholder Cover Gradient since we don't have images yet */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <MenuBook sx={{ fontSize: 60, color: 'white', opacity: 0.5 }} />
                </Box>

                {/* Status badge removed - browse API doesn't return availability info */}

                {/* Wishlist Icon */}
                <Tooltip title={isInWishlist ? "Already in Wishlist" : "Add to Wishlist"}>
                    <IconButton
                        onClick={handleWishlistClick}
                        disabled={adding || isInWishlist}
                        sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            bgcolor: 'background.paper',
                            boxShadow: 2,
                            '&:hover': { bgcolor: 'background.paper' }
                        }}
                        size="small"
                    >
                        {isInWishlist ? (
                            <Favorite sx={{ color: 'error.main' }} fontSize="small" />
                        ) : (
                            <FavoriteBorder fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>

            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>
                    {book.publisher_name || 'Unknown Publisher'}
                </Typography>

                <Typography
                    gutterBottom
                    variant="h6"
                    component="div"
                    sx={{
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        lineHeight: 1.3,
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}
                >
                    {book.title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating
                        value={parseFloat(book.avg_rating) || 0}
                        readOnly
                        precision={0.5}
                        size="small"
                        emptyIcon={<Star style={{ opacity: 0.55 }} fontSize="inherit" />}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 600 }}>
                        ({book.review_count || 0})
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    sx={{
                        borderRadius: '10px',
                        borderWidth: '2px',
                        fontWeight: 700,
                        '&:hover': { borderWidth: '2px' }
                    }}
                >
                    View Details
                </Button>
            </CardContent>
        </Card>
    );
};

const BrowseBooks = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [wishlistIds, setWishlistIds] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await studentApi.browseBooks({ search: searchTerm });
                setBooks(response.data);
            } catch (err) {
                setError('Failed to fetch books');
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchBooks();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Fetch user's wishlist to check which books are already in it
    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const response = await featuresApi.getWishlist();
                const ids = (response.data || []).map(item => item.book_id);
                setWishlistIds(ids);
            } catch (err) {
                console.error("Failed to fetch wishlist", err);
            }
        };
        fetchWishlist();
    }, []);

    const handleAddToWishlist = async (bookId) => {
        try {
            await featuresApi.addToWishlist(bookId);
            setWishlistIds(prev => [...prev, bookId]);
            setSnackbar({ open: true, message: 'Added to wishlist!' });
        } catch (err) {
            if (err.message?.includes('already')) {
                setSnackbar({ open: true, message: 'Already in your wishlist' });
            } else {
                setSnackbar({ open: true, message: 'Failed to add to wishlist' });
            }
        }
    };

    return (
        <Box>
            <Box sx={{
                mb: 5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{
                        background: 'linear-gradient(45deg, #06b6d4, #3b82f6)',
                        backgroundClip: 'text',
                        textFillColor: 'transparent',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline-block'
                    }}>
                        Discover Books
                    </Typography>
                    <Typography color="text.secondary">
                        Explore our vast collection of knowledge
                    </Typography>
                </Box>

                <TextField
                    placeholder="Search by title or ISBN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: { xs: '100%', md: 350 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '12px', bgcolor: 'background.paper' }
                    }}
                />
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {books.map((book) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={book.book_id}>
                            <BookCard
                                book={book}
                                onAddToWishlist={handleAddToWishlist}
                                isInWishlist={wishlistIds.includes(book.book_id)}
                            />
                        </Grid>
                    ))}
                    {!loading && books.length === 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center', py: 10, opacity: 0.7 }}>
                                <MenuBook sx={{ fontSize: 60, mb: 2, color: 'text.disabled' }} />
                                <Typography variant="h6" color="text.secondary">
                                    No books found matching your criteria.
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </Box>
    );
};

export default BrowseBooks;
