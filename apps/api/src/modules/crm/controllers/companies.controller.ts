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
import { CompaniesService } from '../services/companies.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyFilterDto } from '../dto/company-filter.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @RequirePermissions(Permissions.COMPANIES_READ)
  @ApiOperation({ summary: 'List companies with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of companies' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() filters: CompanyFilterDto,
  ) {
    return this.companiesService.findAll(tenantId, filters);
  }

  @Get(':id')
  @RequirePermissions(Permissions.COMPANIES_READ)
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Company details' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.companiesService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.COMPANIES_WRITE)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.COMPANIES_WRITE)
  @ApiOperation({ summary: 'Update a company' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Company updated' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.COMPANIES_DELETE)
  @ApiOperation({ summary: 'Delete a company' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Company deleted' })
  @ApiResponse({ status: 400, description: 'Company has associated contacts' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.companiesService.remove(tenantId, id);
  }

  @Get(':id/contacts')
  @RequirePermissions(Permissions.COMPANIES_READ)
  @ApiOperation({ summary: 'List contacts associated with a company' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of associated contacts' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findContacts(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.companiesService.findContacts(tenantId, id);
  }

  @Post(':id/contacts')
  @RequirePermissions(Permissions.COMPANIES_WRITE)
  @ApiOperation({ summary: 'Add a contact to a company' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Contact associated with company' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  addContact(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { contactId: string },
  ) {
    return this.companiesService.addContact(tenantId, id, body.contactId);
  }

  @Delete(':id/contacts/:contactId')
  @RequirePermissions(Permissions.COMPANIES_WRITE)
  @ApiOperation({ summary: 'Remove a contact from a company' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'contactId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Contact removed from company' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  removeContact(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    return this.companiesService.removeContact(tenantId, id, contactId);
  }
}
