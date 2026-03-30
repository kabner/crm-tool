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
import { MacrosService } from '../services/macros.service';
import { CreateMacroDto } from '../dto/create-macro.dto';

@ApiTags('Ticket Macros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/service/macros')
export class MacrosController {
  constructor(private readonly macrosService: MacrosService) {}

  @Get()
  @RequirePermissions(Permissions.TICKETS_READ)
  @ApiOperation({ summary: 'List all macros' })
  @ApiResponse({ status: 200, description: 'List of macros' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.macrosService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions(Permissions.TICKETS_READ)
  @ApiOperation({ summary: 'Get a single macro by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Macro details' })
  @ApiResponse({ status: 404, description: 'Macro not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.macrosService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.TICKETS_WRITE)
  @ApiOperation({ summary: 'Create a new macro' })
  @ApiResponse({ status: 201, description: 'Macro created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateMacroDto,
  ) {
    return this.macrosService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.TICKETS_WRITE)
  @ApiOperation({ summary: 'Update a macro' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Macro updated' })
  @ApiResponse({ status: 404, description: 'Macro not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateMacroDto>,
  ) {
    return this.macrosService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.TICKETS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a macro' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Macro deleted' })
  @ApiResponse({ status: 404, description: 'Macro not found' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.macrosService.remove(tenantId, id);
  }

  @Post(':id/execute/:ticketId')
  @RequirePermissions(Permissions.TICKETS_WRITE)
  @ApiOperation({ summary: 'Execute a macro on a ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Macro ID' })
  @ApiParam({ name: 'ticketId', type: 'string', format: 'uuid', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Macro executed' })
  async execute(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
  ) {
    return this.macrosService.execute(tenantId, ticketId, id);
  }
}
