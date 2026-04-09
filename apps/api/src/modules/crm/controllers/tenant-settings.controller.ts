import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { TenantSettingsService } from '../services/tenant-settings.service';
import { UpsertTenantSettingDto } from '../dto/tenant-setting.dto';

@ApiTags('Tenant Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/tenant-settings')
export class TenantSettingsController {
  constructor(private readonly tenantSettingsService: TenantSettingsService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Get a tenant setting by key' })
  @ApiParam({ name: 'key', type: 'string' })
  @ApiResponse({ status: 200, description: 'Setting value object' })
  get(
    @CurrentUser('tenantId') tenantId: string,
    @Param('key') key: string,
  ) {
    return this.tenantSettingsService.get(tenantId, key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Upsert a tenant setting' })
  @ApiParam({ name: 'key', type: 'string' })
  @ApiResponse({ status: 200, description: 'Setting saved' })
  upsert(
    @CurrentUser('tenantId') tenantId: string,
    @Param('key') key: string,
    @Body() dto: UpsertTenantSettingDto,
  ) {
    return this.tenantSettingsService.upsert(tenantId, key, dto.value);
  }
}
