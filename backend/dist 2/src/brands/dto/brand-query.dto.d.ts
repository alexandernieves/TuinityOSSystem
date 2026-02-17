import { z } from 'zod';
export declare const brandQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    search?: string | undefined;
}, {
    search?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export type BrandQueryDto = z.infer<typeof brandQuerySchema>;
