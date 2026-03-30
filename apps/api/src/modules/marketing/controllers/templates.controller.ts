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
import { TemplatesService } from '../services/templates.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';

@ApiTags('Email Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/marketing/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'List email templates' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.templatesService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'Get a single email template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Template details' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templatesService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Create a new email template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Update an email template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an email template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Template deleted' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templatesService.remove(tenantId, id);
  }
}
