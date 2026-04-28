import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    IconButton,
    Tooltip,
    Grid,
    useTheme,
    alpha,
    Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CardMembership as MembershipIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { adminApi } from '../../api';

const MembershipTypesPage = () => {
    const theme = useTheme();

    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getMembershipTypes();
            setTypes(response.data || []);
        } catch (err) {
            setError('Failed to load membership types: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const handleOpenDialog = (type = null) => {
        if (type) {
            setEditingType(type);
            setValue('type_name', type.type_name);
            setValue('loan_limit', type.loan_limit);
            setValue('loan_period_days', type.loan_period_days);
            setValue('daily_late_fee', type.daily_late_fee);
        } else {
            setEditingType(null);
            reset();
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingType(null);
        reset();
    };

    const handleSave = async (data) => {
        try {
            if (editingType) {
                await adminApi.manageMembershipTypes('update', {
                    membership_type_id: editingType.membership_type_id,
                    ...data
                });
                setSuccess('Membership type updated successfully');
            } else {
                await adminApi.manageMembershipTypes('create', data);
                setSuccess('Membership type created successfully');
            }
            handleCloseDialog();
            fetchTypes();
        } catch (err) {
            setError('Failed to save: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (typeId) => {
        if (!confirm('Are you sure you want to delete this membership type?')) return;
        try {
            await adminApi.manageMembershipTypes('delete', { membership_type_id: typeId });
            setSuccess('Membership type deleted successfully');
            fetchTypes();
        } catch (err) {
            setError('Failed to delete: ' + (err.response?.data?.message || err.message));
        }
    };

    const columns = [
        { field: 'membership_type_id', headerName: 'ID', width: 70 },
        {
            field: 'type_name',
            headerName: 'Type Name',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Chip
                    icon={<MembershipIcon />}
                    label={params.value}
                    color="primary"
                    variant="outlined"
                />
            )
        },
        {
            field: 'loan_limit',
            headerName: 'Loan Limit',
            width: 120,
            renderCell: (params) => (
                <Typography fontWeight={600}>{params.value} books</Typography>
            )
        },
        {
            field: 'loan_period_days',
            headerName: 'Loan Period',
            width: 130,
            renderCell: (params) => (
                <Typography>{params.value} days</Typography>
            )
        },
        {
            field: 'daily_late_fee',
            headerName: 'Daily Late Fee',
            width: 130,
            renderCell: (params) => (
                <Typography color="error.main" fontWeight={600}>
                    ₹{parseFloat(params.value || 0).toFixed(2)}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(params.row.membership_type_id)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Membership Types
                    </Typography>
                    <Typography color="text.secondary">
                        Configure membership plans with loan limits and fee structures
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    Add Type
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Types</Typography>
                            <Typography variant="h3" fontWeight={800} color="primary.main">
                                {types.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Max Loan Limit</Typography>
                            <Typography variant="h3" fontWeight={800} color="success.main">
                                {types.length > 0 ? Math.max(...types.map(t => t.loan_limit)) : 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Data Grid */}
            <Card sx={{ borderRadius: 3 }}>
                <Box sx={{ height: 400 }}>
                    <DataGrid
                        rows={types}
                        columns={columns}
                        getRowId={(row) => row.membership_type_id}
                        loading={loading}
                        pageSizeOptions={[10, 25]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                        sx={{ border: 'none' }}
                    />
                </Box>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(handleSave)}>
                    <DialogTitle sx={{ fontWeight: 700 }}>
                        {editingType ? 'Edit Membership Type' : 'Add New Membership Type'}
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            {...register('type_name', { required: 'Type name is required' })}
                            label="Type Name"
                            fullWidth
                            margin="normal"
                            error={!!errors.type_name}
                            helperText={errors.type_name?.message}
                            placeholder="e.g., Standard, Premium, Faculty"
                        />
                        <TextField
                            {...register('loan_limit', { required: 'Loan limit is required', min: 1 })}
                            label="Loan Limit (max books)"
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.loan_limit}
                            helperText={errors.loan_limit?.message}
                        />
                        <TextField
                            {...register('loan_period_days', { required: 'Loan period is required', min: 1 })}
                            label="Loan Period (days)"
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.loan_period_days}
                            helperText={errors.loan_period_days?.message}
                        />
                        <TextField
                            {...register('daily_late_fee')}
                            label="Daily Late Fee (₹)"
                            type="number"
                            fullWidth
                            margin="normal"
                            inputProps={{ step: '0.01', min: 0 }}
                            placeholder="0.00"
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            {editingType ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default MembershipTypesPage;
