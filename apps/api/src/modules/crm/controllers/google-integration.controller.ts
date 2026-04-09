import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthService } from '../services/google-auth.service';
import { GmailSyncService } from '../services/gmail-sync.service';
import { CalendarSyncService } from '../services/calendar-sync.service';

@Controller('api/v1/integrations/google')
export class GoogleIntegrationController {
  private readonly frontendUrl: string;

  constructor(
    private readonly googleAuth: GoogleAuthService,
    private readonly gmailSync: GmailSyncService,
    private readonly calendarSync: CalendarSyncService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth-url')
  getAuthUrl(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const url = this.googleAuth.getAuthUrl(tenantId, userId);
    return { url };
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      // State contains tenantId:userId encoded for the callback
      // For now, we'll parse from state param or use a temporary approach
      // The frontend should pass state when initiating OAuth
      let tenantId = '';
      let userId = '';
      if (state) {
        const parts = state.split(':');
        tenantId = parts[0] || '';
        userId = parts[1] || '';
      }

      if (!tenantId || !userId || !code) {
        return res.redirect(
          `${this.frontendUrl}/settings/integrations?google=error`,
        );
      }

      await this.googleAuth.handleCallback(tenantId, userId, code);
      return res.redirect(
        `${this.frontendUrl}/settings/integrations?google=connected`,
      );
    } catch (error) {
      return res.redirect(
        `${this.frontendUrl}/settings/integrations?google=error`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@CurrentUser('userId') userId: string) {
    const connection = await this.googleAuth.getConnection(userId);
    if (!connection) {
      return { connected: false };
    }
    return {
      connected: true,
      email: connection.googleEmail,
      scopes: connection.scopes,
      gmailLastSyncAt: connection.gmailLastSyncAt,
      calendarLastSyncAt: connection.calendarLastSyncAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect')
  async disconnect(@CurrentUser('userId') userId: string) {
    await this.googleAuth.disconnect(userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('gmail/sync')
  async syncGmail(@CurrentUser('userId') userId: string) {
    try {
      const result = await this.gmailSync.syncEmails(userId);
      return result;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Gmail sync failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('gmail/thread/:threadId')
  async getThread(
    @CurrentUser('userId') userId: string,
    @Param('threadId') threadId: string,
  ) {
    try {
      return await this.gmailSync.getThread(userId, threadId);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch thread',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('gmail/send')
  async sendEmail(
    @CurrentUser('userId') userId: string,
    @Body() body: { to: string; subject: string; body: string; contactId?: string },
  ) {
    try {
      return await this.gmailSync.sendEmail(
        userId,
        body.to,
        body.subject,
        body.body,
        body.contactId,
      );
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to send email',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('calendar/sync')
  async syncCalendar(@CurrentUser('userId') userId: string) {
    try {
      const result = await this.calendarSync.syncEvents(userId);
      return result;
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Calendar sync failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('calendar/upcoming')
  async getUpcomingEvents(
    @CurrentUser('userId') userId: string,
    @Query('days') days?: string,
  ) {
    try {
      return await this.calendarSync.getUpcomingEvents(
        userId,
        days ? parseInt(days, 10) : 7,
      );
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch events',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('calendar/events')
  async createEvent(
    @CurrentUser('userId') userId: string,
    @Body()
    body: {
      summary: string;
      description?: string;
      start: string;
      end: string;
      attendees?: string[];
    },
  ) {
    try {
      return await this.calendarSync.createEvent(userId, body);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create event',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
