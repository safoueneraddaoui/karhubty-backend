import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Get user profile by ID
  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId },
      select: [
        'userId',
        'email',
        'firstName',
        'lastName',
        'phone',
        'address',
        'city',
        'dateCreated',
        'isActive',
        'role',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Update user profile
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user fields
    Object.assign(user, updateProfileDto);

    await this.userRepository.save(user);

    // Return user without password
    const { password, ...result } = user;
    return result as User;
  }

  // Change password
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    user.password = hashedPassword;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  // Get user rentals (we'll implement this after creating Rental module)
  async getUserRentals(userId: number) {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Return user rentals after creating Rental module
    // For now, return empty array
    return [];
  }

  // Get user reviews (we'll implement this after creating Review module)
  async getUserReviews(userId: number) {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Return user reviews after creating Review module
    // For now, return empty array
    return [];
  }

  // Find user by email (helper method)
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Get all users (for admin)
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'userId',
        'email',
        'firstName',
        'lastName',
        'phone',
        'address',
        'city',
        'dateCreated',
        'isActive',
        'role',
      ],
    });
  }

  // Activate/Deactivate user (for admin)
  async toggleActiveStatus(
    userId: number,
    isActive: boolean,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = isActive;
    await this.userRepository.save(user);

    return {
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }

  // Delete user (for admin)
  async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}