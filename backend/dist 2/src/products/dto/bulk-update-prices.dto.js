"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdatePricesSchema = exports.updatePriceDto = void 0;
const zod_1 = require("zod");
exports.updatePriceDto = zod_1.z.object({
    productId: zod_1.z.string(),
    price_a: zod_1.z.number().optional(),
    price_b: zod_1.z.number().optional(),
    price_c: zod_1.z.number().optional(),
    price_d: zod_1.z.number().optional(),
    price_e: zod_1.z.number().optional(),
});
exports.bulkUpdatePricesSchema = zod_1.z.object({
    updates: zod_1.z.array(exports.updatePriceDto),
});
//# sourceMappingURL=bulk-update-prices.dto.js.map