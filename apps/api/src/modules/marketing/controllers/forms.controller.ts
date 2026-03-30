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
import { FormsService } from '../services/forms.service';
import { CreateFormDto } from '../dto/create-form.dto';
import { UpdateFormDto } from '../dto/update-form.dto';

@ApiTags('Marketing Forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/marketing/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @RequirePermissions(Permissions.FORMS_READ)
  @ApiOperation({ summary: 'List forms with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of forms' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.formsService.findAll(tenantId, {
      status,
      search,
      limit,
      page,
    });
  }

  @Get(':id')
  @RequirePermissions(Permissions.FORMS_READ)
  @ApiOperation({ summary: 'Get a single form with fields and settings' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Form details' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.formsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.FORMS_WRITE)
  @ApiOperation({ summary: 'Create a new form' })
  @ApiResponse({ status: 201, description: 'Form created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateFormDto,
  ) {
    return this.formsService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.FORMS_WRITE)
  @ApiOperation({ summary: 'Update a form' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Form updated' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormDto,
  ) {
    return this.formsService.update(tenantId, id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(Permissions.FORMS_WRITE)
  @ApiOperation({ summary: 'Publish a form' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Form published' })
  async publish(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.formsService.publish(tenantId, id);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.FORMS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a form' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Form deleted' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.formsService.remove(tenantId, id);
  }

  @Get(':id/submissions')
  @RequirePermissions(Permissions.FORMS_READ)
  @ApiOperation({ summary: 'List form submissions' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Paginated list of submissions' })
  async getSubmissions(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.formsService.getSubmissions(tenantId, id, { limit, page });
  }

  @Get(':id/embed')
  @RequirePermissions(Permissions.FORMS_READ)
  @ApiOperation({ summary: 'Get form embed code' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Embed code HTML' })
  async getEmbedCode(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // Verify form exists and belongs to tenant
    await this.formsService.findOne(tenantId, id);
    const embedCode = this.formsService.getEmbedCode(tenantId, id);
    return { embedCode };
  }
}
