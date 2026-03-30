import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { CampaignsService } from '../services/campaigns.service';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/marketing/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'List campaigns with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of campaigns' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.campaignsService.findAll(tenantId, {
      search,
      status,
      type,
      limit,
      page,
    });
  }

  @Get(':id')
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'Get a single campaign' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Campaign details' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Campaign updated' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Campaign deleted' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.remove(tenantId, id);
  }

  @Get(':id/stats')
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'Get campaign statistics' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Campaign statistics' })
  async getStats(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.getStats(tenantId, id);
  }
}
