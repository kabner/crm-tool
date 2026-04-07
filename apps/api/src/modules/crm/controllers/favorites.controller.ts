import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { FavoritesService } from '../services/favorites.service';
import { CreateFavoriteDto } from '../dto/create-favorite.dto';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle a favorite' })
  @ApiResponse({ status: 201, description: 'Favorite toggled' })
  toggle(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFavoriteDto,
  ) {
    return this.favoritesService.toggle(tenantId, userId, dto.entityType, dto.entityId);
  }

  @Get()
  @ApiOperation({ summary: 'List favorites' })
  @ApiResponse({ status: 200, description: 'List of favorites' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.favoritesService.findAll(tenantId, userId, entityType);
  }
}
