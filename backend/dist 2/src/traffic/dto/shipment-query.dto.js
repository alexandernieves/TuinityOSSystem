"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentQuerySchema = void 0;
const zod_1 = require("zod");
exports.shipmentQuerySchema = zod_1.z.object({
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
    status: zod_1.z.enum(['DRAFT', 'PACKED', 'DISPATCHED', 'DELIVERED']).optional(),
    shipmentNumber: zod_1.z.string().optional(),
    destination: zod_1.z.string().optional(),
    dmcNumber: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
//# sourceMappingURL=shipment-query.dto.js.map