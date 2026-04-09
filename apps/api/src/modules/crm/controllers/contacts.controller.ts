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
import { ContactsService } from '../services/contacts.service';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactFilterDto } from '../dto/contact-filter.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'List contacts with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of contacts' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Query() filters: ContactFilterDto,
  ) {
    return this.contactsService.findAll(tenantId, filters, userId);
  }

  @Get('duplicates')
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'Find duplicate contacts' })
  @ApiResponse({ status: 200, description: 'List of duplicate contact pairs' })
  async findDuplicates(@CurrentUser('tenantId') tenantId: string) {
    return this.contactsService.findDuplicates(tenantId);
  }

  @Post('merge')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Merge two contacts' })
  @ApiResponse({ status: 200, description: 'Merged contact' })
  async merge(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { keepId: string; mergeId: string },
  ) {
    return this.contactsService.merge(tenantId, body.keepId, body.mergeId);
  }

  @Get(':id')
  @RequirePermissions(Permissions.CONTACTS_READ)
  @ApiOperation({ summary: 'Get a single contact by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Contact details' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(tenantId, dto, userId);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Update a contact' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Contact updated' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.CONTACTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Contact deleted' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactsService.remove(tenantId, id);
  }

  @Post('bulk-update')
  @RequirePermissions(Permissions.CONTACTS_WRITE)
  @ApiOperation({ summary: 'Bulk update contacts' })
  @ApiResponse({ status: 200, description: 'Number of contacts updated' })
  async bulkUpdate(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { ids: string[]; update: UpdateContactDto },
  ) {
    const affected = await this.contactsService.bulkUpdate(
      tenantId,
      body.ids,
      body.update,
    );
    return { affected };
  }

  @Post('bulk-delete')
  @RequirePermissions(Permissions.CONTACTS_DELETE)
  @ApiOperation({ summary: 'Bulk delete contacts' })
  @ApiResponse({ status: 200, description: 'Number of contacts deleted' })
  async bulkDelete(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { ids: string[] },
  ) {
    const affected = await this.contactsService.bulkDelete(
      tenantId,
      body.ids,
    );
    return { affected };
  }
}
