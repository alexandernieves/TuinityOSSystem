import { z } from 'zod';
export declare const closeSessionSchema: z.ZodObject<{
    actualBalance: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    actualBalance: number;
    notes?: string | undefined;
}, {
    actualBalance: number;
    notes?: string | undefined;
}>;
export type CloseSessionDto = z.infer<typeof closeSessionSchema>;
