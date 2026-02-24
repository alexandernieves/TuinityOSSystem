import { NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
export type RequestWithJwtUser = Request & {
    user?: {
        sub: string;
        tenantId: string;
    };
};
export declare class JwtOptionalMiddleware implements NestMiddleware {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    use(req: RequestWithJwtUser, _res: Response, next: NextFunction): void;
}
