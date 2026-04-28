import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    Chip,
    Grid,
    TextField,
    MenuItem,
    useTheme,
    alpha,
    IconButton,
    Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Bookmark as ReservationIcon,
    Check as FulfillIcon,
    Close as CancelIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { librarianApi } from '../../api';

const ReservationsPage = () => {
    const theme = useTheme();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const params = statusFilter ? { status: statusFilter } : {};
            const response = await librarianApi.getAllReservations(params);
            setReservations(response.data || []);
        } catch (err) {
            setError('Failed to load reservations: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [statusFilter]);

    const handleFulfill = async (id) => {
        try {
            await librarianApi.fulfillReservation(id);
            setSuccess('Reservation fulfilled! Member has 3 days to collect.');
            fetchReservations();
        } catch (err) {
            setError('Failed to fulfill: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Cancel this reservation?')) return;
        try {
            await librarianApi.cancelReservation(id);
            setSuccess('Reservation cancelled');
            fetchReservations();
        } catch (err) {
            setError('Failed to cancel: ' + (err.response?.data?.message || err.message));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'FULFILLED': return 'success';
            case 'EXPIRED': return 'error';
            case 'CANCELLED': return 'default';
            default: return 'default';
        }
    };

    const columns = [
        { field: 'reservation_id', headerName: 'ID', width: 70 },
        {
            field: 'title',
            headerName: 'Book',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box>
                    <Typography fontWeight={600}>{params.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{params.row.isbn}</Typography>
                </Box>
            )
        },
        {
            field: 'member',
            headerName: 'Member',
            width: 200,
            renderCell: (params) => (
                <Box>
                    <Typography>{params.row.first_name} {params.row.last_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{params.row.card_number}</Typography>
                </Box>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={getStatusColor(params.value)}
                    size="small"
                />
            )
        },
        {
            field: 'reserved_at',
            headerName: 'Reserved',
            width: 120,
            renderCell: (params) => new Date(params.value).toLocaleDateString()
        },
        {
            field: 'queue_position',
            headerName: 'Queue',
            width: 80,
            renderCell: (params) => params.value ? `#${params.value}` : '-'
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            renderCell: (params) => (
                <Box>
                    {params.row.status === 'PENDING' && (
                        <>
                            <Tooltip title="Mark as Fulfilled">
                                <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleFulfill(params.row.reservation_id)}
                                >
                                    <FulfillIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleCancel(params.row.reservation_id)}
                                >
                                    <CancelIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            ),
        },
    ];

    // Stats
    const pending = reservations.filter(r => r.status === 'PENDING').length;
    const fulfilled = reservations.filter(r => r.status === 'FULFILLED').length;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Reservations
                    </Typography>
                    <Typography color="text.secondary">
                        Manage book reservations from students
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchReservations}
                >
                    Refresh
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Pending</Typography>
                            <Typography variant="h3" fontWeight={800} color="warning.main">
                                {pending}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Fulfilled</Typography>
                            <Typography variant="h3" fontWeight={800} color="success.main">
                                {fulfilled}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total</Typography>
                            <Typography variant="h3" fontWeight={800} color="primary.main">
                                {reservations.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filter */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    select
                    label="Filter by Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    size="small"
                    sx={{ width: 200 }}
                >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="FULFILLED">Fulfilled</MenuItem>
                    <MenuItem value="EXPIRED">Expired</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </TextField>
            </Box>

            {/* Data Grid */}
            <Card sx={{ borderRadius: 3 }}>
                <Box sx={{ height: 500 }}>
                    <DataGrid
                        rows={reservations}
                        columns={columns}
                        getRowId={(row) => row.reservation_id}
                        loading={loading}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                        sx={{ border: 'none' }}
                    />
                </Box>
            </Card>
        </Box>
    );
};

export default ReservationsPage;
