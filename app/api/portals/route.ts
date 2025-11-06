import { NextRequest, NextResponse } from 'next/server';
import { createOmadaClient } from '@/lib/omada-api';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');

    const requireEnvSiteId = !siteId;
    const client = createOmadaClient(requireEnvSiteId);
    const portals = await client.getPortals(siteId || undefined);

    return NextResponse.json({ portals });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch portals';

    if (errorMessage.includes('OMADA_SITE_ID not configured')) {
      logger.info('Site ID not configured, client should fetch sites', { endpoint: '/api/portals' });
    } else {
      logger.error('Error fetching portals', error, { endpoint: '/api/portals' });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
