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
import { LeadsService } from '../services/leads.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { LeadFilterDto } from '../dto/lead-filter.dto';
import { ConvertLeadDto } from '../dto/convert-lead.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @RequirePermissions(Permissions.LEADS_READ)
  @ApiOperation({ summary: 'List leads with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of leads' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() filters: LeadFilterDto,
  ) {
    return this.leadsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @RequirePermissions(Permissions.LEADS_READ)
  @ApiOperation({ summary: 'Get a single lead by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead details' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leadsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.LEADS_WRITE)
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.LEADS_WRITE)
  @ApiOperation({ summary: 'Update a lead' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead updated' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.LEADS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Lead deleted' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leadsService.remove(tenantId, id);
  }

  @Post(':id/convert')
  @RequirePermissions(Permissions.LEADS_WRITE)
  @ApiOperation({ summary: 'Convert a lead to a contact (and optionally a deal)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead converted' })
  @ApiResponse({ status: 400, description: 'Lead already converted or invalid input' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async convert(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.leadsService.convert(tenantId, userId, id, dto);
  }
}
