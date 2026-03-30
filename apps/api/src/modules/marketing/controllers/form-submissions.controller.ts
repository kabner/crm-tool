import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../../shared/auth/decorators/public.decorator';
import { FormsService } from '../services/forms.service';
import { SubmitFormDto } from '../dto/submit-form.dto';

@ApiTags('Form Submissions (Public)')
@Controller('api/v1/forms')
export class FormSubmissionsController {
  constructor(private readonly formsService: FormsService) {}

  @Post(':formId/submit')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a form (public endpoint)' })
  @ApiParam({ name: 'formId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Submission successful' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async submitForm(
    @Param('formId', ParseUUIDPipe) formId: string,
    @Body() dto: SubmitFormDto,
    @Req() req: Request,
  ) {
    // Override formId from route param
    dto.formId = formId;

    // Extract IP address
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';

    return this.formsService.submitForm(formId, dto, ipAddress);
  }
}
