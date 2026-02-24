import { z } from 'zod';
export declare const RegisterClientDtoSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    tenantSlug: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    tenantSlug: string;
    password: string;
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
    tenantSlug?: string | undefined;
}>;
export type RegisterClientDto = z.infer<typeof RegisterClientDtoSchema>;
