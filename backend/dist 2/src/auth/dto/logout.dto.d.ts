import { z } from 'zod';
export declare const LogoutDtoSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type LogoutDto = z.infer<typeof LogoutDtoSchema>;
