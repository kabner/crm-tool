/// <reference types="multer" />
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
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { AssetsService } from '../services/assets.service';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { CreateAssetFolderDto } from '../dto/create-asset-folder.dto';
import { UpdateAssetFolderDto } from '../dto/update-asset-folder.dto';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @RequirePermissions(Permissions.ASSETS_WRITE)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file asset' })
  @ApiResponse({ status: 201, description: 'Asset uploaded' })
  async upload(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.assetsService.upload(tenantId, userId, file, folderId);
  }

  @Get()
  @RequirePermissions(Permissions.ASSETS_READ)
  @ApiOperation({ summary: 'List assets with optional filtering' })
  @ApiResponse({ status: 200, description: 'Paginated list of assets' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('folderId') folderId?: string,
    @Query('search') search?: string,
    @Query('mimeType') mimeType?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.assetsService.findAll(tenantId, {
      folderId,
      search,
      mimeType,
      limit,
      page,
    });
  }

  @Get(':id')
  @RequirePermissions(Permissions.ASSETS_READ)
  @ApiOperation({ summary: 'Get a single asset' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Asset details' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assetsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.ASSETS_WRITE)
  @ApiOperation({ summary: 'Update asset metadata' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Asset updated' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.ASSETS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an asset' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Asset deleted' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assetsService.remove(tenantId, id);
  }

  // Folder operations

  @Post('folders')
  @RequirePermissions(Permissions.ASSETS_WRITE)
  @ApiOperation({ summary: 'Create an asset folder' })
  @ApiResponse({ status: 201, description: 'Folder created' })
  async createFolder(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateAssetFolderDto,
  ) {
    return this.assetsService.createFolder(tenantId, dto);
  }

  @Get('folders')
  @RequirePermissions(Permissions.ASSETS_READ)
  @ApiOperation({ summary: 'List asset folders' })
  @ApiResponse({ status: 200, description: 'List of folders' })
  async getFolders(
    @CurrentUser('tenantId') tenantId: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.assetsService.getFolders(tenantId, parentId);
  }

  @Patch('folders/:id')
  @RequirePermissions(Permissions.ASSETS_WRITE)
  @ApiOperation({ summary: 'Update an asset folder' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Folder updated' })
  async updateFolder(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetFolderDto,
  ) {
    return this.assetsService.updateFolder(tenantId, id, dto);
  }

  @Delete('folders/:id')
  @RequirePermissions(Permissions.ASSETS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an asset folder' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Folder deleted' })
  async removeFolder(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assetsService.removeFolder(tenantId, id);
  }
}
