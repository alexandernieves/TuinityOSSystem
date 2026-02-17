"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerQuerySchema = void 0;
const zod_1 = require("zod");
exports.customerQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    customerType: zod_1.z.enum(['CASH', 'CREDIT']).optional(),
    creditStatus: zod_1.z.enum(['NORMAL', 'OVERDUE', 'BLOCKED']).optional(),
    isBlocked: zod_1.z.coerce.boolean().optional(),
    search: zod_1.z.string().optional(),
});
//# sourceMappingURL=customer-query.dto.js.map