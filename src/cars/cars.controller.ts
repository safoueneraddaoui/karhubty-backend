import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { carImageStorage, imageFileFilter } from '../common/utils/file-upload.util';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  // === SPECIFIC STATIC ROUTES (must come BEFORE dynamic routes) ===

  // GET /api/cars/my-cars - Smart endpoint for authenticated users
  // - Regular users: see ALL cars
  // - Agents: see only THEIR cars
  @Get('my-cars')
  @UseGuards(JwtAuthGuard)
  async getMyCars(@Request() req) {
    console.log('🔵 getMyCars() called - User role:', req.user?.role);
    if (req.user.role === 'agent') {
      // Agent: return only their cars
      console.log('🟢 Agent cars endpoint - agentId:', req.user.userId);
      return this.carsService.findByAgent(req.user.userId);
    }
    // User or admin: return all cars
    console.log('🟡 User all cars endpoint');
    return this.carsService.findAll({});
  }

  // GET /api/cars/featured - Get featured cars (public)
  @Get('featured')
  async getFeatured() {
    return this.carsService.getFeatured();
  }

  // GET /api/cars/search - Search cars (public)
  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }
    return this.carsService.search(query);
  }

  // GET /api/cars/category/:category - Get cars by category (public)
  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return this.carsService.findByCategory(category);
  }

  // === AGENT-SPECIFIC ROUTES ===

  // GET /api/cars/agent/my-cars - Get current agent's own cars
  @Get('agent/my-cars')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async getMyAgentCars(@Request() req) {
    return this.carsService.findByAgent(req.user.userId);
  }

  // GET /api/cars/agent/:agentId - Get any agent's cars (admin only, or own)
  @Get('agent/:agentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'superadmin')
  async findByAgent(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Request() req,
  ) {
    // Agents can only view their own cars (unless admin)
    if (req.user.role === 'agent' && req.user.userId !== agentId) {
      throw new Error('Unauthorized: You can only view your own cars');
    }
    return this.carsService.findByAgent(agentId);
  }

  // === DYNAMIC/PARAMETERIZED ROUTES (must come LAST) ===

  // GET /api/cars/:id - Get car by ID (public)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    console.log('🔴 findOne() called with id:', id, '- typeof:', typeof id);
    return this.carsService.findOne(id);
  }

  // === QUERY-BASED ROUTES ===

  // GET /api/cars - Get all cars (public) - MUST BE AFTER :id to avoid conflicts
  @Get()
  async findAllCars(
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('transmission') transmission?: string,
    @Query('fuelType') fuelType?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      transmission,
      fuelType,
      search,
    };

    return this.carsService.findAll(filters);
  }

  // POST /api/cars/:id/check-availability - Check car availability (public)
  @Post(':id/check-availability')
  async checkAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() dates: { startDate: string; endDate: string },
  ) {
    return this.carsService.checkAvailability(
      id,
      new Date(dates.startDate),
      new Date(dates.endDate),
    );
  }

  // POST /api/cars - Create new car (Agent only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async create(
    @Request() req,
    @Body() createCarDto: CreateCarDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Get image paths (optional - if no files, pass empty array)
    const imagePaths = files && files.length > 0 
      ? files.map((file) => `cars/${file.filename}`)
      : [];

    return this.carsService.create(req.user.userId, createCarDto, imagePaths);
  }

  // PUT /api/cars/:id - Update car (Agent only - own cars)
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'superadmin')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: carImageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateCarDto: UpdateCarDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const imagePaths = files?.map((file) => `cars/${file.filename}`);
    // Service will verify ownership
    return this.carsService.update(id, req.user.userId, updateCarDto, imagePaths, req.user.role);
  }

  // PUT /api/cars/:id/availability - Set car availability (Agent only)
  @Put(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'superadmin')
  async setAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    // Service will verify ownership
    return this.carsService.setAvailability(id, req.user.userId, isAvailable, req.user.role);
  }

  // DELETE /api/cars/:id - Delete car (Agent only - own cars)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'superadmin')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Service will verify ownership
    await this.carsService.remove(id, req.user.userId, req.user.role);
    return { success: true, message: 'Car deleted successfully' };
  }
}