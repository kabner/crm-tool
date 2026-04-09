import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { CurrencyService } from '../services/currency.service';

class UpsertRateDto {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

@ApiTags('Currency')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  @ApiOperation({ summary: 'List all exchange rates for the tenant' })
  @ApiResponse({ status: 200, description: 'Exchange rates list' })
  getRates(@CurrentUser('tenantId') tenantId: string) {
    return this.currencyService.getRates(tenantId);
  }

  @Put('rates')
  @ApiOperation({ summary: 'Upsert an exchange rate' })
  @ApiResponse({ status: 200, description: 'Exchange rate saved' })
  upsertRate(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpsertRateDto,
  ) {
    return this.currencyService.upsertRate(
      tenantId,
      dto.fromCurrency,
      dto.toCurrency,
      dto.rate,
    );
  }

  @Get('convert')
  @ApiOperation({ summary: 'Convert an amount between currencies' })
  @ApiQuery({ name: 'amount', type: Number })
  @ApiQuery({ name: 'from', type: String })
  @ApiQuery({ name: 'to', type: String })
  @ApiResponse({ status: 200, description: 'Converted amount' })
  async convert(
    @CurrentUser('tenantId') tenantId: string,
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const converted = await this.currencyService.convert(
      tenantId,
      Number(amount),
      from,
      to,
    );
    return { amount: Number(amount), from, to, converted };
  }
}
