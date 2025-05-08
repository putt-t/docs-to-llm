import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const cleanOutput = searchParams.get('clean_output') === 'true';

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {

        const backendApiUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/crawl-single-url?url=${encodeURIComponent(url)}&clean_output=${cleanOutput}`;
        const response = await fetch(backendApiUrl);

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.message || 'Failed to crawl URL' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error crawling URL:', error);
        return NextResponse.json({ error: 'Failed to crawl URL' }, { status: 500 });
    }
} 