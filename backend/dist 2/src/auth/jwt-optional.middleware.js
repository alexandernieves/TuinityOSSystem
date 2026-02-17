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
exports.JwtOptionalMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
let JwtOptionalMiddleware = class JwtOptionalMiddleware {
    jwtService;
    configService;
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    use(req, _res, next) {
        const authorizationRaw = req.header('authorization');
        const authorization = authorizationRaw?.trim();
        if (!authorization?.toLowerCase().startsWith('bearer ')) {
            return next();
        }
        const token = authorization.slice('bearer '.length).trim();
        if (!token) {
            return next();
        }
        const secret = this.configService.get('JWT_SECRET') ?? 'dev-secret';
        try {
            const payload = this.jwtService.verify(token, { secret });
            if (payload?.sub && payload?.tenantId) {
                req.user = { sub: payload.sub, tenantId: payload.tenantId };
            }
        }
        catch {
        }
        return next();
    }
};
exports.JwtOptionalMiddleware = JwtOptionalMiddleware;
exports.JwtOptionalMiddleware = JwtOptionalMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], JwtOptionalMiddleware);
//# sourceMappingURL=jwt-optional.middleware.js.map