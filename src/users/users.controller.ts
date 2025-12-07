import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users/profile - Get current user profile
  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  // GET /api/users/:id - Get user by ID
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getProfile(id);
  }

  // PUT /api/users/:id - Update user profile
  @Put(':id')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
    @Request() req,
  ) {
    // Users can only update their own profile (unless admin)
    if (req.user.userId !== id && req.user.role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    return this.usersService.updateProfile(id, updateProfileDto);
  }

  // PUT /api/users/:id/password - Change password
  @Put(':id/password')
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    // Users can only change their own password
    if (req.user.userId !== id && req.user.role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    return this.usersService.changePassword(id, changePasswordDto);
  }

  // GET /api/users/:id/rentals - Get user rentals
  @Get(':id/rentals')
  async getUserRentals(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    // Users can only view their own rentals (unless admin)
    if (req.user.userId !== id && req.user.role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    return this.usersService.getUserRentals(id);
  }

  // GET /api/users/:id/reviews - Get user reviews
  @Get(':id/reviews')
  async getUserReviews(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    // Users can only view their own reviews (unless admin)
    if (req.user.userId !== id && req.user.role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    return this.usersService.getUserReviews(id);
  }

  // Admin only routes
  // GET /api/users - Get all users (admin only)
  @Get()
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  async getAllUsers() {
    return this.usersService.findAll();
  }

  // PUT /api/users/:id/activate - Activate user (admin only)
  @Put(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  async activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleActiveStatus(id, true);
  }

  // PUT /api/users/:id/deactivate - Deactivate user (admin only)
  @Put(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleActiveStatus(id, false);
  }

  // DELETE /api/users/:id - Delete user (admin only)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}