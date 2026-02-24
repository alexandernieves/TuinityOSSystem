"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSaleSchema = void 0;
const zod_1 = require("zod");
const updateSaleItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid Product ID'),
    quantity: zod_1.z.number().int().positive('Quantity must be positive'),
    unitPrice: zod_1.z.number().nonnegative().optional(),
    discount: zod_1.z.number().nonnegative().default(0),
});
exports.updateSaleSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    items: zod_1.z.array(updateSaleItemSchema).min(1, 'At least one item required'),
    paymentMethod: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    authorizedBy: zod_1.z.string().optional(),
});
//# sourceMappingURL=update-sale.dto.js.map