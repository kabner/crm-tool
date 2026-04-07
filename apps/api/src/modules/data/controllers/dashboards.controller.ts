import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { DashboardsService } from '../services/dashboards.service';
import { CreateDashboardDto } from '../dto/create-dashboard.dto';
import { UpdateDashboardDto } from '../dto/update-dashboard.dto';
import { CreateWidgetDto } from '../dto/create-widget.dto';

@ApiTags('Dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/data/dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get()
  @ApiOperation({ summary: 'List all dashboards' })
  @ApiResponse({ status: 200, description: 'List of dashboards with widget counts' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.dashboardsService.findAll(tenantId);
  }

  @Get('system')
  @ApiOperation({ summary: 'Get or create system dashboards' })
  @ApiResponse({ status: 200, description: 'System dashboards' })
  async getSystemDashboards(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.dashboardsService.getSystemDashboards(tenantId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dashboard with widgets' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Dashboard with widgets' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dashboardsService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new dashboard' })
  @ApiResponse({ status: 201, description: 'Dashboard created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDashboardDto,
  ) {
    return this.dashboardsService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dashboard' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Dashboard updated' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDashboardDto,
  ) {
    return this.dashboardsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a dashboard' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Dashboard deleted' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dashboardsService.remove(tenantId, id);
  }

  @Post(':id/widgets')
  @ApiOperation({ summary: 'Add a widget to a dashboard' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Widget added' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async addWidget(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWidgetDto,
  ) {
    return this.dashboardsService.addWidget(tenantId, id, dto);
  }

  @Patch(':id/widgets/:widgetId')
  @ApiOperation({ summary: 'Update a widget' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'widgetId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Widget updated' })
  @ApiResponse({ status: 404, description: 'Dashboard or widget not found' })
  async updateWidget(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('widgetId', ParseUUIDPipe) widgetId: string,
    @Body() dto: Partial<CreateWidgetDto>,
  ) {
    return this.dashboardsService.updateWidget(tenantId, id, widgetId, dto);
  }

  @Delete(':id/widgets/:widgetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a widget from a dashboard' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'widgetId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Widget removed' })
  @ApiResponse({ status: 404, description: 'Dashboard or widget not found' })
  async removeWidget(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('widgetId', ParseUUIDPipe) widgetId: string,
  ) {
    return this.dashboardsService.removeWidget(tenantId, id, widgetId);
  }
}
