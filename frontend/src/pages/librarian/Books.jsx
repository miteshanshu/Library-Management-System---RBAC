import { useState, useEffect } from 'react';
import { Box, Typography, TextField, InputAdornment, Alert, Button, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search as SearchIcon, LibraryAdd as LibraryAddIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { librarianApi } from '../../api';
import BulkAddCopiesDialog from '../../components/dialogs/BulkAddCopiesDialog';

const LibrarianBooksPage = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [search, setSearch] = useState('');
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

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
                    <Tooltip title="Copy ISBN">
                        <IconButton
                            size="small"
                            onClick={() => copyToClipboard(params.value)}
                        >
                            <CopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 250 },
        { field: 'publisher_name', headerName: 'Publisher', width: 150 },
        { field: 'publication_year', headerName: 'Year', width: 80 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            renderCell: (params) => (
                <Button
                    size="small"
                    startIcon={<LibraryAddIcon />}
                    onClick={() => {
                        setSelectedBook(params.row);
                        setBulkDialogOpen(true);
                    }}
                >
                    Add Copies
                </Button>
            ),
        },
    ];

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>Books Catalog</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            <TextField
                size="small"
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchBooks()}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                sx={{ mb: 2, width: 300 }}
            />

            <Box sx={{ height: 500, backgroundColor: 'background.paper', borderRadius: 2 }}>
                <DataGrid
                    rows={books.map((b, i) => ({ ...b, sl_no: i + 1 }))}
                    columns={columns}
                    getRowId={(row) => row.book_id}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                />
            </Box>

            {/* Bulk Add Copies Dialog */}
            <BulkAddCopiesDialog
                open={bulkDialogOpen}
                onClose={() => {
                    setBulkDialogOpen(false);
                    setSelectedBook(null);
                }}
                book={selectedBook}
                role="librarian"
                onSuccess={(data) => {
                    setSuccess(`Successfully added ${data.copies_created} copies for "${selectedBook?.title}"`);
                }}
            />
        </Box>
    );
};

export default LibrarianBooksPage;
