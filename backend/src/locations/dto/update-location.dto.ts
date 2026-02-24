import { createLocationSchema } from './create-location.dto';

export const updateLocationSchema = createLocationSchema.partial();
export type UpdateLocationDto = Partial<
  import('./create-location.dto').CreateLocationDto
>;
