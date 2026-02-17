"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferInventorySchema = void 0;
const zod_1 = require("zod");
exports.transferInventorySchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    fromBranchId: zod_1.z.string().uuid(),
    toBranchId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().positive(),
    reason: zod_1.z.string().optional(),
});
//# sourceMappingURL=transfer-inventory.dto.js.map