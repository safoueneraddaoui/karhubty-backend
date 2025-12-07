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

  // GET /api/cars - Get all cars (public)
  @Get()
  async findAll(
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

  // GET /api/cars/agent/:agentId - Get cars by agent
  @Get('agent/:agentId')
  @UseGuards(JwtAuthGuard)
  async findByAgent(@Param('agentId', ParseIntPipe) agentId: number) {
    return this.carsService.findByAgent(agentId);
  }

  // GET /api/cars/:id - Get car by ID (public)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.findOne(id);
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
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: carImageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    }),
  )
  async create(
    @Request() req,
    @Body() createCarDto: CreateCarDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Validate that at least 1 image is uploaded
    if (!files || files.length === 0) {
      throw new BadRequestException('At least 1 image is required');
    }

    // Get image paths
    const imagePaths = files.map((file) => `cars/${file.filename}`);

    return this.carsService.create(req.user.userId, createCarDto, imagePaths);
  }

  // PUT /api/cars/:id - Update car (Agent only - own cars)
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
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
    return this.carsService.update(id, req.user.userId, updateCarDto, imagePaths);
  }

  // PUT /api/cars/:id/availability - Set car availability (Agent only)
  @Put(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async setAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.carsService.setAvailability(id, req.user.userId, isAvailable);
  }

  // DELETE /api/cars/:id - Delete car (Agent only - own cars)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.carsService.remove(id, req.user.userId);
    return { success: true, message: 'Car deleted successfully' };
  }
}