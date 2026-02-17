"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseQuerySchema = void 0;
const zod_1 = require("zod");
exports.purchaseQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    supplierName: zod_1.z.string().optional(),
    status: zod_1.z.enum(['DRAFT', 'RECEIVED', 'PARTIAL']).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=purchase-query.dto.js.map