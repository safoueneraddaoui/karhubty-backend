import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Agent } from '../agents/agent.entity';
import { User } from '../users/user.entity';
import { Rental } from '../rentals/rental.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
    private mailerService: MailerService,
  ) {}

  // Get pending agent requests
  async getPendingAgents(): Promise<Agent[]> {
    return this.agentRepository.find({
      where: { accountStatus: 'pending' },
      order: { dateRegistered: 'ASC' },
      select: [
        'agentId',
        'email',
        'firstName',
        'lastName',
        'agencyName',
        'agencyAddress',
        'city',
        'phone',
        'dateRegistered',
        'accountStatus',
        'role',
      ],
    });
  }

  // Approve agent
  async approveAgent(agentId: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.accountStatus !== 'pending') {
      throw new BadRequestException('Only pending agents can be approved');
    }

    agent.accountStatus = 'approved';
    agent.approvalDate = new Date();
    await this.agentRepository.save(agent);

    // Send approval email to agent
    try {
      await this.mailerService.sendMail({
        to: agent.email,
        subject: '🎉 Your KarHubty Agent Account Has Been Approved!',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f8f9fa;
                margin: 0;
                padding: 0;
                line-height: 1.6;
              }
              .wrapper {
                background-color: #f8f9fa;
                padding: 20px 0;
              }
              .container {
                max-width: 580px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              }
              .header {
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -0.5px;
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 18px;
                color: #1a1a1a;
                font-weight: 600;
                margin: 0 0 20px 0;
              }
              .text {
                color: #555555;
                font-size: 16px;
                line-height: 1.6;
                margin: 0 0 20px 0;
              }
              .button-container {
                text-align: center;
                margin: 40px 0;
              }
              .action-button {
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                padding: 16px 50px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
              }
              .action-button:hover {
                transform: translateY(-2px);
              }
              .features-list {
                background-color: #f0fdf4;
                border-left: 4px solid #10B981;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .features-list li {
                margin: 10px 0;
                color: #065F46;
                font-weight: 500;
              }
              .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #888888;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <h1>🎉 Account Approved!</h1>
                </div>
                <div class="content">
                  <p class="greeting">Hello ${agent.firstName} ${agent.lastName},</p>
                  <p class="text">
                    Great news! Your KarHubty agent account has been <strong>approved by our admin team</strong>. 🚗
                  </p>
                  <p class="text">
                    You can now start managing your cars and rentals on the platform. Your agency <strong>${agent.agencyName}</strong> is now live!
                  </p>
                  <div class="features-list">
                    <p style="margin-top: 0; font-weight: 600; color: #065F46;">You can now:</p>
                    <ul style="padding-left: 20px;">
                      <li>✓ Add and manage your vehicles</li>
                      <li>✓ View and approve rental requests</li>
                      <li>✓ Track your earnings and statistics</li>
                      <li>✓ Manage customer reviews</li>
                      <li>✓ Access your agent dashboard</li>
                    </ul>
                  </div>
                  <div class="button-container">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="action-button">
                      Login to Your Dashboard
                    </a>
                  </div>
                  <p class="text">
                    If you have any questions or need assistance, please don't hesitate to contact our support team.
                  </p>
                  <p class="text">
                    Welcome to KarHubty! 🌟
                  </p>
                </div>
                <div class="footer">
                  <p>© 2025 KarHubty. All rights reserved.</p>
                  <p>This email was sent because your agent account was approved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log('[Email] Agent approval email sent to:', agent.email);
    } catch (emailError) {
      console.error('[Email Error] Failed to send approval email:', emailError);
      // Don't throw - email failure shouldn't prevent approval
    }

    const { password, ...result } = agent;
    return result as Agent;
  }

  // Reject agent
  async rejectAgent(agentId: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.accountStatus !== 'pending') {
      throw new BadRequestException('Only pending agents can be rejected');
    }

    agent.accountStatus = 'rejected';
    await this.agentRepository.save(agent);

    const { password, ...result } = agent;
    return result as Agent;
  }

  // Suspend agent
  async suspendAgent(agentId: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    agent.accountStatus = 'suspended';
    await this.agentRepository.save(agent);

    const { password, ...result } = agent;
    return result as Agent;
  }

  // Activate agent
  async activateAgent(agentId: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.accountStatus === 'rejected') {
      throw new BadRequestException('Cannot activate a rejected agent');
    }

    agent.accountStatus = 'approved';
    await this.agentRepository.save(agent);

    const { password, ...result } = agent;
    return result as Agent;
  }

  // Get all agents
  async getAllAgents(filters?: {
    status?: string;
    city?: string;
  }): Promise<Agent[]> {
    const query = this.agentRepository.createQueryBuilder('agent');

    if (filters?.status) {
      query.where('agent.accountStatus = :status', { status: filters.status });
    }

    if (filters?.city) {
      query.andWhere('agent.city = :city', { city: filters.city });
    }

    return query
      .select([
        'agent.agentId',
        'agent.email',
        'agent.firstName',
        'agent.lastName',
        'agent.agencyName',
        'agent.agencyAddress',
        'agent.city',
        'agent.accountStatus',
        'agent.dateRegistered',
        'agent.approvalDate',
        'agent.role',
      ])
      .orderBy('agent.dateRegistered', 'DESC')
      .getMany();
  }

  // Get platform statistics
  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalAgents: number;
    totalRentals: number;
    totalRevenue: number;
    pendingAgents: number;
    completedRentals: number;
  }> {
    const [users, agents, rentals, pendingAgents] = await Promise.all([
      this.userRepository.count(),
      this.agentRepository.count(),
      this.rentalRepository.count(),
      this.agentRepository.count({ where: { accountStatus: 'pending' } }),
    ]);

    const completedRentals = await this.rentalRepository.find({
      where: { status: 'completed' },
    });

    const totalRevenue = completedRentals.reduce(
      (sum, r) => sum + parseFloat(r.totalPrice.toString()),
      0,
    );

    return {
      totalUsers: users,
      totalAgents: agents,
      totalRentals: rentals,
      totalRevenue,
      pendingAgents,
      completedRentals: completedRentals.length,
    };
  }

  // Get revenue statistics
  async getRevenueStats(): Promise<{
    totalRevenue: number;
    byAgent: Array<{
      agentId: number;
      agencyName: string;
      totalEarnings: number;
      completedRentals: number;
    }>;
  }> {
    const agents = await this.agentRepository.find();
    const byAgent: Array<{
      agentId: number;
      agencyName: string;
      totalEarnings: number;
      completedRentals: number;
    }> = [];
    let totalRevenue = 0;

    for (const agent of agents) {
      const rentals = await this.rentalRepository.find({
        where: { agentId: agent.agentId, status: 'completed' },
      });

      const earnings = rentals.reduce(
        (sum, r) => sum + parseFloat(r.totalPrice.toString()),
        0,
      );

      if (earnings > 0 || rentals.length > 0) {
        byAgent.push({
          agentId: agent.agentId,
          agencyName: agent.agencyName,
          totalEarnings: earnings,
          completedRentals: rentals.length,
        });
        totalRevenue += earnings;
      }
    }

    return {
      totalRevenue,
      byAgent: byAgent.sort((a, b) => b.totalEarnings - a.totalEarnings),
    };
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      order: { dateCreated: 'DESC' },
      select: [
        'userId',
        'email',
        'firstName',
        'lastName',
        'phone',
        'city',
        'isActive',
        'isEmailVerified',
        'dateCreated',
        'role',
      ],
    });
  }

  // Delete a user by ID
  async deleteUser(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.userRepository.remove(user);
    return { message: `User ${user.email} deleted successfully` };
  }

  // Delete an agent by ID
  async deleteAgent(agentId: number): Promise<{ message: string }> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    await this.agentRepository.remove(agent);
    return { message: `Agent ${agent.agencyName || agent.email} deleted successfully` };
  }

  // Toggle user status
  async toggleUserStatus(
    userId: number,
    isActive: boolean,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isActive = isActive;
    return this.userRepository.save(user);
  }
}
