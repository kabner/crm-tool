import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Ticket,
  TicketMessage,
  TicketCategory,
  SLAPolicy,
  BusinessHours,
  TicketMacro,
  SurveyResponse,
} from './entities';
import { Contact } from '../crm/entities/contact.entity';
import { User } from '../crm/entities/user.entity';
import { KBCategory } from './entities/kb-category.entity';
import { KBSection } from './entities/kb-section.entity';
import { KBArticle } from './entities/kb-article.entity';
import { TicketsController } from './controllers/tickets.controller';
import { CategoriesController } from './controllers/categories.controller';
import { MacrosController } from './controllers/macros.controller';
import { KnowledgeBaseController } from './controllers/knowledge-base.controller';
import { ChatController } from './controllers/chat.controller';
import { TicketsService } from './services/tickets.service';
import { CategoriesService } from './services/categories.service';
import { MacrosService } from './services/macros.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { ChatService } from './services/chat.service';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketMessage,
      TicketCategory,
      SLAPolicy,
      BusinessHours,
      TicketMacro,
      SurveyResponse,
      Contact,
      User,
      KBCategory,
      KBSection,
      KBArticle,
      ChatSession,
      ChatMessage,
    ]),
  ],
  controllers: [
    TicketsController,
    CategoriesController,
    MacrosController,
    KnowledgeBaseController,
    ChatController,
  ],
  providers: [
    TicketsService,
    CategoriesService,
    MacrosService,
    KnowledgeBaseService,
    ChatService,
  ],
  exports: [
    TicketsService,
    CategoriesService,
    MacrosService,
    KnowledgeBaseService,
    ChatService,
  ],
})
export class ServiceModule {}
