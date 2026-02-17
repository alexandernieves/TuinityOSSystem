"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInvoiceDtoSchema = exports.CreateInvoiceLineDtoSchema = void 0;
const zod_1 = require("zod");
exports.CreateInvoiceLineDtoSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().trim().min(1).max(255),
    quantity: zod_1.z.number().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
    discountType: zod_1.z
        .enum(['NONE', 'PERCENT', 'AMOUNT'])
        .optional()
        .default('NONE'),
    discountValue: zod_1.z.number().nonnegative().optional().default(0),
    taxable: zod_1.z.boolean().optional().default(true),
    taxRate: zod_1.z.number().nonnegative().optional().default(0.07),
});
exports.CreateInvoiceDtoSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid(),
    customerName: zod_1.z.string().trim().min(1).max(255),
    customerTaxId: zod_1.z.string().trim().max(50).optional(),
    customerPhone: zod_1.z.string().trim().max(50).optional(),
    currency: zod_1.z.string().trim().max(10).optional().default('USD'),
    paymentMethod: zod_1.z
        .enum(['CASH', 'CARD', 'TRANSFER'])
        .optional()
        .default('CASH'),
    lines: zod_1.z.array(exports.CreateInvoiceLineDtoSchema).min(1),
});
//# sourceMappingURL=create-invoice.dto.js.map