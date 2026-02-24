"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
exports.createCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    taxId: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    customerType: zod_1.z.enum(['CASH', 'CREDIT']).default('CASH'),
    priceLevel: zod_1.z.enum(['A', 'B', 'C']).default('A'),
    creditLimit: zod_1.z.number().nonnegative().default(0),
    paymentTermDays: zod_1.z.number().int().nonnegative().default(0),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=create-customer.dto.js.map