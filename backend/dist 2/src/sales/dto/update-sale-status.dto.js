"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSaleStatusSchema = void 0;
const zod_1 = require("zod");
exports.updateSaleStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'QUOTE',
        'PENDING',
        'APPROVED_ORDER',
        'PACKING',
        'COMPLETED',
        'VOID',
    ]),
    authorizedBy: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=update-sale-status.dto.js.map