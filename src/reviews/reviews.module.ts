import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './review.entity';
import { Rental } from '../rentals/rental.entity';
import { Car } from '../cars/car.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Rental, Car])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
