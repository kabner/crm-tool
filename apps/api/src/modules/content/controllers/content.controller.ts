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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { ContentService } from '../services/content.service';
import { CreateContentPageDto } from '../dto/create-content-page.dto';
import { UpdateContentPageDto } from '../dto/update-content-page.dto';
import { ContentFilterDto } from '../dto/content-filter.dto';

@ApiTags('Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('pages')
  @RequirePermissions(Permissions.CONTENT_READ)
  @ApiOperation({ summary: 'List content pages with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of content pages' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() filters: ContentFilterDto,
  ) {
    return this.contentService.findAll(tenantId, filters);
  }

  @Get('pages/:id')
  @RequirePermissions(Permissions.CONTENT_READ)
  @ApiOperation({ summary: 'Get a single content page' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Content page details' })
  @ApiResponse({ status: 404, description: 'Content page not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contentService.findOne(tenantId, id);
  }

  @Get('pages/slug/:slug')
  @RequirePermissions(Permissions.CONTENT_READ)
  @ApiOperation({ summary: 'Get content page by slug' })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({ status: 200, description: 'Content page details' })
  @ApiResponse({ status: 404, description: 'Content page not found' })
  async findBySlug(
    @CurrentUser('tenantId') tenantId: string,
    @Param('slug') slug: string,
  ) {
    return this.contentService.findBySlug(tenantId, slug);
  }

  @Post('pages')
  @RequirePermissions(Permissions.CONTENT_WRITE)
  @ApiOperation({ summary: 'Create a new content page' })
  @ApiResponse({ status: 201, description: 'Content page created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateContentPageDto,
  ) {
    return this.contentService.create(tenantId, userId, dto);
  }

  @Patch('pages/:id')
  @RequirePermissions(Permissions.CONTENT_WRITE)
  @ApiOperation({ summary: 'Update a content page' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Content page updated' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentPageDto,
  ) {
    return this.contentService.update(tenantId, id, dto);
  }

  @Post('pages/:id/publish')
  @RequirePermissions(Permissions.CONTENT_PUBLISH)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a content page' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Content page published' })
  async publish(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contentService.publish(tenantId, id);
  }

  @Post('pages/:id/unpublish')
  @RequirePermissions(Permissions.CONTENT_PUBLISH)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish a content page (revert to draft)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Content page unpublished' })
  async unpublish(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contentService.unpublish(tenantId, id);
  }

  @Delete('pages/:id')
  @RequirePermissions(Permissions.CONTENT_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a content page' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Content page deleted' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contentService.remove(tenantId, id);
  }

  @Get('pages/:id/versions')
  @RequirePermissions(Permissions.CONTENT_READ)
  @ApiOperation({ summary: 'List version history for a content page' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of content versions' })
  async getVersions(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contentService.getVersions(tenantId, id);
  }

  @Post('pages/:id/revert/:versionId')
  @RequirePermissions(Permissions.CONTENT_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revert content page to a previous version' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'versionId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Content page reverted' })
  async revertToVersion(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.contentService.revertToVersion(tenantId, id, versionId);
  }
}
