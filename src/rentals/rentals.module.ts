import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { Rental } from './rental.entity';
import { Car } from '../cars/car.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rental, Car])],
  providers: [RentalsService],
  controllers: [RentalsController]
})
export class RentalsModule {}
