import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
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
import { ChatService } from '../services/chat.service';
import { CreateChatSessionDto } from '../dto/create-chat-session.dto';
import { SendChatMessageDto } from '../dto/send-chat-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/service/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({ status: 201, description: 'Chat session created' })
  async createSession(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateChatSessionDto,
  ) {
    return this.chatService.createSession(tenantId, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List active/waiting chat sessions (agent inbox)' })
  @ApiQuery({ name: 'agentId', required: false })
  @ApiResponse({ status: 200, description: 'List of active chat sessions' })
  async getActiveSessions(
    @CurrentUser('tenantId') tenantId: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.chatService.getActiveSessions(tenantId, agentId);
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: 'Get messages for a chat session' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of chat messages' })
  async getMessages(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.getMessages(tenantId, id);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send a message in a chat session' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendChatMessageDto,
  ) {
    const senderType = dto.senderType ?? 'agent';
    const senderId = senderType === 'agent' ? userId : dto.sessionId;
    return this.chatService.sendMessage(tenantId, id, senderType, senderId, dto.body);
  }

  @Post('sessions/:id/assign')
  @ApiOperation({ summary: 'Assign an agent to a chat session' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Agent assigned' })
  async assignAgent(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.assignAgent(tenantId, id, userId);
  }

  @Post('sessions/:id/end')
  @ApiOperation({ summary: 'End a chat session' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Chat session ended' })
  async endSession(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.endSession(tenantId, id);
  }

  @Post('sessions/:id/convert-to-ticket')
  @ApiOperation({ summary: 'Convert a chat session to a support ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket created from chat' })
  async convertToTicket(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { subject?: string },
  ) {
    return this.chatService.convertToTicket(tenantId, id, body.subject);
  }
}
