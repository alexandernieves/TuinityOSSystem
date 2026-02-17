"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSalespersonSchema = exports.createSalespersonSchema = exports.updateCustomerSubAreaSchema = exports.createCustomerSubAreaSchema = exports.updateCustomerAreaSchema = exports.createCustomerAreaSchema = exports.voidTransactionSchema = exports.createCustomerTransactionSchema = exports.approveCustomerSchema = exports.blockCustomerSchema = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
exports.createCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    taxId: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    customerType: zod_1.z.enum(['CASH', 'CREDIT']).default('CASH'),
    priceLevel: zod_1.z.enum(['A', 'B', 'C', 'D', 'E']).default('A'),
    creditLimit: zod_1.z.number().nonnegative().default(0),
    paymentTermDays: zod_1.z.number().int().nonnegative().default(0),
    notes: zod_1.z.string().optional(),
});
exports.updateCustomerSchema = exports.createCustomerSchema.partial();
exports.blockCustomerSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Reason is required'),
});
exports.approveCustomerSchema = zod_1.z.object({
    creditLimit: zod_1.z.number().positive('Credit limit must be positive'),
    paymentTermDays: zod_1.z.number().int().positive('Payment terms must be positive'),
});
exports.createCustomerTransactionSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid().optional(),
    type: zod_1.z.enum(['INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'ADJUSTMENT']),
    referenceType: zod_1.z.string().optional(),
    referenceId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().min(1, 'Description is required'),
    amount: zod_1.z.number(),
    dueDate: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
});
exports.voidTransactionSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Reason is required'),
});
exports.createCustomerAreaSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Code is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
});
exports.updateCustomerAreaSchema = exports.createCustomerAreaSchema.partial();
exports.createCustomerSubAreaSchema = zod_1.z.object({
    areaId: zod_1.z.string().uuid(),
    code: zod_1.z.string().min(1, 'Code is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
});
exports.updateCustomerSubAreaSchema = exports.createCustomerSubAreaSchema.partial();
exports.createSalespersonSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Code is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    areaId: zod_1.z.string().uuid().optional(),
    subAreaId: zod_1.z.string().uuid().optional(),
    commissionRate: zod_1.z.number().min(0).max(100).default(0),
});
exports.updateSalespersonSchema = exports.createSalespersonSchema.partial();
//# sourceMappingURL=index.js.map