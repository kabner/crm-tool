import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { AttachmentsService } from '../services/attachments.service';

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.attachmentsService.findAll(tenantId, entityType, entityId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async upload(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: any,
    @Body() body: { entityType: string; entityId: string },
  ) {
    return this.attachmentsService.create(tenantId, userId, {
      entityType: body.entityType,
      entityId: body.entityId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileUrl: `/uploads/${file.filename}`,
    });
  }

  @Delete(':id')
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attachmentsService.remove(tenantId, id);
  }
}
