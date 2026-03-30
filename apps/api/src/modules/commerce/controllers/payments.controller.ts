import {
  Controller,
  Get,
  Post,
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
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';

@ApiTags('Commerce - Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/commerce/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List payments with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of payments' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.findAll(tenantId, { page, limit });
  }

  @Post()
  @ApiOperation({ summary: 'Record a payment' })
  @ApiResponse({ status: 201, description: 'Payment recorded' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(tenantId, dto);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded' })
  async refund(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { amount: number },
  ) {
    return this.paymentsService.refund(tenantId, id, body.amount);
  }
}
