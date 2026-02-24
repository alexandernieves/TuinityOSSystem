"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openSessionSchema = void 0;
const zod_1 = require("zod");
exports.openSessionSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid(),
    openingBalance: zod_1.z.number().nonnegative(),
});
//# sourceMappingURL=open-session.dto.js.map