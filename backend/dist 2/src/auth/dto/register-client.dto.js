"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterClientDtoSchema = void 0;
const zod_1 = require("zod");
exports.RegisterClientDtoSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().optional(),
    tenantSlug: zod_1.z.string().default('dynamo'),
});
//# sourceMappingURL=register-client.dto.js.map