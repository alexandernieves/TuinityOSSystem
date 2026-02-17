"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBranchDto = exports.CreateBranchDto = exports.updateBranchSchema = exports.createBranchSchema = void 0;
const zod_1 = require("zod");
exports.createBranchSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    code: zod_1.z.string().min(2).max(10).toUpperCase(),
});
exports.updateBranchSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    code: zod_1.z.string().min(2).max(10).toUpperCase().optional(),
});
class CreateBranchDto {
    name;
    code;
}
exports.CreateBranchDto = CreateBranchDto;
class UpdateBranchDto {
    name;
    code;
}
exports.UpdateBranchDto = UpdateBranchDto;
//# sourceMappingURL=branch.dto.js.map