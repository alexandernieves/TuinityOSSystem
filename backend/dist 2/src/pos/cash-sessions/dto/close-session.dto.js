"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeSessionSchema = void 0;
const zod_1 = require("zod");
exports.closeSessionSchema = zod_1.z.object({
    actualBalance: zod_1.z.number().nonnegative(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=close-session.dto.js.map