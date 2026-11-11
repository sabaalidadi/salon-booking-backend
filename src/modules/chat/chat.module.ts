import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity.js';
import { Message } from './entities/message.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message])],
})
export class ChatModule {}
