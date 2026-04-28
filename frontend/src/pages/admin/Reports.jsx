import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { reportsApi } from '../../api';

const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString();
};

const formatCurrency = (value) => `Rs.${parseFloat(value || 0).toFixed(2)}`;

const ReportsPage = () => {
    const [tab, setTab] = useState(0);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reportTypes = [
        { label: 'Overdue', fetch: () => reportsApi.getOverdueReport() },
        { label: 'Circulation', fetch: () => reportsApi.getCirculationReport() },
        { label: 'Inventory', fetch: () => reportsApi.getInventorySummary() },
        { label: 'Member Activity', fetch: () => reportsApi.getMemberActivityReport() },
        { label: 'Debt Aging', fetch: () => reportsApi.getDebtAgingReport() },
        { label: 'Turnaround', fetch: () => reportsApi.getTurnaroundMetrics() },
    ];

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await reportTypes[tab].fetch();
                setData(response.data || []);
            } catch (err) {
                setError(err.message);
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [tab]);

    const reportColumns = [
        [
            { field: 'sl_no', headerName: 'Sl. No', width: 70 },
            { field: 'title', headerName: 'Book Title', flex: 1.2, minWidth: 220 },
            { field: 'first_name', headerName: 'First Name', minWidth: 120 },
            { field: 'last_name', headerName: 'Last Name', minWidth: 120 },
            { field: 'card_number', headerName: 'Card Number', minWidth: 130 },
            { field: 'email', headerName: 'Email', flex: 1, minWidth: 220 },
            {
                field: 'due_date',
                headerName: 'Due Date',
                minWidth: 120,
                valueFormatter: (params) => formatDate(params.value),
            },
            {
                field: 'days_overdue',
                headerName: 'Days Overdue',
                minWidth: 130,
                renderCell: (params) => (
                    <Chip
                        label={`${params.value} day${params.value === 1 ? '' : 's'}`}
                        color={params.value > 14 ? 'error' : params.value > 7 ? 'warning' : 'default'}
                        size="small"
                    />
                ),
            },
        ],
        null,
        null,
        null,
        [
            { field: 'sl_no', headerName: 'Sl. No', width: 70 },
            { field: 'member_id', headerName: 'Member ID', minWidth: 110 },
            { field: 'first_name', headerName: 'First Name', minWidth: 120 },
            { field: 'last_name', headerName: 'Last Name', minWidth: 120 },
            {
                field: 'unpaid_fees',
                headerName: 'Unpaid Balance',
                minWidth: 140,
                valueFormatter: (params) => formatCurrency(params.value),
            },
            {
                field: 'partial_fees',
                headerName: 'Partial Balance',
                minWidth: 140,
                valueFormatter: (params) => formatCurrency(params.value),
            },
        ],
        null,
    ];

    const columns = data.length > 0
        ? reportColumns[tab] || [
            { field: 'sl_no', headerName: 'Sl. No', width: 70 },
            ...Object.keys(data[0]).map((key) => ({
                field: key,
                headerName: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                flex: 1,
                minWidth: 120,
            }))
        ]
        : [];

    const insightsByTab = [
        [
            { label: 'Overdue Loans', value: data.length },
            {
                label: 'Avg Days Overdue',
                value: data.length
                    ? (data.reduce((sum, row) => sum + Number(row.days_overdue || 0), 0) / data.length).toFixed(1)
                    : '0.0',
            },
            {
                label: 'Longest Delay',
                value: data.length ? `${Math.max(...data.map((row) => Number(row.days_overdue || 0)))} days` : '0 days',
            },
        ],
        [],
        [],
        [],
        [
            { label: 'Members In Debt', value: data.length },
            {
                label: 'Unpaid Balance',
                value: formatCurrency(data.reduce((sum, row) => sum + parseFloat(row.unpaid_fees || 0), 0)),
            },
            {
                label: 'Partial Balance',
                value: formatCurrency(data.reduce((sum, row) => sum + parseFloat(row.partial_fees || 0), 0)),
            },
        ],
        [],
    ];

    const insights = insightsByTab[tab] || [];

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Reports
            </Typography>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                {reportTypes.map((r, i) => (
                    <Tab key={i} label={r.label} />
                ))}
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!loading && insights.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {insights.map((item) => (
                        <Grid item xs={12} md={4} key={item.label}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {item.label}
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700}>
                                        {item.value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Card>
                <CardContent>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : data.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={4}>
                            No data available for this report
                        </Typography>
                    ) : (
                        <Box sx={{ height: 460 }}>
                            <DataGrid
                                rows={data.map((d, i) => ({ ...d, sl_no: i + 1 }))}
                                columns={columns}
                                getRowId={(row, idx) => row.loan_id || row.book_id || row.member_id || row.title || idx}
                                pageSizeOptions={[10, 25]}
                                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default ReportsPage;
