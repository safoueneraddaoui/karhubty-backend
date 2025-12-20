import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  // Create notification
  async create(data: {
    recipientId: number;
    recipientType: string;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    return this.notificationRepository.save(notification);
  }

  // Get user notifications
  async getByRecipient(
    recipientId: number,
    recipientType: string,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId, recipientType },
      order: { createdAt: 'DESC' },
    });
  }

  // Get unread notifications
  async getUnreadByRecipient(
    recipientId: number,
    recipientType: string,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId, recipientType, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  // Mark all as read
  async markAllAsRead(
    recipientId: number,
    recipientType: string,
  ): Promise<void> {
    await this.notificationRepository.update(
      { recipientId, recipientType, isRead: false },
      { isRead: true },
    );
  }

  // Delete notification
  async delete(notificationId: number): Promise<void> {
    await this.notificationRepository.delete(notificationId);
  }

  // Get unread count
  async getUnreadCount(
    recipientId: number,
    recipientType: string,
  ): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId, recipientType, isRead: false },
    });
  }
}
