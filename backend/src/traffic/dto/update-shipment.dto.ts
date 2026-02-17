import { z } from 'zod';

export const updateTrafficDocsSchema = z.object({
  dmcNumber: z.string().optional(),
  blNumber: z.string().optional(),
  bookingNumber: z.string().optional(),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),

  carrierName: z.string().optional(),
  driverName: z.string().optional(),
  plateNumber: z.string().optional(),

  dispatchDate: z.string().datetime().optional(),
});

export type UpdateTrafficDocsDto = z.infer<typeof updateTrafficDocsSchema>;
