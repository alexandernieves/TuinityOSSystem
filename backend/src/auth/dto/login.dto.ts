import { z } from 'zod';

export const LoginDtoSchema = z.object({
  tenantSlug: z.string().trim().min(2).max(50),
  email: z.string().trim().email().toLowerCase().max(255),
  password: z.string().min(6).max(100),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;
