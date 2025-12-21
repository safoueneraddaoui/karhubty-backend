import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { Car } from './car.entity';
import { Rental } from '../rentals/rental.entity';
import { User } from '../users/user.entity';
import { Agent } from '../agents/agent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Car, Rental, User, Agent])],
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}