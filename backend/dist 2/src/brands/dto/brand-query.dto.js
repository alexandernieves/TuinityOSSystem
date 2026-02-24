"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandQuerySchema = void 0;
const zod_1 = require("zod");
exports.brandQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
});
//# sourceMappingURL=brand-query.dto.js.map