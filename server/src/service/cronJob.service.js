"use strict";

import cron from 'node-cron';
import notificationService from '../service/notification.service.js';

/**
 * @class CronJobService
 * @description Service to handle scheduled tasks
 */
class CronJobService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * @dev Initialize all cron jobs
   */
  init() {
    console.log('⏰ Initializing cron jobs...');

    // Cleanup expired notifications every hour
    this.scheduleNotificationCleanup();

    console.log('✅ Cron jobs initialized successfully');
  }

  /**
   * @dev Schedule notification cleanup job
   */
  scheduleNotificationCleanup() {
    const job = cron.schedule('0 * * * *', async () => { // Every hour
      try {
        console.log('🧹 Running notification cleanup job...');
        const deletedCount = await notificationService.cleanupExpiredNotifications();
        console.log(`✅ Cleanup completed. Deleted ${deletedCount} expired notifications`);
      } catch (error) {
        console.error('❌ Error in notification cleanup job:', error);
      }
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set('notificationCleanup', job);
    
    // Start the job only in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON_JOBS === 'true') {
      job.start();
      console.log('⏰ Notification cleanup job scheduled (every hour)');
    } else {
      console.log('⏰ Notification cleanup job registered but not started (development mode)');
    }
  }

  /**
   * @dev Stop all jobs
   */
  stopAllJobs() {
    console.log('🛑 Stopping all cron jobs...');
    for (const [jobName, job] of this.jobs) {
      job.stop();
      console.log(`⏸️  Stopped job: ${jobName}`);
    }
  }

  /**
   * @dev Get status of all jobs
   */
  getJobsStatus() {
    const status = {};
    for (const [jobName, job] of this.jobs) {
      status[jobName] = {
        running: job.running || false,
        scheduled: job.scheduled || false
      };
    }
    return status;
  }

  /**
   * @dev Manual trigger for notification cleanup
   */
  async triggerNotificationCleanup() {
    try {
      console.log('🧹 Manually triggering notification cleanup...');
      const deletedCount = await notificationService.cleanupExpiredNotifications();
      console.log(`✅ Manual cleanup completed. Deleted ${deletedCount} expired notifications`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error in manual notification cleanup:', error);
      throw error;
    }
  }
}

// Export singleton instance
const cronJobService = new CronJobService();
export default cronJobService;