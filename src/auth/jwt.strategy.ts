import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'karhubty-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub, payload.role);
    
    if (!user) {
      throw new UnauthorizedException();
    }

    // Return appropriate ID field based on role
    if (payload.role === 'agent') {
      return {
        sub: payload.sub,
        userId: payload.sub, // For agents, this is actually their agentId
        agentId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }

    return {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}