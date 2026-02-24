import { z } from 'zod';

export const CreateInvoiceLineDtoSchema = z.object({
  description: z.string().trim().min(1).max(255),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountType: z.enum(['NONE', 'PERCENT', 'AMOUNT']).optional().default('NONE'),
  discountValue: z.number().nonnegative().optional().default(0),
  taxable: z.boolean().optional().default(true),
  taxRate: z.number().nonnegative().optional().default(0.07),
});

export const CreateInvoiceDtoSchema = z.object({
  branchId: z.string().uuid(),
  customerName: z.string().trim().min(1).max(255),
  customerTaxId: z.string().trim().max(50).optional(),
  customerPhone: z.string().trim().max(50).optional(),
  currency: z.string().trim().max(10).optional().default('USD'),
  lines: z.array(CreateInvoiceLineDtoSchema).min(1),
});

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceDtoSchema>;
export type CreateInvoiceLineDto = z.infer<typeof CreateInvoiceLineDtoSchema>;
