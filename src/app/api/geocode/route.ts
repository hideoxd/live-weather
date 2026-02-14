import { NextRequest, NextResponse } from 'next/server';

const GEOCODE_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
};
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

// Simple city name lookup for known coordinates
const KNOWN_CITIES: Record<string, { name: string; country: string }> = {
    '51.51,-0.13': { name: 'London', country: 'GB' },
    '40.71,-74.01': { name: 'New York', country: 'US' },
    '35.68,139.65': { name: 'Tokyo', country: 'JP' },
    '19.08,72.88': { name: 'Mumbai', country: 'IN' },
    '25.20,55.27': { name: 'Dubai', country: 'AE' },
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
        return NextResponse.json(
            { error: 'Please provide lat and lon' },
            { status: 400, headers: NO_STORE_HEADERS }
        );
    }

    // Check known cities first
    const key = `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`;
    if (KNOWN_CITIES[key]) {
        return NextResponse.json(KNOWN_CITIES[key], { headers: GEOCODE_CACHE_HEADERS });
    }

    try {
        // Use Open-Meteo geocoding with reverse search
        // Open-Meteo doesn't have reverse geocoding, so we use a free alternative
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
            {
                headers: {
                    'User-Agent': 'SkyPulse Weather Dashboard/1.0',
                },
                next: { revalidate: 86400 },
            }
        );

        if (!res.ok) {
            return NextResponse.json({ name: 'Unknown', country: '' }, { headers: NO_STORE_HEADERS });
        }

        const data = await res.json();

        return NextResponse.json({
            name: data.address?.city || data.address?.town || data.address?.village || data.name || 'Unknown',
            country: data.address?.country_code?.toUpperCase() || '',
        }, { headers: GEOCODE_CACHE_HEADERS });
    } catch {
        return NextResponse.json({ name: 'Unknown', country: '' }, { headers: NO_STORE_HEADERS });
    }
}
