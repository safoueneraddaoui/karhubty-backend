import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
