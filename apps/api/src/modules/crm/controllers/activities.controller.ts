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
import { RbacGuard } from '../../../shared/auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { RequestUser } from '../../../shared/auth/interfaces/jwt-payload.interface';
import { ActivitiesService } from '../services/activities.service';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { ActivityFilterDto } from '../dto/activity-filter.dto';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('api/v1/activities')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({ status: 201, description: 'Activity created' })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user.tenantId, user.userId, dto);
  }

  @Get()
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'List activities with filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of activities' })
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query() filters: ActivityFilterDto,
  ) {
    return this.activitiesService.findAll(user.tenantId, filters);
  }

  @Get('tasks/upcoming')
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'Get upcoming tasks for the current user' })
  @ApiResponse({ status: 200, description: 'List of upcoming tasks' })
  async getUpcomingTasks(@CurrentUser() user: RequestUser) {
    return this.activitiesService.getUpcomingTasks(
      user.tenantId,
      user.userId,
    );
  }

  @Get('contact/:contactId')
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'Get activity timeline for a contact' })
  @ApiParam({ name: 'contactId', type: String })
  @ApiResponse({ status: 200, description: 'Contact activity timeline' })
  async findByContact(
    @CurrentUser() user: RequestUser,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Query() filters: ActivityFilterDto,
  ) {
    return this.activitiesService.findByContact(
      user.tenantId,
      contactId,
      filters,
    );
  }

  @Get('company/:companyId')
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'Get activity timeline for a company' })
  @ApiParam({ name: 'companyId', type: String })
  @ApiResponse({ status: 200, description: 'Company activity timeline' })
  async findByCompany(
    @CurrentUser() user: RequestUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() filters: ActivityFilterDto,
  ) {
    return this.activitiesService.findByCompany(
      user.tenantId,
      companyId,
      filters,
    );
  }

  @Get(':id')
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'Get a single activity' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Activity details' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activitiesService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Update an activity' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Activity updated' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(user.tenantId, id, dto);
  }

  @Patch(':id/complete')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Mark a task as completed' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Task marked as completed' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async complete(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activitiesService.complete(user.tenantId, id);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Activity deleted' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activitiesService.remove(user.tenantId, id);
  }
}
