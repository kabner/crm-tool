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
import { CategoriesService } from '../services/categories.service';
import { CreateContentCategoryDto } from '../dto/create-content-category.dto';
import { UpdateContentCategoryDto } from '../dto/update-content-category.dto';

@ApiTags('Content Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/content/categories')
export class ContentCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions(Permissions.CONTENT_READ)
  @ApiOperation({ summary: 'List content categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('type') type?: string,
  ) {
    return this.categoriesService.findAll(tenantId, type);
  }

  @Get(':id')
  @RequirePermissions(Permissions.CONTENT_READ)
  @ApiOperation({ summary: 'Get a single content category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.CONTENT_WRITE)
  @ApiOperation({ summary: 'Create a content category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateContentCategoryDto,
  ) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.CONTENT_WRITE)
  @ApiOperation({ summary: 'Update a content category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.CONTENT_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a content category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.remove(tenantId, id);
  }
}
