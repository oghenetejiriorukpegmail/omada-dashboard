import { NextResponse } from 'next/server';
import { createOmadaClient } from '@/lib/omada-api';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const client = createOmadaClient(false);
    const sites = await client.getSites();

    return NextResponse.json({ sites });
  } catch (error) {
    logger.error('Error fetching sites', error, { endpoint: '/api/sites' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}
