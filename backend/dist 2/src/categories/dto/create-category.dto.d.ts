import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    parentId?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    parentId?: string | undefined;
}>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
