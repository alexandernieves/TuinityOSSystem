"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContextInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const request_context_1 = require("./request-context");
const prisma_service_1 = require("../prisma/prisma.service");
let RequestContextInterceptor = class RequestContextInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const http = context.switchToHttp();
        const req = http.getRequest();
        const path = req?.path ?? '';
        const bypassTenantIsolation = path.startsWith('/auth') || path.startsWith('/health');
        return (0, rxjs_1.from)((async () => {
            if (bypassTenantIsolation) {
                return {
                    bypassTenantIsolation: true,
                    tenantId: req?.user?.tenantId,
                    userId: req?.user?.sub,
                };
            }
            let tenantId = req?.user?.tenantId;
            const userId = req?.user?.sub;
            if (!tenantId) {
                const slug = req?.tenant?.slug;
                if (slug) {
                    const tenant = await this.prisma.tenant.findUnique({
                        where: {
                            slug,
                        },
                        select: {
                            id: true,
                        },
                    });
                    tenantId = tenant?.id;
                }
            }
            return {
                bypassTenantIsolation: false,
                tenantId,
                userId,
                role: req.role,
                permissions: req.permissions,
            };
        })()).pipe((0, operators_1.mergeMap)((store) => request_context_1.RequestContext.run(store, () => next.handle())));
    }
};
exports.RequestContextInterceptor = RequestContextInterceptor;
exports.RequestContextInterceptor = RequestContextInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RequestContextInterceptor);
//# sourceMappingURL=request-context.interceptor.js.map