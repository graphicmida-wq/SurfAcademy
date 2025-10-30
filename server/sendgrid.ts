import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email};
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableSendGridClient() {
  const {apiKey, email} = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

// Utility functions for newsletter system
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateUnsubscribeFooter(unsubscribeUrl: string, postalAddress?: string): string {
  const defaultAddress = 'Scuola di Longboard, Via della Spiaggia 1, 19100 La Spezia, Italia';
  const address = postalAddress || defaultAddress;
  
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
      <p>Hai ricevuto questa email perché sei iscritto alla nostra newsletter.</p>
      <p><a href="${unsubscribeUrl}" style="color: #0066cc; text-decoration: underline;">Annulla l'iscrizione</a></p>
      <p style="margin-top: 10px;">${address}</p>
    </div>
  `;
}

export function injectTrackingPixel(html: string, trackingUrl: string): string {
  const pixel = `<img src="${trackingUrl}" width="1" height="1" alt="" />`;
  // Inject pixel before closing body tag, or append if no body tag exists
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`);
  }
  return html + pixel;
}

export function generateEmailTemplate(content: string, unsubscribeUrl: string, trackingUrl: string, postalAddress?: string): string {
  const contentWithPixel = injectTrackingPixel(content, trackingUrl);
  const footer = generateUnsubscribeFooter(unsubscribeUrl, postalAddress);
  
  return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Newsletter</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px;">
                  ${contentWithPixel}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 30px 40px;">
                  ${footer}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
