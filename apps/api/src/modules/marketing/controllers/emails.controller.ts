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
import { EmailsService } from '../services/emails.service';
import { CreateEmailDto } from '../dto/create-email.dto';
import { UpdateEmailDto } from '../dto/update-email.dto';
import { SendEmailDto } from '../dto/send-email.dto';

@ApiTags('Marketing Emails')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/marketing/emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get()
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'List marketing emails with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of emails' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.emailsService.findAll(tenantId, {
      status,
      search,
      limit,
      page,
    });
  }

  @Get(':id')
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'Get a single email with stats' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Email details' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const email = await this.emailsService.findOne(tenantId, id);
    const stats = await this.emailsService.getStats(tenantId, id);
    return { ...email, stats };
  }

  @Post()
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Create a new marketing email' })
  @ApiResponse({ status: 201, description: 'Email created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateEmailDto,
  ) {
    return this.emailsService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Update a marketing email' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Email updated' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmailDto,
  ) {
    return this.emailsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a marketing email' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Email deleted' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.emailsService.remove(tenantId, id);
  }

  @Post(':id/duplicate')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Duplicate a marketing email' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Email duplicated' })
  async duplicate(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.emailsService.duplicate(tenantId, id);
  }

  @Post(':id/send')
  @RequirePermissions(Permissions.EMAILS_SEND)
  @ApiOperation({ summary: 'Send email to recipients' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Email queued for sending' })
  async send(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendEmailDto,
  ) {
    // Override emailId from the route param
    dto.emailId = id;
    return this.emailsService.send(tenantId, userId, dto);
  }

  @Get(':id/stats')
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'Get email analytics' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Email statistics' })
  async getStats(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.emailsService.getStats(tenantId, id);
  }
}
