import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log('📥 Data API Request:', { action });

    // Validate configuration
    if (!config.api.dataUrl) {
      return NextResponse.json({ 
        error: 'AWS Data URL not configured. Please check your environment variables.' 
      }, { status: 500 });
    }

    if (!config.api.apiKey) {
      return NextResponse.json({ 
        error: 'AWS API Key not configured. Please check your environment variables.' 
      }, { status: 500 });
    }

    const response = await fetch(config.api.dataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.api.apiKey,
      },
      body: JSON.stringify({ action, data }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AWS Data API Error:', errorText);
      return NextResponse.json({ 
        error: 'AWS Data API call failed',
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Data API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}