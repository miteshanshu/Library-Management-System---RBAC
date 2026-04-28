import { Snackbar, Alert } from '@mui/material';
import useUIStore from '../../store/uiStore';

const StatusSnackbar = () => {
    const { snackbar, hideSnackbar } = useUIStore();

    return (
        <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={hideSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert
                onClose={hideSnackbar}
                severity={snackbar.severity}
                variant="filled"
                sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}
            >
                {snackbar.message}
            </Alert>
        </Snackbar>
    );
};

export default StatusSnackbar;
