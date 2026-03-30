import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Marketing entities
import { MarketingEmail } from './entities/marketing-email.entity';
import { EmailSend } from './entities/email-send.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { Campaign } from './entities/campaign.entity';
import { Form } from './entities/form.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowNode } from './entities/workflow-node.entity';
import { WorkflowEdge } from './entities/workflow-edge.entity';
import { WorkflowEnrollment } from './entities/workflow-enrollment.entity';
import { PageView } from './entities/page-view.entity';
import { LeadScoreModel } from './entities/lead-score-model.entity';
import { LeadScoreRule } from './entities/lead-score-rule.entity';
import { LeadScore } from './entities/lead-score.entity';

// CRM entities needed for email sending
import { Contact } from '../crm/entities/contact.entity';
import { List } from '../crm/entities/list.entity';
import { ListMembership } from '../crm/entities/list-membership.entity';

// Services
import { EmailsService } from './services/emails.service';
import { EmailDeliveryService } from './services/email-delivery.service';
import { TemplatesService } from './services/templates.service';
import { WorkflowsService } from './services/workflows.service';
import { FormsService } from './services/forms.service';
import { CampaignsService } from './services/campaigns.service';
import { LeadScoringService } from './services/lead-scoring.service';
import { TrackingService } from './services/tracking.service';

// Controllers
import { EmailsController } from './controllers/emails.controller';
import { TemplatesController } from './controllers/templates.controller';
import { TrackingController } from './controllers/tracking.controller';
import { WorkflowsController } from './controllers/workflows.controller';
import { FormsController } from './controllers/forms.controller';
import { FormSubmissionsController } from './controllers/form-submissions.controller';
import { CampaignsController } from './controllers/campaigns.controller';
import { LeadScoringController } from './controllers/lead-scoring.controller';
import { WebsiteTrackingController } from './controllers/website-tracking.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketingEmail,
      EmailSend,
      EmailTemplate,
      Campaign,
      Form,
      FormSubmission,
      Workflow,
      WorkflowNode,
      WorkflowEdge,
      WorkflowEnrollment,
      PageView,
      LeadScoreModel,
      LeadScoreRule,
      LeadScore,
      Contact,
      List,
      ListMembership,
    ]),
  ],
  controllers: [
    EmailsController,
    TemplatesController,
    TrackingController,
    WorkflowsController,
    FormsController,
    FormSubmissionsController,
    CampaignsController,
    LeadScoringController,
    WebsiteTrackingController,
  ],
  providers: [
    EmailsService,
    EmailDeliveryService,
    TemplatesService,
    WorkflowsService,
    FormsService,
    CampaignsService,
    LeadScoringService,
    TrackingService,
  ],
  exports: [
    EmailsService,
    EmailDeliveryService,
    TemplatesService,
    WorkflowsService,
    FormsService,
    CampaignsService,
    LeadScoringService,
    TrackingService,
  ],
})
export class MarketingModule {}
