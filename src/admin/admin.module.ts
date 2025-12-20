import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Agent } from '../agents/agent.entity';
import { User } from '../users/user.entity';
import { Rental } from '../rentals/rental.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, User, Rental])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
