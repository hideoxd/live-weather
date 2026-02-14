'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { ForecastItem } from '@/types/weather';

interface PrecipitationChartProps {
    data: ForecastItem[];
    timezone: number;
}

export default function PrecipitationChart({ data, timezone }: PrecipitationChartProps) {
    const chartData = data.slice(0, 12).map((item) => {
        const date = new Date((item.dt + timezone) * 1000);
        const rain = item.rain?.['3h'] || 0;
        const snow = item.snow?.['3h'] || 0;
        return {
            time: date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                hour12: true,
                timeZone: 'UTC',
            }),
            precipitation: Math.round((rain + snow) * 10) / 10,
            chance: Math.round(item.pop * 100),
        };
    });

    const getBarColor = (chance: number) => {
        if (chance >= 80) return '#3b82f6';
        if (chance >= 60) return '#06b6d4';
        if (chance >= 40) return '#22c55e';
        if (chance >= 20) return '#eab308';
        return '#64748b';
    };

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{label}</p>
                    <p className="value" style={{ color: '#06b6d4' }}>
                        Chance: {payload.find(p => p.dataKey === 'chance')?.value}%
                    </p>
                    <p className="value" style={{ color: '#3b82f6' }}>
                        Amount: {payload.find(p => p.dataKey === 'precipitation')?.value} mm
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                    dataKey="time"
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                    dataKey="chance"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                >
                    {chartData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={getBarColor(entry.chance)}
                            fillOpacity={0.7}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
