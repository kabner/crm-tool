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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { SavedViewsService } from '../services/saved-views.service';
import { CreateSavedViewDto } from '../dto/create-saved-view.dto';
import { UpdateSavedViewDto } from '../dto/update-saved-view.dto';

@ApiTags('Saved Views')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/views')
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Get()
  @ApiOperation({ summary: 'List saved views for an object type' })
  @ApiQuery({
    name: 'objectType',
    enum: ['contact', 'company', 'deal'],
    required: true,
  })
  @ApiResponse({ status: 200, description: 'List of saved views' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Query('objectType') objectType: string,
  ) {
    return this.savedViewsService.findAll(tenantId, userId, objectType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single saved view' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Saved view details' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.savedViewsService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new saved view' })
  @ApiResponse({ status: 201, description: 'View created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSavedViewDto,
  ) {
    return this.savedViewsService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saved view' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'View updated' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSavedViewDto,
  ) {
    return this.savedViewsService.update(tenantId, userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved view' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'View deleted' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.savedViewsService.remove(tenantId, userId, id);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set a view as default for its object type' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'View set as default' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async setDefault(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('objectType') objectType: string,
  ) {
    return this.savedViewsService.setDefault(
      tenantId,
      userId,
      id,
      objectType,
    );
  }
}
