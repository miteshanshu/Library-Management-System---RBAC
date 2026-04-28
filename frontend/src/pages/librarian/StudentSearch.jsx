import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Alert,
    Grid,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { librarianApi } from '../../api';

const formatCurrency = (value) => `Rs.${parseFloat(value || 0).toFixed(2)}`;

const StudentSearchPage = () => {
    const [searchType, setSearchType] = useState('card');
    const [searchValue, setSearchValue] = useState('');
    const [student, setStudent] = useState(null);
    const [loans, setLoans] = useState([]);
    const [fees, setFees] = useState([]);
    const [overdues, setOverdues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!searchValue.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const params = searchType === 'card'
                ? { card_number: searchValue }
                : { email: searchValue };
            const response = await librarianApi.searchStudent(params);
            setStudent(response.data);

            const [loansRes, feesRes, overdueRes] = await Promise.all([
                librarianApi.getStudentLoans(response.data.member_id),
                librarianApi.getStudentFees(response.data.member_id),
                librarianApi.getStudentOverdueLoans(response.data.member_id),
            ]);
            setLoans(loansRes.data || []);
            setFees(feesRes.data || []);
            setOverdues(overdueRes.data || []);
        } catch (err) {
            setError(err.message);
            setStudent(null);
            setLoans([]);
            setFees([]);
            setOverdues([]);
        } finally {
            setLoading(false);
        }
    };

    const outstandingFees = fees.reduce((sum, fee) => sum + parseFloat(fee.outstanding_amount || 0), 0);

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Student Search
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                        <TextField
                            select
                            label="Search By"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            SelectProps={{ native: true }}
                            sx={{ width: 150 }}
                        >
                            <option value="card">Card Number</option>
                            <option value="email">Email</option>
                        </TextField>
                        <TextField
                            label={searchType === 'card' ? 'Card Number' : 'Email'}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            sx={{ flex: 1 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {student && !loading && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Student Profile
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Typography><strong>Name:</strong> {student.first_name} {student.last_name}</Typography>
                                <Typography><strong>Card:</strong> {student.card_number}</Typography>
                                <Typography><strong>Email:</strong> {student.email}</Typography>
                                <Typography><strong>Phone:</strong> {student.phone || 'N/A'}</Typography>
                                <Chip
                                    label={student.status}
                                    color={student.status === 'ACTIVE' ? 'success' : 'error'}
                                    sx={{ mt: 2 }}
                                />
                                <Divider sx={{ my: 2 }} />
                                <Typography><strong>Outstanding Fees:</strong> {formatCurrency(outstandingFees)}</Typography>
                                <Typography><strong>Overdue Loans:</strong> {overdues.length}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Loans ({loans.length})
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                {loans.length === 0 ? (
                                    <Typography color="text.secondary">No loans found</Typography>
                                ) : (
                                    <List disablePadding>
                                        {loans.slice(0, 10).map((loan) => (
                                            <ListItem key={loan.loan_id} divider>
                                                <ListItemText
                                                    primary={loan.title}
                                                    secondary={`Due: ${new Date(loan.due_date).toLocaleDateString()} | Barcode: ${loan.barcode}`}
                                                />
                                                <Chip
                                                    label={loan.status}
                                                    size="small"
                                                    color={loan.status === 'OVERDUE' ? 'error' : loan.status === 'RETURNED' ? 'success' : 'primary'}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Outstanding Fees ({fees.length})
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                {fees.length === 0 ? (
                                    <Typography color="text.secondary">No fee records found</Typography>
                                ) : (
                                    <List disablePadding>
                                        {fees.slice(0, 8).map((fee) => (
                                            <ListItem key={fee.fee_id} divider>
                                                <ListItemText
                                                    primary={`${fee.fee_type} - ${formatCurrency(fee.amount)}`}
                                                    secondary={`Paid ${formatCurrency(fee.amount_paid)} | Remaining ${formatCurrency(fee.outstanding_amount)}`}
                                                />
                                                <Chip
                                                    label={fee.status}
                                                    size="small"
                                                    color={fee.status === 'PAID' ? 'success' : fee.status === 'PARTIAL' ? 'warning' : 'error'}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Overdue Details ({overdues.length})
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                {overdues.length === 0 ? (
                                    <Typography color="text.secondary">No overdue loans found</Typography>
                                ) : (
                                    <List disablePadding>
                                        {overdues.slice(0, 8).map((loan) => (
                                            <ListItem key={loan.loan_id} divider>
                                                <ListItemText
                                                    primary={loan.title}
                                                    secondary={`Due ${new Date(loan.due_date).toLocaleDateString()} | ${loan.days_overdue} day${loan.days_overdue === 1 ? '' : 's'} overdue`}
                                                />
                                                <Chip label={`${loan.days_overdue} days`} size="small" color="error" />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default StudentSearchPage;
