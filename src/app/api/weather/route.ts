import { NextRequest, NextResponse } from 'next/server';
import { getWMODescription, getWMOIcon, getWMOMain, getWMOWeatherId } from '@/lib/wmo-codes';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const WEATHER_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
};
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const units = searchParams.get('units') || 'metric';

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Please provide coordinates (lat & lon)' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);

  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return NextResponse.json(
      { error: 'Invalid coordinates provided' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const isImperial = units === 'imperial';
  const tempUnit = isImperial ? 'fahrenheit' : 'celsius';
  const windUnit = isImperial ? 'mph' : 'kmh';

  try {
    // Fetch weather + air quality in parallel from Open-Meteo (no API key needed!)
    const [weatherRes, aqRes] = await Promise.all([
      fetch(
        `${OPEN_METEO_URL}?` +
        `latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
        `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
        `&temperature_unit=${tempUnit}` +
        `&wind_speed_unit=${windUnit}` +
        `&precipitation_unit=mm` +
        `&timezone=auto` +
        `&forecast_days=6`,
        { next: { revalidate: 600 } }
      ),
      fetch(
        `${AIR_QUALITY_URL}?` +
        `latitude=${lat}&longitude=${lon}` +
        `&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,ammonia`,
        { next: { revalidate: 600 } }
      ),
    ]);

    if (!weatherRes.ok) {
      const errText = await weatherRes.text();
      console.error('Open-Meteo weather error:', errText);
      return NextResponse.json(
        { error: 'Failed to fetch weather data from Open-Meteo' },
        { status: weatherRes.status, headers: NO_STORE_HEADERS }
      );
    }

    const weatherData = await weatherRes.json();
    const aqData = aqRes.ok ? await aqRes.json() : null;

    // Transform Open-Meteo data into our internal format (compatible with frontend)
    const transformed = transformWeatherData(weatherData, aqData, latNum, lonNum, isImperial);

    return NextResponse.json(transformed, { headers: WEATHER_CACHE_HEADERS });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

interface OpenMeteoWeather {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    cloud_cover: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    visibility: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
}

interface OpenMeteoAQ {
  current: {
    time: string;
    european_aqi: number;
    us_aqi: number;
    pm10: number;
    pm2_5: number;
    carbon_monoxide: number;
    nitrogen_dioxide: number;
    sulphur_dioxide: number;
    ozone: number;
    ammonia: number;
  };
}

function transformWeatherData(
  weather: OpenMeteoWeather,
  aq: OpenMeteoAQ | null,
  lat: number,
  lon: number,
  isImperial: boolean
) {
  const now = Math.floor(new Date(weather.current.time).getTime() / 1000);
  const isDay = weather.current.is_day === 1;
  const sunriseToday = Math.floor(new Date(weather.daily.sunrise[0]).getTime() / 1000);
  const sunsetToday = Math.floor(new Date(weather.daily.sunset[0]).getTime() / 1000);

  // Build current weather
  const current = {
    coord: { lon, lat },
    weather: [
      {
        id: getWMOWeatherId(weather.current.weather_code),
        main: getWMOMain(weather.current.weather_code),
        description: getWMODescription(weather.current.weather_code).toLowerCase(),
        icon: getWMOIcon(weather.current.weather_code, isDay),
      },
    ],
    base: 'open-meteo',
    main: {
      temp: weather.current.temperature_2m,
      feels_like: weather.current.apparent_temperature,
      temp_min: weather.daily.temperature_2m_min[0],
      temp_max: weather.daily.temperature_2m_max[0],
      pressure: Math.round(weather.current.pressure_msl),
      humidity: weather.current.relative_humidity_2m,
      sea_level: Math.round(weather.current.pressure_msl),
      grnd_level: Math.round(weather.current.surface_pressure),
    },
    visibility: getVisibilityFromHourly(weather),
    wind: {
      speed: isImperial
        ? weather.current.wind_speed_10m
        : weather.current.wind_speed_10m / 3.6, // Convert km/h to m/s for metric
      deg: weather.current.wind_direction_10m,
      gust: isImperial
        ? weather.current.wind_gusts_10m
        : weather.current.wind_gusts_10m / 3.6,
    },
    clouds: { all: weather.current.cloud_cover },
    rain: weather.current.rain > 0 ? { '1h': weather.current.rain } : undefined,
    snow: weather.current.snowfall > 0 ? { '1h': weather.current.snowfall } : undefined,
    dt: now,
    sys: {
      type: 2,
      id: 0,
      country: '', // Will be filled by geocoding if needed
      sunrise: sunriseToday,
      sunset: sunsetToday,
    },
    timezone: weather.utc_offset_seconds,
    id: 0,
    name: '', // Will be filled by the frontend or geocoding
    cod: 200,
  };

  // Build hourly forecast (next 48 hours, in 3-hour intervals to match expected format)
  const forecastList = [];
  const currentHourIndex = getCurrentHourIndex(weather.hourly.time);

  for (let i = currentHourIndex; i < Math.min(weather.hourly.time.length, currentHourIndex + 48); i += 3) {
    const dt = Math.floor(new Date(weather.hourly.time[i]).getTime() / 1000);
    const hourIsDay = weather.hourly.is_day[i] === 1;

    forecastList.push({
      dt,
      main: {
        temp: weather.hourly.temperature_2m[i],
        feels_like: weather.hourly.apparent_temperature[i],
        temp_min: weather.hourly.temperature_2m[i] - 1,
        temp_max: weather.hourly.temperature_2m[i] + 1,
        pressure: Math.round(weather.current.pressure_msl),
        humidity: weather.hourly.relative_humidity_2m[i],
      },
      weather: [
        {
          id: getWMOWeatherId(weather.hourly.weather_code[i]),
          main: getWMOMain(weather.hourly.weather_code[i]),
          description: getWMODescription(weather.hourly.weather_code[i]).toLowerCase(),
          icon: getWMOIcon(weather.hourly.weather_code[i], hourIsDay),
        },
      ],
      clouds: { all: weather.hourly.cloud_cover[i] },
      wind: {
        speed: isImperial
          ? weather.hourly.wind_speed_10m[i]
          : weather.hourly.wind_speed_10m[i] / 3.6,
        deg: weather.hourly.wind_direction_10m[i],
      },
      visibility: weather.hourly.visibility[i] || 10000,
      pop: (weather.hourly.precipitation_probability[i] || 0) / 100,
      rain: weather.hourly.precipitation[i] > 0 ? { '3h': weather.hourly.precipitation[i] } : undefined,
      dt_txt: weather.hourly.time[i].replace('T', ' ') + ':00',
    });
  }

  // Also add 1-hour interval items for the first 8 hours (for hourly forecast sidebar)
  const hourlyDetailed = [];
  for (let i = currentHourIndex; i < Math.min(weather.hourly.time.length, currentHourIndex + 9); i++) {
    const dt = Math.floor(new Date(weather.hourly.time[i]).getTime() / 1000);
    const hourIsDay = weather.hourly.is_day[i] === 1;

    hourlyDetailed.push({
      dt,
      main: {
        temp: weather.hourly.temperature_2m[i],
        feels_like: weather.hourly.apparent_temperature[i],
        temp_min: weather.hourly.temperature_2m[i] - 1,
        temp_max: weather.hourly.temperature_2m[i] + 1,
        pressure: Math.round(weather.current.pressure_msl),
        humidity: weather.hourly.relative_humidity_2m[i],
      },
      weather: [
        {
          id: getWMOWeatherId(weather.hourly.weather_code[i]),
          main: getWMOMain(weather.hourly.weather_code[i]),
          description: getWMODescription(weather.hourly.weather_code[i]).toLowerCase(),
          icon: getWMOIcon(weather.hourly.weather_code[i], hourIsDay),
        },
      ],
      clouds: { all: weather.hourly.cloud_cover[i] },
      wind: {
        speed: isImperial
          ? weather.hourly.wind_speed_10m[i]
          : weather.hourly.wind_speed_10m[i] / 3.6,
        deg: weather.hourly.wind_direction_10m[i],
      },
      visibility: weather.hourly.visibility[i] || 10000,
      pop: (weather.hourly.precipitation_probability[i] || 0) / 100,
      rain: weather.hourly.precipitation[i] > 0 ? { '3h': weather.hourly.precipitation[i] } : undefined,
      dt_txt: weather.hourly.time[i].replace('T', ' ') + ':00',
    });
  }

  // Build forecast object
  const forecast = {
    cod: '200',
    message: 0,
    cnt: forecastList.length,
    list: forecastList,
    city: {
      id: 0,
      name: '',
      coord: { lat, lon },
      country: '',
      population: 0,
      timezone: weather.utc_offset_seconds,
      sunrise: sunriseToday,
      sunset: sunsetToday,
    },
  };

  // Build air quality
  const aqiValue = aq ? mapEuropeanAQI(aq.current.european_aqi) : 1;
  const airQuality = {
    coord: { lon, lat },
    list: [
      {
        main: { aqi: aqiValue },
        components: {
          co: aq?.current.carbon_monoxide || 0,
          no: 0,
          no2: aq?.current.nitrogen_dioxide || 0,
          o3: aq?.current.ozone || 0,
          so2: aq?.current.sulphur_dioxide || 0,
          pm2_5: aq?.current.pm2_5 || 0,
          pm10: aq?.current.pm10 || 0,
          nh3: aq?.current.ammonia || 0,
        },
        dt: now,
      },
    ],
  };

  return {
    current,
    forecast,
    airQuality,
    hourlyDetailed, // Extra: 1-hour interval data for sidebar
  };
}

function getCurrentHourIndex(times: string[]): number {
  const now = new Date();
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]) >= now) {
      return Math.max(0, i - 1);
    }
  }
  return 0;
}

function getVisibilityFromHourly(weather: OpenMeteoWeather): number {
  const idx = getCurrentHourIndex(weather.hourly.time);
  return weather.hourly.visibility[idx] || 10000;
}

function mapEuropeanAQI(eaqi: number): number {
  // European AQI ranges: 0-20 Good, 20-40 Fair, 40-60 Moderate, 60-80 Poor, 80-100+ Very Poor
  // Map to 1-5 scale
  if (eaqi <= 20) return 1;
  if (eaqi <= 40) return 2;
  if (eaqi <= 60) return 3;
  if (eaqi <= 80) return 4;
  return 5;
}
