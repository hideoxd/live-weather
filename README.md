<![CDATA[<div align="center">

# ☁️ SkyPulse

### Real-time Weather Intelligence Dashboard

A stunning, premium weather dashboard built with **Next.js**, featuring live weather data, interactive charts, dynamic theming, and a glassmorphic UI — powered entirely by free, open-source APIs.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Open-Meteo](https://img.shields.io/badge/Open--Meteo-Free%20API-FF6B35?style=for-the-badge)](https://open-meteo.com/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

---

**No API key required** · **Completely free** · **Open source data**

</div>

---

## ✨ Features

### 🌡️ Current Conditions
- Real-time temperature, humidity, wind speed & direction, visibility, pressure
- Feels-like temperature, dew point calculation
- High/low temperature range for the day

### 📊 Interactive Charts
- **Temperature Trend** — Area chart with gradient fills showing actual vs. feels-like temperature
- **Precipitation Forecast** — Color-coded bar chart showing rain probability over the next 36 hours

### 🕐 Forecasts
- **Hourly Forecast** — Next 9 hours with 1-hour precision (temperature, icons, rain chance)
- **5-Day Forecast** — Daily temperature range bars with weather conditions

### 🌍 Multi-City Support
- Track weather for multiple cities simultaneously
- City search with real-time autocomplete (worldwide coverage)
- Quick-switch between saved cities via tabs
- Add/remove cities on the fly

### 🎨 Dynamic Weather Theming
The entire UI theme **adapts to weather conditions** — background colors and ambient orbs change based on:

| Condition | Theme |
|-----------|-------|
| ☀️ Clear (Day) | Deep navy + sky blue & golden orbs |
| 🌙 Clear (Night) | Near-black + deep blue & purple orbs |
| ☁️ Cloudy | Dark gray-blue + muted slate orbs |
| 🌧️ Rain | Dark blue + indigo & cyan orbs |
| ❄️ Snow | Dark navy + icy blue & lavender orbs |
| ⛈️ Thunderstorm | Deep purple-black + violet & electric orbs |
| 🌫️ Fog/Haze | Muted dark + gray slate orbs |
| 🔥 Hot (>35°C) | Warm brown-black + orange & red orbs |
| 🧊 Cold (<-5°C) | Arctic dark + icy white & blue orbs |

### 🏗️ Additional Features
- **Air Quality Index** — Real-time AQI with color-coded gauge (PM2.5, PM10, O₃, NO₂, etc.)
- **Sun Arc** — Visual sunrise/sunset tracker showing current sun position
- **Unit Toggle** — Switch between °C/°F (metric/imperial) instantly
- **Responsive** — Fully optimized for desktop, tablet, and mobile
- **Premium Loading** — Orbital animation with glowing core, spinning rings, and progress bar
- **Glassmorphism UI** — Frosted glass cards with subtle borders and depth

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | Vanilla CSS + [Tailwind CSS](https://tailwindcss.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Fonts** | [Inter](https://fonts.google.com/specimen/Inter) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) |
| **Weather API** | [Open-Meteo](https://open-meteo.com/) (free, no key) |
| **Geocoding** | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) |
| **Air Quality** | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) |
| **Reverse Geocoding** | [OpenStreetMap Nominatim](https://nominatim.org/) |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ installed
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/skypulse.git
cd skypulse

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**That's it!** No API keys required. The app uses Open-Meteo's free API out of the box.

### Production Build

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── weather/route.ts      # Weather data API (Open-Meteo → internal format)
│   │   ├── search/route.ts       # City search API (Open-Meteo geocoding)
│   │   └── geocode/route.ts      # Reverse geocoding (Nominatim)
│   ├── globals.css               # Complete design system (1600+ lines)
│   ├── layout.tsx                # Root layout + SEO metadata
│   └── page.tsx                  # Entry point
├── components/
│   ├── WeatherDashboard.tsx      # Main dashboard component (900+ lines)
│   └── charts/
│       ├── TemperatureChart.tsx   # Temperature area chart
│       └── PrecipitationChart.tsx # Precipitation bar chart
├── lib/
│   ├── weather-utils.ts          # Formatting & data utilities
│   └── wmo-codes.ts              # WMO weather code → description mapper
└── types/
    └── weather.ts                # TypeScript interfaces
```

---

## 🏗️ Architecture

### Data Flow

```
Open-Meteo API  ─→  /api/weather (transform)  ─→  WeatherDashboard
                                                        ├── Current conditions
                                                        ├── Hourly forecast
                                                        ├── Daily forecast
                                                        ├── Temperature chart
                                                        ├── Precipitation chart
                                                        ├── AQI gauge
                                                        └── Sun arc
```

### API Transformation Layer

The `/api/weather` route fetches from Open-Meteo and transforms the response into an internal format. This decouples the frontend from the API provider — if you ever want to switch APIs, you only change the route handler.

Key transformations:
- **WMO Weather Codes** → Human-readable descriptions + icons
- **Hourly data** → Two formats: 1-hour intervals (sidebar) + 3-hour intervals (charts)
- **Daily data** → Extracted from hourly aggregates
- **European AQI** → 1-5 scale compatible with frontend

### Dynamic Theming

The `WeatherDashboard` component includes a `useEffect` that reads the current weather condition and temperature, then sets CSS custom properties on `document.documentElement`:

```typescript
// Theme changes smoothly via CSS transitions (1.5s ease)
root.style.setProperty('--theme-bg', theme.bg);
root.style.setProperty('--theme-orb1', theme.orb1);
root.style.setProperty('--theme-orb2', theme.orb2);
root.style.setProperty('--theme-orb3', theme.orb3);
```

---

## 🎨 Design System

### Colors
- **Background**: Deep navy (`#0a0e1a`) with dynamic weather-based shifts
- **Cards**: Glassmorphic with 20px blur and subtle borders
- **Accents**: Blue (`#3b82f6`), Cyan (`#06b6d4`), Purple (`#8b5cf6`), Orange (`#f97316`), Green (`#22c55e`)

### Typography
- **Headings & Body**: Inter (300-900 weights)
- **Numbers & Data**: JetBrains Mono (monospace)

### Animations
- Floating ambient orbs (20-30s cycles)
- `fadeInUp` entrance animations with staggered delays
- Smooth theme transitions (1.5s CSS transitions)
- Orbital loading animation with 3 rings + 3 dots + pulsing core
- Hover micro-interactions on all interactive elements

---

## 📝 API Reference

### `GET /api/weather`

Fetch weather data for a location.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | ✅ | Latitude |
| `lon` | number | ✅ | Longitude |
| `units` | string | ❌ | `metric` (default) or `imperial` |

**Response**: `{ current, forecast, airQuality, hourlyDetailed }`

### `GET /api/search`

Search for cities by name.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | ✅ | City name (min 2 chars) |

**Response**: Array of `{ name, country, state, lat, lon }`

### `GET /api/geocode`

Reverse geocode coordinates to city name.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | ✅ | Latitude |
| `lon` | number | ✅ | Longitude |

**Response**: `{ name, country }`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Open-Meteo](https://open-meteo.com/) — Free weather API (no key required!)
- [OpenStreetMap / Nominatim](https://nominatim.org/) — Reverse geocoding
- [Recharts](https://recharts.org/) — React charting library
- [Lucide](https://lucide.dev/) — Beautiful icon set
- [Google Fonts](https://fonts.google.com/) — Inter & JetBrains Mono

---

<div align="center">

**Built with ❤️ using Next.js & Open-Meteo**

[⬆ Back to Top](#️-skypulse)

</div>
]]>
