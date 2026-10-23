import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getDb } from '../db/connection.js';

export interface EmailReminderParams {
  recipientEmail: string;
  recipientName: string;
  caregiverRole?: string;
  appointmentTitle: string;
  appointmentTime: string;
  appointmentDate: string;
  location?: string | null;
  message: string;
  idempotencyToken: string;
}

export interface EmailResult {
  success: boolean;
  mode: 'live' | 'simulated';
  messageId: string;
  recipient: string;
  subject: string;
  timestamp: string;
  details: string;
  rawResponse?: unknown;
}

export class SesService {
  private client: SESClient | null = null;
  private isConfigured: boolean = false;
  private senderEmail: string;

  constructor() {
    this.senderEmail = process.env.SES_SENDER_EMAIL || 'care@carecircle.demo';

    const hasCreds = Boolean(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION
    );

    if (hasCreds) {
      try {
        this.client = new SESClient({
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });
        this.isConfigured = true;
        console.log('[CareCircle SES] Amazon SES client initialized with live credentials.');
      } catch (err) {
        console.warn('[CareCircle SES] Failed to initialize live SES client. Falling back to simulation mode.', err);
        this.isConfigured = false;
      }
    } else {
      console.log('[CareCircle SES] No AWS credentials detected. Operating in safe Simulated SES Mode.');
    }
  }

  public getStatus(): { mode: 'live' | 'simulated'; senderEmail: string } {
    return {
      mode: this.isConfigured ? 'live' : 'simulated',
      senderEmail: this.senderEmail,
    };
  }

  public async sendAppointmentReminder(params: EmailReminderParams): Promise<EmailResult> {
    const db = getDb();
    const timestamp = new Date().toISOString();
    const subject = `CareCircle Reminder: ${params.appointmentTitle} for Meera Rao`;

    // Email Body (HTML & Plain Text)
    const textBody = `
Hello ${params.recipientName},

This is an automated care coordination reminder from CareCircle AI regarding Meera Rao.

Appointment: ${params.appointmentTitle}
Date & Time: ${params.appointmentDate} at ${params.appointmentTime}
Location: ${params.location || 'See appointment details'}

Important Note:
${params.message}

Please confirm transport and document preparation in the CareCircle dashboard.

— CareCircle AI Coordination Assistant
`.trim();

    const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #202A26; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background-color: #23483D; color: #ffffff; padding: 16px 24px; border-radius: 12px 12px 0 0;">
    <h2 style="margin: 0; font-size: 18px; font-weight: 700;">CareCircle AI — Care Reminder</h2>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: #E7EEE7;">Family Care Plan for Meera Rao</p>
  </div>
  <div style="background-color: #FFFFFF; border: 1px solid #E5E8E2; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hello <strong>${params.recipientName}</strong>,</p>
    <div style="background-color: #F7F6F0; border-left: 4px solid #A96A20; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #202A26;">${params.appointmentTitle}</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #68736D;">
        <strong>Time:</strong> ${params.appointmentDate} at ${params.appointmentTime}<br/>
        <strong>Location:</strong> ${params.location || 'Oak Valley Health Clinic'}
      </p>
    </div>
    <p style="font-size: 13px; color: #202A26;">${params.message}</p>
    <hr style="border: none; border-top: 1px solid #E5E8E2; margin: 20px 0;" />
    <p style="font-size: 11px; color: #8F998F; margin-bottom: 0;">
      This action was authorized by Anika Rao and dispatched via CareCircle AI Action Gate.
    </p>
  </div>
</body>
</html>
`.trim();

    // 1. Live AWS SES Execution
    if (this.isConfigured && this.client) {
      try {
        const command = new SendEmailCommand({
          Source: this.senderEmail,
          Destination: {
            ToAddresses: [params.recipientEmail],
          },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Text: { Data: textBody, Charset: 'UTF-8' },
              Html: { Data: htmlBody, Charset: 'UTF-8' },
            },
          },
        });

        const response = await this.client.send(command);
        const messageId = response.MessageId || `ses-${Date.now()}`;

        // Audit log
        db.prepare(`
          INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `act-ses-${Date.now()}`,
          'Anika Rao',
          'ses_reminder_sent',
          'caregiver',
          params.recipientEmail,
          `Amazon SES Email: ${subject}`,
          `Live email sent via AWS SES. MessageId: ${messageId}`,
          'success',
          timestamp
        );

        return {
          success: true,
          mode: 'live',
          messageId,
          recipient: params.recipientEmail,
          subject,
          timestamp,
          details: `Email accepted by Amazon SES for delivery to ${params.recipientEmail}`,
          rawResponse: response,
        };
      } catch (err: any) {
        console.error('[CareCircle SES] Failed to send email via Amazon SES:', err);

        // Record failure in audit log (FR-6: Never fake success on failure)
        db.prepare(`
          INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `act-ses-err-${Date.now()}`,
          'Anika Rao',
          'ses_reminder_failed',
          'caregiver',
          params.recipientEmail,
          `Amazon SES Send Failed: ${subject}`,
          `AWS SES Error: ${err.message || 'Unknown provider error'}`,
          'failed',
          timestamp
        );

        throw new Error(`Amazon SES Error: ${err.message || 'Failed to dispatch email'}`);
      }
    }

    // 2. Safe Simulated SES Mode (Clearly labeled demo mode, zero false claims)
    const simulatedMessageId = `sim-ses-${Date.now()}`;

    // Record in audit log as simulated
    db.prepare(`
      INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `act-sim-ses-${Date.now()}`,
      'Anika Rao',
      'ses_reminder_simulated',
      'caregiver',
      params.recipientEmail,
      `Simulated SES Email: ${subject}`,
      `[Simulated SES Mode] Verified payload generated for ${params.recipientEmail}. Idempotency token: ${params.idempotencyToken}`,
      'success',
      timestamp
    );

    return {
      success: true,
      mode: 'simulated',
      messageId: simulatedMessageId,
      recipient: params.recipientEmail,
      subject,
      timestamp,
      details: `[Simulated SES Mode] Reminder formatted and verified for ${params.recipientEmail}. Connect AWS credentials in .env to activate live dispatch.`,
    };
  }
}

export const sesService = new SesService();
