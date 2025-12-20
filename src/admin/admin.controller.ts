import {
  Controller,
  Get,
  Put,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /api/admin/agents/pending - Get pending agent approvals
  @Get('agents/pending')
  async getPendingAgents() {
    return this.adminService.getPendingAgents();
  }

  // GET /api/admin/agents - Get all agents with filters
  @Get('agents')
  async getAllAgents(
    @Query('status') status?: string,
    @Query('city') city?: string,
  ) {
    return this.adminService.getAllAgents({ status, city });
  }

  // PUT /api/admin/agents/:agentId/approve - Approve agent
  @Put('agents/:agentId/approve')
  async approveAgent(@Param('agentId', ParseIntPipe) agentId: number) {
    return this.adminService.approveAgent(agentId);
  }

  // PUT /api/admin/agents/:agentId/reject - Reject agent
  @Put('agents/:agentId/reject')
  async rejectAgent(@Param('agentId', ParseIntPipe) agentId: number) {
    return this.adminService.rejectAgent(agentId);
  }

  // PUT /api/admin/agents/:agentId/suspend - Suspend agent
  @Put('agents/:agentId/suspend')
  async suspendAgent(@Param('agentId', ParseIntPipe) agentId: number) {
    return this.adminService.suspendAgent(agentId);
  }

  // PUT /api/admin/agents/:agentId/activate - Activate agent
  @Put('agents/:agentId/activate')
  async activateAgent(@Param('agentId', ParseIntPipe) agentId: number) {
    return this.adminService.activateAgent(agentId);
  }

  // GET /api/admin/stats - Platform statistics
  @Get('stats')
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  // GET /api/admin/revenue - Revenue statistics
  @Get('revenue')
  async getRevenueStats() {
    return this.adminService.getRevenueStats();
  }
}
