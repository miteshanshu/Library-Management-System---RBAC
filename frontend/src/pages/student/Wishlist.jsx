import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    IconButton,
    Rating,
    Chip,
    Container,
    CircularProgress,
    Alert,
    useTheme,
    alpha
} from '@mui/material';
import {
    Favorite,
    FavoriteBorder,
    ArrowBack,
    MenuBook,
    DeleteOutline,
    ShoppingCartOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { featuresApi } from '../../api';

const Wishlist = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWishlist = async () => {
        try {
            const res = await featuresApi.getWishlist();
            setBooks(res.data);
        } catch (err) {
            setError('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleRemove = async (bookId) => {
        try {
            // Optimistic update
            setBooks(prev => prev.filter(b => b.book_id !== bookId));
            await featuresApi.removeFromWishlist(bookId);
        } catch (err) {
            console.error(err);
            fetchWishlist(); // Revert on error
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 5 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/student/dashboard')}
                    sx={{ mb: 2 }}
                >
                    Back to Dashboard
                </Button>
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{
                    background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block'
                }}>
                    My Wishlist
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Books you want to read in the future
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {books.length === 0 ? (
                <Box sx={{
                    textAlign: 'center',
                    py: 10,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    borderRadius: 4,
                    border: '2px dashed',
                    borderColor: 'divider'
                }}>
                    <FavoriteBorder sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h5" fontWeight={700} gutterBottom color="text.secondary">
                        Your wishlist is empty
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Save books you're interested in by clicking the heart icon.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/student/books')}
                    >
                        Browse Books
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {books.map((book) => (
                        <Grid item xs={12} sm={6} md={4} key={book.book_id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 3,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-5px)', boxShadow: theme.shadows[8] }
                            }}>
                                <Box sx={{ position: 'relative', pt: '60%', bgcolor: 'grey.200' }}>
                                    {book.cover_image ? (
                                        <CardMedia
                                            component="img"
                                            image={book.cover_image}
                                            alt={book.title}
                                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `linear-gradient(45deg, ${theme.palette.grey[300]}, ${theme.palette.grey[100]})`
                                        }}>
                                            <MenuBook sx={{ fontSize: 60, opacity: 0.2 }} />
                                        </Box>
                                    )}
                                    <IconButton
                                        sx={{
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                            bgcolor: 'white',
                                            '&:hover': { bgcolor: 'white' }
                                        }}
                                        onClick={() => handleRemove(book.book_id)}
                                    >
                                        <Favorite color="error" />
                                    </IconButton>
                                </Box>
                                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                    <Typography variant="h6" fontWeight={700} gutterBottom>
                                        {book.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        by {book.authors?.map(a => `${a.first_name} ${a.last_name}`).join(', ') || 'Unknown'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                                        <Rating value={parseFloat(book.avg_rating || 0)} precision={0.5} readOnly size="small" />
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                            ({book.review_count || 0})
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={book.genre_name}
                                        size="small"
                                        variant="outlined"
                                        sx={{ borderRadius: 1 }}
                                    />
                                </CardContent>
                                <Box sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => navigate(`/student/books/${book.book_id}`)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        View Details
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
};

export default Wishlist;
