"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrandSchema = void 0;
const zod_1 = require("zod");
exports.createBrandSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').trim(),
    description: zod_1.z.string().optional(),
});
//# sourceMappingURL=create-brand.dto.js.map