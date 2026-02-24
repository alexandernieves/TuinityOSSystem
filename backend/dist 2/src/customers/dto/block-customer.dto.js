"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockCustomerSchema = void 0;
const zod_1 = require("zod");
exports.blockCustomerSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Reason is required'),
});
//# sourceMappingURL=block-customer.dto.js.map