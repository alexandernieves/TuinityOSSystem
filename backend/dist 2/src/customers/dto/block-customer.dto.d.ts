import { z } from 'zod';
export declare const blockCustomerSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type BlockCustomerDto = z.infer<typeof blockCustomerSchema>;
