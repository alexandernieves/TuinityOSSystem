"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshDtoSchema = void 0;
const zod_1 = require("zod");
exports.RefreshDtoSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(20),
});
//# sourceMappingURL=refresh.dto.js.map