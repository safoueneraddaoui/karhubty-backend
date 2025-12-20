import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  // POST /api/rentals - Create rental request (User only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async create(@Request() req, @Body() createRentalDto: CreateRentalDto) {
    return this.rentalsService.create(req.user.userId, createRentalDto);
  }

  // POST /api/rentals/calculate-price - Calculate rental price
  @Post('calculate-price')
  async calculatePrice(@Body() calculatePriceDto: CalculatePriceDto) {
    return this.rentalsService.calculatePrice(
      calculatePriceDto.carId,
      calculatePriceDto.startDate,
      calculatePriceDto.endDate,
    );
  }

  // POST /api/rentals/check-overlap/:userId - Check for overlapping rentals
  @Post('check-overlap/:userId')
  @UseGuards(JwtAuthGuard)
  async checkOverlap(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dates: { startDate: string; endDate: string },
  ) {
    return this.rentalsService.checkUserOverlap(
      userId,
      dates.startDate,
      dates.endDate,
    );
  }

  // GET /api/rentals/user/:userId - Get user's rentals
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    // Users can only view their own rentals (unless admin)
    if (req.user.userId !== userId && req.user.role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    return this.rentalsService.findByUser(userId);
  }

  // GET /api/rentals/agent - Get current logged-in agent's rentals (JWT based)
  @Get('agent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async getMyRentals(@Request() req) {
    return this.rentalsService.findByAgent(req.user.userId);
  }

  // GET /api/rentals/agent/pending-count - Get pending rental count for current agent
  @Get('agent/pending-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async getPendingCount(@Request() req) {
    return this.rentalsService.getPendingCountByAgent(req.user.userId);
  }

  // GET /api/rentals/agent/:agentId - Get agent's rentals by ID
  @Get('agent/:agentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'superadmin')
  async findByAgent(@Param('agentId', ParseIntPipe) agentId: number) {
    return this.rentalsService.findByAgent(agentId);
  }

  // GET /api/rentals/stats - Get rental statistics
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req) {
    // If agent, get only their stats
    if (req.user.role === 'agent') {
      return this.rentalsService.getStats(req.user.userId);
    }
    // If admin, get all stats
    return this.rentalsService.getStats();
  }

  // GET /api/rentals/:id - Get rental by ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rentalsService.findOne(id);
  }

  // PUT /api/rentals/:id/approve - Approve rental (Agent only)
  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async approve(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.rentalsService.approve(id, req.user.userId);
  }

  // PUT /api/rentals/:id/reject - Reject rental (Agent only)
  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async reject(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.rentalsService.reject(id, req.user.userId);
  }

  // PUT /api/rentals/:id/cancel - Cancel rental (User only)
  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async cancel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.rentalsService.cancel(id, req.user.userId);
  }

  // PUT /api/rentals/:id/complete - Complete rental
  @Put(':id/complete')
  @UseGuards(JwtAuthGuard)
  async complete(@Param('id', ParseIntPipe) id: number) {
    return this.rentalsService.complete(id);
  }

  // GET /api/rentals - Get all rentals (Admin) or filter by agentId (Agent)
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req, @Query('agentId') agentId?: string) {
    // If agentId query parameter is provided
    if (agentId) {
      const parsedAgentId = parseInt(agentId, 10);
      
      // Agents can only access their own rentals
      if (req.user.role === 'agent' && req.user.userId !== parsedAgentId) {
        throw new Error('Unauthorized: You can only view your own rentals');
      }
      
      return this.rentalsService.findByAgent(parsedAgentId);
    }
    
    // Only superadmin can view all rentals without filter
    if (req.user.role !== 'superadmin') {
      throw new Error('Unauthorized: Only admins can view all rentals');
    }
    
    return this.rentalsService.findAll();
  }
}