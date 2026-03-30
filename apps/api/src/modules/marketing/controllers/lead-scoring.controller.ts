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
import { LeadScoringService } from '../services/lead-scoring.service';
import { CreateLeadScoreModelDto } from '../dto/create-lead-score-model.dto';
import { UpdateLeadScoreModelDto } from '../dto/update-lead-score-model.dto';

@ApiTags('Lead Scoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/marketing/lead-scoring')
export class LeadScoringController {
  constructor(private readonly leadScoringService: LeadScoringService) {}

  @Get('models')
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'List lead score models' })
  @ApiResponse({ status: 200, description: 'List of lead score models' })
  async findAllModels(@CurrentUser('tenantId') tenantId: string) {
    return this.leadScoringService.findAllModels(tenantId);
  }

  @Get('models/:id')
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'Get a lead score model with rules' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead score model details' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  async findOneModel(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leadScoringService.findOneModel(tenantId, id);
  }

  @Post('models')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Create a lead score model' })
  @ApiResponse({ status: 201, description: 'Model created' })
  async createModel(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateLeadScoreModelDto,
  ) {
    return this.leadScoringService.createModel(tenantId, dto);
  }

  @Patch('models/:id')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Update a lead score model' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Model updated' })
  async updateModel(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadScoreModelDto,
  ) {
    return this.leadScoringService.updateModel(tenantId, id, dto);
  }

  @Delete('models/:id')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead score model' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Model deleted' })
  async removeModel(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leadScoringService.removeModel(tenantId, id);
  }

  @Post('calculate/:contactId')
  @RequirePermissions(Permissions.EMAILS_READ)
  @ApiOperation({ summary: 'Calculate lead score for a contact' })
  @ApiParam({ name: 'contactId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Calculated score with breakdown' })
  async calculateScore(
    @CurrentUser('tenantId') tenantId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Query('modelId') modelId?: string,
  ) {
    return this.leadScoringService.calculateScore(tenantId, contactId, modelId);
  }

  @Post('recalculate')
  @RequirePermissions(Permissions.EMAILS_WRITE)
  @ApiOperation({ summary: 'Recalculate scores for all contacts' })
  @ApiResponse({ status: 200, description: 'Recalculation result' })
  async recalculateAll(
    @CurrentUser('tenantId') tenantId: string,
    @Body('modelId') modelId: string,
  ) {
    return this.leadScoringService.recalculateAll(tenantId, modelId);
  }
}
