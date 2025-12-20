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

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  // Create review
  async create(userId: number, createReviewDto: CreateReviewDto): Promise<Review> {
    // Validate rating
    if (createReviewDto.rating < 1 || createReviewDto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const review = this.reviewRepository.create({
      userId,
      ...createReviewDto,
    });

    return this.reviewRepository.save(review);
  }

  // Get reviews for a car
  async findByCarId(carId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { carId, isApproved: true },
      order: { reviewDate: 'DESC' },
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
}
