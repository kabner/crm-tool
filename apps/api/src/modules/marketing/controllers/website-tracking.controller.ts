import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Res,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { Public } from '../../../shared/auth/decorators/public.decorator';
import { TrackingService } from '../services/tracking.service';
import { TrackPageViewDto } from '../dto/track-page-view.dto';

@ApiTags('Website Tracking')
@Controller('api/v1/tracking/web')
export class WebsiteTrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('pageview')
  @Public()
  @ApiOperation({ summary: 'Record a page view (called from tracking JS snippet)' })
  @ApiResponse({ status: 201, description: 'Page view recorded' })
  async trackPageView(@Body() body: TrackPageViewDto & { tenantId?: string }) {
    const tenantId = body.tenantId;
    if (!tenantId) {
      return { success: false, error: 'tenantId is required' };
    }
    await this.trackingService.trackPageView(tenantId, body);
    return { success: true };
  }

  @Get('script/:tenantId')
  @Public()
  @ApiOperation({ summary: 'Get the tracking JS snippet for embedding' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'JavaScript tracking snippet' })
  async getTrackingScript(
    @Param('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const script = this.trackingService.getTrackingScript(tenantId);
    res.set('Content-Type', 'text/html');
    res.send(script);
  }

  @Get('pageviews')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List page views with filters' })
  @ApiResponse({ status: 200, description: 'Paginated page views' })
  async getPageViews(
    @CurrentUser('tenantId') tenantId: string,
    @Query('contactId') contactId?: string,
    @Query('pageUrl') pageUrl?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.trackingService.getPageViews(tenantId, {
      contactId,
      pageUrl,
      startDate,
      endDate,
      limit,
      page,
    });
  }

  @Get('contact/:contactId/journey')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get page view timeline for a contact' })
  @ApiParam({ name: 'contactId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Contact journey timeline' })
  async getContactJourney(
    @CurrentUser('tenantId') tenantId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    return this.trackingService.getContactJourney(tenantId, contactId);
  }
}
