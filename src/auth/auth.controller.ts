import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register/user
  @Post('register/user')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  // POST /api/auth/register/agent
  @Post('register/agent')
  async registerAgent(@Body() registerAgentDto: RegisterAgentDto) {
    return this.authService.registerAgent(registerAgentDto);
  }

  // POST /api/auth/login
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}