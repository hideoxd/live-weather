export interface WeatherData {
    current: CurrentWeather;
    forecast: ForecastData;
    airQuality: AirQualityData;
    hourlyDetailed?: ForecastItem[];
}

export interface CurrentWeather {
    coord: { lon: number; lat: number };
    weather: WeatherCondition[];
    base: string;
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
        sea_level?: number;
        grnd_level?: number;
    };
    visibility: number;
    wind: {
        speed: number;
        deg: number;
        gust?: number;
    };
    clouds: { all: number };
    rain?: { '1h'?: number; '3h'?: number };
    snow?: { '1h'?: number; '3h'?: number };
    dt: number;
    sys: {
        type?: number;
        id?: number;
        country: string;
        sunrise: number;
        sunset: number;
    };
    timezone: number;
    id: number;
    name: string;
    cod: number;
}

export interface WeatherCondition {
    id: number;
    main: string;
    description: string;
    icon: string;
}

export interface ForecastData {
    cod: string;
    message: number;
    cnt: number;
    list: ForecastItem[];
    city: {
        id: number;
        name: string;
        coord: { lat: number; lon: number };
        country: string;
        population: number;
        timezone: number;
        sunrise: number;
        sunset: number;
    };
}

export interface ForecastItem {
    dt: number;
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
    };
    weather: WeatherCondition[];
    clouds: { all: number };
    wind: { speed: number; deg: number; gust?: number };
    visibility: number;
    pop: number;
    rain?: { '3h': number };
    snow?: { '3h': number };
    dt_txt: string;
}

export interface AirQualityData {
    coord: { lon: number; lat: number };
    list: AirQualityItem[];
}

export interface AirQualityItem {
    main: { aqi: number };
    components: {
        co: number;
        no: number;
        no2: number;
        o3: number;
        so2: number;
        pm2_5: number;
        pm10: number;
        nh3: number;
    };
    dt: number;
}

export interface CityInfo {
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
}

export interface SearchResult {
    name: string;
    country: string;
    state: string;
    lat: number;
    lon: number;
}

export type TemperatureUnit = 'metric' | 'imperial';
