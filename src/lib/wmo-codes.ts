// WMO Weather Interpretation Codes mapped to descriptions and OpenWeatherMap-compatible icons
// Reference: https://open-meteo.com/en/docs

interface WMOMapping {
    description: string;
    iconDay: string;
    iconNight: string;
    main: string;
}

const WMO_CODES: Record<number, WMOMapping> = {
    0: { description: 'Clear sky', iconDay: '01d', iconNight: '01n', main: 'Clear' },
    1: { description: 'Mainly clear', iconDay: '01d', iconNight: '01n', main: 'Clear' },
    2: { description: 'Partly cloudy', iconDay: '02d', iconNight: '02n', main: 'Clouds' },
    3: { description: 'Overcast', iconDay: '04d', iconNight: '04n', main: 'Clouds' },
    45: { description: 'Fog', iconDay: '50d', iconNight: '50n', main: 'Fog' },
    48: { description: 'Depositing rime fog', iconDay: '50d', iconNight: '50n', main: 'Fog' },
    51: { description: 'Light drizzle', iconDay: '09d', iconNight: '09n', main: 'Drizzle' },
    53: { description: 'Moderate drizzle', iconDay: '09d', iconNight: '09n', main: 'Drizzle' },
    55: { description: 'Dense drizzle', iconDay: '09d', iconNight: '09n', main: 'Drizzle' },
    56: { description: 'Light freezing drizzle', iconDay: '09d', iconNight: '09n', main: 'Drizzle' },
    57: { description: 'Dense freezing drizzle', iconDay: '09d', iconNight: '09n', main: 'Drizzle' },
    61: { description: 'Slight rain', iconDay: '10d', iconNight: '10n', main: 'Rain' },
    63: { description: 'Moderate rain', iconDay: '10d', iconNight: '10n', main: 'Rain' },
    65: { description: 'Heavy rain', iconDay: '10d', iconNight: '10n', main: 'Rain' },
    66: { description: 'Light freezing rain', iconDay: '13d', iconNight: '13n', main: 'Rain' },
    67: { description: 'Heavy freezing rain', iconDay: '13d', iconNight: '13n', main: 'Rain' },
    71: { description: 'Slight snow fall', iconDay: '13d', iconNight: '13n', main: 'Snow' },
    73: { description: 'Moderate snow fall', iconDay: '13d', iconNight: '13n', main: 'Snow' },
    75: { description: 'Heavy snow fall', iconDay: '13d', iconNight: '13n', main: 'Snow' },
    77: { description: 'Snow grains', iconDay: '13d', iconNight: '13n', main: 'Snow' },
    80: { description: 'Slight rain showers', iconDay: '09d', iconNight: '09n', main: 'Rain' },
    81: { description: 'Moderate rain showers', iconDay: '09d', iconNight: '09n', main: 'Rain' },
    82: { description: 'Violent rain showers', iconDay: '09d', iconNight: '09n', main: 'Rain' },
    85: { description: 'Slight snow showers', iconDay: '13d', iconNight: '13n', main: 'Snow' },
    86: { description: 'Heavy snow showers', iconDay: '13d', iconNight: '13n', main: 'Snow' },
    95: { description: 'Thunderstorm', iconDay: '11d', iconNight: '11n', main: 'Thunderstorm' },
    96: { description: 'Thunderstorm with slight hail', iconDay: '11d', iconNight: '11n', main: 'Thunderstorm' },
    99: { description: 'Thunderstorm with heavy hail', iconDay: '11d', iconNight: '11n', main: 'Thunderstorm' },
};

export function getWMODescription(code: number): string {
    return WMO_CODES[code]?.description || 'Unknown';
}

export function getWMOIcon(code: number, isDay: boolean = true): string {
    const mapping = WMO_CODES[code];
    if (!mapping) return isDay ? '01d' : '01n';
    return isDay ? mapping.iconDay : mapping.iconNight;
}

export function getWMOMain(code: number): string {
    return WMO_CODES[code]?.main || 'Unknown';
}

export function getWMOWeatherId(code: number): number {
    // Map WMO codes to approximate OpenWeatherMap weather IDs for compatibility
    if (code <= 1) return 800; // Clear
    if (code === 2) return 802; // Few clouds
    if (code === 3) return 804; // Overcast
    if (code <= 48) return 741; // Fog
    if (code <= 57) return 300; // Drizzle
    if (code <= 67) return 500; // Rain
    if (code <= 77) return 600; // Snow
    if (code <= 82) return 520; // Showers
    if (code <= 86) return 620; // Snow showers
    if (code <= 99) return 200; // Thunderstorm
    return 800;
}
