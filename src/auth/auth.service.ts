import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Agent } from '../agents/agent.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  // Register User (Customer)
  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, password, phone, ...userData } = registerUserDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if phone number already exists
    if (phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      phone,
      ...userData,
      role: 'user',
      isEmailVerified: false,
      isActive: true,
      emailVerificationToken,
      emailVerificationTokenExpires,
    });

    await this.userRepository.save(user);

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${emailVerificationToken}`;
    
    try {
      console.log('[Email] Attempting to send verification email to:', email);
      console.log('[Email] MailerService available:', !!this.mailerService);
      const result = await this.mailerService.sendMail({
        to: email,
        subject: '✉️ Verify Your KarHubty Account - Action Required',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f8f9fa;
                margin: 0;
                padding: 0;
                line-height: 1.6;
              }
              .wrapper {
                background-color: #f8f9fa;
                padding: 20px 0;
              }
              .container {
                max-width: 580px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              }
              .header {
                background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -0.5px;
              }
              .header p {
                margin: 8px 0 0 0;
                font-size: 16px;
                opacity: 0.95;
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 18px;
                color: #1a1a1a;
                font-weight: 600;
                margin: 0 0 20px 0;
              }
              .text {
                color: #555555;
                font-size: 16px;
                line-height: 1.6;
                margin: 0 0 20px 0;
              }
              .button-container {
                text-align: center;
                margin: 40px 0;
              }
              .verify-button {
                background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
                color: white;
                padding: 16px 50px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s;
                box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
              }
              .verify-button:hover {
                transform: translateY(-2px);
              }
              .link-text {
                text-align: center;
                color: #888888;
                margin: 30px 0;
                font-size: 14px;
              }
              .code-section {
                background-color: #f8f9fa;
                border-left: 4px solid #FF6B35;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                word-break: break-all;
              }
              .code {
                font-family: 'Monaco', 'Courier New', monospace;
                color: #FF6B35;
                font-size: 13px;
                margin: 0;
                font-weight: 500;
              }
              .info-box {
                background-color: #FFF3E0;
                border-left: 4px solid #FF6B35;
                padding: 15px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .info-box p {
                margin: 0;
                color: #E65100;
                font-size: 14px;
                font-weight: 500;
              }
              .info-box strong {
                display: block;
                margin-bottom: 5px;
              }
              .security-note {
                color: #666666;
                font-size: 14px;
                margin: 25px 0;
                padding: 15px;
                background-color: #f0f0f0;
                border-radius: 4px;
                border-left: 4px solid #2196F3;
              }
              .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #888888;
                font-size: 12px;
                border-top: 1px solid #e0e0e0;
              }
              .footer p {
                margin: 5px 0;
              }
              .social-links {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #e0e0e0;
              }
              .divider {
                height: 1px;
                background-color: #e0e0e0;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <!-- Header -->
                <div class="header">
                  <h1>🚗 KarHubty</h1>
                  <p>Your Car Rental Platform</p>
                </div>

                <!-- Main Content -->
                <div class="content">
                  <p class="greeting">Welcome to KarHubty! 🎉</p>
                  
                  <p class="text">
                    Thank you for creating your account with us! We're excited to have you join our community of car rental enthusiasts.
                  </p>

                  <p class="text">
                    To get started and access all the features of your KarHubty account, please verify your email address by clicking the button below:
                  </p>

                  <!-- Verify Button -->
                  <div class="button-container">
                    <a href="${verificationLink}" class="verify-button">✓ Verify Email Address</a>
                  </div>

                  <p class="link-text">
                    Or click the link below if the button above doesn't work:
                  </p>

                  <!-- Clickable Link Button -->
                  <div class="button-container">
                    <a href="${verificationLink}" class="verify-button" style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); font-size: 14px; padding: 12px 30px;">
                      🔗 Open Verification Link
                    </a>
                  </div>

                  <!-- Important Info -->
                  <div class="info-box">
                    <p>
                      <strong>⏰ Link Expires In: 24 Hours</strong>
                      This verification link will expire in 24 hours for security reasons. If it expires, you can request a new verification email during login.
                    </p>
                  </div>

                  <!-- Security Note -->
                  <div class="security-note">
                    <strong>🔒 Security Notice:</strong> If you didn't create this account, please disregard this email. Your account remains secure and this email address won't be activated unless you verify it.
                  </div>

                  <p class="text" style="margin-top: 30px;">
                    Questions? Need help? Our support team is here for you. Just reply to this email.
                  </p>

                  <p class="text">
                    Happy renting!<br>
                    <strong>The KarHubty Team</strong>
                  </p>
                </div>

                <!-- Footer -->
                <div class="footer">
                  <p><strong>KarHubty</strong> © 2025 | All Rights Reserved</p>
                  <p>Your trusted car rental platform for seamless mobility solutions</p>
                  <div class="social-links">
                    <p>📧 support@karhubty.com | 🌐 www.karhubty.com</p>
                  </div>
                  <p style="margin-top: 15px; color: #999999;">
                    This is an automated message. Please do not reply directly to this email.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log('[Email] ✅ Email sent successfully:', result);
    } catch (error) {
      console.error('[Email] ❌ Error sending verification email:', error);
      // Don't throw error, user can still verify manually
    }

    return {
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
    };
  }

  // Register Agent (Needs approval)
  async registerAgent(registerAgentDto: RegisterAgentDto) {
    const { email, password, phone, ...agentData } = registerAgentDto;

    // Check if email already exists
    const existingAgent = await this.agentRepository.findOne({
      where: { email },
    });
    if (existingAgent) {
      throw new ConflictException('Email already registered');
    }

    // Check if phone number already exists
    if (phone) {
      const existingPhone = await this.agentRepository.findOne({
        where: { phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create agent (status: pending)
    const agent = this.agentRepository.create({
      email,
      password: hashedPassword,
      phone,
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

    // Check if agent is approved or in verification (awaiting documents)
    if (isAgent) {
      const agent = user as unknown as Agent;
      if (agent.accountStatus !== 'approved' && agent.accountStatus !== 'in_verification') {
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
      if (!regularUser.isEmailVerified) {
        throw new UnauthorizedException('Please verify your email before logging in');
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

  // Verify Email
  async verifyEmail(token: string) {
    // Find user with this verification token
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token has expired
    if (user.emailVerificationTokenExpires < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null as any;
    user.emailVerificationTokenExpires = null as any;

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Email verified successfully. You can now login.',
    };
  }

  // Validate user by ID (used by JWT strategy)
  async validateUser(userId: number, role: string) {
    if (role === 'agent') {
      return this.agentRepository.findOne({ where: { agentId: userId } });
    }
    return this.userRepository.findOne({ where: { userId } });
  }

  // Forgot Password
  async forgotPassword(email: string) {
    // Find user with this email
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpires = passwordResetTokenExpires;

    await this.userRepository.save(user);

    // Send reset password email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${passwordResetToken}`;
    
    try {
      console.log('[Email] Sending password reset email to:', email);
      const result = await this.mailerService.sendMail({
        to: email,
        subject: '🔐 Reset Your KarHubty Password',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f8f9fa;
                margin: 0;
                padding: 0;
                line-height: 1.6;
              }
              .wrapper {
                background-color: #f8f9fa;
                padding: 20px 0;
              }
              .container {
                max-width: 580px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              }
              .header {
                background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -0.5px;
              }
              .header p {
                margin: 8px 0 0 0;
                font-size: 16px;
                opacity: 0.95;
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 18px;
                color: #1a1a1a;
                font-weight: 600;
                margin: 0 0 20px 0;
              }
              .text {
                color: #555555;
                font-size: 16px;
                line-height: 1.6;
                margin: 0 0 20px 0;
              }
              .button-container {
                text-align: center;
                margin: 40px 0;
              }
              .reset-button {
                background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
                color: white;
                padding: 16px 50px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s;
                box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
              }
              .reset-button:hover {
                transform: translateY(-2px);
              }
              .warning-box {
                background-color: #FFF3E0;
                border-left: 4px solid #FF6B35;
                padding: 15px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .warning-box p {
                margin: 0;
                color: #E65100;
                font-size: 14px;
                font-weight: 500;
              }
              .warning-box strong {
                display: block;
                margin-bottom: 5px;
              }
              .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #888888;
                font-size: 12px;
                border-top: 1px solid #e0e0e0;
              }
              .footer p {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <!-- Header -->
                <div class="header">
                  <h1>🔐 Reset Password</h1>
                  <p>Your KarHubty Account</p>
                </div>

                <!-- Main Content -->
                <div class="content">
                  <p class="greeting">Hi there!</p>
                  
                  <p class="text">
                    We received a request to reset the password for your KarHubty account. Click the button below to create a new password:
                  </p>

                  <!-- Reset Button -->
                  <div class="button-container">
                    <a href="${resetLink}" class="reset-button">🔑 Reset My Password</a>
                  </div>

                  <!-- Alternate Link -->
                  <p class="text">
                    Or click this link if the button doesn't work:
                  </p>
                  <div class="button-container">
                    <a href="${resetLink}" class="reset-button" style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); font-size: 14px; padding: 12px 30px;">
                      🔗 Open Reset Link
                    </a>
                  </div>

                  <!-- Warning -->
                  <div class="warning-box">
                    <p>
                      <strong>⏰ Link Expires In: 1 Hour</strong>
                      This password reset link will expire in 1 hour for security reasons.
                    </p>
                  </div>

                  <div class="warning-box" style="background-color: #FCE4EC; border-left-color: #E91E63;">
                    <p style="color: #C2185B;">
                      <strong>🔒 Important Security Notice</strong>
                      If you didn't request this password reset, please ignore this email. Your account is still secure.
                    </p>
                  </div>

                  <p class="text">
                    Need help? Contact our support team at support@karhubty.com
                  </p>
                </div>

                <!-- Footer -->
                <div class="footer">
                  <p><strong>KarHubty</strong> © 2025 | All Rights Reserved</p>
                  <p>Your trusted car rental platform</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log('[Email] ✅ Password reset email sent successfully');
    } catch (error) {
      console.error('[Email] ❌ Error sending password reset email:', error);
      // Still return success to prevent user enumeration
    }

    return {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    };
  }

  // Reset Password
  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    // Find user with this reset token
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (user.passwordResetTokenExpires < new Date()) {
      throw new BadRequestException('Password reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = null as any;
    user.passwordResetTokenExpires = null as any;

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    };
  }
}