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
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PipelinesService } from '../services/pipelines.service';
import { CreatePipelineDto } from '../dto/create-pipeline.dto';
import { UpdatePipelineDto } from '../dto/update-pipeline.dto';

@ApiTags('Pipelines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  @RequirePermissions(Permissions.DEALS_READ)
  @ApiOperation({ summary: 'List all pipelines' })
  @ApiResponse({ status: 200, description: 'List of pipelines with stage counts' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.pipelinesService.findAll(tenantId);
  }

  @Get('default')
  @RequirePermissions(Permissions.DEALS_READ)
  @ApiOperation({ summary: 'Get the default pipeline' })
  @ApiResponse({ status: 200, description: 'Default pipeline with stages' })
  @ApiResponse({ status: 404, description: 'No default pipeline configured' })
  async getDefault(@CurrentUser('tenantId') tenantId: string) {
    return this.pipelinesService.getDefault(tenantId);
  }

  @Get(':id')
  @RequirePermissions(Permissions.DEALS_READ)
  @ApiOperation({ summary: 'Get a single pipeline with stages' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Pipeline with stages' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pipelinesService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.PIPELINES_CONFIGURE)
  @ApiOperation({ summary: 'Create a new pipeline' })
  @ApiResponse({ status: 201, description: 'Pipeline created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreatePipelineDto,
  ) {
    return this.pipelinesService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.PIPELINES_CONFIGURE)
  @ApiOperation({ summary: 'Update a pipeline' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Pipeline updated' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePipelineDto,
  ) {
    return this.pipelinesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.PIPELINES_CONFIGURE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a pipeline' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Pipeline deleted' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  @ApiResponse({
    status: 409,
    description: 'Pipeline has deals and cannot be deleted',
  })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pipelinesService.remove(tenantId, id);
  }
}
