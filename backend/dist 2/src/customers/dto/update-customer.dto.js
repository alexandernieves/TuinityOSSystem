"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerSchema = void 0;
const zod_1 = require("zod");
exports.updateCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    taxId: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    priceLevel: zod_1.z.enum(['A', 'B', 'C']).optional(),
    creditLimit: zod_1.z.number().nonnegative().optional(),
    paymentTermDays: zod_1.z.number().int().nonnegative().optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=update-customer.dto.js.map