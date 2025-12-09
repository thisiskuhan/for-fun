import { NextResponse } from 'next/server';
import { registry } from '@/lib/metrics';

// Metrics endpoint for Prometheus scraping
export async function GET() {
  try {
    const metrics = await registry.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': registry.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
