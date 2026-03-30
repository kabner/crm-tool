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
import { ListsService } from '../services/lists.service';
import { CreateListDto } from '../dto/create-list.dto';
import { UpdateListDto } from '../dto/update-list.dto';
import { ListFilterDto } from '../dto/list-filter.dto';
import { PaginationQueryDto } from '../../../shared/common/dto/pagination.dto';

@ApiTags('Lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'List all lists with member counts' })
  @ApiResponse({ status: 200, description: 'Paginated list of lists' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() filters: ListFilterDto,
  ) {
    return this.listsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'Get a single list by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List details with member count' })
  @ApiResponse({ status: 404, description: 'List not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listsService.findOne(tenantId, id);
  }

  @Get(':id/members')
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'Get paginated members of a list' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Paginated list of contacts' })
  @ApiResponse({ status: 404, description: 'List not found' })
  async getMembers(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.listsService.getMembers(tenantId, id, pagination);
  }

  @Post()
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Create a new list' })
  @ApiResponse({ status: 201, description: 'List created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateListDto,
  ) {
    return this.listsService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Update a list' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List updated' })
  @ApiResponse({ status: 404, description: 'List not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListDto,
  ) {
    return this.listsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a list and its memberships' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'List deleted' })
  @ApiResponse({ status: 404, description: 'List not found' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listsService.remove(tenantId, id);
  }

  @Post(':id/members')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Add contacts to a static list' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Members added' })
  @ApiResponse({ status: 400, description: 'Cannot add to smart list' })
  async addMembers(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { contactIds: string[] },
  ) {
    return this.listsService.addMembers(tenantId, id, body.contactIds);
  }

  @Post(':id/members/remove')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove contacts from a static list' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Members removed' })
  @ApiResponse({ status: 400, description: 'Cannot remove from smart list' })
  async removeMembers(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { contactIds: string[] },
  ) {
    return this.listsService.removeMembers(tenantId, id, body.contactIds);
  }

  @Post('preview')
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'Preview smart list filter result count' })
  @ApiResponse({
    status: 200,
    description: 'Count of contacts matching the filter',
  })
  async preview(
    @CurrentUser('tenantId') tenantId: string,
    @Body() filters: Record<string, any>,
  ) {
    return this.listsService.evaluateSmartList(tenantId, filters);
  }
}
