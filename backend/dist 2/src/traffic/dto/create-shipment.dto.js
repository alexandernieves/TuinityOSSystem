"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShipmentSchema = void 0;
const zod_1 = require("zod");
exports.createShipmentSchema = zod_1.z.object({
    destination: zod_1.z.string().optional(),
    carrierName: zod_1.z.string().optional(),
    driverName: zod_1.z.string().optional(),
    plateNumber: zod_1.z.string().optional(),
    bookingNumber: zod_1.z.string().optional(),
    containerNumber: zod_1.z.string().optional(),
    sealNumber: zod_1.z.string().optional(),
    saleIds: zod_1.z
        .array(zod_1.z.string().uuid())
        .min(1, 'At least one sale must be selected'),
});
//# sourceMappingURL=create-shipment.dto.js.map