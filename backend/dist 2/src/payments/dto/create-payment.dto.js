"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid('Invalid customer ID'),
    saleId: zod_1.z.string().uuid('Invalid sale ID').optional(),
    amount: zod_1.z.number().positive('Amount must be positive'),
    paymentDate: zod_1.z.string().datetime().optional(),
    paymentMethod: zod_1.z
        .enum(['CASH', 'TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'OTHER'])
        .default('CASH'),
    reference: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=create-payment.dto.js.map