import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'sender_type' })
  senderType: string;

  @Column({ name: 'sender_id', type: 'varchar', nullable: true })
  senderId: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', default: '[]' })
  attachments: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatSession)
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;
}
