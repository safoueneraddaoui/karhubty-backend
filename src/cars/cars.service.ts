import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Car } from './car.entity';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { Rental } from '../rentals/rental.entity';
import { User } from '../users/user.entity';
import { Agent } from '../agents/agent.entity';
import { deleteImageFile, getImageRelativePath } from '../common/utils/file-upload.util';
import * as path from 'path';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  // Get agent status
  async getAgentStatus(userId: number): Promise<Agent | null> {
    // userId is actually agentId when the user is an agent
    return await this.agentRepository.findOne({
      where: { agentId: userId },
    });
  }

  // Create new car with images
  async create(
    agentId: number,
    createCarDto: CreateCarDto,
    uploadedFiles?: Express.Multer.File[],
  ): Promise<Car> {
    console.log('🚗 [CarsService.create] Starting:', {
      agentId,
      createCarDto,
      uploadedFilesCount: uploadedFiles?.length || 0,
    });

    // Check if agent is in verification status
    const agent = await this.getAgentStatus(agentId);
    if (agent && agent.accountStatus === 'in_verification') {
      throw new ForbiddenException(
        'You cannot add cars while your account is in verification. Please upload the requested documents first.',
      );
    }

    // Check if license plate already exists
    const existingCar = await this.carRepository.findOne({
      where: { licensePlate: createCarDto.licensePlate },
    });

    if (existingCar) {
      console.error('❌ [CarsService.create] License plate already exists:', createCarDto.licensePlate);
      throw new ConflictException('License plate already exists');
    }

    // Convert uploaded files to image paths
    const imagePaths = uploadedFiles
      ? uploadedFiles.map((file) => getImageRelativePath(file.filename))
      : [];

    console.log('📸 [CarsService.create] Image paths:', imagePaths);

    // Create car with images
    const car = this.carRepository.create({
      ...createCarDto,
      agentId,
      images: imagePaths,
      isAvailable: true,
      averageRating: 0,
    });

    console.log('💾 [CarsService.create] Car object created:', car);

    const savedCar = await this.carRepository.save(car);
    console.log('✅ [CarsService.create] Car saved successfully:', savedCar);
    return savedCar;
  }

  // Get all cars with optional filters
  async findAll(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    transmission?: string;
    fuelType?: string;
    search?: string;
  }): Promise<Car[]> {
    const query = this.carRepository.createQueryBuilder('car');

    // Only show available cars by default
    query.where('car.isAvailable = :isAvailable', { isAvailable: true });

    // Apply filters
    if (filters) {
      if (filters.category) {
        query.andWhere('car.category = :category', {
          category: filters.category,
        });
      }

      if (filters.minPrice) {
        query.andWhere('car.pricePerDay >= :minPrice', {
          minPrice: filters.minPrice,
        });
      }

      if (filters.maxPrice) {
        query.andWhere('car.pricePerDay <= :maxPrice', {
          maxPrice: filters.maxPrice,
        });
      }

      if (filters.transmission) {
        query.andWhere('car.transmission = :transmission', {
          transmission: filters.transmission,
        });
      }

      if (filters.fuelType) {
        query.andWhere('car.fuelType = :fuelType', {
          fuelType: filters.fuelType,
        });
      }

      if (filters.search) {
        query.andWhere(
          '(LOWER(car.brand) LIKE LOWER(:search) OR LOWER(car.model) LIKE LOWER(:search))',
          { search: `%${filters.search}%` },
        );
      }
    }

    return query.getMany();
  }

  // Get car by ID with images and agent info
  async findOne(id: number): Promise<any> {
    const car = await this.carRepository.findOne({
      where: { carId: id },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    // Get agent information from Agent entity
    const agentInfo: any = {};
    if (car.agentId) {
      const agent = await this.agentRepository.findOne({
        where: { agentId: car.agentId },
      });
      
      if (agent) {
        agentInfo.agentId = agent.agentId;
        agentInfo.agentName = `${agent.firstName} ${agent.lastName}`;
        agentInfo.agencyName = agent.agencyName;
      }
    }

    return {
      ...car,
      ...agentInfo,
    };
  }

  // Get cars by agent
  async findByAgent(agentId: number): Promise<Car[]> {
    return this.carRepository.find({ where: { agentId } });
  }

  // Update car
  async update(
    id: number,
    agentId: number,
    updateCarDto: UpdateCarDto,
    newImages?: Express.Multer.File[],
    role?: string,
  ): Promise<Car> {
    console.log('🚗 [CarsService.update] Starting:', {
      carId: id,
      agentId,
      updateCarDto,
      newImagesCount: newImages?.length || 0,
    });

    const car = await this.findOne(id);

    // Verify ownership (superadmins can update any car)
    if (role !== 'superadmin' && car.agentId !== agentId) {
      console.error('❌ [CarsService.update] Ownership check failed:', { carAgentId: car.agentId, agentId, role });
      throw new ForbiddenException('You can only update your own cars');
    }

    // Update car fields
    Object.assign(car, updateCarDto);

    // Update images if provided
    if (newImages && newImages.length > 0) {
      console.log('📸 [CarsService.update] Adding new images...');
      const newImagePaths = newImages.map((file) =>
        getImageRelativePath(file.filename),
      );
      // Append new images to existing ones instead of replacing
      if (car.images && car.images.length > 0) {
        car.images = [...car.images, ...newImagePaths];
      } else {
        car.images = newImagePaths;
      }
      console.log('📸 [CarsService.update] Updated image paths:', car.images);
    }

    console.log('💾 [CarsService.update] Saving car...');
    const savedCar = await this.carRepository.save(car);
    console.log('✅ [CarsService.update] Car updated successfully:', savedCar);
    return savedCar;
  }

  // Delete car
  async remove(id: number, agentId: number, role?: string): Promise<void> {
    const car = await this.findOne(id);

    // Verify ownership (superadmins can delete any car)
    if (role !== 'superadmin' && car.agentId !== agentId) {
      throw new ForbiddenException('You can only delete your own cars');
    }

    // Delete images from filesystem
    if (car.images && car.images.length > 0) {
      car.images.forEach((imagePath) => {
        deleteImageFile(imagePath);
      });
    }

    await this.carRepository.remove(car);
  }

  // Set car availability
  async setAvailability(
    id: number,
    agentId: number,
    isAvailable: boolean,
    role?: string,
  ): Promise<Car> {
    const car = await this.findOne(id);

    // Verify ownership (superadmins can update any car)
    if (role !== 'superadmin' && car.agentId !== agentId) {
      throw new ForbiddenException('You can only update your own cars');
    }

    car.isAvailable = isAvailable;
    return this.carRepository.save(car);
  }

  // Search cars
  async search(query: string): Promise<Car[]> {
    return this.carRepository.find({
      where: [
        { brand: Like(`%${query}%`), isAvailable: true },
        { model: Like(`%${query}%`), isAvailable: true },
      ],
    });
  }

  // Get featured cars (highest rated)
  async getFeatured(): Promise<Car[]> {
    return this.carRepository.find({
      where: { isAvailable: true },
      order: { averageRating: 'DESC' },
      take: 6,
    });
  }

  // Get cars by category
  async findByCategory(category: string): Promise<Car[]> {
    return this.carRepository.find({
      where: { category, isAvailable: true },
    });
  }

  // Check availability for specific dates (placeholder for now)
  async checkAvailability(
    carId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{ available: boolean; message?: string }> {
    const car = await this.findOne(carId);

    if (!car.isAvailable) {
      return { available: false, message: 'Car is not available' };
    }

    // Check against existing rentals
    const conflictingRental = await this.rentalRepository
      .createQueryBuilder('rental')
      .where('rental.carId = :carId', { carId })
      .andWhere('rental.status IN (:...statuses)', {
        statuses: ['pending', 'approved'],
      })
      .andWhere(
        '(rental.startDate <= :endDate AND rental.endDate >= :startDate)',
        { startDate, endDate },
      )
      .getOne();

    if (conflictingRental) {
      return {
        available: false,
        message: `Car is reserved from ${conflictingRental.startDate.toISOString().split('T')[0]} to ${conflictingRental.endDate.toISOString().split('T')[0]}`,
      };
    }

    return { available: true };
  }

  // Admin: Get all cars
  async findAllForAdmin(): Promise<Car[]> {
    return this.carRepository.find();
  }

  // Admin: Delete any car
  async removeByAdmin(id: number): Promise<void> {
    const car = await this.findOne(id);

    // Delete images from filesystem
    if (car.images && car.images.length > 0) {
      car.images.forEach((imagePath) => {
        deleteImageFile(imagePath);
      });
    }

    await this.carRepository.remove(car);
  }
}