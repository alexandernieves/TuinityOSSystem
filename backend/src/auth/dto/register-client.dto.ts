import { z } from 'zod';

export const RegisterClientDtoSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  tenantSlug: z.string().default('dynamo'), // Default to main tenant
});

export type RegisterClientDto = z.infer<typeof RegisterClientDtoSchema>;
