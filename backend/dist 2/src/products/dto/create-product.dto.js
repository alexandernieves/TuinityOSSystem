"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, 'Description is required').trim(),
    description_es: zod_1.z.string().optional(),
    description_en: zod_1.z.string().optional(),
    description_pt: zod_1.z.string().optional(),
    codigoArancelario: zod_1.z.string().min(1, 'Tariff code is required'),
    paisOrigen: zod_1.z.string().min(1, 'Country of origin is required'),
    price_a: zod_1.z.number({ required_error: 'Price A is required' }).nonnegative(),
    price_b: zod_1.z.number({ required_error: 'Price B is required' }).nonnegative(),
    price_c: zod_1.z.number({ required_error: 'Price C is required' }).nonnegative(),
    price_d: zod_1.z.number({ required_error: 'Price D is required' }).nonnegative(),
    price_e: zod_1.z.number({ required_error: 'Price E is required' }).nonnegative(),
    barcodes: zod_1.z.array(zod_1.z.string()).optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    brandId: zod_1.z.string().uuid().optional(),
    forceCreate: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=create-product.dto.js.map