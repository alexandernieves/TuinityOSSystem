"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productQuerySchema = void 0;
const zod_1 = require("zod");
exports.productQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
    search: zod_1.z.string().optional(),
});
//# sourceMappingURL=product-query.dto.js.map