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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { PipelineFieldsService } from '../services/pipeline-fields.service';

@ApiTags('Pipeline Fields')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/pipelines/:pipelineId/fields')
export class PipelineFieldsController {
  constructor(private readonly pipelineFieldsService: PipelineFieldsService) {}

  @Get()
  @ApiOperation({ summary: 'List fields for a pipeline' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Param('pipelineId', ParseUUIDPipe) pipelineId: string,
  ) {
    return this.pipelineFieldsService.findByPipeline(tenantId, pipelineId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a pipeline field' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Param('pipelineId', ParseUUIDPipe) pipelineId: string,
    @Body() body: { name: string; fieldKey?: string; fieldType?: string; options?: string[]; required?: boolean },
  ) {
    return this.pipelineFieldsService.create(tenantId, pipelineId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pipeline field' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { name?: string; fieldType?: string; options?: string[] | null; required?: boolean; position?: number },
  ) {
    return this.pipelineFieldsService.update(tenantId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a pipeline field' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pipelineFieldsService.remove(tenantId, id);
  }
}
