import { z } from 'zod';
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    parentId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    parentId?: string | undefined;
}>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
