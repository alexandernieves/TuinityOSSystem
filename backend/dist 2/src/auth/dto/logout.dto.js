"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutDtoSchema = void 0;
const zod_1 = require("zod");
exports.LogoutDtoSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(20),
});
//# sourceMappingURL=logout.dto.js.map