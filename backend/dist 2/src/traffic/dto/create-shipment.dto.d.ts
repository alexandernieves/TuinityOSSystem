import { z } from 'zod';
export declare const createShipmentSchema: z.ZodObject<{
    destination: z.ZodOptional<z.ZodString>;
    carrierName: z.ZodOptional<z.ZodString>;
    driverName: z.ZodOptional<z.ZodString>;
    plateNumber: z.ZodOptional<z.ZodString>;
    bookingNumber: z.ZodOptional<z.ZodString>;
    containerNumber: z.ZodOptional<z.ZodString>;
    sealNumber: z.ZodOptional<z.ZodString>;
    saleIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    saleIds: string[];
    destination?: string | undefined;
    containerNumber?: string | undefined;
    sealNumber?: string | undefined;
    bookingNumber?: string | undefined;
    carrierName?: string | undefined;
    driverName?: string | undefined;
    plateNumber?: string | undefined;
}, {
    saleIds: string[];
    destination?: string | undefined;
    containerNumber?: string | undefined;
    sealNumber?: string | undefined;
    bookingNumber?: string | undefined;
    carrierName?: string | undefined;
    driverName?: string | undefined;
    plateNumber?: string | undefined;
}>;
export type CreateShipmentDto = z.infer<typeof createShipmentSchema>;
