/// <reference types="multer" />
import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { ImportExportService } from '../services/import-export.service';
import { ExportDto } from '../dto/export.dto';

@ApiTags('Import/Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/import-export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Post('contacts/export')
  @RequirePermissions(Permissions.CONTACTS_EXPORT)
  @ApiOperation({ summary: 'Export contacts as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportContacts(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: ExportDto,
    @Res() res: Response,
  ) {
    const csv = await this.importExportService.exportContacts(
      tenantId,
      dto.filters,
      dto.columns,
    );

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="contacts_${timestamp}.csv"`,
    );
    res.send(csv);
  }

  @Post('companies/export')
  @RequirePermissions(Permissions.CONTACTS_EXPORT)
  @ApiOperation({ summary: 'Export companies as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportCompanies(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: ExportDto,
    @Res() res: Response,
  ) {
    const csv = await this.importExportService.exportCompanies(
      tenantId,
      dto.filters,
      dto.columns,
    );

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="companies_${timestamp}.csv"`,
    );
    res.send(csv);
  }

  @Post('parse')
  @RequirePermissions(Permissions.CONTACTS_IMPORT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Parse CSV file and return headers + preview' })
  @ApiResponse({ status: 200, description: 'Parsed CSV headers and preview rows' })
  async parseCSV(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    return this.importExportService.parseCSV(file.buffer);
  }

  @Post('contacts/import')
  @RequirePermissions(Permissions.CONTACTS_IMPORT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import contacts from CSV' })
  @ApiResponse({ status: 200, description: 'Import results' })
  async importContacts(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      fieldMapping: string;
      duplicateHandling: 'skip' | 'update' | 'create';
      duplicateField: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    let fieldMapping: Record<string, string>;
    try {
      fieldMapping =
        typeof body.fieldMapping === 'string'
          ? JSON.parse(body.fieldMapping)
          : body.fieldMapping;
    } catch {
      throw new BadRequestException('Invalid fieldMapping JSON.');
    }

    return this.importExportService.importContacts(tenantId, userId, file.buffer, fieldMapping, {
      duplicateHandling: body.duplicateHandling || 'skip',
      duplicateField: body.duplicateField || 'email',
    });
  }
}
