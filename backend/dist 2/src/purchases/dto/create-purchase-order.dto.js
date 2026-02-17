"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPurchaseOrderSchema = void 0;
const zod_1 = require("zod");
const purchaseOrderItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid Product ID'),
    quantity: zod_1.z.number().int().positive('Quantity must be positive'),
    unitFobValue: zod_1.z.number().positive('Unit FOB value must be positive'),
});
exports.createPurchaseOrderSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid('Invalid Branch ID'),
    supplierName: zod_1.z.string().min(1, 'Supplier name required'),
    invoiceNumber: zod_1.z.string().optional(),
    proformaNumber: zod_1.z.string().optional(),
    fobValue: zod_1.z.number().nonnegative('FOB value must be non-negative'),
    freightCost: zod_1.z.number().nonnegative().default(0),
    insuranceCost: zod_1.z.number().nonnegative().default(0),
    dutiesCost: zod_1.z.number().nonnegative().default(0),
    otherCosts: zod_1.z.number().nonnegative().default(0),
    orderDate: zod_1.z.string().datetime().optional(),
    expectedDate: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().int().positive(),
        unitFobValue: zod_1.z.number().positive(),
    }))
        .min(1, 'At least one item required'),
});
//# sourceMappingURL=create-purchase-order.dto.js.map