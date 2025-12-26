import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../users/user.entity';
import { Agent } from '../agents/agent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Agent]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET') || 'karhubty-secret-key-change-in-production',
          signOptions: {
            expiresIn: '7d',
          },
        };
      },
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const emailProvider = configService.get<string>('EMAIL_PROVIDER') || 'mailhog';
        const transport: any = {
          host: configService.get<string>('EMAIL_HOST'),
          port: configService.get<number>('EMAIL_PORT'),
        };

        // Add secure flag and authentication for Brevo
        if (emailProvider === 'brevo') {
          transport.secure = false; // Port 587 uses STARTTLS, not implicit TLS
          transport.auth = {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          };
        } else {
          // MailHog development setup
          transport.secure = false;
          transport.ignoreTLS = true;
        }

        return {
          transport,
          defaults: {
            from: {
              name: 'KarHubty Support',
              address: configService.get<string>('EMAIL_FROM') || 'noreply@karhubty.com',
            },
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}