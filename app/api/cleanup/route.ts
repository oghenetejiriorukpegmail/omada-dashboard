import { NextRequest, NextResponse } from 'next/server';
import { createOmadaClient } from '@/lib/omada-api';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json().catch(() => ({}));

    // Create client without requiring site ID (we'll fetch all sites if needed)
    const client = createOmadaClient(false);

    logger.info('Starting expired user cleanup', { siteId: siteId || 'all-sites' });

    let sitesToCheck: string[] = [];

    if (siteId) {
      // Use provided site ID
      sitesToCheck = [siteId];
    } else if (process.env.OMADA_SITE_ID) {
      // Use configured site ID
      sitesToCheck = [process.env.OMADA_SITE_ID];
    } else {
      // Get all sites
      const sites = await client.getSites();
      sitesToCheck = sites.map(site => site.siteId);
      logger.info('Found sites to check', { count: sitesToCheck.length });
    }

    let totalExpired = 0;
    let totalDeleted = 0;
    const errors: string[] = [];

    // Check each site
    for (const targetSiteId of sitesToCheck) {
      try {
        logger.info('Checking site for expired users', { siteId: targetSiteId });

        // Get all local users for this site
        const users = await client.getLocalUsers(targetSiteId);
        const now = Date.now();

        // Filter expired users
        const expiredUsers = users.filter(user =>
          user.expirationTime > 0 && user.expirationTime <= now
        );

        logger.info('Found expired users', {
          siteId: targetSiteId,
          totalUsers: users.length,
          expiredCount: expiredUsers.length
        });

        totalExpired += expiredUsers.length;

        // Delete each expired user
        for (const user of expiredUsers) {
          try {
            await client.deleteLocalUser(user.id, targetSiteId);
            totalDeleted++;

            logger.info('Deleted expired user', {
              siteId: targetSiteId,
              userId: user.id,
              userName: user.userName,
              expirationTime: new Date(user.expirationTime).toISOString()
            });
          } catch (error) {
            const errorMsg = `Failed to delete user ${user.userName} (${user.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            logger.error('Failed to delete expired user', error, {
              siteId: targetSiteId,
              userId: user.id,
              userName: user.userName
            });
          }
        }
      } catch (error) {
        const errorMsg = `Failed to process site ${targetSiteId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logger.error('Failed to process site', error, { siteId: targetSiteId });
      }
    }

    const result = {
      success: true,
      sitesChecked: sitesToCheck.length,
      expiredUsersFound: totalExpired,
      usersDeleted: totalDeleted,
      errors: errors.length > 0 ? errors : undefined
    };

    logger.info('Cleanup completed', result);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Cleanup failed', error, { endpoint: '/api/cleanup' });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run cleanup'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to run cleanup (can be triggered by external cron services)
export async function GET() {
  return POST(new NextRequest('http://localhost/api/cleanup', { method: 'POST' }));
}
