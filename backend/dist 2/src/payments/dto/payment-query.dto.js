"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentQuerySchema = void 0;
const zod_1 = require("zod");
exports.paymentQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    customerId: zod_1.z.string().uuid().optional(),
    saleId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    paymentMethod: zod_1.z
        .enum(['CASH', 'TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'OTHER'])
        .optional(),
});
//# sourceMappingURL=payment-query.dto.js.map