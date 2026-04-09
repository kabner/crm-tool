import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { GoogleAuthService } from './google-auth.service';
import { Activity } from '../entities/activity.entity';
import { Contact } from '../entities/contact.entity';
import { GoogleConnection } from '../entities/google-connection.entity';

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);

  constructor(
    private readonly googleAuth: GoogleAuthService,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(GoogleConnection)
    private readonly connectionRepo: Repository<GoogleConnection>,
  ) {}

  async syncEvents(
    userId: string,
  ): Promise<{ synced: number; matched: number }> {
    const authResult = await this.googleAuth.getAuthenticatedClient(userId);
    if (!authResult) throw new Error('Google account not connected');
    const { client, connection } = authResult;

    const calendar = google.calendar({ version: 'v3', auth: client });
    let synced = 0;
    let matched = 0;

    const params: any = {
      calendarId: 'primary',
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    };

    if (connection.calendarSyncToken) {
      params.syncToken = connection.calendarSyncToken;
    } else {
      // First sync: get events from last 30 days
      params.timeMin = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
    }

    try {
      const result = await calendar.events.list(params);
      const events = result.data.items || [];

      for (const event of events) {
        if (!event.id || event.status === 'cancelled') continue;

        // Check if already logged (by googleEventId in metadata)
        const existingActivity = await this.activityRepo
          .createQueryBuilder('a')
          .where('a.tenant_id = :tenantId', {
            tenantId: connection.tenantId,
          })
          .andWhere('a.user_id = :userId', { userId: connection.userId })
          .andWhere("a.metadata->>'googleEventId' = :eventId", {
            eventId: event.id,
          })
          .getOne();

        if (existingActivity) continue;

        // Match attendees to CRM contacts
        let contactId: string | null = null;
        const attendees = event.attendees || [];
        for (const attendee of attendees) {
          if (attendee.self) continue;
          if (!attendee.email) continue;
          const contact = await this.contactRepo.findOne({
            where: {
              tenantId: connection.tenantId,
              email: attendee.email.toLowerCase(),
            },
          });
          if (contact) {
            contactId = contact.id;
            matched++;
            break;
          }
        }

        const startTime = event.start?.dateTime || event.start?.date;
        const endTime = event.end?.dateTime || event.end?.date;

        const activity = this.activityRepo.create({
          tenantId: connection.tenantId,
          type: 'meeting',
          subject: event.summary || '(no title)',
          body: event.description || undefined,
          contactId: contactId || undefined,
          userId: connection.userId,
          dueDate: startTime ? new Date(startTime) : undefined,
          metadata: {
            googleEventId: event.id,
            calendarId: 'primary',
            startTime,
            endTime,
            location: event.location,
            attendees: attendees.map((a) => ({
              email: a.email,
              name: a.displayName,
              status: a.responseStatus,
            })),
            meetLink:
              event.hangoutLink ||
              event.conferenceData?.entryPoints?.[0]?.uri,
          },
        });
        await this.activityRepo.save(activity);
        synced++;
      }

      // Save sync token for incremental sync
      if (result.data.nextSyncToken) {
        connection.calendarSyncToken = result.data.nextSyncToken;
      }
      connection.calendarLastSyncAt = new Date();
      await this.connectionRepo.save(connection);
    } catch (error: any) {
      // If sync token is invalid, reset and do full sync
      if (error?.code === 410) {
        connection.calendarSyncToken = null as any;
        await this.connectionRepo.save(connection);
        return this.syncEvents(userId); // Retry without sync token
      }
      throw error;
    }

    return { synced, matched };
  }

  async getUpcomingEvents(userId: string, days: number = 7) {
    const authResult = await this.googleAuth.getAuthenticatedClient(userId);
    if (!authResult) throw new Error('Google account not connected');
    const { client } = authResult;

    const calendar = google.calendar({ version: 'v3', auth: client });
    const result = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      timeMax: new Date(
        Date.now() + days * 24 * 60 * 60 * 1000,
      ).toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return result.data.items || [];
  }

  async createEvent(
    userId: string,
    data: {
      summary: string;
      description?: string;
      start: string;
      end: string;
      attendees?: string[];
    },
  ) {
    const authResult = await this.googleAuth.getAuthenticatedClient(userId);
    if (!authResult) throw new Error('Google account not connected');
    const { client } = authResult;

    const calendar = google.calendar({ version: 'v3', auth: client });
    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: data.summary,
        description: data.description,
        start: { dateTime: data.start },
        end: { dateTime: data.end },
        attendees: data.attendees?.map((email) => ({ email })),
      },
    });

    return result.data;
  }
}
