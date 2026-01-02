import { NextRequest, NextResponse } from 'next/server';

const AWS_DATA_URL = process.env.NEXT_PUBLIC_DATA_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log('📥 Data API Request:', { action });

    // Always use AWS - no local fallback
    if (!AWS_DATA_URL) {
      return NextResponse.json({ 
        error: 'AWS Data URL not configured. Please check your environment variables.' 
      }, { status: 500 });
    }

    const response = await fetch(AWS_DATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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