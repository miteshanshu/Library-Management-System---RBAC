import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '@mui/material';

export const LoansTrendChart = ({ data }) => {
    const theme = useTheme();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis
                    dataKey="date"
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 12,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[4]
                    }}
                    itemStyle={{ color: theme.palette.text.primary }}
                />
                <Area
                    type="monotone"
                    dataKey="loans"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorLoans)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};
