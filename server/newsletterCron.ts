import cron from 'node-cron';
import type { DatabaseStorage } from './storage';
import { sendCampaignEmails } from './newsletterRoutes';

export function setupNewsletterCron(storage: DatabaseStorage) {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const campaigns = await storage.getScheduledCampaigns();
      const now = new Date();

      for (const campaign of campaigns) {
        if (campaign.scheduledFor && campaign.scheduledFor <= now) {
          console.log(`[Newsletter Cron] Sending scheduled campaign: ${campaign.name}`);
          
          try {
            await sendCampaignEmails(campaign.id, storage);
            console.log(`[Newsletter Cron] Campaign "${campaign.name}" sent successfully`);
          } catch (error) {
            console.error(`[Newsletter Cron] Failed to send campaign "${campaign.name}":`, error);
          }
        }
      }
    } catch (error) {
      console.error('[Newsletter Cron] Error processing scheduled campaigns:', error);
    }
  });

  console.log('[Newsletter Cron] Scheduler started - checking every 5 minutes');
}
