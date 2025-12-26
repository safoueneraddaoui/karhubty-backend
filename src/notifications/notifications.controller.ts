import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /api/notifications - Get all notifications for current user
  @Get()
  async getNotifications(@Request() req) {
    const recipientType = req.user.role === 'agent' ? 'agent' : 'user';
    return this.notificationsService.getByRecipient(
      req.user.userId,
      recipientType,
    );
  }

  // GET /api/notifications/unread - Get unread notifications
  @Get('unread')
  async getUnreadNotifications(@Request() req) {
    const recipientType = req.user.role === 'agent' ? 'agent' : 'user';
    return this.notificationsService.getUnreadByRecipient(
      req.user.userId,
      recipientType,
    );
  }

  // GET /api/notifications/unread/count - Get unread count
  @Get('unread/count')
  async getUnreadCount(@Request() req) {
    const recipientType = req.user.role === 'agent' ? 'agent' : 'user';
    const count = await this.notificationsService.getUnreadCount(
      req.user.userId,
      recipientType,
    );
    return { count };
  }

  // PUT /api/notifications/:id/read - Mark notification as read
  @Put(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(id);
  }

  // PUT /api/notifications/read-all - Mark all as read
  @Put('read-all')
  async markAllAsRead(@Request() req) {
    const recipientType = req.user.role === 'agent' ? 'agent' : 'user';
    await this.notificationsService.markAllAsRead(
      req.user.userId,
      recipientType,
    );
    return { success: true, message: 'All notifications marked as read' };
  }

  // DELETE /api/notifications/:id - Delete notification
  @Delete(':id')
  async deleteNotification(@Param('id', ParseIntPipe) id: number) {
    await this.notificationsService.delete(id);
    return { success: true, message: 'Notification deleted' };
  }

  // POST /api/notifications/send-document-request - Send document request email to agent
  @Post('send-document-request')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  async sendDocumentRequest(@Body() body: {
    agentEmail: string;
    agentName: string;
    requiredDocuments: string;
    message?: string;
  }) {
    return this.notificationsService.sendDocumentRequestEmail(body);
  }
}
