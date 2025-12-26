import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Notification } from './notification.entity';
import { Agent } from '../agents/agent.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    private mailerService: MailerService,
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

  // Send document request email to agent
  async sendDocumentRequestEmail(data: {
    agentEmail: string;
    agentName: string;
    requiredDocuments: string;
    message?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Update agent status to "in_verification"
      const agent = await this.agentRepository.findOne({
        where: { email: data.agentEmail },
      });
      
      if (agent) {
        agent.accountStatus = 'in_verification';
        await this.agentRepository.save(agent);
      }

      const documentList = data.requiredDocuments
        .split(',')
        .map(doc => `<li>${doc.trim()}</li>`)
        .join('');

      await this.mailerService.sendMail({
        to: data.agentEmail,
        subject: '📄 KarHubty - Document Request for Account Verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #FF9500 0%, #FF6B35 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">📄 Documents Needed</h1>
            </div>
            <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px;">
              <p style="color: #333; font-size: 16px;">Hello ${data.agentName},</p>
              <p style="color: #555; line-height: 1.6;">
                Thank you for applying to be an agent on KarHubty! To complete the verification of your account and activate your agent dashboard, we need you to submit the following documents:
              </p>
              
              <div style="background: #fff3e0; border-left: 4px solid #FF9500; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 15px 0; color: #e65100; font-weight: 600;">Required Documents:</p>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${documentList}
                </ul>
              </div>

              <p style="color: #555; line-height: 1.6;">
                ${data.message || 'Please upload these documents through your agent dashboard to proceed with your account verification.'}
              </p>

              <p style="color: #555; line-height: 1.6;">
                <strong>Next Steps:</strong><br>
                1. Log in to your KarHubty agent account<br>
                2. Go to Profile → Documents<br>
                3. Upload the requested documents<br>
                4. Our team will review and approve your account
              </p>

              <p style="color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                © 2025 KarHubty. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      return {
        success: true,
        message: `Document request email sent successfully to ${data.agentEmail}`,
      };
    } catch (error) {
      console.error('Error sending document request email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
