import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Rental } from './rental.entity';
import { Car } from '../cars/car.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    private notificationsService: NotificationsService,
  ) {}

  // Create rental request
  async create(userId: number, createRentalDto: CreateRentalDto): Promise<Rental> {
    const { carId, startDate, endDate } = createRentalDto;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    // Get car details
    const car = await this.carRepository.findOne({ where: { carId } });
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    if (!car.isAvailable) {
      throw new BadRequestException('Car is not available');
    }

    // Check if car is already booked for these dates
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
      throw new ConflictException('Car is already booked for these dates');
    }

    // Check if user has overlapping rentals
    const userOverlap = await this.rentalRepository
      .createQueryBuilder('rental')
      .where('rental.userId = :userId', { userId })
      .andWhere('rental.status IN (:...statuses)', {
        statuses: ['pending', 'approved'],
      })
      .andWhere(
        '(rental.startDate <= :endDate AND rental.endDate >= :startDate)',
        { startDate, endDate },
      )
      .getOne();

    if (userOverlap) {
      throw new ConflictException(
        'You already have a rental during this period',
      );
    }

    // Calculate price
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = days * parseFloat(car.pricePerDay.toString());

    // Create rental
    const rental = this.rentalRepository.create({
      userId,
      carId,
      agentId: car.agentId,
      startDate: start,
      endDate: end,
      totalPrice,
      guaranteeAmount: parseFloat(car.guaranteePrice.toString()),
      status: 'pending',
      paymentStatus: 'pending',
    });

    const savedRental = await this.rentalRepository.save(rental);

    // Send notification to agent
    await this.notificationsService.create({
      recipientId: car.agentId,
      recipientType: 'agent',
      type: 'rental_request',
      title: 'New Rental Request',
      message: `You have a new rental request for ${car.brand} ${car.model} from ${startDate} to ${endDate}`,
      relatedEntityType: 'rental',
      relatedEntityId: savedRental.rentalId,
    });

    return savedRental;
  }

  // Get all rentals for a user (with car details)
  async findByUser(userId: number): Promise<any[]> {
    const rentals = await this.rentalRepository.find({
      where: { userId },
      order: { requestDate: 'DESC' },
    });

    // Attach car details to each rental
    const rentalsWithDetails = await Promise.all(
      rentals.map(async (rental) => {
        const car = await this.carRepository.findOne({
          where: { carId: rental.carId },
        });

        return {
          ...rental,
          car: car ? {
            carId: car.carId,
            brand: car.brand,
            model: car.model,
            year: car.year,
            color: car.color,
            licensePlate: car.licensePlate,
            pricePerDay: car.pricePerDay,
            category: car.category,
            images: car.images,
            isAvailable: car.isAvailable,
          } : null,
        };
      }),
    );

    return rentalsWithDetails;
  }

  // Get all rentals for an agent (with user and car details)
  async findByAgent(agentId: number): Promise<any[]> {
    // Get all rentals for this agent
    const rentals = await this.rentalRepository.find({
      where: { agentId },
      order: { requestDate: 'DESC' },
    });

    // Since we can't use relations (they're commented out), we'll manually fetch and attach user data
    const User = require('../users/user.entity').User;
    const userRepository = this.rentalRepository.manager.getRepository(User);
    
    const rentalsWithDetails = await Promise.all(
      rentals.map(async (rental) => {
        const user = await userRepository.findOne({
          where: { userId: rental.userId },
        });
        
        const car = await this.carRepository.findOne({
          where: { carId: rental.carId },
        });

        return {
          ...rental,
          user: user ? {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            city: user.city,
          } : null,
          car: car ? {
            carId: car.carId,
            brand: car.brand,
            model: car.model,
            year: car.year,
            color: car.color,
            licensePlate: car.licensePlate,
            pricePerDay: car.pricePerDay,
            isAvailable: car.isAvailable,
          } : null,
        };
      }),
    );

    return rentalsWithDetails;
  }

  // Get pending rental count for an agent
  async getPendingCountByAgent(agentId: number): Promise<{ count: number }> {
    const count = await this.rentalRepository.count({
      where: { agentId, status: 'pending' },
    });
    return { count };
  }

  // Get rental by ID
  async findOne(id: number): Promise<Rental> {
    const rental = await this.rentalRepository.findOne({
      where: { rentalId: id },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    return rental;
  }

  // Approve rental (Agent only)
  async approve(rentalId: number, agentId: number): Promise<Rental> {
    const rental = await this.findOne(rentalId);

    // Verify ownership
    if (rental.agentId !== agentId) {
      throw new ForbiddenException('You can only approve your own rentals');
    }

    if (rental.status !== 'pending') {
      throw new BadRequestException('Only pending rentals can be approved');
    }

    // Check car availability again
    const car = await this.carRepository.findOne({
      where: { carId: rental.carId },
    });

    if (!car || !car.isAvailable) {
      throw new BadRequestException('Car is no longer available');
    }

    rental.status = 'approved';
    rental.approvalDate = new Date();

    const savedRental = await this.rentalRepository.save(rental);

    // Update car status to unavailable
    car.isAvailable = false;
    await this.carRepository.save(car);

    // Send notification to user
    await this.notificationsService.create({
      recipientId: rental.userId,
      recipientType: 'user',
      type: 'rental_approved',
      title: 'Rental Request Approved',
      message: `Your rental request for ${car.brand} ${car.model} has been approved! Pick up date: ${rental.startDate.toISOString().split('T')[0]}`,
      relatedEntityType: 'rental',
      relatedEntityId: savedRental.rentalId,
    });

    return savedRental;
  }

  // Reject rental (Agent only)
  async reject(rentalId: number, agentId: number): Promise<Rental> {
    const rental = await this.findOne(rentalId);

    // Verify ownership
    if (rental.agentId !== agentId) {
      throw new ForbiddenException('You can only reject your own rentals');
    }

    if (rental.status !== 'pending') {
      throw new BadRequestException('Only pending rentals can be rejected');
    }

    rental.status = 'rejected';

    const savedRental = await this.rentalRepository.save(rental);

    // Get car details for notification
    const car = await this.carRepository.findOne({
      where: { carId: rental.carId },
    });

    // Send notification to user
    await this.notificationsService.create({
      recipientId: rental.userId,
      recipientType: 'user',
      type: 'rental_rejected',
      title: 'Rental Request Rejected',
      message: `Your rental request for ${car?.brand} ${car?.model} has been rejected`,
      relatedEntityType: 'rental',
      relatedEntityId: savedRental.rentalId,
    });

    return savedRental;
  }

  // Cancel rental (User only)
  async cancel(rentalId: number, userId: number): Promise<Rental> {
    const rental = await this.findOne(rentalId);

    // Verify ownership
    if (rental.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own rentals');
    }

    if (rental.status !== 'pending' && rental.status !== 'approved') {
      throw new BadRequestException(
        'Only pending or approved rentals can be cancelled',
      );
    }

    // Check if rental has already started
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(rental.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (startDate <= today) {
      throw new BadRequestException(
        'Cannot cancel rental that has already started',
      );
    }

    rental.status = 'cancelled';
    const savedRental = await this.rentalRepository.save(rental);

    // Restore car availability if it was approved
    if (rental.status === 'cancelled') {
      const car = await this.carRepository.findOne({
        where: { carId: rental.carId },
      });
      if (car && !car.isAvailable) {
        car.isAvailable = true;
        await this.carRepository.save(car);
      }
    }

    return savedRental;
  }

  // Complete rental (Mark as completed)
  async complete(rentalId: number): Promise<Rental> {
    const rental = await this.findOne(rentalId);

    if (rental.status !== 'approved') {
      throw new BadRequestException('Only approved rentals can be completed');
    }

    // Check if end date has passed
    const today = new Date();
    const endDate = new Date(rental.endDate);

    if (endDate > today) {
      throw new BadRequestException('Rental period has not ended yet');
    }

    rental.status = 'completed';
    rental.completionDate = new Date();
    rental.paymentStatus = 'paid';

    const savedRental = await this.rentalRepository.save(rental);

    // Restore car availability after completion
    const car = await this.carRepository.findOne({
      where: { carId: rental.carId },
    });
    if (car && !car.isAvailable) {
      car.isAvailable = true;
      await this.carRepository.save(car);
    }

    return savedRental;
  }

  // Calculate rental price
  async calculatePrice(
    carId: number,
    startDate: string,
    endDate: string,
  ): Promise<{
    days: number;
    pricePerDay: number;
    totalPrice: number;
    guaranteeAmount: number;
    total: number;
  }> {
    const car = await this.carRepository.findOne({ where: { carId } });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const pricePerDay = parseFloat(car.pricePerDay.toString());
    const totalPrice = days * pricePerDay;
    const guaranteeAmount = parseFloat(car.guaranteePrice.toString());

    return {
      days,
      pricePerDay,
      totalPrice,
      guaranteeAmount,
      total: totalPrice + guaranteeAmount,
    };
  }

  // Check for overlapping rentals for a user
  async checkUserOverlap(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<{ hasOverlap: boolean; conflictingRental?: Rental }> {
    const overlap = await this.rentalRepository
      .createQueryBuilder('rental')
      .where('rental.userId = :userId', { userId })
      .andWhere('rental.status IN (:...statuses)', {
        statuses: ['pending', 'approved'],
      })
      .andWhere(
        '(rental.startDate <= :endDate AND rental.endDate >= :startDate)',
        { startDate, endDate },
      )
      .getOne();

    return {
      hasOverlap: !!overlap,
      conflictingRental: overlap || undefined,
    };
  }

  // Get all rentals (Admin only)
  async findAll(): Promise<Rental[]> {
    return this.rentalRepository.find({
      order: { requestDate: 'DESC' },
    });
  }

  // Get rental statistics
  async getStats(agentId?: number): Promise<{
    total: number;
    pending: number;
    approved: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    const query = this.rentalRepository.createQueryBuilder('rental');

    if (agentId) {
      query.where('rental.agentId = :agentId', { agentId });
    }

    const rentals = await query.getMany();

    const stats = {
      total: rentals.length,
      pending: rentals.filter((r) => r.status === 'pending').length,
      approved: rentals.filter((r) => r.status === 'approved').length,
      completed: rentals.filter((r) => r.status === 'completed').length,
      cancelled: rentals.filter((r) => r.status === 'cancelled').length,
      totalRevenue: rentals
        .filter((r) => r.status === 'completed')
        .reduce((sum, r) => sum + parseFloat(r.totalPrice.toString()), 0),
    };

    return stats;
  }
}