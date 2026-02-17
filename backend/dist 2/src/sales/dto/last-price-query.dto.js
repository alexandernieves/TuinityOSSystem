"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastPriceQuerySchema = void 0;
const zod_1 = require("zod");
exports.lastPriceQuerySchema = zod_1.z.object({
    customerId: zod_1.z.string(),
    productId: zod_1.z.string(),
});
//# sourceMappingURL=last-price-query.dto.js.map