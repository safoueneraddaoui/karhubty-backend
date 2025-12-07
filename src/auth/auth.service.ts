import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Agent } from '../agents/agent.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    private jwtService: JwtService,
  ) {}

  // Register User (Customer)
  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, password, ...userData } = registerUserDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      ...userData,
      role: 'user',
    });

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'User registered successfully',
    };
  }

  // Register Agent (Needs approval)
  async registerAgent(registerAgentDto: RegisterAgentDto) {
    const { email, password, ...agentData } = registerAgentDto;

    // Check if email already exists
    const existingAgent = await this.agentRepository.findOne({
      where: { email },
    });
    if (existingAgent) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create agent (status: pending)
    const agent = this.agentRepository.create({
      email,
      password: hashedPassword,
      ...agentData,
      role: 'agent',
      accountStatus: 'pending',
    });

    await this.agentRepository.save(agent);

    return {
      success: true,
      message:
        'Agent registration submitted. Awaiting admin approval.',
    };
  }

  // Login (User or Agent)
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Try to find user first
    let user: User | Agent | null = await this.userRepository.findOne({ where: { email } });
    let isAgent = false;

    // If not found in users, try agents
    if (!user) {
      user = await this.agentRepository.findOne({ where: { email } });
      isAgent = true;
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if agent is approved
    if (isAgent) {
      const agent = user as unknown as Agent;
      if (agent.accountStatus !== 'approved') {
        throw new UnauthorizedException(
          'Agent account is not approved yet',
        );
      }
    }

    // Check if user is active
    if (!isAgent) {
      const regularUser = user as unknown as User;
      if (!regularUser.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: isAgent ? (user as unknown as Agent).agentId : (user as unknown as User).userId,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    // Return user data with token
    const { password: _, ...userData } = user as any;
    return {
      success: true,
      user: {
        ...userData,
        id: isAgent ? (user as unknown as Agent).agentId : (user as unknown as User).userId,
        token,
      },
    };
  }

  // Validate user by ID (used by JWT strategy)
  async validateUser(userId: number, role: string) {
    if (role === 'agent') {
      return this.agentRepository.findOne({ where: { agentId: userId } });
    }
    return this.userRepository.findOne({ where: { userId } });
  }
}