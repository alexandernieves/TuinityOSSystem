import { z } from 'zod';
export declare const openSessionSchema: z.ZodObject<{
    branchId: z.ZodString;
    openingBalance: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    openingBalance: number;
}, {
    branchId: string;
    openingBalance: number;
}>;
export type OpenSessionDto = z.infer<typeof openSessionSchema>;
