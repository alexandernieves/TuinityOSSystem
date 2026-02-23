import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  fax: z.string().optional(),
  poBox: z.string().optional(),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  inventoryAccount: z.string().optional(),
  supplierAccount: z.string().optional(),
});

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
