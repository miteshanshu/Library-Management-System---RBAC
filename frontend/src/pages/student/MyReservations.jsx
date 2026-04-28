import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    CircularProgress,
    Alert,
    useTheme,
    alpha,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Bookmark as ReservationIcon,
    MenuBook,
    Cancel as CancelIcon,
    CheckCircle,
    Schedule,
    Error as ErrorIcon
} from '@mui/icons-material';
import { featuresApi } from '../../api';

const MyReservations = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const res = await featuresApi.getMyReservations();
            setReservations(res.data || []);
        } catch (err) {
            setError('Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleCancel = async (reservationId) => {
        if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
        try {
            await featuresApi.cancelReservation(reservationId);
            fetchReservations();
        } catch (err) {
            alert('Failed to cancel reservation: ' + (err.response?.data?.message || err.message));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'FULFILLED': return 'success';
            case 'CANCELLED': return 'default';
            case 'EXPIRED': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Schedule />;
            case 'FULFILLED': return <CheckCircle />;
            case 'CANCELLED': return <CancelIcon />;
            case 'EXPIRED': return <ErrorIcon />;
            default: return <Schedule />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    My Reservations
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Track your book reservations and queue positions
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {reservations.length === 0 ? (
                <Card sx={{
                    borderRadius: 4,
                    textAlign: 'center',
                    py: 8,
                    px: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.03)
                }}>
                    <ReservationIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No reservations yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        When all copies of a book are loaned out, you can reserve it to be notified when it becomes available.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/student/books')}
                        sx={{ borderRadius: 2 }}
                    >
                        Browse Books
                    </Button>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {reservations.map((reservation) => (
                        <Grid item xs={12} sm={6} md={4} key={reservation.reservation_id}>
                            <Card sx={{
                                borderRadius: 4,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: theme.shadows[8]
                                }
                            }}>
                                {/* Book Cover Placeholder */}
                                <Box sx={{
                                    pt: '60%',
                                    position: 'relative',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                                }}>
                                    <MenuBook sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        fontSize: 48,
                                        color: 'white',
                                        opacity: 0.4
                                    }} />
                                    <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                                        <Chip
                                            icon={getStatusIcon(reservation.status)}
                                            label={reservation.status}
                                            color={getStatusColor(reservation.status)}
                                            size="small"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </Box>
                                </Box>

                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                                        {reservation.title || `Book #${reservation.book_id}`}
                                    </Typography>

                                    <Box sx={{ mt: 'auto', pt: 2 }}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Reserved: {new Date(reservation.reserved_at).toLocaleDateString()}
                                        </Typography>
                                        {reservation.queue_position && (
                                            <Typography variant="caption" color="primary" fontWeight={600}>
                                                Queue Position: #{reservation.queue_position}
                                            </Typography>
                                        )}
                                        {reservation.expiry_at && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Expires: {new Date(reservation.expiry_at).toLocaleDateString()}
                                            </Typography>
                                        )}
                                    </Box>

                                    {reservation.status === 'PENDING' && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<CancelIcon />}
                                            onClick={() => handleCancel(reservation.reservation_id)}
                                            sx={{ mt: 2, borderRadius: 2 }}
                                        >
                                            Cancel Reservation
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default MyReservations;
