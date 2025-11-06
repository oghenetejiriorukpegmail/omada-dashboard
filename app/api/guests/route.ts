import { NextRequest, NextResponse } from 'next/server';
import { createOmadaClient } from '@/lib/omada-api';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');

    const client = createOmadaClient(false);

    logger.info('Fetching guests', { siteId: siteId || 'all-sites' });

    let sitesToCheck: string[] = [];

    if (siteId) {
      sitesToCheck = [siteId];
    } else if (process.env.OMADA_SITE_ID) {
      sitesToCheck = [process.env.OMADA_SITE_ID];
    } else {
      const sites = await client.getSites();
      sitesToCheck = sites.map(site => site.siteId);
    }

    const allGuests = [];
    const now = Date.now();

    for (const targetSiteId of sitesToCheck) {
      try {
        const users = await client.getLocalUsers(targetSiteId);

        // Add site info and status to each user
        const usersWithStatus = users.map(user => ({
          ...user,
          siteId: targetSiteId,
          status: user.expirationTime > 0 && user.expirationTime <= now ? 'expired' : 'active',
          isExpired: user.expirationTime > 0 && user.expirationTime <= now,
        }));

        allGuests.push(...usersWithStatus);
      } catch (error) {
        logger.error('Failed to fetch guests for site', error, { siteId: targetSiteId });
      }
    }

    logger.info('Fetched guests successfully', {
      totalGuests: allGuests.length,
      sitesChecked: sitesToCheck.length
    });

    return NextResponse.json({
      success: true,
      guests: allGuests,
      sitesChecked: sitesToCheck.length,
      timestamp: now
    });
  } catch (error) {
    logger.error('Failed to fetch guests', error, { endpoint: '/api/guests' });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch guests'
      },
      { status: 500 }
    );
  }
}
