import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { SearchService, SearchResults } from '../services/search.service';

@Controller('api/v1/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async globalSearch(
    @CurrentUser('tenantId') tenantId: string,
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @Query('types') types?: string,
  ): Promise<SearchResults> {
    const options: { limit?: number; types?: string[] } = {};

    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    if (types) {
      options.types = types.split(',').map((t) => t.trim());
    }

    return this.searchService.globalSearch(tenantId, q, options);
  }
}
