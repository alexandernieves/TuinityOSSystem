"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMovementSchema = void 0;
const zod_1 = require("zod");
exports.createMovementSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid Product ID'),
    branchId: zod_1.z.string().uuid('Invalid Branch ID'),
    type: zod_1.z.enum(['IN', 'OUT', 'ADJUSTMENT']),
    quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1'),
    reason: zod_1.z.string().min(1, 'Reason is required'),
    referenceId: zod_1.z.string().optional(),
    unitType: zod_1.z.enum(['UNIT', 'BOX']).optional(),
});
//# sourceMappingURL=create-movement.dto.js.map