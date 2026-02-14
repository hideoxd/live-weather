import { NextRequest, NextResponse } from 'next/server';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const SEARCH_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
};
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json([], { headers: NO_STORE_HEADERS });
    }

    try {
        const res = await fetch(
            `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
            { next: { revalidate: 1800 } }
        );

        if (!res.ok) {
            return NextResponse.json([], { headers: NO_STORE_HEADERS });
        }

        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            return NextResponse.json([], { headers: SEARCH_CACHE_HEADERS });
        }

        const results = data.results.map(
            (item: {
                name: string;
                country_code: string;
                country: string;
                admin1?: string;
                latitude: number;
                longitude: number;
            }) => ({
                name: item.name,
                country: item.country_code?.toUpperCase() || '',
                countryName: item.country || '',
                state: item.admin1 || '',
                lat: item.latitude,
                lon: item.longitude,
            })
        );

        return NextResponse.json(results, { headers: SEARCH_CACHE_HEADERS });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Failed to search cities' },
            { status: 500, headers: NO_STORE_HEADERS }
        );
    }
}
