'use client';

import { memo, useMemo } from 'react';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { ForecastItem } from '@/types/weather';
import { formatTempShort } from '@/lib/weather-utils';

interface TemperatureChartProps {
    data: ForecastItem[];
    timezone: number;
}

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string }>;
    label?: string;
}

const TemperatureTooltip = memo(function TemperatureTooltip({ active, payload, label }: ChartTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="label">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="value" style={{ color: entry.dataKey === 'temp' ? '#3b82f6' : '#8b5cf6' }}>
                        {entry.dataKey === 'temp' ? 'Temp' : 'Feels'}: {formatTempShort(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
});

function TemperatureChart({ data, timezone }: TemperatureChartProps) {
    const chartData = useMemo(
        () =>
            data.slice(0, 12).map((item) => {
                const date = new Date((item.dt + timezone) * 1000);
                return {
                    time: date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        hour12: true,
                        timeZone: 'UTC',
                    }),
                    temp: Math.round(item.main.temp),
                    feels: Math.round(item.main.feels_like),
                    humidity: item.main.humidity,
                };
            }),
        [data, timezone]
    );

    return (
        <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="feelsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                </defs>
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
                    tickFormatter={(val) => `${val}°`}
                />
                <Tooltip content={<TemperatureTooltip />} />
                <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#tempGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#3b82f6', stroke: '#0a0e1a', strokeWidth: 2 }}
                />
                <Area
                    type="monotone"
                    dataKey="feels"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    fill="url(#feelsGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#0a0e1a', strokeWidth: 2 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default memo(TemperatureChart);
