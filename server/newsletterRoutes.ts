import type { Express, Response } from "express";
import type { DatabaseStorage } from "./storage";
import { storage } from "./storage";
import { insertNewsletterContactSchema, insertNewsletterCampaignSchema, insertNewsletterEventSchema } from "@shared/schema";
import { getUncachableSendGridClient, generateToken, generateEmailTemplate } from "./sendgrid";
import { z } from "zod";

const BASE_URL = process.env.REPL_SLUG 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPLIT_DEV_DOMAIN}`
  : 'http://localhost:5000';

export async function sendCampaignEmails(campaignId: string, storageInstance: DatabaseStorage) {
  const campaign = await storageInstance.getNewsletterCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  await storageInstance.updateNewsletterCampaign(campaignId, { status: 'sending' });

  const tags = campaign.tags || [];
  const contacts = await storageInstance.getContactsByTags(tags);

  const { client, fromEmail } = await getUncachableSendGridClient();
  let sentCount = 0;
  let errorCount = 0;

  for (const contact of contacts) {
    try {
      const unsubscribeUrl = `${BASE_URL}/newsletter/unsubscribe/${contact.unsubscribeToken}`;
      const trackingUrl = `${BASE_URL}/track/open/${campaignId}/${contact.id}`;
      const html = generateEmailTemplate(campaign.htmlContent, unsubscribeUrl, trackingUrl);

      await client.send({
        to: contact.email,
        from: fromEmail,
        subject: campaign.subject,
        html,
      });

      await storageInstance.createNewsletterEvent({
        campaignId,
        contactId: contact.id,
        eventType: 'sent',
        metadata: {},
      });

      await storageInstance.updateNewsletterContact(contact.id, {
        lastEmailSentAt: new Date(),
      });

      sentCount++;
    } catch (error) {
      console.error(`Error sending to ${contact.email}:`, error);
      errorCount++;
      
      await storageInstance.createNewsletterEvent({
        campaignId,
        contactId: contact.id,
        eventType: 'bounced',
        metadata: { error: String(error) },
      });
    }
  }

  // Update campaign status based on success/failure
  let finalStatus: string;
  if (errorCount === contacts.length) {
    finalStatus = 'draft'; // All failed - revert to draft
  } else if (errorCount > 0) {
    finalStatus = 'sending'; // Partial failure - keep in sending for manual review
  } else {
    finalStatus = 'sent'; // All succeeded
  }
  
  await storageInstance.updateNewsletterCampaign(campaignId, {
    status: finalStatus,
    sentAt: sentCount > 0 ? new Date() : null,
    totalRecipients: contacts.length,
    totalSent: sentCount,
    totalBounced: errorCount,
  });

  if (errorCount > 0) {
    console.warn(`[Newsletter] Campaign ${campaignId}: ${sentCount}/${contacts.length} sent successfully, ${errorCount} failed (status: ${finalStatus})`);
  }
}

export function registerNewsletterRoutes(app: Express, isAuthenticated: any, isAdmin: any) {

  // ========== Public Newsletter Routes ==========
  
  // Subscribe to newsletter (creates pending contact, sends confirmation email)
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      // Validate only user-provided fields (email, firstName, lastName)
      const userDataSchema = z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      });

      const validatedData = userDataSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ message: "Dati non validi", errors: validatedData.error.errors });
      }

      const { email, firstName, lastName } = validatedData.data;

      // Check if email already exists
      const existing = await storage.getNewsletterContactByEmail(email);
      if (existing) {
        if (existing.status === 'confirmed') {
          return res.status(400).json({ message: "Sei già iscritto alla newsletter" });
        }
        if (existing.status === 'pending') {
          return res.status(400).json({ message: "Controlla la tua email per confermare l'iscrizione" });
        }
        if (existing.status === 'unsubscribed') {
          // Re-subscribe: update contact with new tokens
          const confirmToken = generateToken();
          const unsubscribeToken = generateToken();
          
          await storage.updateNewsletterContact(existing.id, {
            status: 'pending',
            confirmToken,
            unsubscribeToken,
            firstName: firstName || existing.firstName,
            lastName: lastName || existing.lastName,
            subscribedIp: req.ip,
          });

          // Send confirmation email
          const confirmUrl = `${BASE_URL}/newsletter/confirm/${confirmToken}`;
          const { client, fromEmail } = await getUncachableSendGridClient();
          
          await client.send({
            to: email,
            from: fromEmail,
            subject: 'Conferma la tua iscrizione alla Newsletter',
            html: `
              <h2>Benvenuto/a alla Newsletter di Scuola di Longboard!</h2>
              <p>Ciao ${firstName || 'surfista'},</p>
              <p>Clicca sul link qui sotto per confermare la tua iscrizione:</p>
              <p><a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Conferma Iscrizione</a></p>
              <p>Se non hai richiesto questa iscrizione, puoi ignorare questa email.</p>
            `
          });

          return res.json({ message: "Email di conferma inviata. Controlla la tua casella di posta." });
        }
      }

      // Create new contact
      const confirmToken = generateToken();
      const unsubscribeToken = generateToken();
      
      const contact = await storage.createNewsletterContact({
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        status: 'pending',
        confirmToken,
        unsubscribeToken,
        subscribedIp: req.ip || null,
        tags: [],
      });

      // Send confirmation email
      const confirmUrl = `${BASE_URL}/newsletter/confirm/${confirmToken}`;
      const { client, fromEmail } = await getUncachableSendGridClient();
      
      await client.send({
        to: email,
        from: fromEmail,
        subject: 'Conferma la tua iscrizione alla Newsletter',
        html: `
          <h2>Benvenuto/a alla Newsletter di Scuola di Longboard!</h2>
          <p>Ciao ${firstName || 'surfista'},</p>
          <p>Clicca sul link qui sotto per confermare la tua iscrizione:</p>
          <p><a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Conferma Iscrizione</a></p>
          <p>Se non hai richiesto questa iscrizione, puoi ignorare questa email.</p>
        `
      });

      res.json({ message: "Email di conferma inviata. Controlla la tua casella di posta." });
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ message: "Errore durante l'iscrizione" });
    }
  });

  // Confirm newsletter subscription
  app.get('/newsletter/confirm/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const contact = await storage.confirmNewsletterContact(token);
      
      if (!contact) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Token non valido</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>Token non valido o scaduto</h1>
            <p>Il link di conferma non è valido o è già stato utilizzato.</p>
            <a href="/">Torna alla Home</a>
          </body>
          </html>
        `);
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Iscrizione Confermata</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✓ Iscrizione Confermata!</h1>
          <p>Grazie ${contact.firstName || ''} per esserti iscritto/a alla nostra newsletter.</p>
          <p>Riceverai aggiornamenti sulle ultime novità, corsi e contenuti esclusivi sul surf.</p>
          <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Torna alla Home</a>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error confirming newsletter:", error);
      res.status(500).send('Errore durante la conferma');
    }
  });

  // Unsubscribe from newsletter
  app.get('/newsletter/unsubscribe/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const contact = await storage.unsubscribeNewsletterContact(token);
      
      if (!contact) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Token non valido</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>Token non valido</h1>
            <p>Il link di disiscrizione non è valido.</p>
            <a href="/">Torna alla Home</a>
          </body>
          </html>
        `);
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Disiscrizione Completata</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>Disiscrizione Completata</h1>
          <p>Ci dispiace vederti andare, ${contact.firstName || 'surfista'}.</p>
          <p>Non riceverai più email dalla nostra newsletter.</p>
          <p>Se cambi idea, puoi sempre iscriverti nuovamente dal nostro sito.</p>
          <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Torna alla Home</a>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error unsubscribing from newsletter:", error);
      res.status(500).send('Errore durante la disiscrizione');
    }
  });

  // Track email open (1x1 pixel)
  app.get('/track/open/:campaignId/:contactId', async (req, res) => {
    try {
      const { campaignId, contactId } = req.params;
      
      // Record open event
      await storage.createNewsletterEvent({
        campaignId,
        contactId,
        eventType: 'opened',
        metadata: { userAgent: req.headers['user-agent'], ip: req.ip },
      });

      // Update campaign stats
      const campaign = await storage.getNewsletterCampaign(campaignId);
      if (campaign) {
        await storage.updateNewsletterCampaign(campaignId, {
          totalOpened: (campaign.totalOpened || 0) + 1,
        });
      }

      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end(pixel);
    } catch (error) {
      console.error("Error tracking open:", error);
      res.status(200).end(); // Always return 200 for tracking pixels
    }
  });

  // ========== Admin Newsletter Routes ==========
  
  // Get all contacts (admin only)
  app.get('/api/admin/newsletter/contacts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.query;
      const contacts = await storage.getAllNewsletterContacts(status as string);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Create contact (admin only)
  app.post('/api/admin/newsletter/contacts', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertNewsletterContactSchema.parse(req.body);
      const confirmToken = generateToken();
      const unsubscribeToken = generateToken();
      
      const contact = await storage.createNewsletterContact({
        ...data,
        confirmToken,
        unsubscribeToken,
      });
      res.json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  // Update contact (admin only)
  app.patch('/api/admin/newsletter/contacts/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const contact = await storage.updateNewsletterContact(id, req.body);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  // Delete contact (admin only)
  app.delete('/api/admin/newsletter/contacts/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNewsletterContact(id);
      res.json({ message: "Contact deleted" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Get all campaigns (admin only)
  app.get('/api/admin/newsletter/campaigns', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const campaigns = await storage.getAllNewsletterCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Get single campaign (admin only)
  app.get('/api/admin/newsletter/campaigns/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getNewsletterCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  // Create campaign (admin only)
  app.post('/api/admin/newsletter/campaigns', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const data = insertNewsletterCampaignSchema.parse(req.body);
      
      const campaign = await storage.createNewsletterCampaign({
        ...data,
        createdBy: userId,
      });
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Update campaign (admin only)
  app.patch('/api/admin/newsletter/campaigns/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.updateNewsletterCampaign(id, req.body);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // Delete campaign (admin only)
  app.delete('/api/admin/newsletter/campaigns/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNewsletterCampaign(id);
      res.json({ message: "Campaign deleted" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Send campaign immediately or schedule (admin only)
  app.post('/api/admin/newsletter/campaigns/:id/send', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { testEmail, schedule } = req.body;

      const campaign = await storage.getNewsletterCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // If test email, send only to that address
      if (testEmail) {
        const { client, fromEmail } = await getUncachableSendGridClient();
        const unsubscribeUrl = `${BASE_URL}/newsletter/unsubscribe/test-token`;
        const trackingUrl = `${BASE_URL}/track/open/${id}/test`;
        const html = generateEmailTemplate(campaign.htmlContent, unsubscribeUrl, trackingUrl);

        await client.send({
          to: testEmail,
          from: fromEmail,
          subject: `[TEST] ${campaign.subject}`,
          html,
        });

        return res.json({ message: `Test email sent to ${testEmail}` });
      }

      // If schedule, update campaign status and scheduledFor
      if (schedule) {
        await storage.updateNewsletterCampaign(id, {
          status: 'scheduled',
          scheduledFor: new Date(schedule),
        });
        return res.json({ message: "Campaign scheduled successfully" });
      }

      // Send immediately
      await sendCampaignEmails(id, storage);
      res.json({ message: "Campaign sent successfully" });
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });


  // Get campaign statistics (admin only)
  app.get('/api/admin/newsletter/campaigns/:id/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getNewsletterCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const events = await storage.getEventsByCampaign(id);
      
      const totalSent = campaign.totalSent || 0;
      const stats = {
        totalRecipients: campaign.totalRecipients,
        totalSent: campaign.totalSent,
        totalOpened: campaign.totalOpened,
        totalClicked: campaign.totalClicked,
        totalBounced: campaign.totalBounced,
        openRate: totalSent > 0 ? ((campaign.totalOpened || 0) / totalSent * 100).toFixed(2) : 0,
        clickRate: totalSent > 0 ? ((campaign.totalClicked || 0) / totalSent * 100).toFixed(2) : 0,
        events: events.slice(0, 100), // Last 100 events
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching campaign stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ========== SendGrid Webhook Handler ==========
  
  // Webhook endpoint for SendGrid events (bounces, spam, unsubscribes)
  // IMPORTANT: Configure SENDGRID_WEBHOOK_SECRET in environment variables
  app.post('/api/webhook/sendgrid', async (req, res) => {
    try {
      // SECURITY: Require webhook secret to prevent spoofing
      const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('[SendGrid Webhook] SENDGRID_WEBHOOK_SECRET not configured - rejecting webhook');
        return res.status(503).json({ message: "Webhook not configured" });
      }
      
      const authHeader = req.headers['authorization'];
      if (authHeader !== `Bearer ${webhookSecret}`) {
        console.warn('[SendGrid Webhook] Unauthorized webhook attempt');
        return res.status(401).json({ message: "Unauthorized" });
      }

      const events = req.body;
      
      if (!Array.isArray(events)) {
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      for (const event of events) {
        const { email, event: eventType, sg_message_id } = event;
        
        if (!email || !eventType) {
          console.warn('[SendGrid Webhook] Missing email or event type:', event);
          continue;
        }

        const contact = await storage.getNewsletterContactByEmail(email);
        
        if (!contact) {
          console.warn(`[SendGrid Webhook] Contact not found for email: ${email}`);
          continue;
        }

        // Handle different event types
        switch (eventType) {
          case 'bounce':
          case 'dropped':
            await storage.updateNewsletterContact(contact.id, {
              status: 'bounced',
            });
            
            await storage.createNewsletterEvent({
              campaignId: null,
              contactId: contact.id,
              eventType: 'bounced',
              metadata: { reason: event.reason || 'unknown', sgMessageId: sg_message_id },
            });
            
            console.log(`[SendGrid Webhook] Marked ${email} as bounced`);
            break;

          case 'spamreport':
            await storage.updateNewsletterContact(contact.id, {
              status: 'spam',
            });
            
            await storage.createNewsletterEvent({
              campaignId: null,
              contactId: contact.id,
              eventType: 'spam',
              metadata: { sgMessageId: sg_message_id },
            });
            
            console.log(`[SendGrid Webhook] Marked ${email} as spam`);
            break;

          case 'unsubscribe':
            await storage.updateNewsletterContact(contact.id, {
              status: 'unsubscribed',
            });
            
            await storage.createNewsletterEvent({
              campaignId: null,
              contactId: contact.id,
              eventType: 'unsubscribe',
              metadata: { sgMessageId: sg_message_id },
            });
            
            console.log(`[SendGrid Webhook] Unsubscribed ${email}`);
            break;

          default:
            break;
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[SendGrid Webhook] Error processing webhook:', error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });
}
