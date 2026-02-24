import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
export type TenantContext = {
    slug: string;
};
export type RequestWithTenant = Request & {
    tenant?: TenantContext;
};
export declare class TenantMiddleware implements NestMiddleware {
    use(req: RequestWithTenant, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
}
