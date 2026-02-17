import { z } from 'zod';
export declare const updateTrafficDocsSchema: z.ZodObject<{
    dmcNumber: z.ZodOptional<z.ZodString>;
    blNumber: z.ZodOptional<z.ZodString>;
    bookingNumber: z.ZodOptional<z.ZodString>;
    containerNumber: z.ZodOptional<z.ZodString>;
    sealNumber: z.ZodOptional<z.ZodString>;
    carrierName: z.ZodOptional<z.ZodString>;
    driverName: z.ZodOptional<z.ZodString>;
    plateNumber: z.ZodOptional<z.ZodString>;
    dispatchDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dispatchDate?: string | undefined;
    containerNumber?: string | undefined;
    sealNumber?: string | undefined;
    dmcNumber?: string | undefined;
    blNumber?: string | undefined;
    bookingNumber?: string | undefined;
    carrierName?: string | undefined;
    driverName?: string | undefined;
    plateNumber?: string | undefined;
}, {
    dispatchDate?: string | undefined;
    containerNumber?: string | undefined;
    sealNumber?: string | undefined;
    dmcNumber?: string | undefined;
    blNumber?: string | undefined;
    bookingNumber?: string | undefined;
    carrierName?: string | undefined;
    driverName?: string | undefined;
    plateNumber?: string | undefined;
}>;
export type UpdateTrafficDocsDto = z.infer<typeof updateTrafficDocsSchema>;
