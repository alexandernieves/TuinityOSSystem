import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10).toUpperCase(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(10).toUpperCase().optional(),
});

export class CreateBranchDto {
  name!: string;
  code!: string;
}

export class UpdateBranchDto {
  name?: string;
  code?: string;
}
