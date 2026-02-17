import { z } from 'zod';
export declare const shipmentQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PACKED", "DISPATCHED", "DELIVERED"]>>;
    shipmentNumber: z.ZodOptional<z.ZodString>;
    destination: z.ZodOptional<z.ZodString>;
    dmcNumber: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: "DRAFT" | "PACKED" | "DISPATCHED" | "DELIVERED" | undefined;
    shipmentNumber?: string | undefined;
    destination?: string | undefined;
    dmcNumber?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    status?: "DRAFT" | "PACKED" | "DISPATCHED" | "DELIVERED" | undefined;
    shipmentNumber?: string | undefined;
    destination?: string | undefined;
    dmcNumber?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type ShipmentQueryDto = z.infer<typeof shipmentQuerySchema>;
