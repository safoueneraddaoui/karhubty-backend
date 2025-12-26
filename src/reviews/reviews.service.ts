import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Rental } from '../rentals/rental.entity';
import { Car } from '../cars/car.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
  ) {}

  // Create review - only if user has approved rental for this car
  async create(userId: number, createReviewDto: CreateReviewDto): Promise<Review> {
    // Validate rating
    if (createReviewDto.rating < 1 || createReviewDto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Verify user has approved or completed rental for this car
    const approvedRental = await this.rentalRepository.findOne({
      where: {
        userId,
        carId: createReviewDto.carId,
        status: 'approved', // Allow reviews on ongoing or completed rentals
      },
    });

    // Also check for completed rentals
    const completedRental = !approvedRental ? await this.rentalRepository.findOne({
      where: {
        userId,
        carId: createReviewDto.carId,
        status: 'completed',
      },
    }) : null;

    if (!approvedRental && !completedRental) {
      throw new ForbiddenException('You can only review cars you have rented');
    }

    const review = this.reviewRepository.create({
      userId,
      ...createReviewDto,
    });

    return this.reviewRepository.save(review);
  }

  // Get latest 5 reviews for a car
  async findByCarId(carId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { carId, isApproved: true },
      order: { reviewDate: 'DESC' },
      take: 5, // Only get 5 latest
    });
  }

  // Get user's reviews
  async findByUserId(userId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { userId },
      order: { reviewDate: 'DESC' },
    });
  }

  // Get review by ID
  async findOne(reviewId: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  // Update review
  async update(
    reviewId: number,
    userId: number,
    updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.findOne(reviewId);

    // Verify ownership
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Validate rating if provided
    if (
      updateReviewDto.rating &&
      (updateReviewDto.rating < 1 || updateReviewDto.rating > 5)
    ) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    Object.assign(review, updateReviewDto);
    return this.reviewRepository.save(review);
  }

  // Delete review
  async remove(reviewId: number, userId: number): Promise<void> {
    const review = await this.findOne(reviewId);

    // Verify ownership
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.remove(review);
  }

  // Approve review (Admin)
  async approveReview(reviewId: number): Promise<Review> {
    const review = await this.findOne(reviewId);

    review.isApproved = true;
    return this.reviewRepository.save(review);
  }

  // Get all reviews (Admin)
  async findAll(): Promise<Review[]> {
    return this.reviewRepository.find({
      order: { reviewDate: 'DESC' },
    });
  }

  // Get pending reviews (Admin)
  async getPendingReviews(): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { isApproved: false },
      order: { reviewDate: 'ASC' },
    });
  }

  // Get car average rating
  async getCarAverageRating(carId: number): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const reviews = await this.reviewRepository.find({
      where: { carId, isApproved: true },
    });

    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
    };
  }

  // Agent reply to review
  async replyToReview(
    reviewId: number,
    agentId: number,
    reply: string,
  ): Promise<Review> {
    const review = await this.findOne(reviewId);

    // Verify agent owns the car
    const car = await this.carRepository.findOne({
      where: { carId: review.carId },
    });

    if (!car || car.agentId !== agentId) {
      throw new ForbiddenException(
        'You can only reply to reviews on your own cars',
      );
    }

    review.agentReply = reply;
    review.replyDate = new Date();
    return this.reviewRepository.save(review);
  }

  // Get agent car reviews with user info
  async getAgentCarReviews(agentId: number): Promise<any[]> {
    const cars = await this.carRepository.find({ where: { agentId } });
    const carIds = cars.map((c) => c.carId);

    if (carIds.length === 0) {
      return [];
    }

    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.carId IN (:...carIds)', { carIds })
      .andWhere('review.isApproved = :approved', { approved: true })
      .orderBy('review.reviewDate', 'DESC')
      .getMany();

    // Map the reviews to include customer name
    return reviews.map(review => ({
      reviewId: review.reviewId,
      userId: review.userId,
      carId: review.carId,
      rentalId: review.rentalId,
      rating: review.rating,
      comment: review.comment,
      agentReply: review.agentReply,
      reviewDate: review.reviewDate,
      replyDate: review.replyDate,
      isApproved: review.isApproved,
      updatedAt: review.updatedAt,
      customerName: review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous',
      customerEmail: review.user?.email,
    }));
  }
}
