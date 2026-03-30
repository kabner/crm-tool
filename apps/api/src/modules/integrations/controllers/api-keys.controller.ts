import {
  Controller,
  Get,
  Post,
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
import { ApiKeysService } from '../services/api-keys.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/integrations/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @RequirePermissions(Permissions.API_KEYS_MANAGE)
  @ApiOperation({ summary: 'List API keys (never returns full key)' })
  @ApiResponse({ status: 200, description: 'List of API keys' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.apiKeysService.findAll(tenantId);
  }

  @Post()
  @RequirePermissions(Permissions.API_KEYS_MANAGE)
  @ApiOperation({ summary: 'Create an API key (returns plain key once)' })
  @ApiResponse({ status: 201, description: 'API key created with plain key' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    const { key, plainKey } = await this.apiKeysService.create(
      tenantId,
      userId,
      dto,
    );

    return {
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      rateLimit: key.rateLimit,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      plainKey,
    };
  }

  @Delete(':id')
  @RequirePermissions(Permissions.API_KEYS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async revoke(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.revoke(tenantId, id);
  }
}
