import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AgentDocument } from '../common/entities/agent-document.entity';
import { Agent } from '../agents/agent.entity';
import { Notification } from '../notifications/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([AgentDocument, Agent, Notification])],
  controllers: [DocumentsController],
  providers: [DocumentsService, NotificationsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
