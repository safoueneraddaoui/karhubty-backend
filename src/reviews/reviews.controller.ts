import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // POST /api/reviews - Create review (Protected)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, createReviewDto);
  }

  // === STATIC GET ROUTES (must come BEFORE parameterized routes) ===

  // GET /api/reviews - Get all reviews (Admin)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async findAll() {
    return this.reviewsService.findAll();
  }

  // GET /api/reviews/admin/pending - Get pending reviews (Admin)
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async getPendingReviews() {
    return this.reviewsService.getPendingReviews();
  }

  // GET /api/reviews/car/:carId - Get reviews for car
  @Get('car/:carId')
  async findByCarId(@Param('carId', ParseIntPipe) carId: number) {
    return this.reviewsService.findByCarId(carId);
  }

  // GET /api/reviews/car/:carId/rating - Get car average rating
  @Get('car/:carId/rating')
  async getCarRating(@Param('carId', ParseIntPipe) carId: number) {
    return this.reviewsService.getCarAverageRating(carId);
  }

  // GET /api/reviews/user/:userId - Get user's reviews
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    // Users can only view their own reviews (unless admin)
    if (req.user.userId !== userId && req.user.role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    return this.reviewsService.findByUserId(userId);
  }

  // === PARAMETERIZED ROUTES (must come AFTER static routes) ===

  // GET /api/reviews/:id - Get review by ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  // PUT /api/reviews/:id - Update review
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, req.user.userId, updateReviewDto);
  }

  // DELETE /api/reviews/:id - Delete review
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.reviewsService.remove(id, req.user.userId);
    return { success: true, message: 'Review deleted successfully' };
  }

  // PUT /api/reviews/:id/approve - Approve review (Admin)
  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async approveReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.approveReview(id);
  }
}
