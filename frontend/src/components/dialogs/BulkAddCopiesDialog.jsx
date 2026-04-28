import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import { adminApi, librarianApi } from '../../api';

const BulkAddCopiesDialog = ({ open, onClose, book, role = 'admin', onSuccess }) => {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAddCopies = async () => {
        if (!book) return;

        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 1 || qty > 100) {
            setError("Please enter a valid quantity between 1 and 100");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const api = role === 'admin' ? adminApi : librarianApi;
            // locationId is optional, passing null for now as per simple requirement
            const result = await api.addBulkCopies(book.book_id, qty, null);

            if (onSuccess) {
                onSuccess(result.data);
            }
            onClose();
            setQuantity(1); // Reset
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to add copies");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add Copies</DialogTitle>
            <DialogContent>
                {book && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">{book.title}</Typography>
                        <Typography variant="body2" color="text.secondary">ISBN: {book.isbn}</Typography>
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <TextField
                    label="Number of Copies"
                    type="number"
                    fullWidth
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputProps={{ min: 1, max: 100 }}
                    helperText="Enter number of copies to generate (1-100)"
                    disabled={loading}
                    autoFocus
                />

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    * Barcodes will be automatically generated for all copies.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button
                    onClick={handleAddCopies}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Adding...' : 'Add Copies'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkAddCopiesDialog;
