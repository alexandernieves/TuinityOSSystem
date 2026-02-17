import { z } from 'zod';

// Customer DTOs
export const createCustomerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    taxId: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    customerType: z.enum(['CASH', 'CREDIT']).default('CASH'),
    priceLevel: z.enum(['A', 'B', 'C', 'D', 'E']).default('A'),
    creditLimit: z.number().nonnegative().default(0),
    paymentTermDays: z.number().int().nonnegative().default(0),
    notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const blockCustomerSchema = z.object({
    reason: z.string().min(1, 'Reason is required'),
});

export const approveCustomerSchema = z.object({
    creditLimit: z.number().positive('Credit limit must be positive'),
    paymentTermDays: z.number().int().positive('Payment terms must be positive'),
});

// Customer Transaction DTOs
export const createCustomerTransactionSchema = z.object({
    customerId: z.string().uuid(),
    branchId: z.string().uuid().optional(),
    type: z.enum(['INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'ADJUSTMENT']),
    referenceType: z.string().optional(),
    referenceId: z.string().uuid().optional(),
    description: z.string().min(1, 'Description is required'),
    amount: z.number(),
    dueDate: z.string().datetime().optional(),
    notes: z.string().optional(),
});

export const voidTransactionSchema = z.object({
    reason: z.string().min(1, 'Reason is required'),
});

// Customer Area DTOs
export const createCustomerAreaSchema = z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});

export const updateCustomerAreaSchema = createCustomerAreaSchema.partial();

// Customer SubArea DTOs
export const createCustomerSubAreaSchema = z.object({
    areaId: z.string().uuid(),
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});

export const updateCustomerSubAreaSchema = createCustomerSubAreaSchema.partial();

// Salesperson DTOs
export const createSalespersonSchema = z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    areaId: z.string().uuid().optional(),
    subAreaId: z.string().uuid().optional(),
    commissionRate: z.number().min(0).max(100).default(0),
});

export const updateSalespersonSchema = createSalespersonSchema.partial();

// Type exports
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type BlockCustomerDto = z.infer<typeof blockCustomerSchema>;
export type ApproveCustomerDto = z.infer<typeof approveCustomerSchema>;

export type CreateCustomerTransactionDto = z.infer<typeof createCustomerTransactionSchema>;
export type VoidTransactionDto = z.infer<typeof voidTransactionSchema>;

export type CreateCustomerAreaDto = z.infer<typeof createCustomerAreaSchema>;
export type UpdateCustomerAreaDto = z.infer<typeof updateCustomerAreaSchema>;

export type CreateCustomerSubAreaDto = z.infer<typeof createCustomerSubAreaSchema>;
export type UpdateCustomerSubAreaDto = z.infer<typeof updateCustomerSubAreaSchema>;

export type CreateSalespersonDto = z.infer<typeof createSalespersonSchema>;
export type UpdateSalespersonDto = z.infer<typeof updateSalespersonSchema>;
