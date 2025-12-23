import { NextRequest, NextResponse } from 'next/server';

const AWS_DATA_URL = process.env.NEXT_PUBLIC_DATA_URL || '';
const USE_AWS = process.env.NEXT_PUBLIC_USE_AWS === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // If AWS is configured, proxy to AWS Lambda
    if (USE_AWS) {
      const response = await fetch(AWS_DATA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();
      return NextResponse.json(result);
    }

    // Otherwise, use local implementation for development
    switch (action) {
      case 'submit':
        return NextResponse.json(await submitRequest(data));
      case 'get':
        return NextResponse.json(await getRequest(data));
      case 'list':
        return NextResponse.json(await listRequests(data));
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Data API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function submitRequest(data: any) {
  // For local development, simulate saving to database
  const requestId = `REQ-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  const request = {
    id: requestId,
    ...data,
    timestamp,
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  console.log('📝 Medical Request Saved (Local Development):', {
    source: 'User Form Submission',
    ...request
  });

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { 
    success: true, 
    id: requestId,
    timestamp,
    message: 'Request submitted successfully to local storage simulation.'
  };
}

async function getRequest(data: any) {
  const { id } = data;
  
  // Simulate retrieving a request
  console.log('Getting request:', id);
  
  return {
    success: true,
    request: {
      id,
      doctorName: 'Dr. Sample',
      location: 'Sample Hospital',
      email: 'doctor@example.com',
      patientAge: '25',
      symptoms: 'Sample symptoms',
      urgency: 'medium',
      specialty: 'Internal Medicine',
      timestamp: new Date().toISOString(),
      status: 'pending'
    }
  };
}

async function listRequests(data: any) {
  const { status, specialty, limit = 10 } = data;
  
  // Simulate listing requests
  console.log('Listing requests with filters:', { status, specialty, limit });
  
  return {
    success: true,
    requests: [],
    count: 0
  };
}