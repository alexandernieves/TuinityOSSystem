"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterTenantDtoSchema = void 0;
const zod_1 = require("zod");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
exports.RegisterTenantDtoSchema = zod_1.z.object({
    companyName: zod_1.z.string().trim().min(2).max(100),
    tenantSlug: zod_1.z
        .string()
        .trim()
        .min(2)
        .max(50)
        .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
        .refine((val) => !val.startsWith('-') && !val.endsWith('-'), {
        message: 'Slug cannot start or end with a hyphen',
    }),
    adminEmail: zod_1.z.string().trim().email().toLowerCase(),
    adminPassword: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100)
        .regex(passwordRegex, 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)'),
    branchName: zod_1.z.string().trim().min(2).max(100),
    branchCode: zod_1.z.string().trim().min(2).max(20).toUpperCase(),
});
//# sourceMappingURL=register-tenant.dto.js.map