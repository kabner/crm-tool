import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { ContactTypesService } from '../services/contact-types.service';

@ApiTags('Contact Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/contact-types')
export class ContactTypesController {
  constructor(private readonly contactTypesService: ContactTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List contact type options' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.contactTypesService.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a contact type option' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: { name: string; color?: string },
  ) {
    return this.contactTypesService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact type option' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; color?: string; position?: number },
  ) {
    return this.contactTypesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact type option' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactTypesService.remove(tenantId, id);
  }
}
