import api from './axios';

export const reportsApi = {
    // Get dashboard summary
    getDashboardSummary: () => {
        return api.get('/reports/dashboard-summary');
    },

    // Get overdue report
    getOverdueReport: (params = {}) => {
        const { limit = 100, offset = 0 } = params;
        return api.get(`/reports/overdue?limit=${limit}&offset=${offset}`);
    },

    // Get circulation report
    getCirculationReport: (params = {}) => {
        const { start_date, end_date } = params;
        const queryParams = new URLSearchParams();
        if (start_date) queryParams.append('start_date', start_date);
        if (end_date) queryParams.append('end_date', end_date);
        const query = queryParams.toString();
        return api.get(`/reports/circulation${query ? '?' + query : ''}`);
    },

    // Get inventory summary
    getInventorySummary: () => {
        return api.get('/reports/inventory');
    },

    // Get member activity report
    getMemberActivityReport: (params = {}) => {
        const { limit = 100, offset = 0 } = params;
        return api.get(`/reports/member-activity?limit=${limit}&offset=${offset}`);
    },

    // Get debt aging report
    getDebtAgingReport: () => {
        return api.get('/reports/debt-aging');
    },

    // Get turnaround metrics
    getTurnaroundMetrics: () => {
        return api.get('/reports/turnaround-metrics');
    },
};

export default reportsApi;
