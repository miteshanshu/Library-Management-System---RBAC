import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Chip,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { adminApi } from '../../api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getUsers({ role: roleFilter || undefined });
            setUsers(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const handleCreateLibrarian = async (data) => {
        try {
            await adminApi.createLibrarian(data);
            setSuccess('Librarian created successfully');
            setDialogOpen(false);
            reset();
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await adminApi.toggleLibrarianStatus(userId, !currentStatus);
            setSuccess(`Librarian ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const columns = [
        { field: 'sl_no', headerName: 'Sl. No', width: 70 },
        { field: 'user_id', headerName: 'ID', width: 70 },
        { field: 'full_name', headerName: 'Full Name', flex: 1, minWidth: 150 },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
        {
            field: 'role',
            headerName: 'Role',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={params.value === 'admin' ? 'error' : params.value === 'librarian' ? 'primary' : 'success'}
                />
            ),
        },
        {
            field: 'is_active',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Active' : 'Inactive'}
                    size="small"
                    color={params.value ? 'success' : 'default'}
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            renderCell: (params) => {
                if (params.row.role !== 'librarian') return null;
                return (
                    <Button
                        size="small"
                        onClick={() => handleToggleStatus(params.row.user_id, params.row.is_active)}
                    >
                        {params.row.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                );
            },
        },
    ];

    const filteredUsers = users.filter((u) =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    ).map((user, index) => ({ ...user, sl_no: index + 1 }));

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700}>User Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                    Add Librarian
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                />
                <TextField
                    size="small"
                    select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    SelectProps={{ native: true }}
                    sx={{ width: 150 }}
                >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="librarian">Librarian</option>
                    <option value="student">Student</option>
                </TextField>
            </Box>

            <Box sx={{ height: 500, backgroundColor: 'background.paper', borderRadius: 2 }}>
                <DataGrid
                    rows={filteredUsers}
                    columns={columns}
                    getRowId={(row) => row.user_id}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                />
            </Box>

            {/* Create Librarian Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(handleCreateLibrarian)}>
                    <DialogTitle>Create Librarian</DialogTitle>
                    <DialogContent>
                        <TextField
                            {...register('full_name', { required: 'Required' })}
                            label="Full Name"
                            fullWidth
                            margin="normal"
                            error={!!errors.full_name}
                            helperText={errors.full_name?.message}
                        />
                        <TextField
                            {...register('email', { required: 'Required' })}
                            label="Email"
                            type="email"
                            fullWidth
                            margin="normal"
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                        <TextField
                            {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })}
                            label="Password"
                            type="password"
                            fullWidth
                            margin="normal"
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setDialogOpen(false); reset(); }}>Cancel</Button>
                        <Button type="submit" variant="contained">Create</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default UsersPage;
