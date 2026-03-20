import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
        });
    }

    async validate(payload: any) {
        // Verify session is still active
        const isValid = await this.authService.validateSession(payload.sessionId);
        if (!isValid) {
            throw new UnauthorizedException('Session has been closed or is inactive');
        }

        return {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
            sessionId: payload.sessionId
        };
    }
}
