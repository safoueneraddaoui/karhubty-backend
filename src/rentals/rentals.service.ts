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

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
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

    return this.rentalRepository.save(rental);
  }

  // Get all rentals for a user
  async findByUser(userId: number): Promise<Rental[]> {
    return this.rentalRepository.find({
      where: { userId },
      order: { requestDate: 'DESC' },
    });
  }

  // Get all rentals for an agent
  async findByAgent(agentId: number): Promise<Rental[]> {
    return this.rentalRepository.find({
      where: { agentId },
      order: { requestDate: 'DESC' },
    });
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

    return this.rentalRepository.save(rental);
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

    return this.rentalRepository.save(rental);
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

    return this.rentalRepository.save(rental);
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

    return this.rentalRepository.save(rental);
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