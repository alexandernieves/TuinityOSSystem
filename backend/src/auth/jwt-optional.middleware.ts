import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';

export type RequestWithJwtUser = Request & {
  user?: {
    sub: string;
    tenantId: string;
  };
};

@Injectable()
export class JwtOptionalMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  use(req: RequestWithJwtUser, _res: Response, next: NextFunction) {
    const authorizationRaw = req.header('authorization');
    const authorization = authorizationRaw?.trim();
    if (!authorization?.toLowerCase().startsWith('bearer ')) {
      return next();
    }

    const token = authorization.slice('bearer '.length).trim();
    if (!token) {
      return next();
    }

    const secret = this.configService.get<string>('JWT_SECRET') ?? 'dev-secret';

    try {
      const payload = this.jwtService.verify(token, { secret });

      if (payload?.sub && payload?.tenantId) {
        req.user = { sub: payload.sub, tenantId: payload.tenantId };
      }
    } catch {
      // Ignore invalid token for optional auth.
    }

    return next();
  }
}
