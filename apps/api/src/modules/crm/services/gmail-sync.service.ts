import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { GoogleAuthService } from './google-auth.service';
import { Activity } from '../entities/activity.entity';
import { Contact } from '../entities/contact.entity';
import { EmailSyncLog } from '../entities/email-sync-log.entity';
import { GoogleConnection } from '../entities/google-connection.entity';

@Injectable()
export class GmailSyncService {
  private readonly logger = new Logger(GmailSyncService.name);

  constructor(
    private readonly googleAuth: GoogleAuthService,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(EmailSyncLog)
    private readonly syncLogRepo: Repository<EmailSyncLog>,
    @InjectRepository(GoogleConnection)
    private readonly connectionRepo: Repository<GoogleConnection>,
  ) {}

  async syncEmails(
    userId: string,
  ): Promise<{ synced: number; matched: number }> {
    const authResult = await this.googleAuth.getAuthenticatedClient(userId);
    if (!authResult) throw new Error('Google account not connected');
    const { client, connection } = authResult;

    const gmail = google.gmail({ version: 'v1', auth: client });
    let synced = 0;
    let matched = 0;

    // Fetch recent messages (last 50, or use date filter for incremental)
    const listResult = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: connection.gmailLastSyncAt
        ? `after:${Math.floor(connection.gmailLastSyncAt.getTime() / 1000)}`
        : 'newer_than:7d',
    });

    const messages = listResult.data.messages || [];

    for (const msg of messages) {
      // Skip if already synced
      const existing = await this.syncLogRepo.findOne({
        where: { userId, googleMessageId: msg.id! },
      });
      if (existing) continue;

      // Fetch full message
      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
      });

      const headers = fullMsg.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find(
          (h) => h.name?.toLowerCase() === name.toLowerCase(),
        )?.value || '';

      const from = getHeader('From');
      const to = getHeader('To');
      const subject = getHeader('Subject');
      const date = getHeader('Date');

      // Extract email addresses
      const emailRegex = /[\w.+-]+@[\w.-]+\.\w{2,}/g;
      const allEmails = [
        ...(from.match(emailRegex) || []),
        ...(to.match(emailRegex) || []),
      ];
      const otherEmails = allEmails.filter(
        (e) => e.toLowerCase() !== connection.googleEmail.toLowerCase(),
      );

      // Match to CRM contact
      let contactId: string | null = null;
      for (const email of otherEmails) {
        const contact = await this.contactRepo.findOne({
          where: {
            tenantId: connection.tenantId,
            email: email.toLowerCase(),
          },
        });
        if (contact) {
          contactId = contact.id;
          matched++;
          break;
        }
      }

      // Create activity
      const activity = this.activityRepo.create({
        tenantId: connection.tenantId,
        type: 'email',
        subject: subject || '(no subject)',
        body: fullMsg.data.snippet || undefined,
        contactId: contactId || undefined,
        userId: connection.userId,
        metadata: {
          googleMessageId: msg.id,
          threadId: msg.threadId,
          from,
          to,
          date,
          direction: from.includes(connection.googleEmail)
            ? 'outbound'
            : 'inbound',
        },
      });
      const savedActivity = await this.activityRepo.save(activity);

      // Log sync
      await this.syncLogRepo.save(
        this.syncLogRepo.create({
          tenantId: connection.tenantId,
          userId: connection.userId,
          googleMessageId: msg.id!,
          activityId: savedActivity.id,
        }),
      );

      synced++;
    }

    // Update connection sync state
    connection.gmailLastSyncAt = new Date();
    if (listResult.data.resultSizeEstimate) {
      // Store latest historyId for future incremental sync
      const profile = await gmail.users.getProfile({ userId: 'me' });
      connection.gmailHistoryId =
        profile.data.historyId || connection.gmailHistoryId;
    }
    await this.connectionRepo.save(connection);

    return { synced, matched };
  }

  async sendEmail(
    userId: string,
    to: string,
    subject: string,
    body: string,
    contactId?: string,
  ): Promise<Activity> {
    const authResult = await this.googleAuth.getAuthenticatedClient(userId);
    if (!authResult) throw new Error('Google account not connected');
    const { client, connection } = authResult;

    const gmail = google.gmail({ version: 'v1', auth: client });

    // Build RFC 2822 message
    const messageParts = [
      `To: ${to}`,
      `From: ${connection.googleEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
    ];
    const raw = Buffer.from(messageParts.join('\r\n')).toString('base64url');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    // Create activity
    const activity = this.activityRepo.create({
      tenantId: connection.tenantId,
      type: 'email',
      subject,
      body,
      contactId: contactId || undefined,
      userId: connection.userId,
      metadata: {
        googleMessageId: result.data.id,
        threadId: result.data.threadId,
        from: connection.googleEmail,
        to,
        direction: 'outbound',
      },
    });
    return this.activityRepo.save(activity);
  }

  async getThread(userId: string, threadId: string) {
    const authResult = await this.googleAuth.getAuthenticatedClient(userId);
    if (!authResult) throw new Error('Google account not connected');
    const { client } = authResult;

    const gmail = google.gmail({ version: 'v1', auth: client });
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });
    return thread.data;
  }
}
