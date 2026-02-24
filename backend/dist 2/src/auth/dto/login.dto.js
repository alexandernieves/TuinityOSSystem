"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginDtoSchema = void 0;
const zod_1 = require("zod");
exports.LoginDtoSchema = zod_1.z.object({
    tenantSlug: zod_1.z.string().trim().min(2).max(50),
    email: zod_1.z.string().trim().email().toLowerCase().max(255),
    password: zod_1.z.string().min(6).max(100),
});
//# sourceMappingURL=login.dto.js.map