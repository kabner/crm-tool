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
import { DealsService } from '../services/deals.service';
import { CreateDealDto } from '../dto/create-deal.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { DealFilterDto } from '../dto/deal-filter.dto';
import { MoveDealDto } from '../dto/move-deal.dto';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @RequirePermissions(Permissions.DEALS_READ)
  @ApiOperation({ summary: 'List deals with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of deals' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() filters: DealFilterDto,
  ) {
    return this.dealsService.findAll(tenantId, filters);
  }

  @Get('pipeline/:pipelineId')
  @RequirePermissions(Permissions.DEALS_READ)
  @ApiOperation({ summary: 'Get deals grouped by stage for Kanban board' })
  @ApiParam({ name: 'pipelineId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Deals grouped by pipeline stages',
  })
  async getByPipeline(
    @CurrentUser('tenantId') tenantId: string,
    @Param('pipelineId', ParseUUIDPipe) pipelineId: string,
  ) {
    return this.dealsService.getByPipeline(tenantId, pipelineId);
  }

  @Get('pipeline/:pipelineId/summary')
  @RequirePermissions(Permissions.DEALS_READ)
  @ApiOperation({ summary: 'Get pipeline summary statistics' })
  @ApiParam({ name: 'pipelineId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Pipeline summary with stage stats' })
  async getSummary(
    @CurrentUser('tenantId') tenantId: string,
    @Param('pipelineId', ParseUUIDPipe) pipelineId: string,
  ) {
    return this.dealsService.getSummary(tenantId, pipelineId);
  }

  @Get(':id')
  @RequirePermissions(Permissions.DEALS_READ)
  @ApiOperation({ summary: 'Get a single deal by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deal details' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dealsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.DEALS_WRITE)
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({ status: 201, description: 'Deal created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDealDto,
  ) {
    return this.dealsService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.DEALS_WRITE)
  @ApiOperation({ summary: 'Update a deal' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deal updated' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealsService.update(tenantId, id, dto);
  }

  @Patch(':id/stage')
  @RequirePermissions(Permissions.DEALS_WRITE)
  @ApiOperation({ summary: 'Move deal to a different stage' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deal moved to new stage' })
  @ApiResponse({ status: 404, description: 'Deal or stage not found' })
  async moveStage(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveDealDto,
  ) {
    return this.dealsService.moveStage(tenantId, id, dto.stageId, dto.position);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.DEALS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deal' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deal deleted' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dealsService.remove(tenantId, id);
  }
}
