import { z } from 'zod';
export declare const salesQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: string | undefined;
    q?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    status?: string | undefined;
    limit?: number | undefined;
    q?: string | undefined;
    page?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type SalesQueryDto = z.infer<typeof salesQuerySchema>;
