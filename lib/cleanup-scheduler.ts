import cron from 'node-cron';
import { logger } from './logger';

// Flag to prevent multiple scheduler instances
let schedulerStarted = false;

export function startCleanupScheduler() {
  // Prevent multiple instances in dev mode (hot reload)
  if (schedulerStarted) {
    logger.info('Cleanup scheduler already running');
    return;
  }

  // Run cleanup every hour at minute 0
  // Cron format: minute hour day month weekday
  // '0 * * * *' = Every hour at minute 0
  const schedule = process.env.CLEANUP_SCHEDULE || '0 * * * *';

  logger.info('Starting cleanup scheduler', { schedule });

  cron.schedule(schedule, async () => {
    logger.info('Running scheduled cleanup job');

    try {
      const response = await fetch('http://localhost:3500/api/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Cleanup request failed with status ${response.status}`);
      }

      const result = await response.json();
      logger.info('Scheduled cleanup completed', result);
    } catch (error) {
      logger.error('Scheduled cleanup failed', error);
    }
  });

  schedulerStarted = true;
  logger.info('Cleanup scheduler started successfully', { schedule });
}
