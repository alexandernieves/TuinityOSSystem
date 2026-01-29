import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export type TenantContext = {
  slug: string;
};

export type RequestWithTenant = Request & {
  tenant?: TenantContext;
};

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, res: Response, next: NextFunction) {
    const path = req.path ?? '';

    if (path.startsWith('/health')) {
      return next();
    }

    const headerSlugRaw = req.header('x-tenant-slug');
    const headerSlug = headerSlugRaw?.trim();

    if (headerSlug) {
      req.tenant = { slug: headerSlug };
      return next();
    }

    const hostHeader = req.header('host');
    const host = (hostHeader ?? '').split(':')[0].trim();

    // If using subdomains, the slug is the first label: empresa1.tudominio.com
    // For localhost or IPs, no subdomain is assumed.
    if (host && host !== 'localhost' && !/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      const parts = host.split('.').filter(Boolean);
      if (parts.length >= 3) {
        const slug = parts[0];
        req.tenant = { slug };
        return next();
      }
    }

    return res.status(400).json({
      message: 'Missing tenant context. Provide x-tenant-slug header or use subdomain.',
    });
  }
}
