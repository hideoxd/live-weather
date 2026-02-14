import { ForecastItem, TemperatureUnit } from '@/types/weather';

export function formatTemp(temp: number, unit: TemperatureUnit): string {
    return `${Math.round(temp)}°${unit === 'metric' ? 'C' : 'F'}`;
}

export function formatTempShort(temp: number): string {
    return `${Math.round(temp)}°`;
}

export function formatTime(timestamp: number, timezone: number): string {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
    });
}

export function formatDate(timestamp: number, timezone: number): string {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

export function formatDay(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getWindDirection(deg: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
}

export function getWindSpeed(speed: number, unit: TemperatureUnit): string {
    if (unit === 'imperial') {
        return `${Math.round(speed)} mph`;
    }
    return `${Math.round(speed * 3.6)} km/h`;
}

export function getVisibility(visibility: number, unit: TemperatureUnit): string {
    if (unit === 'imperial') {
        return `${(visibility / 1609.34).toFixed(1)} mi`;
    }
    if (visibility >= 1000) {
        return `${(visibility / 1000).toFixed(1)} km`;
    }
    return `${visibility} m`;
}

export function getAQILabel(aqi: number): { label: string; color: string } {
    const labels: Record<number, { label: string; color: string }> = {
        1: { label: 'Good', color: '#22c55e' },
        2: { label: 'Fair', color: '#eab308' },
        3: { label: 'Moderate', color: '#f97316' },
        4: { label: 'Poor', color: '#ef4444' },
        5: { label: 'Very Poor', color: '#7c3aed' },
    };
    return labels[aqi] || { label: 'Unknown', color: '#64748b' };
}

export function getUVLabel(uv: number): { label: string; color: string } {
    if (uv <= 2) return { label: 'Low', color: '#22c55e' };
    if (uv <= 5) return { label: 'Moderate', color: '#eab308' };
    if (uv <= 7) return { label: 'High', color: '#f97316' };
    if (uv <= 10) return { label: 'Very High', color: '#ef4444' };
    return { label: 'Extreme', color: '#7c3aed' };
}

export function getWeatherIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

export function getDailyForecasts(list: ForecastItem[]): ForecastItem[] {
    const dailyMap = new Map<string, ForecastItem>();

    list.forEach((item) => {
        const date = new Date(item.dt * 1000).toDateString();
        const existing = dailyMap.get(date);

        if (!existing) {
            dailyMap.set(date, { ...item });
        } else {
            // Take midday reading as representative, keep min/max
            const hour = new Date(item.dt * 1000).getHours();
            if (hour >= 11 && hour <= 14) {
                dailyMap.set(date, {
                    ...item,
                    main: {
                        ...item.main,
                        temp_min: Math.min(existing.main.temp_min, item.main.temp_min),
                        temp_max: Math.max(existing.main.temp_max, item.main.temp_max),
                    },
                });
            } else {
                dailyMap.set(date, {
                    ...existing,
                    main: {
                        ...existing.main,
                        temp_min: Math.min(existing.main.temp_min, item.main.temp_min),
                        temp_max: Math.max(existing.main.temp_max, item.main.temp_max),
                    },
                    pop: Math.max(existing.pop, item.pop),
                });
            }
        }
    });

    return Array.from(dailyMap.values()).slice(0, 5);
}

export function getHourlyForecasts(list: ForecastItem[], count: number = 8): ForecastItem[] {
    return list.slice(0, count);
}

export function getSunPosition(sunrise: number, sunset: number, current: number): number {
    if (current < sunrise) return 0;
    if (current > sunset) return 100;
    const total = sunset - sunrise;
    const elapsed = current - sunrise;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function getPressureTrend(pressure: number): string {
    if (pressure >= 1020) return 'High';
    if (pressure >= 1013) return 'Normal';
    if (pressure >= 1000) return 'Low';
    return 'Very Low';
}

export function getDewPoint(temp: number, humidity: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    return Math.round((b * alpha) / (a - alpha));
}
