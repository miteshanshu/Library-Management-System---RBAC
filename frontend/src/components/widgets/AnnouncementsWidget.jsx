import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    IconButton,
    Chip,
    useTheme,
    alpha
} from '@mui/material';
import {
    Campaign as AnnouncementIcon,
    Add as AddIcon,
    Close as CloseIcon,
    AccessTime,
    PriorityHigh
} from '@mui/icons-material';
import { featuresApi } from '../../api';
import { useAuthStore } from '../../store';

const AnnouncementsWidget = ({ limit = 5 }) => {
    const theme = useTheme();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('NORMAL'); // 'NORMAL' | 'HIGH'
    const [submitting, setSubmitting] = useState(false);

    const fetchAnnouncements = async () => {
        try {
            const res = await featuresApi.getAnnouncements();
            setAnnouncements(res.data);
        } catch (err) {
            console.error("Failed to fetch announcements", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async () => {
        if (!title || !message) return;
        setSubmitting(true);
        try {
            await featuresApi.createAnnouncement({ title, content: message, priority });
            setOpenDialog(false);
            setTitle('');
            setMessage('');
            setPriority('NORMAL');
            fetchAnnouncements();
        } catch (err) {
            alert('Failed to post announcement: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityColor = (p) => {
        return p === 'high' ? theme.palette.error.main : theme.palette.primary.main;
    };

    return (
        <Card sx={{
            height: '100%',
            borderRadius: 4,
            boxShadow: theme.shadows[4],
            overflow: 'visible'
        }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
                {/* Header */}
                <Box sx={{
                    p: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            p: 1,
                            borderRadius: '12px',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            display: 'flex'
                        }}>
                            <AnnouncementIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                Library News
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Updates & Announcements
                            </Typography>
                        </Box>
                    </Box>

                    {isAdmin && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenDialog(true)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                            Post New
                        </Button>
                    )}
                </Box>

                {/* List */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 400 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress size={30} />
                        </Box>
                    ) : announcements.length > 0 ? (
                        <List disablePadding>
                            {announcements.slice(0, limit).map((item, index) => (
                                <Box key={item.announcement_id}>
                                    <ListItem alignItems="flex-start" sx={{ px: 3, py: 2.5 }}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        {item.title}
                                                    </Typography>
                                                    {item.priority === 'HIGH' && (
                                                        <Chip
                                                            label="Important"
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                            sx={{ height: 20, fontSize: '0.65rem' }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.primary"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            mb: 1
                                                        }}
                                                    >
                                                        {item.content}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(item.created_at).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    {index < announcements.length - 1 && <Divider variant="inset" component="li" sx={{ ml: 3 }} />}
                                </Box>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                            <Typography variant="body2">No recent announcements.</Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>

            {/* Create Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth TransitionProps={{ unmountOnExit: true }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Post New Announcement
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                        <TextField
                            label="Message"
                            fullWidth
                            multiline
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Priority Level
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                    label="Normal"
                                    onClick={() => setPriority('NORMAL')}
                                    color={priority === 'NORMAL' ? 'primary' : 'default'}
                                    variant={priority === 'NORMAL' ? 'filled' : 'outlined'}
                                    clickable
                                />
                                <Chip
                                    label="High Importance"
                                    onClick={() => setPriority('HIGH')}
                                    color={priority === 'HIGH' ? 'error' : 'default'}
                                    variant={priority === 'HIGH' ? 'filled' : 'outlined'}
                                    clickable
                                    icon={<PriorityHigh />}
                                />
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} disabled={submitting}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!title || !message || submitting}
                    >
                        {submitting ? 'Posting...' : 'Post Announcement'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default AnnouncementsWidget;
