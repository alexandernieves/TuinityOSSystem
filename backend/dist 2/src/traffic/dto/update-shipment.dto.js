"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTrafficDocsSchema = void 0;
const zod_1 = require("zod");
exports.updateTrafficDocsSchema = zod_1.z.object({
    dmcNumber: zod_1.z.string().optional(),
    blNumber: zod_1.z.string().optional(),
    bookingNumber: zod_1.z.string().optional(),
    containerNumber: zod_1.z.string().optional(),
    sealNumber: zod_1.z.string().optional(),
    carrierName: zod_1.z.string().optional(),
    driverName: zod_1.z.string().optional(),
    plateNumber: zod_1.z.string().optional(),
    dispatchDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=update-shipment.dto.js.map