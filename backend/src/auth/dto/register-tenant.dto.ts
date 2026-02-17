import { z } from 'zod';

// Password must have: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Slug must be lowercase alphanumeric with hyphens only
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RegisterTenantDtoSchema = z.object({
  companyName: z.string().trim().min(2).max(100),
  tenantSlug: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), {
      message: 'Slug cannot start or end with a hyphen',
    }),
  adminEmail: z.string().trim().email().toLowerCase(),
  adminPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)',
    ),
  branchName: z.string().trim().min(2).max(100),
  branchCode: z.string().trim().min(2).max(20).toUpperCase(),
});

export type RegisterTenantDto = z.infer<typeof RegisterTenantDtoSchema>;
