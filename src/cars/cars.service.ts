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
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
  ) {}

  // Create new car with images
  async create(
    agentId: number,
    createCarDto: CreateCarDto,
    images: string[],
  ): Promise<Car> {
    // Check if license plate already exists
    const existingCar = await this.carRepository.findOne({
      where: { licensePlate: createCarDto.licensePlate },
    });

    if (existingCar) {
      throw new ConflictException('License plate already exists');
    }

    // Create car
    const car = this.carRepository.create({
      ...createCarDto,
      agentId,
      images,
      isAvailable: true,
      averageRating: 0,
    });

    return this.carRepository.save(car);
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

  // Get car by ID
  async findOne(id: number): Promise<Car> {
    const car = await this.carRepository.findOne({ where: { carId: id } });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    return car;
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
    newImages?: string[],
  ): Promise<Car> {
    const car = await this.findOne(id);

    // Verify ownership
    if (car.agentId !== agentId) {
      throw new ForbiddenException('You can only update your own cars');
    }

    // Update fields
    Object.assign(car, updateCarDto);

    // Update images if provided
    if (newImages && newImages.length > 0) {
      // Delete old images from filesystem
      if (car.images && car.images.length > 0) {
        car.images.forEach((imagePath) => {
          const fullPath = path.join(process.cwd(), 'uploads', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
      }
      car.images = newImages;
    }

    return this.carRepository.save(car);
  }

  // Delete car
  async remove(id: number, agentId: number): Promise<void> {
    const car = await this.findOne(id);

    // Verify ownership
    if (car.agentId !== agentId) {
      throw new ForbiddenException('You can only delete your own cars');
    }

    // Delete images from filesystem
    if (car.images && car.images.length > 0) {
      car.images.forEach((imagePath) => {
        const fullPath = path.join(process.cwd(), 'uploads', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await this.carRepository.remove(car);
  }

  // Set car availability
  async setAvailability(
    id: number,
    agentId: number,
    isAvailable: boolean,
  ): Promise<Car> {
    const car = await this.findOne(id);

    // Verify ownership
    if (car.agentId !== agentId) {
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
  ): Promise<{ available: boolean }> {
    const car = await this.findOne(carId);

    // TODO: Check against existing rentals when Rental module is created
    // For now, just check if car exists and is available

    return { available: car.isAvailable };
  }

  // Admin: Get all cars
  async findAllForAdmin(): Promise<Car[]> {
    return this.carRepository.find();
  }

  // Admin: Delete any car
  async removeByAdmin(id: number): Promise<void> {
    const car = await this.findOne(id);

    // Delete images
    if (car.images && car.images.length > 0) {
      car.images.forEach((imagePath) => {
        const fullPath = path.join(process.cwd(), 'uploads', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await this.carRepository.remove(car);
  }
}