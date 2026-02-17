import { z } from 'zod';
export declare const transferInventorySchema: z.ZodObject<{
    productId: z.ZodString;
    fromBranchId: z.ZodString;
    toBranchId: z.ZodString;
    quantity: z.ZodNumber;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    fromBranchId: string;
    toBranchId: string;
    reason?: string | undefined;
}, {
    productId: string;
    quantity: number;
    fromBranchId: string;
    toBranchId: string;
    reason?: string | undefined;
}>;
export type TransferInventoryDto = z.infer<typeof transferInventorySchema>;
