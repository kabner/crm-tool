import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CardScannerService } from '../services/card-scanner.service';

@ApiTags('Card Scanner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/scan-card')
export class CardScannerController {
  constructor(private readonly scannerService: CardScannerService) {}

  @Post()
  @ApiOperation({
    summary: 'Scan business card image and extract contact info',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req: any, file: any, cb: any) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed'), false);
        }
      },
    }),
  )
  async scan(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    return this.scannerService.scanCard(file.buffer);
  }
}
