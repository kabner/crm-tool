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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { ActivityTypesService } from '../services/activity-types.service';

@ApiTags('Activity Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/activity-types')
export class ActivityTypesController {
  constructor(private readonly activityTypesService: ActivityTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List activity type options' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.activityTypesService.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an activity type option' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: { name: string; slug: string; icon?: string; color?: string; isInteraction?: boolean },
  ) {
    return this.activityTypesService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an activity type option' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; icon?: string; color?: string; isInteraction?: boolean; position?: number },
  ) {
    return this.activityTypesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity type option (system types protected)' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activityTypesService.remove(tenantId, id);
  }
}
