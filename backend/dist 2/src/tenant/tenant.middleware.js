"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantMiddleware = void 0;
const common_1 = require("@nestjs/common");
let TenantMiddleware = class TenantMiddleware {
    use(req, res, next) {
        const rawUrl = (req.originalUrl ?? req.url ?? req.path ?? '').trim();
        const path = rawUrl.split('?')[0];
        if (path.startsWith('/health') || path.startsWith('/auth')) {
            return next();
        }
        const authorizationRaw = req.header('authorization');
        const authorization = authorizationRaw?.trim();
        if (authorization?.toLowerCase().startsWith('bearer ')) {
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
};
exports.TenantMiddleware = TenantMiddleware;
exports.TenantMiddleware = TenantMiddleware = __decorate([
    (0, common_1.Injectable)()
], TenantMiddleware);
//# sourceMappingURL=tenant.middleware.js.map