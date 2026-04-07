import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { RequestUser } from '../../../shared/auth/interfaces/jwt-payload.interface';
import { FeedService } from '../services/feed.service';

@Controller('api/v1/feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getFeed(
    @CurrentUser() user: RequestUser,
    @Query('mode', new DefaultValuePipe('all')) mode: 'all' | 'mine',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.feedService.getFeed(user.tenantId, user.userId, {
      mode,
      page,
      limit,
    });
  }

  @Post('reactions')
  async toggleReaction(
    @CurrentUser() user: RequestUser,
    @Body() body: { entityType: string; entityId: string; emoji: string },
  ) {
    return this.feedService.toggleReaction(
      user.tenantId,
      user.userId,
      body.entityType,
      body.entityId,
      body.emoji,
    );
  }

  @Get('reactions/:entityType/:entityId')
  async getReactions(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.feedService.getReactions(entityType, entityId);
  }
}
