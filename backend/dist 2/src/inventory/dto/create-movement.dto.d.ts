import { z } from 'zod';
export declare const createMovementSchema: z.ZodObject<{
    productId: z.ZodString;
    branchId: z.ZodString;
    type: z.ZodEnum<["IN", "OUT", "ADJUSTMENT"]>;
    quantity: z.ZodNumber;
    reason: z.ZodString;
    referenceId: z.ZodOptional<z.ZodString>;
    unitType: z.ZodOptional<z.ZodEnum<["UNIT", "BOX"]>>;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    productId: string;
    quantity: number;
    type: "IN" | "OUT" | "ADJUSTMENT";
    reason: string;
    referenceId?: string | undefined;
    unitType?: "UNIT" | "BOX" | undefined;
}, {
    branchId: string;
    productId: string;
    quantity: number;
    type: "IN" | "OUT" | "ADJUSTMENT";
    reason: string;
    referenceId?: string | undefined;
    unitType?: "UNIT" | "BOX" | undefined;
}>;
export type CreateMovementDto = z.infer<typeof createMovementSchema>;
