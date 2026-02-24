"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundSaleSchema = exports.refundItemSchema = void 0;
const zod_1 = require("zod");
exports.refundItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid Product ID'),
    quantity: zod_1.z.number().int().positive('Quantity must be positive'),
});
exports.refundSaleSchema = zod_1.z.object({
    items: zod_1.z
        .array(exports.refundItemSchema)
        .min(1, 'At least one item required for refund'),
});
//# sourceMappingURL=refund-sale.dto.js.map