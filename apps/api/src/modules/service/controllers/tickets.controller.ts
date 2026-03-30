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
import { TicketsService } from '../services/tickets.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketFilterDto } from '../dto/ticket-filter.dto';
import { CreateTicketMessageDto } from '../dto/create-ticket-message.dto';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('stats')
  @RequirePermissions(Permissions.TICKETS_READ)
  @ApiOperation({ summary: 'Get ticket statistics' })
  @ApiResponse({ status: 200, description: 'Ticket stats' })
  async getStats(@CurrentUser('tenantId') tenantId: string) {
    return this.ticketsService.getStats(tenantId);
  }

  @Get()
  @RequirePermissions(Permissions.TICKETS_READ)
  @ApiOperation({ summary: 'List tickets with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of tickets' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() filters: TicketFilterDto,
  ) {
    return this.ticketsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @RequirePermissions(Permissions.TICKETS_READ)
  @ApiOperation({ summary: 'Get a single ticket by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket details with messages' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ticketsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.TICKETS_WRITE)
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.TICKETS_WRITE)
  @ApiOperation({ summary: 'Update a ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.TICKETS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Ticket deleted' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ticketsService.remove(tenantId, id);
  }

  @Post(':id/messages')
  @RequirePermissions(Permissions.TICKETS_WRITE)
  @ApiOperation({ summary: 'Add a message or note to a ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Message added' })
  async addMessage(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTicketMessageDto,
  ) {
    return this.ticketsService.addMessage(tenantId, id, userId, dto);
  }

  @Post(':id/assign')
  @RequirePermissions(Permissions.TICKETS_ASSIGN)
  @ApiOperation({ summary: 'Assign a ticket to a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket assigned' })
  async assign(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { userId: string },
  ) {
    return this.ticketsService.assign(tenantId, id, body.userId);
  }

  @Post(':id/close')
  @RequirePermissions(Permissions.TICKETS_WRITE)
  @ApiOperation({ summary: 'Close a ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket closed' })
  async close(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ticketsService.close(tenantId, id);
  }
}
