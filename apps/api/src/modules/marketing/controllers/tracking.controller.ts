import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../../shared/auth/decorators/public.decorator';
import { EmailsService } from '../services/emails.service';

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

@ApiTags('Email Tracking')
@Controller('api/v1/tracking')
export class TrackingController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get('open/:emailSendId')
  @Public()
  @ApiOperation({ summary: 'Track email open (returns 1x1 GIF)' })
  @ApiParam({ name: 'emailSendId', type: 'string', format: 'uuid' })
  async trackOpen(
    @Param('emailSendId', ParseUUIDPipe) emailSendId: string,
    @Res() res: Response,
  ) {
    // Fire-and-forget tracking
    this.emailsService.trackOpen(emailSendId).catch(() => {});

    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    res.end(TRACKING_PIXEL);
  }

  @Get('click/:emailSendId')
  @Public()
  @ApiOperation({ summary: 'Track email click and redirect' })
  @ApiParam({ name: 'emailSendId', type: 'string', format: 'uuid' })
  async trackClick(
    @Param('emailSendId', ParseUUIDPipe) emailSendId: string,
    @Query('url') url: string,
    @Res() res: Response,
  ) {
    // Fire-and-forget tracking
    this.emailsService.trackClick(emailSendId, url).catch(() => {});

    // Redirect to the original URL
    const redirectUrl = url || '/';
    res.redirect(302, redirectUrl);
  }

  @Get('unsubscribe/:emailSendId')
  @Public()
  @ApiOperation({ summary: 'Unsubscribe from emails' })
  @ApiParam({ name: 'emailSendId', type: 'string', format: 'uuid' })
  async unsubscribe(
    @Param('emailSendId', ParseUUIDPipe) emailSendId: string,
    @Res() res: Response,
  ) {
    await this.emailsService.processUnsubscribe(emailSendId);

    res.set('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Unsubscribed</title></head>
      <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <h1>You have been unsubscribed</h1>
          <p>You will no longer receive marketing emails from us.</p>
        </div>
      </body>
      </html>
    `);
  }
}
