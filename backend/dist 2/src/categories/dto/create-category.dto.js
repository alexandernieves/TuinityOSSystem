"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').trim(),
    description: zod_1.z.string().optional(),
    parentId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=create-category.dto.js.map