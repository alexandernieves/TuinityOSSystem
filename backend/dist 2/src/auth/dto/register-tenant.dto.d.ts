import { z } from 'zod';
export declare const RegisterTenantDtoSchema: z.ZodObject<{
    companyName: z.ZodString;
    tenantSlug: z.ZodEffects<z.ZodString, string, string>;
    adminEmail: z.ZodString;
    adminPassword: z.ZodString;
    branchName: z.ZodString;
    branchCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantSlug: string;
    companyName: string;
    adminEmail: string;
    adminPassword: string;
    branchName: string;
    branchCode: string;
}, {
    tenantSlug: string;
    companyName: string;
    adminEmail: string;
    adminPassword: string;
    branchName: string;
    branchCode: string;
}>;
export type RegisterTenantDto = z.infer<typeof RegisterTenantDtoSchema>;
