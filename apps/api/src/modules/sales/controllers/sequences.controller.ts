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
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { SequencesService } from '../services/sequences.service';
import { CreateSequenceDto } from '../dto/create-sequence.dto';
import { UpdateSequenceDto } from '../dto/update-sequence.dto';
import { EnrollContactDto } from '../dto/enroll-contact.dto';

@ApiTags('Sequences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/sequences')
export class SequencesController {
  constructor(private readonly sequencesService: SequencesService) {}

  @Get()
  @ApiOperation({ summary: 'List sequences' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of sequences' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.sequencesService.findAll(tenantId, { page, limit, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sequence with steps' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Sequence details with steps' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sequencesService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new sequence' })
  @ApiResponse({ status: 201, description: 'Sequence created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSequenceDto,
  ) {
    return this.sequencesService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sequence (optionally replace steps)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Sequence updated' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSequenceDto,
  ) {
    return this.sequencesService.update(tenantId, id, dto);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a sequence' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Sequence activated' })
  async activate(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sequencesService.activate(tenantId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a sequence' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Sequence paused' })
  async pause(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sequencesService.pause(tenantId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a draft sequence' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Sequence deleted' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sequencesService.remove(tenantId, id);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll a contact in a sequence' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Contact enrolled' })
  async enroll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnrollContactDto,
  ) {
    return this.sequencesService.enroll(tenantId, id, dto.contactId, userId);
  }

  @Post(':id/unenroll/:enrollmentId')
  @ApiOperation({ summary: 'Unenroll a contact from a sequence' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'enrollmentId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Contact unenrolled' })
  async unenroll(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Body() body: { reason?: string },
  ) {
    return this.sequencesService.unenroll(
      tenantId,
      enrollmentId,
      body.reason ?? 'manual_exit',
    );
  }

  @Get(':id/enrollments')
  @ApiOperation({ summary: 'List enrollments for a sequence' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of enrollments' })
  async getEnrollments(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.sequencesService.getEnrollments(tenantId, id, {
      page,
      limit,
      status,
    });
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get sequence analytics' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Sequence statistics' })
  async getStats(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sequencesService.getStats(tenantId, id);
  }
}
