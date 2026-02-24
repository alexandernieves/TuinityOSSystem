"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receivePurchaseOrderSchema = void 0;
const zod_1 = require("zod");
const receiveItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid Product ID'),
    quantity: zod_1.z.number().int().positive('Quantity must be positive'),
});
exports.receivePurchaseOrderSchema = zod_1.z.object({
    items: zod_1.z.array(receiveItemSchema).min(1, 'At least one item required'),
    receivedDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=receive-purchase-order.dto.js.map