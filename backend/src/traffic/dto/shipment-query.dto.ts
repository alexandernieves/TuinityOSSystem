import { z } from 'zod';

export const shipmentQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: z.enum(['DRAFT', 'PACKED', 'DISPATCHED', 'DELIVERED']).optional(),
  shipmentNumber: z.string().optional(),
  destination: z.string().optional(),
  dmcNumber: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ShipmentQueryDto = z.infer<typeof shipmentQuerySchema>;
