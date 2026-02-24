"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaleSchema = void 0;
const zod_1 = require("zod");
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid Product ID'),
    quantity: zod_1.z.number().int().positive('Quantity must be positive'),
    unitPrice: zod_1.z.number().nonnegative().optional(),
    discount: zod_1.z.number().nonnegative().default(0),
});
exports.createSaleSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid('Invalid Branch ID'),
    customerId: zod_1.z.string().optional(),
    items: zod_1.z.array(saleItemSchema).min(1, 'At least one item required'),
    paymentMethod: zod_1.z.string().min(1, 'Payment method required').optional(),
    status: zod_1.z.enum(['QUOTE', 'PENDING', 'COMPLETED']).default('COMPLETED'),
    notes: zod_1.z.string().optional(),
    authorizedBy: zod_1.z.string().optional(),
});
//# sourceMappingURL=create-sale.dto.js.map