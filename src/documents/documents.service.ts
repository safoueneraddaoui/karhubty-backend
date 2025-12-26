import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentDocument } from '../common/entities/agent-document.entity';
import { Agent } from '../agents/agent.entity';
import { Notification } from '../notifications/notification.entity';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(AgentDocument)
    private readonly documentRepository: Repository<AgentDocument>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly mailerService: MailerService,
  ) {}

  async uploadDocument(
    agentId: number,
    file: Express.Multer.File,
    documentType: string,
  ): Promise<AgentDocument> {
    // Validate agent exists
    const agent = await this.agentRepository.findOne({ where: { agentId } });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Allow agents in pending or in_verification status to upload documents
    if (agent.accountStatus !== 'pending' && agent.accountStatus !== 'in_verification') {
      throw new ForbiddenException(
        'Documents can only be uploaded by agents with pending or verification status',
      );
    }

    // If agent is in pending status, automatically move them to in_verification
    if (agent.accountStatus === 'pending') {
      agent.accountStatus = 'in_verification';
      await this.agentRepository.save(agent);
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type (only PDF, JPG, PNG)
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, JPG, and PNG files are allowed',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Create documents directory if it doesn't exist
    const documentsDir = path.join(process.cwd(), 'uploads', 'documents', String(agentId));
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    // Save file
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(documentsDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Create document record
    const document = this.documentRepository.create({
      agentId,
      documentType,
      filePath: `uploads/documents/${agentId}/${fileName}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'pending',
    });

    await this.documentRepository.save(document);

    // Create notification for superadmin about new document upload
    await this.createDocumentUploadNotification(agentId, documentType);

    return document;
  }

  async getAgentDocuments(agentId: number): Promise<AgentDocument[]> {
    return this.documentRepository.find({
      where: { agentId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async getDocumentsByType(agentId: number, documentType: string): Promise<AgentDocument[]> {
    return this.documentRepository.find({
      where: { agentId, documentType },
      order: { uploadedAt: 'DESC' },
    });
  }

  async getAllPendingDocuments(): Promise<AgentDocument[]> {
    return this.documentRepository.find({
      where: { status: 'pending' },
      relations: ['agent'],
      order: { uploadedAt: 'ASC' },
    });
  }

  async verifyDocument(
    documentId: number,
    adminId: number,
    approved: boolean,
    rejectionReason?: string,
  ): Promise<AgentDocument> {
    const document = await this.documentRepository.findOne({
      where: { documentId },
      relations: ['agent'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (approved) {
      document.status = 'verified';
      document.verifiedAt = new Date();
      document.verifiedBy = adminId;
    } else {
      document.status = 'rejected';
      document.rejectionReason = rejectionReason || '';
    }

    await this.documentRepository.save(document);

    // Create notification for agent about verification result
    await this.createDocumentVerificationNotification(
      document.agentId,
      document.documentType,
      approved,
      rejectionReason,
    );

    return document;
  }

  async deleteDocument(documentId: number, agentId: number): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { documentId, agentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await this.documentRepository.delete(documentId);
  }

  private async createDocumentUploadNotification(
    agentId: number,
    documentType: string,
  ): Promise<void> {
    const agent = await this.agentRepository.findOne({ where: { agentId } });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Get all superadmins for notification
    // For now, we'll query superadmins from users table (we'll assume superadmin ID = 1)
    const notification = this.notificationRepository.create({
      recipientId: 1, // Superadmin (adjust based on your superadmin identification)
      recipientType: 'superadmin',
      type: 'document_uploaded',
      title: 'New Document Uploaded',
      message: `${agent.agencyName} has uploaded a ${documentType} document for verification.`,
      relatedEntityType: 'agent',
      relatedEntityId: agentId,
      isRead: false,
    });

    await this.notificationRepository.save(notification);
  }

  private async createDocumentVerificationNotification(
    agentId: number,
    documentType: string,
    approved: boolean,
    rejectionReason?: string,
  ): Promise<void> {
    const agent = await this.agentRepository.findOne({ where: { agentId } });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Create notification
    const notification = this.notificationRepository.create({
      recipientId: agentId,
      recipientType: 'agent',
      type: approved ? 'document_verified' : 'document_rejected',
      title: approved ? 'Document Verified' : 'Document Rejected',
      message: approved
        ? `Your ${documentType} document has been verified successfully.`
        : `Your ${documentType} document was rejected. Reason: ${rejectionReason || 'Please contact support.'}`,
      relatedEntityType: 'agent',
      relatedEntityId: agentId,
      isRead: false,
    });

    await this.notificationRepository.save(notification);

    // Send email notification
    try {
      if (approved) {
        await this.mailerService.sendMail({
          to: agent.email,
          subject: '✅ Document Verified - KarHubty',
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; background-color: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { color: #333; line-height: 1.6; }
                .highlight { color: #10b981; font-weight: bold; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Document Verified</h1>
                </div>
                <div class="content">
                  <p>Hello ${agent.firstName || 'Agent'},</p>
                  <p>Great news! Your <span class="highlight">${documentType}</span> document has been <span class="highlight">successfully verified</span> by our SuperAdmin team.</p>
                  <p>Your account is now closer to full approval. You can now:</p>
                  <ul>
                    <li>Access all platform features</li>
                    <li>List and manage your vehicles</li>
                    <li>Receive rental requests</li>
                  </ul>
                  <p>If you still have pending documents, please make sure to submit them as well.</p>
                  <p>Thank you for choosing KarHubty!</p>
                  <p>Best regards,<br><strong>KarHubty Team</strong></p>
                </div>
                <div class="footer">
                  <p>This is an automated message, please do not reply directly to this email.</p>
                  <p>© 2025 KarHubty. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } else {
        await this.mailerService.sendMail({
          to: agent.email,
          subject: '📋 Document Review - Action Required - KarHubty',
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; background-color: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { color: #333; line-height: 1.6; }
                .reason-box { background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .reason-box strong { color: #856404; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📋 Document Review</h1>
                </div>
                <div class="content">
                  <p>Hello ${agent.firstName || 'Agent'},</p>
                  <p>We have reviewed your <strong>${documentType}</strong> document, and unfortunately it has been <strong>rejected</strong>.</p>
                  <div class="reason-box">
                    <strong>Reason for Rejection:</strong><br>
                    ${rejectionReason || 'Please contact support for more information.'}
                  </div>
                  <p>Please address the mentioned issue(s) and resubmit your document. To resubmit:</p>
                  <ol>
                    <li>Log in to your KarHubty account</li>
                    <li>Go to your profile documents section</li>
                    <li>Upload the corrected document</li>
                    <li>Submit for verification again</li>
                  </ol>
                  <p>If you have any questions or need clarification, please contact our support team.</p>
                  <p>Best regards,<br><strong>KarHubty Team</strong></p>
                </div>
                <div class="footer">
                  <p>This is an automated message, please do not reply directly to this email.</p>
                  <p>© 2025 KarHubty. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
      // Don't throw error if email fails, notification is still created
    }
  }

  async checkAllDocumentsVerified(agentId: number): Promise<boolean> {
    const documents = await this.documentRepository.find({
      where: { agentId },
    });

    if (documents.length === 0) {
      return false;
    }

    return documents.every((doc) => doc.status === 'verified');
  }

  async approveAgentAfterDocuments(agentId: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({ where: { agentId } });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Check if all documents are verified
    const allVerified = await this.checkAllDocumentsVerified(agentId);

    if (allVerified) {
      agent.accountStatus = 'approved';
      agent.approvalDate = new Date();
      await this.agentRepository.save(agent);

      // Create notification for agent
      const notification = this.notificationRepository.create({
        recipientId: agentId,
        recipientType: 'agent',
        type: 'account_approved',
        title: 'Account Approved',
        message: 'Your account has been approved! You can now add and manage cars.',
        relatedEntityType: 'agent',
        relatedEntityId: agentId,
        isRead: false,
      });

      await this.notificationRepository.save(notification);
    }

    return agent;
  }

  async submitDocumentsForReview(agentId: number): Promise<void> {
    const agent = await this.agentRepository.findOne({ where: { agentId } });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Verify agent has documents
    const documents = await this.documentRepository.find({
      where: { agentId },
    });

    if (documents.length === 0) {
      throw new BadRequestException('Please upload at least one document before submitting');
    }

    // Create notification for superadmin about document submission
    const notification = this.notificationRepository.create({
      recipientId: 1, // Superadmin
      recipientType: 'superadmin',
      type: 'documents_submitted',
      title: 'New Document Submission',
      message: `${agent.agencyName} has submitted ${documents.length} document(s) for verification review.`,
      relatedEntityType: 'agent',
      relatedEntityId: agentId,
      isRead: false,
    });

    await this.notificationRepository.save(notification);
  }
}
