import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Chip,
    Button,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Divider,
    List,
    ListItem,
    Avatar,
    TextField,
    Rating,
    useTheme,
    alpha,
    Container,
    Paper,
    IconButton
} from '@mui/material';
import {
    ArrowBack,
    MenuBook,
    Person,
    Category,
    Business,
    CheckCircle,
    Error as ErrorIcon,
    Schedule,
    Favorite,
    FavoriteBorder
} from '@mui/icons-material';
import { studentApi, featuresApi } from '../../api';

const BookDetails = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();

    const [book, setBook] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ avg_rating: 0, review_count: 0 });
    const [isInWishlist, setIsInWishlist] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Review Form
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bookRes, reviewsRes] = await Promise.all([
                    studentApi.getBookDetails(bookId),
                    featuresApi.getBookReviews(bookId)
                ]);

                setBook(bookRes.data);
                setReviews(reviewsRes.data.reviews || []);
                setReviewStats(reviewsRes.data.stats || { avg_rating: 0, review_count: 0 });

                // Check wishlist status (optimization: check from local list or separate call)
                const wishlistRes = await featuresApi.getWishlist();
                const isWishlisted = wishlistRes.data.some(b => b.book_id === parseInt(bookId));
                setIsInWishlist(isWishlisted);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [bookId]);

    const handleSubmitReview = async () => {
        if (!userRating) return;
        setSubmittingReview(true);
        try {
            await featuresApi.addReview(bookId, userRating, userComment);
            // Refresh reviews
            const reviewsRes = await featuresApi.getBookReviews(bookId);
            setReviews(reviewsRes.data.reviews);
            setReviewStats(reviewsRes.data.stats);
            setUserComment('');
            setUserRating(0);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleToggleWishlist = async () => {
        try {
            if (isInWishlist) {
                await featuresApi.removeFromWishlist(bookId);
                setIsInWishlist(false);
            } else {
                await featuresApi.addToWishlist(bookId);
                setIsInWishlist(true);
            }
        } catch (err) {
            console.error("Wishlist toggle failed", err);
        }
    };

    const handleReserve = async () => {
        try {
            await featuresApi.createReservation(bookId);
            alert("Book reserved successfully! Check your dashboard.");
            navigate('/student/dashboard');
        } catch (err) {
            alert("Failed to reserve: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
        </Box>
    );

    if (error || !book) return (
        <Alert severity="error" sx={{ mt: 3 }}>{error || 'Book not found'}</Alert>
    );

    const copies = book.copies || [];
    const availableCopies = copies.filter(c => c.status === 'AVAILABLE').length;

    return (
        <Box>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{ mb: 3 }}
            >
                Back to Browse
            </Button>

            <Grid container spacing={4}>
                {/* Left Column: Cover & Actions */}
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: theme.shadows[10],
                        position: 'sticky',
                        top: 20
                    }}>
                        <Box sx={{
                            pt: '140%',
                            position: 'relative',
                            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                                <IconButton
                                    onClick={handleToggleWishlist}
                                    sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'white' } }}
                                >
                                    {isInWishlist ? <Favorite color="error" /> : <FavoriteBorder />}
                                </IconButton>
                            </Box>
                            <MenuBook sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: 80,
                                color: 'white',
                                opacity: 0.3
                            }} />
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                                {copies.length > 0 ? (
                                    <>
                                        <Chip
                                            label={availableCopies > 0 ? `${availableCopies} ${availableCopies === 1 ? 'Copy' : 'Copies'} Available` : 'All Copies Loaned Out'}
                                            color={availableCopies > 0 ? 'success' : 'warning'}
                                            sx={{ fontWeight: 700, px: 2, py: 2.5, borderRadius: 2 }}
                                        />

                                        {availableCopies > 0 ? (
                                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                                Please visit the library counter to check out this book.
                                            </Typography>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={handleReserve}
                                                    startIcon={<Schedule />}
                                                    sx={{
                                                        borderRadius: 2,
                                                        px: 3,
                                                        py: 1,
                                                        fontWeight: 600,
                                                        boxShadow: theme.shadows[4]
                                                    }}
                                                >
                                                    Reserve This Book
                                                </Button>
                                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                                    Reserve to get notified when a copy becomes available.
                                                </Typography>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" textAlign="center">
                                        No copies registered for this book yet.
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Details & Reviews */}
                <Grid item xs={12} md={8}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ lineHeight: 1.1 }}>
                            {book.title}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                            <Rating value={parseFloat(reviewStats.avg_rating)} precision={0.5} readOnly />
                            <Typography fontWeight={600} color="text.secondary">
                                {reviewStats.avg_rating} ({reviewStats.review_count} reviews)
                            </Typography>
                            <Divider orientation="vertical" flexItem />
                            <Typography color="text.secondary" fontWeight={500}>
                                {book.isbn}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                            {book.genres.map(g => (
                                <Chip key={g.genre_id} label={g.genre_name} variant="outlined" />
                            ))}
                        </Box>
                    </Box>

                    <Paper sx={{ borderRadius: 4, p: 4, mb: 4 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>About this edition</Typography>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Publisher</Typography>
                                <Typography variant="body1" fontWeight={600}>{book.publisher_name}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Authors</Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {book.authors.map(a => `${a.first_name} ${a.last_name}`).join(', ')}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Box>
                        <Typography variant="h5" fontWeight={800} gutterBottom>Reviews</Typography>

                        {/* Write Review */}
                        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Rate this book</Typography>
                            <Rating
                                value={userRating}
                                onChange={(event, newValue) => setUserRating(newValue)}
                                size="large"
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Share your thoughts..."
                                value={userComment}
                                onChange={(e) => setUserComment(e.target.value)}
                                sx={{ mb: 2, bgcolor: 'background.paper' }}
                            />
                            <Button
                                variant="contained"
                                disabled={!userRating || submittingReview}
                                onClick={handleSubmitReview}
                            >
                                Post Review
                            </Button>
                        </Paper>

                        {/* Reviews List */}
                        <List>
                            {reviews.map((review) => (
                                <ListItem key={review.review_id} alignItems="flex-start" sx={{ px: 0, py: 2 }}>
                                    <Avatar sx={{ mr: 2, bgcolor: theme.palette.secondary.main }}>
                                        {review.full_name?.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                            <Typography variant="subtitle1" fontWeight={700}>{review.full_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
                                        <Typography variant="body2" color="text.primary">
                                            {review.comment}
                                        </Typography>
                                    </Box>
                                </ListItem>
                            ))}
                            {reviews.length === 0 && (
                                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                    No reviews yet. Be the first to review!
                                </Typography>
                            )}
                        </List>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default BookDetails;
