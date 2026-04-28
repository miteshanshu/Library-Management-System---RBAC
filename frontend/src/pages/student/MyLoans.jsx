import { useState, useEffect } from 'react';
import { Box, Typography, Chip, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { studentApi } from '../../api';

const MyLoansPage = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const response = await studentApi.getMyLoans();
                setLoans(response.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLoans();
    }, []);

    const columns = [
        { field: 'sl_no', headerName: 'Sl. No', width: 70 },
        { field: 'loan_id', headerName: 'Loan ID', width: 80 },
        { field: 'title', headerName: 'Book Title', flex: 1, minWidth: 200 },
        { field: 'barcode', headerName: 'Barcode', width: 120 },
        { field: 'checkout_date', headerName: 'Checkout', width: 110, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
        { field: 'due_date', headerName: 'Due Date', width: 110, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
        {
            field: 'days_overdue',
            headerName: 'Days Overdue',
            width: 120,
            valueGetter: (params) => {
                if (params.row.status !== 'OVERDUE') return 0;
                const dueDate = new Date(params.row.due_date);
                const today = new Date();
                const msPerDay = 24 * 60 * 60 * 1000;
                return Math.max(Math.floor((today - dueDate) / msPerDay), 0);
            },
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={params.value === 'OVERDUE' ? 'error' : params.value === 'RETURNED' ? 'success' : 'primary'}
                />
            ),
        },
    ];

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>My Loans</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box sx={{ height: 500, backgroundColor: 'background.paper', borderRadius: 2 }}>
                <DataGrid
                    rows={loans.map((l, i) => ({ ...l, sl_no: i + 1 }))}
                    columns={columns}
                    getRowId={(row) => row.loan_id}
                    loading={loading}
                    pageSizeOptions={[10, 25, 100]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default MyLoansPage;
