import { z } from 'zod';
export declare const RefreshDtoSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RefreshDto = z.infer<typeof RefreshDtoSchema>;
