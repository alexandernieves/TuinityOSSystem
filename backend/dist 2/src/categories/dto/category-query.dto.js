"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryQuerySchema = void 0;
const zod_1 = require("zod");
exports.categoryQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(100),
    search: zod_1.z.string().optional(),
});
//# sourceMappingURL=category-query.dto.js.map