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
    InputAdornment,
    Chip,
    Autocomplete
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Search as SearchIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { adminApi, librarianApi } from '../../api';

const BookCopiesPage = () => {
    const [copies, setCopies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [bookOptions, setBookOptions] = useState([]);
    const [selectionModel, setSelectionModel] = useState([]);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm();

    const fetchCopies = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getAllBookCopies({ search });
            setCopies(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookOptions = async (query = '') => {
        try {
            const response = await librarianApi.viewBooks({ search: query, limit: 20 });
            setBookOptions(response.data || []);
        } catch (err) {
            console.error("Failed to fetch books", err);
        }
    };

    useEffect(() => {
        fetchCopies();
        fetchBookOptions();
    }, []);

    const handleSearch = () => {
        fetchCopies();
    };

    const handleAddCopy = async (data) => {
        try {
            if (!data.book || !data.book.book_id) {
                setError("Please select a valid book");
                return;
            }

            await adminApi.addBookCopy({
                book_id: data.book.book_id,
                barcode: data.barcode,
                location_id: data.location_id || null, // Optional
            });

            setSuccess('Book copy added successfully');
            setDialogOpen(false);
            reset();
            fetchCopies();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteCopy = async (copyId) => {
        if (!confirm('Are you sure you want to delete this copy?')) return;
        try {
            await adminApi.deleteBookCopy(copyId);
            setSuccess('Copy deleted successfully');
            fetchCopies();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleBulkDelete = async () => {
        if (selectionModel.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectionModel.length} selected copies? This action cannot be undone.`)) return;

        try {
            const response = await adminApi.bulkDeleteBookCopies(selectionModel);
            setSuccess(response.message || `Deleted ${selectionModel.length} copies successfully`);
            setSelectionModel([]);
            fetchCopies();
        } catch (err) {
            setError(err.message || 'Failed to delete copies');
        }
    };

    // Copy to clipboard function
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSuccess(`Copied: ${text}`);
        setTimeout(() => setSuccess(null), 2000);
    };

    const columns = [
        { field: 'sl_no', headerName: 'Sl. No', width: 70 },
        {
            field: 'barcode',
            headerName: 'Barcode',
            width: 220,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            bgcolor: 'action.hover',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            letterSpacing: '0.5px'
                        }}
                    >
                        {params.value}
                    </Typography>
                    <Button
                        size="small"
                        variant="text"
                        sx={{ minWidth: 'auto', p: 0.5 }}
                        onClick={() => copyToClipboard(params.value)}
                    >
                        <CopyIcon fontSize="small" />
                    </Button>
                </Box>
            )
        },
        { field: 'title', headerName: 'Book Title', flex: 1, minWidth: 200 },
        {
            field: 'isbn',
            headerName: 'ISBN',
            width: 180,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {params.value}
                    </Typography>
                    <Button
                        size="small"
                        variant="text"
                        sx={{ minWidth: 'auto', p: 0.5 }}
                        onClick={() => copyToClipboard(params.value)}
                    >
                        <CopyIcon fontSize="small" />
                    </Button>
                </Box>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => {
                const colors = {
                    AVAILABLE: 'success',
                    LOANED: 'warning',
                    MAINTENANCE: 'error',
                    LOST: 'default',
                    RESERVED: 'info'
                };
                return <Chip label={params.value} color={colors[params.value] || 'default'} size="small" />;
            }
        },
        { field: 'location_name', headerName: 'Location', width: 150 },
        { field: 'created_by_name', headerName: 'Added By', width: 150 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            renderCell: (params) => (
                <Button size="small" color="error" onClick={() => handleDeleteCopy(params.row.copy_id)}>
                    Delete
                </Button>
            ),
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700}>Book Copies Management</Typography>
                <Box>
                    {selectionModel.length > 0 && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleBulkDelete}
                            sx={{ mr: 2 }}
                        >
                            Delete Selected ({selectionModel.length})
                        </Button>
                    )}
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                        Add Copy
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search by barcode, title, or ISBN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                    sx={{ width: 350 }}
                />
                <Button variant="outlined" onClick={handleSearch}>Search</Button>
            </Box>

            <Box sx={{ height: 500, backgroundColor: 'background.paper', borderRadius: 2 }}>
                <DataGrid
                    rows={copies.map((c, i) => ({ ...c, sl_no: i + 1 }))}
                    columns={columns}
                    getRowId={(row) => row.copy_id}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    checkboxSelection
                    disableRowSelectionOnClick
                    onRowSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
                    rowSelectionModel={selectionModel}
                />
            </Box>

            {/* Add Copy Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(handleAddCopy)}>
                    <DialogTitle>Add New Copy</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Controller
                                name="book"
                                control={control}
                                rules={{ required: 'Book is required' }}
                                render={({ field: { onChange, value }, fieldState: { error } }) => (
                                    <Autocomplete
                                        options={bookOptions}
                                        getOptionLabel={(option) => `${option.title} (${option.isbn})`}
                                        onChange={(_, data) => onChange(data)}
                                        onInputChange={(_, newInputValue) => {
                                            if (newInputValue.length > 2) fetchBookOptions(newInputValue);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Book"
                                                error={!!error}
                                                helperText={error?.message}
                                                placeholder="Type to search books..."
                                            />
                                        )}
                                    />
                                )}
                            />

                            <TextField
                                {...register('barcode', { required: 'Barcode is required' })}
                                label="Barcode"
                                fullWidth
                                error={!!errors.barcode}
                                helperText={errors.barcode?.message}
                            />

                            <TextField
                                {...register('location_id')} // For now just raw ID or empty. Ideally fetching locations.
                                label="Location ID (Optional)"
                                type="number"
                                fullWidth
                                helperText="Enter Location ID if known"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setDialogOpen(false); reset(); }}>Cancel</Button>
                        <Button type="submit" variant="contained">Add Copy</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default BookCopiesPage;
