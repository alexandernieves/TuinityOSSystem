"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesQuerySchema = void 0;
const zod_1 = require("zod");
exports.salesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    status: zod_1.z.string().optional(),
    q: zod_1.z.string().optional(),
});
//# sourceMappingURL=sales-query.dto.js.map