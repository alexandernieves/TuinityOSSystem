import { z } from 'zod';
export declare const LoginDtoSchema: z.ZodObject<{
    tenantSlug: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    tenantSlug: string;
    password: string;
}, {
    email: string;
    tenantSlug: string;
    password: string;
}>;
export type LoginDto = z.infer<typeof LoginDtoSchema>;
