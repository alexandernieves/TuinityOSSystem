import { z } from 'zod';
export declare const createBranchSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
}, {
    name: string;
    code: string;
}>;
export declare const updateBranchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    code?: string | undefined;
}, {
    name?: string | undefined;
    code?: string | undefined;
}>;
export declare class CreateBranchDto {
    name: string;
    code: string;
}
export declare class UpdateBranchDto {
    name?: string;
    code?: string;
}
