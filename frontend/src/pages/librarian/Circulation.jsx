import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Chip,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { circulationApi, librarianApi } from '../../api';
import { Person as PersonIcon, CheckCircle as SuccessIcon } from '@mui/icons-material';

const CirculationPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [scannedBook, setScannedBook] = useState(null);
    const [foundMember, setFoundMember] = useState(null);
    const [searchingMember, setSearchingMember] = useState(false);

    const checkoutForm = useForm();
    const returnForm = useForm();

    const handleScanBarcode = async (barcode) => {
        if (!barcode) return;
        try {
            const response = await librarianApi.scanBarcode(barcode);
            setScannedBook(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setScannedBook(null);
        }
    };

    const handleSearchMember = async (cardNumber) => {
        if (!cardNumber) return;
        setSearchingMember(true);
        setFoundMember(null);
        try {
            const response = await librarianApi.searchStudent({ card_number: cardNumber });
            if (response.data) {
                setFoundMember(response.data);
            }
        } catch (err) {
            setError('Member not found with card: ' + cardNumber);
            setFoundMember(null);
        } finally {
            setSearchingMember(false);
        }
    };

    const handleCheckout = async (data) => {
        if (!foundMember) {
            setError('Please search for a valid member first');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await circulationApi.issueBook(data.barcode, foundMember.member_id);
            setSuccess(`Book checked out to ${foundMember.first_name} ${foundMember.last_name}!`);
            checkoutForm.reset();
            setScannedBook(null);
            setFoundMember(null);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (data) => {
        setLoading(true);
        setError(null);
        try {
            await circulationApi.returnBook(parseInt(data.loan_id));
            setSuccess('Book returned successfully!');
            returnForm.reset();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Circulation
            </Typography>
            <Typography color="text.secondary" mb={4}>
                Checkout and return books
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            <Grid container spacing={3}>
                {/* Checkout Card */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Checkout Book
                            </Typography>
                            <form onSubmit={checkoutForm.handleSubmit(handleCheckout)}>
                                <TextField
                                    {...checkoutForm.register('barcode', { required: true })}
                                    label="Book Barcode"
                                    fullWidth
                                    margin="normal"
                                    placeholder="Scan or enter barcode"
                                    onBlur={(e) => handleScanBarcode(e.target.value)}
                                />
                                {scannedBook && (
                                    <Alert severity="info" sx={{ my: 2 }}>
                                        <strong>{scannedBook.title}</strong> - {scannedBook.status}
                                    </Alert>
                                )}

                                <TextField
                                    {...checkoutForm.register('card_number', { required: true })}
                                    label="Member Card Number"
                                    fullWidth
                                    margin="normal"
                                    placeholder="e.g., STU-2025018"
                                    onBlur={(e) => handleSearchMember(e.target.value)}
                                    InputProps={{
                                        endAdornment: searchingMember && <CircularProgress size={20} />
                                    }}
                                />

                                {foundMember && (
                                    <Alert
                                        severity="success"
                                        sx={{ my: 2 }}
                                        icon={<PersonIcon />}
                                    >
                                        <Box>
                                            <strong>{foundMember.first_name} {foundMember.last_name}</strong>
                                            <Typography variant="body2">
                                                {foundMember.email} • Status: {foundMember.status}
                                            </Typography>
                                        </Box>
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    sx={{ mt: 2, borderRadius: 2 }}
                                    disabled={loading || !foundMember}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Checkout'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Return Card */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Return Book
                            </Typography>
                            <form onSubmit={returnForm.handleSubmit(handleReturn)}>
                                <TextField
                                    {...returnForm.register('loan_id', { required: true })}
                                    label="Loan ID"
                                    type="number"
                                    fullWidth
                                    margin="normal"
                                    placeholder="Enter loan ID from receipt"
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="secondary"
                                    fullWidth
                                    sx={{ mt: 2, borderRadius: 2 }}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Return Book'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CirculationPage;

