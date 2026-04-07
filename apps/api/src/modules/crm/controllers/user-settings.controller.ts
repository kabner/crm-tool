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
import { UserSettingsService } from '../services/user-settings.service';
import { UpsertUserSettingDto } from '../dto/user-setting.dto';

@ApiTags('User Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/user-settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Get(':section')
  @ApiOperation({ summary: 'Get settings for a section' })
  @ApiParam({ name: 'section', type: 'string' })
  @ApiResponse({ status: 200, description: 'Settings object' })
  get(
    @CurrentUser('userId') userId: string,
    @Param('section') section: string,
  ) {
    return this.userSettingsService.get(userId, section);
  }

  @Put(':section')
  @ApiOperation({ summary: 'Upsert settings for a section' })
  @ApiParam({ name: 'section', type: 'string' })
  @ApiResponse({ status: 200, description: 'Settings saved' })
  upsert(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('section') section: string,
    @Body() dto: UpsertUserSettingDto,
  ) {
    return this.userSettingsService.upsert(tenantId, userId, section, dto.settings);
  }
}
