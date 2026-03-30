import {
  Controller,
  Get,
  Post,
  Patch,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { InvoicesService } from '../services/invoices.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';

@ApiTags('Commerce - Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/commerce/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of invoices' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('contactId') contactId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.invoicesService.findAll(tenantId, {
      page,
      limit,
      status,
      contactId,
      startDate,
      endDate,
    });
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiResponse({ status: 200, description: 'List of overdue invoices' })
  async getOverdue(@CurrentUser('tenantId') tenantId: string) {
    return this.invoicesService.getOverdue(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice details with line items' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(tenantId, id, dto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice sent' })
  async send(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.send(tenantId, id);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  async markPaid(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.markPaid(tenantId, id);
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice voided' })
  async void(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.void(tenantId, id);
  }
}
