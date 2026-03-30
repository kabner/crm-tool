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
import { WorkflowsService } from '../services/workflows.service';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';

@ApiTags('Marketing Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/marketing/workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  @RequirePermissions(Permissions.AUTOMATION_READ)
  @ApiOperation({ summary: 'List workflows with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of workflows' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.workflowsService.findAll(tenantId, {
      status,
      search,
      limit,
      page,
    });
  }

  @Get(':id')
  @RequirePermissions(Permissions.AUTOMATION_READ)
  @ApiOperation({ summary: 'Get workflow detail with nodes and edges' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Workflow details' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.AUTOMATION_WRITE)
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateWorkflowDto,
  ) {
    return this.workflowsService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.AUTOMATION_WRITE)
  @ApiOperation({ summary: 'Update a workflow including nodes and edges' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Workflow updated' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(tenantId, id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(Permissions.AUTOMATION_PUBLISH)
  @ApiOperation({ summary: 'Publish and activate a workflow' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Workflow published' })
  async publish(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.publish(tenantId, id);
  }

  @Post(':id/pause')
  @RequirePermissions(Permissions.AUTOMATION_WRITE)
  @ApiOperation({ summary: 'Pause an active workflow' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Workflow paused' })
  async pause(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.pause(tenantId, id);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.AUTOMATION_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a draft workflow' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Workflow deleted' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.remove(tenantId, id);
  }

  @Post(':id/enroll')
  @RequirePermissions(Permissions.AUTOMATION_WRITE)
  @ApiOperation({ summary: 'Enroll a contact in a workflow' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Contact enrolled' })
  async enrollContact(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('contactId', ParseUUIDPipe) contactId: string,
  ) {
    return this.workflowsService.enrollContact(tenantId, id, contactId);
  }

  @Get(':id/enrollments')
  @RequirePermissions(Permissions.AUTOMATION_READ)
  @ApiOperation({ summary: 'List workflow enrollments' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Paginated list of enrollments' })
  async getEnrollments(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.workflowsService.getEnrollments(tenantId, id, {
      status,
      limit,
      page,
    });
  }

  @Get(':id/stats')
  @RequirePermissions(Permissions.AUTOMATION_READ)
  @ApiOperation({ summary: 'Get workflow analytics' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Workflow statistics' })
  async getStats(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.getStats(tenantId, id);
  }
}
