import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async initSuperAdmin(email: string, password: string) {
    // Check if superadmin already exists
    const existingSuperAdmin = await this.userRepository.findOne({
      where: { role: 'superadmin' },
    });

    if (existingSuperAdmin) {
      return {
        success: false,
        message: 'SuperAdmin already exists',
        email: existingSuperAdmin.email,
      };
    }

    // Check if email is already used
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to superadmin
      existingUser.role = 'superadmin';
      if (password) {
        existingUser.password = await bcrypt.hash(password, 10);
      }
      await this.userRepository.save(existingUser);
      return {
        success: true,
        message: 'Existing user promoted to SuperAdmin',
        email: existingUser.email,
      };
    }

    // Create new superadmin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+212',
      city: 'Casablanca',
      role: 'superadmin',
      isEmailVerified: true,
      isActive: true,
    });

    await this.userRepository.save(superAdmin);

    return {
      success: true,
      message: 'SuperAdmin created successfully',
      email: superAdmin.email,
    };
  }

  async resetSuperAdminPassword(email: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password reset successfully',
      email: user.email,
    };
  }
}
