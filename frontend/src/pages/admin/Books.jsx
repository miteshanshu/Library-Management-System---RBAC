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
    IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Search as SearchIcon, LibraryAdd as LibraryAddIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { adminApi, librarianApi } from '../../api';
import BulkAddCopiesDialog from '../../components/dialogs/BulkAddCopiesDialog';

const BooksPage = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [search, setSearch] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await librarianApi.viewBooks({ search, limit: 100 });
            setBooks(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleSearch = () => {
        fetchBooks();
    };

    const handleAddBook = async (data) => {
        try {
            await adminApi.addBook(data);
            setSuccess('Book added successfully');
            setDialogOpen(false);
            reset();
            fetchBooks();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteBook = async (bookId) => {
        if (!confirm('Are you sure you want to delete this book?')) return;
        try {
            await adminApi.deleteBook(bookId);
            setSuccess('Book deleted successfully');
            fetchBooks();
        } catch (err) {
            setError(err.message);
        }
    };

    // Copy to clipboard function
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSuccess(`Copied: ${text}`);
        setTimeout(() => setSuccess(null), 2000);
    };

    const columns = [
        { field: 'sl_no', headerName: 'Sl. No', width: 80 },
        { field: 'book_id', headerName: 'ID', width: 70 },
        {
            field: 'isbn',
            headerName: 'ISBN',
            width: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            bgcolor: 'action.hover',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            letterSpacing: '1px'
                        }}
                    >
                        {params.value}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => copyToClipboard(params.value)}
                        title="Copy ISBN"
                    >
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Box>
            )
        },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 250 },
        { field: 'publisher_name', headerName: 'Publisher', width: 150 },
        { field: 'publication_year', headerName: 'Year', width: 80 },
        { field: 'language', headerName: 'Language', width: 100 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 250,
            renderCell: (params) => (
                <Box>
                    <Button
                        size="small"
                        startIcon={<LibraryAddIcon />}
                        onClick={() => {
                            setSelectedBook(params.row);
                            setBulkDialogOpen(true);
                        }}
                        sx={{ mr: 1 }}
                    >
                        Add Copies
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDeleteBook(params.row.book_id)}>
                        Delete
                    </Button>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700}>Books Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                    Add Book
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search by title or ISBN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                    sx={{ width: 300 }}
                />
                <Button variant="outlined" onClick={handleSearch}>Search</Button>
            </Box>

            <Box sx={{ height: 500, backgroundColor: 'background.paper', borderRadius: 2 }}>
                <DataGrid
                    rows={books.map((b, i) => ({ ...b, sl_no: i + 1 }))}
                    columns={columns}
                    getRowId={(row) => row.book_id}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                />
            </Box>

            {/* Add Book Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit(handleAddBook)}>
                    <DialogTitle>Add New Book</DialogTitle>
                    <DialogContent>
                        <TextField
                            {...register('isbn', { required: 'ISBN is required' })}
                            label="ISBN"
                            fullWidth
                            margin="normal"
                            error={!!errors.isbn}
                            helperText={errors.isbn?.message}
                        />
                        <TextField
                            {...register('title', { required: 'Title is required' })}
                            label="Title"
                            fullWidth
                            margin="normal"
                            error={!!errors.title}
                            helperText={errors.title?.message}
                        />
                        <TextField {...register('publication_year')} label="Publication Year" type="number" fullWidth margin="normal" />
                        <TextField {...register('language')} label="Language" fullWidth margin="normal" />
                        <TextField {...register('edition')} label="Edition" fullWidth margin="normal" />
                        <TextField {...register('description')} label="Description" fullWidth margin="normal" multiline rows={3} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setDialogOpen(false); reset(); }}>Cancel</Button>
                        <Button type="submit" variant="contained">Add Book</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Bulk Add Copies Dialog */}
            <BulkAddCopiesDialog
                open={bulkDialogOpen}
                onClose={() => {
                    setBulkDialogOpen(false);
                    setSelectedBook(null);
                }}
                book={selectedBook}
                role="admin"
                onSuccess={(data) => {
                    setSuccess(`Successfully added ${data.copies_created} copies for "${selectedBook?.title}"`);
                }}
            />
        </Box>
    );
};

export default BooksPage;
