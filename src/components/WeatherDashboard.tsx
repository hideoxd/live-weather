'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
    Search,
    MapPin,
    Droplets,
    Wind,
    Eye,
    Gauge,
    Thermometer,
    Sun,
    Sunrise,
    Sunset,
    CloudRain,
    Clock,
    Cloud,
    X,
    Plus,
    TrendingUp,
    Zap,
    Navigation,
} from 'lucide-react';
import { WeatherData, CityInfo, SearchResult, TemperatureUnit } from '@/types/weather';
import {
    formatTemp,
    formatTempShort,
    formatTime,
    formatDate,
    formatDay,
    getWindDirection,
    getWindSpeed,
    getVisibility,
    getAQILabel,
    getWeatherIconUrl,
    getDailyForecasts,
    getHourlyForecasts,
    getSunPosition,
    getPressureTrend,
    getDewPoint,
} from '@/lib/weather-utils';

const DEFAULT_CITIES: CityInfo[] = [
    { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
    { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
    { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
    { name: 'Mumbai', country: 'IN', lat: 19.076, lon: 72.8777 },
    { name: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
];

const TemperatureChart = dynamic(() => import('@/components/charts/TemperatureChart'), {
    ssr: false,
    loading: () => <div className="chart-skeleton" />,
});

const PrecipitationChart = dynamic(() => import('@/components/charts/PrecipitationChart'), {
    ssr: false,
    loading: () => <div className="chart-skeleton" />,
});

const MONO_VALUE_STYLE = {
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
} as const;

export default function WeatherDashboard() {
    const [cities, setCities] = useState<CityInfo[]>(DEFAULT_CITIES);
    const [activeCityIndex, setActiveCityIndex] = useState(0);
    const [weatherCache, setWeatherCache] = useState<Record<string, WeatherData>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unit, setUnit] = useState<TemperatureUnit>('metric');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSearch, setShowSearch] = useState(false);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchAbortRef = useRef<AbortController | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const weatherCacheRef = useRef<Record<string, WeatherData>>({});
    const inFlightWeatherRef = useRef<Set<string>>(new Set());

    const activeCity = cities[activeCityIndex] ?? cities[0];
    const cacheKey = `${activeCity.lat},${activeCity.lon},${unit}`;
    const weatherData = weatherCache[cacheKey];

    useEffect(() => {
        weatherCacheRef.current = weatherCache;
    }, [weatherCache]);

    const {
        hourlyData,
        dailyData,
        aqiInfo,
        sunPosition,
        dewPoint,
        tempRangeMin,
        tempRangeSpan,
    } = useMemo(() => {
        if (!weatherData) {
            return {
                hourlyData: [],
                dailyData: [],
                aqiInfo: { label: 'N/A', color: '#64748b' },
                sunPosition: 0,
                dewPoint: 0,
                tempRangeMin: 0,
                tempRangeSpan: 1,
            };
        }

        const { current, forecast, airQuality, hourlyDetailed } = weatherData;
        const computedHourly =
            hourlyDetailed && hourlyDetailed.length > 0
                ? hourlyDetailed
                : getHourlyForecasts(forecast.list, 8);
        const computedDaily = getDailyForecasts(forecast.list);
        const computedAqi = airQuality.list[0]
            ? getAQILabel(airQuality.list[0].main.aqi)
            : { label: 'N/A', color: '#64748b' };
        const computedSunPosition = getSunPosition(current.sys.sunrise, current.sys.sunset, current.dt);
        const computedDewPoint = getDewPoint(current.main.temp, current.main.humidity);

        const allTemps = computedDaily.flatMap((d) => [d.main.temp_min, d.main.temp_max]);
        const min = allTemps.length > 0 ? Math.min(...allTemps) : 0;
        const max = allTemps.length > 0 ? Math.max(...allTemps) : 0;

        return {
            hourlyData: computedHourly,
            dailyData: computedDaily,
            aqiInfo: computedAqi,
            sunPosition: computedSunPosition,
            dewPoint: computedDewPoint,
            tempRangeMin: min,
            tempRangeSpan: Math.max(1, max - min),
        };
    }, [weatherData]);

    // === DYNAMIC WEATHER THEME SYSTEM ===
    useEffect(() => {
        if (!weatherData) return;
        const { current } = weatherData;
        const weatherId = current.weather[0]?.id || 800;
        const temp = current.main.temp;
        const isDay = !current.weather[0]?.icon?.includes('n');

        let theme = {
            bg: '#0a0e1a',
            orb1: 'rgba(59, 130, 246, 0.12)',
            orb2: 'rgba(139, 92, 246, 0.1)',
            orb3: 'rgba(6, 182, 212, 0.08)',
        };

        // Thunderstorm (200-232)
        if (weatherId >= 200 && weatherId < 300) {
            theme = {
                bg: '#0b0614',
                orb1: 'rgba(139, 92, 246, 0.18)',
                orb2: 'rgba(168, 85, 247, 0.14)',
                orb3: 'rgba(234, 179, 8, 0.1)',
            };
        }
        // Drizzle / Rain (300-531)
        else if (weatherId >= 300 && weatherId < 600) {
            theme = {
                bg: '#080e1e',
                orb1: 'rgba(30, 64, 175, 0.16)',
                orb2: 'rgba(99, 102, 241, 0.12)',
                orb3: 'rgba(6, 182, 212, 0.1)',
            };
        }
        // Snow (600-622)
        else if (weatherId >= 600 && weatherId < 700) {
            theme = {
                bg: '#0c1220',
                orb1: 'rgba(147, 197, 253, 0.15)',
                orb2: 'rgba(199, 210, 254, 0.12)',
                orb3: 'rgba(224, 231, 255, 0.08)',
            };
        }
        // Fog / Haze / Mist (700-781)
        else if (weatherId >= 700 && weatherId < 800) {
            theme = {
                bg: '#10131c',
                orb1: 'rgba(148, 163, 184, 0.12)',
                orb2: 'rgba(100, 116, 139, 0.1)',
                orb3: 'rgba(203, 213, 225, 0.06)',
            };
        }
        // Clear (800)
        else if (weatherId === 800) {
            if (isDay) {
                theme = {
                    bg: '#060d1f',
                    orb1: 'rgba(14, 165, 233, 0.15)',
                    orb2: 'rgba(234, 179, 8, 0.1)',
                    orb3: 'rgba(59, 130, 246, 0.08)',
                };
            } else {
                theme = {
                    bg: '#050810',
                    orb1: 'rgba(30, 58, 138, 0.15)',
                    orb2: 'rgba(88, 28, 135, 0.1)',
                    orb3: 'rgba(15, 23, 42, 0.12)',
                };
            }
        }
        // Cloudy (801-804)
        else if (weatherId > 800) {
            theme = {
                bg: '#090d18',
                orb1: 'rgba(71, 85, 105, 0.14)',
                orb2: 'rgba(100, 116, 139, 0.1)',
                orb3: 'rgba(59, 130, 246, 0.06)',
            };
        }

        // Temperature overrides for extreme conditions
        const tempC = unit === 'imperial' ? (temp - 32) * 5 / 9 : temp;
        if (tempC > 35) {
            theme.bg = '#140a06';
            theme.orb1 = 'rgba(249, 115, 22, 0.16)';
            theme.orb2 = 'rgba(239, 68, 68, 0.12)';
            theme.orb3 = 'rgba(234, 179, 8, 0.08)';
        } else if (tempC < -5) {
            theme.bg = '#060a14';
            theme.orb1 = 'rgba(147, 197, 253, 0.18)';
            theme.orb2 = 'rgba(199, 210, 254, 0.14)';
            theme.orb3 = 'rgba(224, 231, 255, 0.1)';
        }

        const root = document.documentElement;
        root.style.setProperty('--theme-bg', theme.bg);
        root.style.setProperty('--theme-orb1', theme.orb1);
        root.style.setProperty('--theme-orb2', theme.orb2);
        root.style.setProperty('--theme-orb3', theme.orb3);
    }, [weatherData, unit]);

    // Fetch weather data
    const fetchWeather = useCallback(
        async (city: CityInfo) => {
            const key = `${city.lat},${city.lon},${unit}`;
            if (weatherCacheRef.current[key] || inFlightWeatherRef.current.has(key)) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            inFlightWeatherRef.current.add(key);

            try {
                const res = await fetch(
                    `/api/weather?lat=${city.lat}&lon=${city.lon}&units=${unit}`
                );
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to fetch weather data');
                }

                setWeatherCache((prev) => {
                    if (prev[key]) return prev;
                    const nextCache = { ...prev, [key]: data };
                    weatherCacheRef.current = nextCache;
                    return nextCache;
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                inFlightWeatherRef.current.delete(key);
                setLoading(false);
            }
        },
        [unit]
    );

    useEffect(() => {
        fetchWeather(activeCity);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCity, unit]);

    // Prefetch weather for all cities
    useEffect(() => {
        let cancelled = false;

        const prefetchWeather = async () => {
            const missingCities = cities.filter((city) => {
                const key = `${city.lat},${city.lon},${unit}`;
                return !weatherCacheRef.current[key] && !inFlightWeatherRef.current.has(key);
            });

            if (missingCities.length === 0) return;

            const results = await Promise.all(
                missingCities.map(async (city) => {
                    const key = `${city.lat},${city.lon},${unit}`;
                    inFlightWeatherRef.current.add(key);

                    try {
                        const res = await fetch(`/api/weather?lat=${city.lat}&lon=${city.lon}&units=${unit}`);
                        const data = await res.json();
                        if (!res.ok || !data.current) return null;
                        return { key, data: data as WeatherData };
                    } catch {
                        return null;
                    } finally {
                        inFlightWeatherRef.current.delete(key);
                    }
                })
            );

            if (cancelled) return;

            const validResults = results.filter((entry): entry is { key: string; data: WeatherData } => Boolean(entry));
            if (validResults.length === 0) return;

            setWeatherCache((prev) => {
                let changed = false;
                const next = { ...prev };

                for (const { key, data } of validResults) {
                    if (!next[key]) {
                        next[key] = data;
                        changed = true;
                    }
                }

                if (changed) {
                    weatherCacheRef.current = next;
                    return next;
                }

                return prev;
            });
        };

        prefetchWeather();

        return () => {
            cancelled = true;
        };
    }, [cities, unit]);

    // Search cities
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchAbortRef.current) {
            searchAbortRef.current.abort();
        }

        searchTimeoutRef.current = setTimeout(async () => {
            const controller = new AbortController();
            searchAbortRef.current = controller;

            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
                    signal: controller.signal,
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setSearchResults(data);
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                // silently fail
            } finally {
                if (searchAbortRef.current === controller) {
                    searchAbortRef.current = null;
                }
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            if (searchAbortRef.current) {
                searchAbortRef.current.abort();
            }
        };
    }, [searchQuery]);

    // Close search on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSearch(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addCity = (result: SearchResult) => {
        const exists = cities.find(
            (c) => Math.abs(c.lat - result.lat) < 0.01 && Math.abs(c.lon - result.lon) < 0.01
        );
        if (!exists) {
            const newCity: CityInfo = {
                name: result.name,
                country: result.country,
                state: result.state,
                lat: result.lat,
                lon: result.lon,
            };
            setCities((prev) => [...prev, newCity]);
            setActiveCityIndex(cities.length);
        } else {
            setActiveCityIndex(cities.indexOf(exists));
        }
        setSearchQuery('');
        setShowSearch(false);
        setSearchResults([]);
    };

    const removeCity = (index: number) => {
        if (cities.length <= 1) return;
        setCities((prev) => prev.filter((_, i) => i !== index));
        if (activeCityIndex >= index && activeCityIndex > 0) {
            setActiveCityIndex((prev) => prev - 1);
        }
    };

    // Render loading
    if (loading && !weatherData) {
        return (
            <>
                <div className="weather-bg">
                    <div className="weather-bg-orb3" />
                </div>
                <div className="dashboard-container">
                    <div className="loading-container">
                        <div className="loading-orb">
                            <div className="loading-ring loading-ring-1" />
                            <div className="loading-ring loading-ring-2" />
                            <div className="loading-ring loading-ring-3" />
                            <div className="loading-dot loading-dot-1" />
                            <div className="loading-dot loading-dot-2" />
                            <div className="loading-dot loading-dot-3" />
                            <div className="loading-core" />
                        </div>
                        <div className="loading-text-wrapper">
                            <p className="loading-text">Fetching Weather Data</p>
                            <p className="loading-subtext">Connecting to weather stations worldwide...</p>
                        </div>
                        <div className="loading-progress">
                            <div className="loading-progress-bar" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Render error
    if (error && !weatherData) {
        return (
            <>
                <div className="weather-bg">
                    <div className="weather-bg-orb3" />
                </div>
                <div className="dashboard-container">
                    <div className="error-container">
                        <div className="error-icon">⚠️</div>
                        <h2 className="error-title">Oops! Something went wrong</h2>
                        <p className="error-message">{error}</p>
                        <button className="retry-btn" onClick={() => fetchWeather(activeCity)}>
                            Try Again
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (!weatherData) return null;

    const { current, forecast, airQuality } = weatherData;

    return (
        <>
            <div className="weather-bg">
                <div className="weather-bg-orb3" />
            </div>
            <div className="dashboard-container">
                {/* Header */}
                <header className="dashboard-header glass-card">
                    <div className="logo-section">
                        <div className="logo-icon">
                            <Cloud size={24} color="white" />
                        </div>
                        <div className="logo-text">
                            <h1>SkyPulse</h1>
                            <p className="live-indicator"><span className="live-dot" />Live Weather Intelligence</p>
                        </div>
                    </div>

                    <div className="search-container" ref={searchContainerRef}>
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search any city worldwide..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSearch(true);
                            }}
                            onFocus={() => setShowSearch(true)}
                            id="city-search"
                        />
                        {showSearch && searchResults.length > 0 && (
                            <div className="search-results">
                                {searchResults.map((result, i) => (
                                    <div
                                        key={`${result.lat}-${result.lon}-${i}`}
                                        className="search-result-item"
                                        onClick={() => addCity(result)}
                                    >
                                        <MapPin size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                        <div>
                                            <div className="city-name">{result.name}</div>
                                            <div className="country-name">
                                                {result.state ? `${result.state}, ` : ''}
                                                {result.country}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="header-actions">
                        <div className="unit-toggle">
                            <button
                                className={`unit-btn ${unit === 'metric' ? 'active' : ''}`}
                                onClick={() => setUnit('metric')}
                                id="unit-celsius"
                            >
                                °C
                            </button>
                            <button
                                className={`unit-btn ${unit === 'imperial' ? 'active' : ''}`}
                                onClick={() => setUnit('imperial')}
                                id="unit-fahrenheit"
                            >
                                °F
                            </button>
                        </div>
                    </div>
                </header>



                {/* City Tabs */}
                <div className="city-tabs">
                    {cities.map((city, index) => {
                        const cityKey = `${city.lat},${city.lon},${unit}`;
                        const cityWeather = weatherCache[cityKey];
                        return (
                            <div
                                key={`${city.lat}-${city.lon}`}
                                className={`city-tab ${index === activeCityIndex ? 'active' : ''}`}
                                onClick={() => setActiveCityIndex(index)}
                            >
                                <span>{city.name}</span>
                                {cityWeather && (
                                    <span className="tab-temp">
                                        {formatTempShort(cityWeather.current.main.temp)}
                                    </span>
                                )}
                                {cityWeather && (
                                    <Image
                                        src={getWeatherIconUrl(cityWeather.current.weather[0].icon)}
                                        alt={`${city.name} weather icon`}
                                        width={28}
                                        height={28}
                                        sizes="28px"
                                        loading="lazy"
                                    />
                                )}
                                {cities.length > 1 && (
                                    <button
                                        className="remove-city"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeCity(index);
                                        }}
                                        aria-label={`Remove ${city.name}`}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    <button
                        className="add-city-tab"
                        onClick={() => {
                            const searchInput = document.getElementById('city-search');
                            searchInput?.focus();
                        }}
                    >
                        <Plus size={16} />
                        Add City
                    </button>
                </div>

                {/* Main Dashboard Grid */}
                <div className="dashboard-grid">
                    {/* Current Weather Hero */}
                    <div className="current-weather glass-card">
                        <div className="current-weather-top">
                            <div className="current-location">
                                <h2 id="current-city-name">
                                    {activeCity.name}{activeCity.country ? `, ${activeCity.country}` : ''}
                                </h2>
                                <div className="location-detail">
                                    <MapPin size={14} />
                                    <span>
                                        {activeCity.state ? `${activeCity.state} · ` : ''}
                                        Lat: {current.coord.lat.toFixed(2)}° Lon:{' '}
                                        {current.coord.lon.toFixed(2)}°
                                    </span>
                                </div>
                            </div>
                            <div className="current-datetime">
                                <div className="date">{formatDate(current.dt, current.timezone)}</div>
                                <div>{formatTime(current.dt, current.timezone)}</div>
                            </div>
                        </div>

                        <div className="current-weather-main">
                            <div className="weather-icon-large">
                                <Image
                                    src={getWeatherIconUrl(current.weather[0].icon)}
                                    alt={current.weather[0].description}
                                    width={140}
                                    height={140}
                                    sizes="140px"
                                    priority
                                />
                            </div>
                            <div className="temp-section">
                                <div className="temp-main">
                                    {Math.round(current.main.temp)}
                                    <span className="degree">°{unit === 'metric' ? 'C' : 'F'}</span>
                                </div>
                                <div className="weather-description">
                                    {current.weather[0].description}
                                </div>
                                <div className="feels-like">
                                    Feels like {formatTemp(current.main.feels_like, unit)}
                                </div>
                                <div className="temp-range">
                                    <span className="temp-high">
                                        ↑ {formatTemp(current.main.temp_max, unit)}
                                    </span>
                                    <span className="temp-low">
                                        ↓ {formatTemp(current.main.temp_min, unit)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="weather-stats">
                            <div className="stat-card">
                                <div className="stat-header">
                                    <Droplets size={16} className="stat-icon" style={{ color: '#06b6d4' }} />
                                    <span className="stat-label">Humidity</span>
                                </div>
                                <div className="stat-value">{current.main.humidity}%</div>
                                <div className="stat-detail">Dew point: {dewPoint}°</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-header">
                                    <Wind size={16} className="stat-icon" style={{ color: '#22c55e' }} />
                                    <span className="stat-label">Wind</span>
                                </div>
                                <div className="stat-value">{getWindSpeed(current.wind.speed, unit)}</div>
                                <div className="stat-detail">
                                    <Navigation
                                        size={12}
                                        style={{
                                            display: 'inline',
                                            transform: `rotate(${current.wind.deg}deg)`,
                                            marginRight: 4,
                                        }}
                                    />
                                    {getWindDirection(current.wind.deg)}
                                    {current.wind.gust
                                        ? ` · Gust ${getWindSpeed(current.wind.gust, unit)}`
                                        : ''}
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-header">
                                    <Eye size={16} className="stat-icon" style={{ color: '#8b5cf6' }} />
                                    <span className="stat-label">Visibility</span>
                                </div>
                                <div className="stat-value">{getVisibility(current.visibility, unit)}</div>
                                <div className="stat-detail">
                                    {current.visibility >= 10000 ? 'Excellent' : current.visibility >= 5000 ? 'Good' : 'Poor'}
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-header">
                                    <Gauge size={16} className="stat-icon" style={{ color: '#f97316' }} />
                                    <span className="stat-label">Pressure</span>
                                </div>
                                <div className="stat-value">{current.main.pressure}</div>
                                <div className="stat-detail">hPa · {getPressureTrend(current.main.pressure)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="sidebar">
                        {/* Hourly Forecast */}
                        <div className="hourly-forecast glass-card">
                            <div className="section-title">
                                <Clock size={18} className="icon" />
                                Hourly Forecast
                            </div>
                            <div className="hourly-list">
                                {hourlyData.map((item, i) => (
                                    <div key={i} className="hourly-item">
                                        <span className="hourly-time">
                                            {i === 0
                                                ? 'Now'
                                                : formatTime(item.dt, forecast.city.timezone)}
                                        </span>
                                        <div className="hourly-icon">
                                            <Image
                                                src={getWeatherIconUrl(item.weather[0].icon)}
                                                alt={item.weather[0].description}
                                                width={32}
                                                height={32}
                                                sizes="32px"
                                                loading="lazy"
                                            />
                                        </div>
                                        <span className="hourly-temp">
                                            {formatTempShort(item.main.temp)}
                                        </span>
                                        <span className="hourly-rain">
                                            {item.pop > 0 ? `${Math.round(item.pop * 100)}%` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sun Times */}
                        <div className="sun-times glass-card">
                            <div className="section-title">
                                <Sun size={18} className="icon" style={{ color: '#eab308' }} />
                                Sun & Moon
                            </div>
                            <div className="sun-visual">
                                <svg viewBox="0 0 200 100" className="sun-arc">
                                    <path
                                        d="M 10 90 Q 100 -10 190 90"
                                        className="sun-arc-path"
                                    />
                                    <path
                                        d="M 10 90 Q 100 -10 190 90"
                                        className="sun-arc-progress"
                                        strokeDasharray="280"
                                        strokeDashoffset={280 - (280 * sunPosition) / 100}
                                    />
                                    {/* Sun dot */}
                                    {sunPosition > 0 && sunPosition < 100 && (
                                        <circle
                                            cx={10 + (sunPosition / 100) * 180}
                                            cy={90 - Math.sin((sunPosition / 100) * Math.PI) * 100}
                                            r="6"
                                            className="sun-position"
                                        />
                                    )}
                                </svg>
                            </div>
                            <div className="sun-times-row">
                                <div className="sun-time-item">
                                    <div className="sun-time-label">
                                        <Sunrise size={14} style={{ display: 'inline', marginRight: 4 }} />
                                        Sunrise
                                    </div>
                                    <div className="sun-time-value">
                                        {formatTime(current.sys.sunrise, current.timezone)}
                                    </div>
                                </div>
                                <div className="sun-time-item">
                                    <div className="sun-time-label">
                                        <Sunset size={14} style={{ display: 'inline', marginRight: 4 }} />
                                        Sunset
                                    </div>
                                    <div className="sun-time-value">
                                        {formatTime(current.sys.sunset, current.timezone)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Air Quality */}
                        {airQuality.list && airQuality.list[0] && (
                            <div className="aqi-card glass-card">
                                <div className="section-title">
                                    <Zap size={18} className="icon" style={{ color: aqiInfo.color }} />
                                    Air Quality
                                </div>
                                <div className="aqi-gauge">
                                    <div className="aqi-number" style={{ color: aqiInfo.color }}>
                                        {airQuality.list[0].main.aqi}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="aqi-label" style={{ color: aqiInfo.color }}>
                                            {aqiInfo.label}
                                        </div>
                                        <div className="aqi-bar">
                                            <div
                                                className="aqi-marker"
                                                style={{
                                                    left: `${((airQuality.list[0].main.aqi - 1) / 4) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="aqi-detail" style={{ marginTop: 8 }}>
                                            PM2.5: {airQuality.list[0].components.pm2_5.toFixed(1)} µg/m³
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Charts Section */}
                    <div className="charts-section">
                        <div className="chart-card glass-card">
                            <div className="section-title">
                                <TrendingUp size={18} className="icon" />
                                Temperature Trend
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div
                                        style={{
                                            width: 12,
                                            height: 3,
                                            background: '#3b82f6',
                                            borderRadius: 2,
                                        }}
                                    />
                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Temperature</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div
                                        style={{
                                            width: 12,
                                            height: 3,
                                            background: '#8b5cf6',
                                            borderRadius: 2,
                                            borderTop: '1px dashed #8b5cf6',
                                        }}
                                    />
                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Feels Like</span>
                                </div>
                            </div>
                            <div className="chart-container">
                                <TemperatureChart
                                    data={forecast.list}
                                    timezone={forecast.city.timezone}
                                />
                            </div>
                        </div>

                        <div className="chart-card glass-card">
                            <div className="section-title">
                                <CloudRain size={18} className="icon" style={{ color: '#06b6d4' }} />
                                Precipitation Chance
                            </div>
                            <div className="chart-container">
                                <PrecipitationChart
                                    data={forecast.list}
                                    timezone={forecast.city.timezone}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5-Day Forecast */}
                    <div className="detail-cards-grid">
                        <div className="daily-forecast glass-card" style={{ gridColumn: '1 / -1' }}>
                            <div className="section-title">
                                <Thermometer size={18} className="icon" style={{ color: '#f97316' }} />
                                5-Day Forecast
                            </div>
                            {dailyData.map((day) => {
                                const barLeft =
                                    ((day.main.temp_min - tempRangeMin) / tempRangeSpan) * 100;
                                const barWidth =
                                    ((day.main.temp_max - day.main.temp_min) / tempRangeSpan) * 100;
                                return (
                                    <div key={day.dt} className="daily-item">
                                        <span className="daily-day">{formatDay(day.dt)}</span>
                                        <div className="daily-icon">
                                            <Image
                                                src={getWeatherIconUrl(day.weather[0].icon)}
                                                alt={day.weather[0].description}
                                                width={36}
                                                height={36}
                                                sizes="36px"
                                                loading="lazy"
                                            />
                                        </div>
                                        <span className="daily-desc">{day.weather[0].description}</span>
                                        <div className="temp-bar-container">
                                            <div
                                                className="temp-bar"
                                                style={{
                                                    width: `${barWidth}%`,
                                                    marginLeft: `${barLeft}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="daily-temps">
                                            <span className="low">{formatTempShort(day.main.temp_min)}</span>
                                            <span className="high">{formatTempShort(day.main.temp_max)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Additional Detail Cards */}
                    <div className="detail-cards-grid">
                        {/* Clouds */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div className="section-title">
                                <Cloud size={18} className="icon" style={{ color: '#94a3b8' }} />
                                Cloud Cover
                            </div>
                            <div className="stat-value" style={{ fontSize: 36, marginTop: 12 }}>
                                {current.clouds.all}%
                            </div>
                            <div className="precip-bar" style={{ marginTop: 12 }}>
                                <div
                                    className="precip-fill"
                                    style={{
                                        width: `${current.clouds.all}%`,
                                        background: 'linear-gradient(90deg, #64748b, #94a3b8)',
                                    }}
                                />
                            </div>
                            <div className="stat-detail" style={{ marginTop: 8 }}>
                                {current.clouds.all < 20
                                    ? 'Clear skies'
                                    : current.clouds.all < 50
                                        ? 'Partly cloudy'
                                        : current.clouds.all < 80
                                            ? 'Mostly cloudy'
                                            : 'Overcast'}
                            </div>
                        </div>

                        {/* Precipitation */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div className="section-title">
                                <Droplets size={18} className="icon" style={{ color: '#06b6d4' }} />
                                Precipitation
                            </div>
                            <div className="stat-value" style={{ fontSize: 36, marginTop: 12 }}>
                                {current.rain
                                    ? `${current.rain['1h'] || current.rain['3h'] || 0} mm`
                                    : current.snow
                                        ? `${current.snow['1h'] || current.snow['3h'] || 0} mm`
                                        : '0 mm'}
                            </div>
                            <div className="stat-detail" style={{ marginTop: 8 }}>
                                {hourlyData[0] && hourlyData[0].pop > 0
                                    ? `${Math.round(hourlyData[0].pop * 100)}% chance in next 3h`
                                    : 'No precipitation expected'}
                            </div>
                            <div className="precip-bar" style={{ marginTop: 8 }}>
                                <div
                                    className="precip-fill"
                                    style={{
                                        width: `${hourlyData[0] ? hourlyData[0].pop * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Ground Level */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div className="section-title">
                                <Gauge size={18} className="icon" style={{ color: '#eab308' }} />
                                Atmospheric Details
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Sea Level</span>
                                    <span style={MONO_VALUE_STYLE}>
                                        {current.main.sea_level || current.main.pressure} hPa
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Ground Level</span>
                                    <span style={MONO_VALUE_STYLE}>
                                        {current.main.grnd_level || '—'} hPa
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Dew Point</span>
                                    <span style={MONO_VALUE_STYLE}>
                                        {formatTemp(dewPoint, unit)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Cloudiness</span>
                                    <span style={MONO_VALUE_STYLE}>
                                        {current.clouds.all}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="dashboard-footer">
                        <div className="footer-brand">SkyPulse</div>
                        <p>Real-time weather intelligence for the modern world</p>
                        <p style={{ marginTop: 8 }}>
                            Powered by{' '}
                            <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">
                                Open-Meteo
                            </a>
                            {' · Free & Open Source · Built with Next.js & Recharts'}
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}
