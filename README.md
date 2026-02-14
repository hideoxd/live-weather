# ☁️ SkyPulse — Weather Dashboard

A modern, real-time weather dashboard with dynamic theming, interactive charts, and a glassmorphic UI. Built with Next.js & TypeScript.

**No API keys needed.** Powered by [Open-Meteo](https://open-meteo.com/) — 100% free and open source.

![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22b5bf?logo=data:image/svg+xml;base64,&logoColor=white)
![License](https://img.shields.io/badge/MIT-green)

---

## Features

- **Live weather data** — temperature, humidity, wind, visibility, pressure, dew point
- **Hourly & 5-day forecasts** with weather icons and rain probability
- **Interactive charts** — temperature trends (area) and precipitation (bar)
- **Air Quality Index** with color-coded gauge and pollutant breakdown
- **Multi-city tracking** — add/remove cities, quick-switch via tabs
- **City search** with real-time autocomplete (worldwide)
- **Dynamic theming** — background adapts to weather (clear, rain, snow, storm, fog, hot, cold)
- **Unit toggle** — °C / °F with instant conversion
- **Sun tracker** — visual sunrise/sunset arc with current position
- **Responsive** — works on desktop, tablet, and mobile
- **Glassmorphic UI** — frosted glass cards, smooth animations, premium feel

---

## Quick Start

```bash
git clone https://github.com/yourusername/skypulse.git
cd skypulse
npm install
npm run dev
```

Open **http://localhost:3000** — that's it. No `.env` setup required.

---

## Tech Stack

| | Technology | Purpose |
|---|---|---|
| ⚡ | **Next.js 16** | Framework (App Router) |
| 🔷 | **TypeScript** | Type safety |
| 🎨 | **Vanilla CSS** | Styling + design system |
| 📊 | **Recharts** | Charts & data visualization |
| 🔣 | **Lucide React** | Icons |
| 🌤️ | **Open-Meteo** | Weather, geocoding, air quality |
| 🗺️ | **Nominatim** | Reverse geocoding |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── weather/route.ts     # Fetches & transforms Open-Meteo data
│   │   ├── search/route.ts      # City search (geocoding)
│   │   └── geocode/route.ts     # Reverse geocoding
│   ├── globals.css              # Full design system
│   ├── layout.tsx               # Root layout + meta
│   └── page.tsx                 # Entry point
├── components/
│   ├── WeatherDashboard.tsx     # Main dashboard (~900 lines)
│   └── charts/
│       ├── TemperatureChart.tsx  # Area chart
│       └── PrecipitationChart.tsx # Bar chart
├── lib/
│   ├── weather-utils.ts         # Formatters & helpers
│   └── wmo-codes.ts             # WMO code → description/icon map
└── types/
    └── weather.ts               # TypeScript interfaces
```

---

## Dynamic Theming

The UI theme shifts automatically based on the active city's weather:

| Weather | Background |
|---------|------------|
| ☀️ Clear (day) | Navy + sky blue & gold orbs |
| 🌙 Clear (night) | Near-black + deep blue & purple |
| ☁️ Cloudy | Gray-blue + muted slate |
| 🌧️ Rain | Dark blue + indigo & cyan |
| ❄️ Snow | Navy + icy blue & lavender |
| ⛈️ Thunderstorm | Deep purple + violet & electric |
| �️ Fog | Muted dark + gray |
| 🔥 Hot (>35°C) | Warm dark + orange & red |
| 🧊 Cold (<-5°C) | Arctic blue + icy white |

All transitions are smooth (1.5s CSS ease).

---

## API Routes

### `GET /api/weather`
Returns current weather, forecast, air quality, and hourly data.

```
/api/weather?lat=51.5074&lon=-0.1278&units=metric
```

### `GET /api/search`
City autocomplete search.

```
/api/search?q=London
```

### `GET /api/geocode`
Reverse geocode coordinates to a city name.

```
/api/geocode?lat=51.5074&lon=-0.1278
```

---

## How It Works

```
User selects city
       ↓
/api/weather fetches from Open-Meteo (weather + air quality + hourly)
       ↓
Server transforms response → internal format (WMO codes → descriptions/icons)
       ↓
WeatherDashboard renders data + applies weather-based theme via CSS variables
```

The transformation layer means the frontend never touches the raw API. If you swap Open-Meteo for another provider, only the route handler changes.

---

## License

MIT

---

## Credits

- [Open-Meteo](https://open-meteo.com/) — Weather data (free, no key)
- [OpenStreetMap Nominatim](https://nominatim.org/) — Reverse geocoding
- [Recharts](https://recharts.org/) — Charts
- [Lucide](https://lucide.dev/) — Icons
