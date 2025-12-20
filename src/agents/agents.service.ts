import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './agent.entity';
import { Rental } from '../rentals/rental.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
  ) {}

  // Get agent profile
  async getProfile(agentId: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
      select: [
        'agentId',
        'email',
        'firstName',
        'lastName',
        'phone',
        'agencyName',
        'agencyAddress',
        'city',
        'accountStatus',
        'dateRegistered',
        'approvalDate',
        'role',
      ],
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  // Update agent profile
  async updateProfile(
    agentId: number,
    updateData: Partial<Agent>,
  ): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Don't allow updating role or accountStatus via profile update
    delete updateData.role;
    delete updateData.accountStatus;

    Object.assign(agent, updateData);
    await this.agentRepository.save(agent);

    const { password, ...result } = agent;
    return result as Agent;
  }

  // Upload agency approval documents
  async uploadApprovalDocuments(
    agentId: number,
    documentPath: string,
  ): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Delete old document if exists
    if (agent.approvalOfAgency) {
      const oldPath = path.join(process.cwd(), 'uploads', agent.approvalOfAgency);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    agent.approvalOfAgency = documentPath;
    await this.agentRepository.save(agent);

    const { password, ...result } = agent;
    return result as Agent;
  }

  // Get agent revenue
  async getRevenue(agentId: number): Promise<{
    totalEarnings: number;
    completedRentals: number;
    pendingRentals: number;
    approvedRentals: number;
    revenue: Array<{
      rentalId: number;
      carInfo: string;
      earnedAmount: number;
      status: string;
      completionDate: Date | null;
    }>;
  }> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const rentals = await this.rentalRepository.find({
      where: { agentId },
      order: { completionDate: 'DESC' },
    });

    const completedRentals = rentals.filter((r) => r.status === 'completed');
    const totalEarnings = completedRentals.reduce(
      (sum, r) => sum + parseFloat(r.totalPrice.toString()),
      0,
    );

    const revenueDetails = rentals.map((r) => ({
      rentalId: r.rentalId,
      carInfo: `Rental #${r.rentalId}`,
      earnedAmount:
        r.status === 'completed'
          ? parseFloat(r.totalPrice.toString())
          : 0,
      status: r.status,
      completionDate: r.completionDate || null,
    }));

    return {
      totalEarnings,
      completedRentals: completedRentals.length,
      pendingRentals: rentals.filter((r) => r.status === 'pending').length,
      approvedRentals: rentals.filter((r) => r.status === 'approved').length,
      revenue: revenueDetails,
    };
  }

  // Get agent dashboard
  async getDashboard(agentId: number): Promise<{
    agentInfo: Agent;
    statistics: {
      totalCars: number;
      totalRentals: number;
      completedRentals: number;
      totalEarnings: number;
      pendingApprovals: number;
    };
  }> {
    const agent = await this.getProfile(agentId);
    const rentals = await this.rentalRepository.find({
      where: { agentId },
    });

    const totalEarnings = rentals
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + parseFloat(r.totalPrice.toString()), 0);

    return {
      agentInfo: agent,
      statistics: {
        totalCars: 0, // Will be populated by cars query
        totalRentals: rentals.length,
        completedRentals: rentals.filter((r) => r.status === 'completed').length,
        totalEarnings,
        pendingApprovals: rentals.filter((r) => r.status === 'pending').length,
      },
    };
  }

  // Get all agents (Admin only)
  async findAll(filters?: {
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
      .getMany();
  }

  // Get agent by ID (Admin)
  async findOne(agentId: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const { password, ...result } = agent;
    return result as Agent;
  }

  // Approve agent (Admin only)
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

  // Reject agent (Admin only)
  async rejectAgent(agentId: number, reason?: string): Promise<Agent> {
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

  // Suspend agent (Admin only)
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

  // Activate agent (Admin only)
  async activateAgent(agentId: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    agent.accountStatus = 'approved';
    await this.agentRepository.save(agent);

    const { password, ...result } = agent;
    return result as Agent;
  }
}
