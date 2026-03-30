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
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { KnowledgeBaseService } from '../services/knowledge-base.service';
import { CreateKBCategoryDto } from '../dto/create-kb-category.dto';
import { UpdateKBCategoryDto } from '../dto/update-kb-category.dto';
import { CreateKBSectionDto } from '../dto/create-kb-section.dto';
import { UpdateKBSectionDto } from '../dto/update-kb-section.dto';
import { CreateKBArticleDto } from '../dto/create-kb-article.dto';
import { UpdateKBArticleDto } from '../dto/update-kb-article.dto';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/service/kb')
export class KnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  // ── Categories ──────────────────────────────────────────────────

  @Get('categories')
  @RequirePermissions(Permissions.KB_READ)
  @ApiOperation({ summary: 'List KB categories with sections' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async findAllCategories(@CurrentUser('tenantId') tenantId: string) {
    return this.kbService.findAllCategories(tenantId);
  }

  @Post('categories')
  @RequirePermissions(Permissions.KB_WRITE)
  @ApiOperation({ summary: 'Create a KB category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateKBCategoryDto,
  ) {
    return this.kbService.createCategory(tenantId, dto);
  }

  @Patch('categories/:id')
  @RequirePermissions(Permissions.KB_WRITE)
  @ApiOperation({ summary: 'Update a KB category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateCategory(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKBCategoryDto,
  ) {
    return this.kbService.updateCategory(tenantId, id, dto);
  }

  @Delete('categories/:id')
  @RequirePermissions(Permissions.KB_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a KB category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async removeCategory(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.kbService.removeCategory(tenantId, id);
  }

  @Get('categories/:id/sections')
  @RequirePermissions(Permissions.KB_READ)
  @ApiOperation({ summary: 'List sections for a category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findSectionsByCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.kbService.findSectionsByCategory(id);
  }

  // ── Sections ────────────────────────────────────────────────────

  @Post('sections')
  @RequirePermissions(Permissions.KB_WRITE)
  @ApiOperation({ summary: 'Create a KB section' })
  @ApiResponse({ status: 201, description: 'Section created' })
  async createSection(@Body() dto: CreateKBSectionDto) {
    return this.kbService.createSection(dto);
  }

  @Patch('sections/:id')
  @RequirePermissions(Permissions.KB_WRITE)
  @ApiOperation({ summary: 'Update a KB section' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKBSectionDto,
  ) {
    return this.kbService.updateSection(id, dto);
  }

  @Delete('sections/:id')
  @RequirePermissions(Permissions.KB_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a KB section' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async removeSection(@Param('id', ParseUUIDPipe) id: string) {
    return this.kbService.removeSection(id);
  }

  // ── Articles ────────────────────────────────────────────────────

  @Get('articles')
  @RequirePermissions(Permissions.KB_READ)
  @ApiOperation({ summary: 'List KB articles with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sectionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'visibility', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAllArticles(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
    @Query('search') search?: string,
  ) {
    return this.kbService.findAllArticles(tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sectionId,
      status,
      visibility,
      search,
    });
  }

  @Get('articles/search')
  @RequirePermissions(Permissions.KB_READ)
  @ApiOperation({ summary: 'Search KB articles' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'visibility', required: false, type: String })
  async searchArticles(
    @CurrentUser('tenantId') tenantId: string,
    @Query('q') q: string,
    @Query('visibility') visibility?: string,
  ) {
    return this.kbService.search(tenantId, q, visibility);
  }

  @Get('articles/popular')
  @RequirePermissions(Permissions.KB_READ)
  @ApiOperation({ summary: 'Get popular KB articles' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularArticles(
    @CurrentUser('tenantId') tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.kbService.getPopularArticles(
      tenantId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('articles/slug/:slug')
  @RequirePermissions(Permissions.KB_READ)
  @ApiOperation({ summary: 'Get a KB article by slug' })
  @ApiParam({ name: 'slug', type: 'string' })
  async findBySlug(
    @CurrentUser('tenantId') tenantId: string,
    @Param('slug') slug: string,
  ) {
    return this.kbService.findBySlug(tenantId, slug);
  }

  @Get('articles/:id')
  @RequirePermissions(Permissions.KB_READ)
  @ApiOperation({ summary: 'Get a single KB article' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOneArticle(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.kbService.findOneArticle(tenantId, id);
  }

  @Post('articles')
  @RequirePermissions(Permissions.KB_WRITE)
  @ApiOperation({ summary: 'Create a KB article' })
  @ApiResponse({ status: 201, description: 'Article created' })
  async createArticle(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateKBArticleDto,
  ) {
    return this.kbService.createArticle(tenantId, userId, dto);
  }

  @Patch('articles/:id')
  @RequirePermissions(Permissions.KB_WRITE)
  @ApiOperation({ summary: 'Update a KB article' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateArticle(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKBArticleDto,
  ) {
    return this.kbService.updateArticle(tenantId, id, dto);
  }

  @Post('articles/:id/publish')
  @RequirePermissions(Permissions.KB_PUBLISH)
  @ApiOperation({ summary: 'Publish a KB article' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async publishArticle(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.kbService.publishArticle(tenantId, id);
  }

  @Delete('articles/:id')
  @RequirePermissions(Permissions.KB_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a KB article' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async removeArticle(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.kbService.removeArticle(tenantId, id);
  }

  @Post('articles/:id/feedback')
  @RequirePermissions(Permissions.KB_READ)
  @ApiOperation({ summary: 'Submit article feedback (helpful/not helpful)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async feedbackArticle(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { helpful: boolean },
  ) {
    return this.kbService.feedback(tenantId, id, body.helpful);
  }
}
