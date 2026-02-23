import { createWarehouseSchema } from './create-warehouse.dto';

export const updateWarehouseSchema = createWarehouseSchema.partial();
export type UpdateWarehouseDto = Partial<
  import('./create-warehouse.dto').CreateWarehouseDto
>;
