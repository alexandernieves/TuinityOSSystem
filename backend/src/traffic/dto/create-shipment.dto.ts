import { z } from 'zod';

export const createShipmentSchema = z.object({
  destination: z.string().optional(),
  carrierName: z.string().optional(),
  driverName: z.string().optional(),
  plateNumber: z.string().optional(),
  bookingNumber: z.string().optional(),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),

  // List of Sale IDs to include in this shipment
  saleIds: z
    .array(z.string().uuid())
    .min(1, 'At least one sale must be selected'),
});

export type CreateShipmentDto = z.infer<typeof createShipmentSchema>;
