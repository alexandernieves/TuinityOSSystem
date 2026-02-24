"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcryptjs"));
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🚀 Iniciando Seed Maestro (v2) para Evolution Zona Libre...');
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'evolution' },
        update: {},
        create: { name: 'Evolution Zona Libre', slug: 'evolution' },
    });
    const bodega = await prisma.branch.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'BZR' } },
        update: {},
        create: { tenantId: tenant.id, name: 'Bodega Zona Libre', code: 'BZR' },
    });
    const tienda = await prisma.branch.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'COL' } },
        update: {},
        create: { tenantId: tenant.id, name: 'Tienda Colón', code: 'COL' },
    });
    const permissionsList = [
        'MANAGE_TENANT', 'MANAGE_USERS', 'VIEW_COSTS', 'EDIT_PRODUCTS',
        'DELETE_PRODUCTS', 'BULK_EDIT_PRICES', 'VIEW_PRICES', 'CREATE_SALE',
        'VIEW_SALES', 'EDIT_SALES', 'APPROVE_SALES', 'VOID_SALES',
        'MANAGE_CLIENTS', 'VIEW_INVENTORY', 'ADJUST_INVENTORY', 'VIEW_BRANCHES',
        'MANAGE_BRANCHES', 'MANAGE_TRAFFIC', 'VIEW_TRAFFIC', 'MANAGE_POS',
        'MANAGE_CASH_REGISTERS', 'VIEW_PRODUCTS'
    ];
    const permMap = new Map();
    for (const key of permissionsList) {
        const p = await prisma.permission.upsert({
            where: { key },
            update: {},
            create: { key },
        });
        permMap.set(key, p.id);
    }
    const rolesConfig = {
        OWNER: permissionsList,
        SALES: ['VIEW_BRANCHES', 'CREATE_SALE', 'VIEW_SALES', 'VIEW_PRICES', 'MANAGE_CLIENTS', 'MANAGE_POS', 'VIEW_PRODUCTS'],
        WAREHOUSE: ['VIEW_BRANCHES', 'VIEW_INVENTORY', 'ADJUST_INVENTORY', 'MANAGE_TRAFFIC', 'VIEW_TRAFFIC', 'VIEW_PRODUCTS'],
    };
    const roleMap = new Map();
    for (const [roleName, rolePerms] of Object.entries(rolesConfig)) {
        const role = await prisma.role.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
            update: {},
            create: { tenantId: tenant.id, name: roleName },
        });
        roleMap.set(roleName, role.id);
        for (const key of rolePerms) {
            const permId = permMap.get(key);
            if (permId) {
                await prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
                    update: {},
                    create: { roleId: role.id, permissionId: permId },
                });
            }
        }
    }
    console.log('✅ Roles y Permisos configurados (RBAC).');
    const passwordHash = await bcrypt.hash('Evolution2026!', 10);
    const usersData = [
        { email: 'ariel@evolution.com', name: 'Ariel (Manager)', role: 'OWNER' },
        { email: 'margarita@evolution.com', name: 'Margarita (Ventas)', role: 'SALES' },
        { email: 'celly@evolution.com', name: 'Celly (Bodega)', role: 'WAREHOUSE' },
        { email: 'vendedor@evolution.com', name: 'Vendedor Tienda', role: 'SALES' },
    ];
    for (const u of usersData) {
        const user = await prisma.user.upsert({
            where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
            update: { passwordHash, role: u.role },
            create: {
                tenantId: tenant.id,
                email: u.email,
                name: u.name,
                passwordHash,
                role: u.role,
                status: 'ACTIVE',
            },
        });
        const roleId = roleMap.get(u.role);
        if (roleId) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: user.id, roleId } },
                update: {},
                create: { userId: user.id, roleId },
            });
        }
    }
    console.log('✅ Usuarios creados y asignados a roles.');
    const productsData = [
        { description: 'Chanel No. 5 100ml', price_a: 120.00, price_b: 110.00, price_c: 105.00, cost: 75.00, sku: 'PAR-CH5', unitsPerBox: 24, weight: 0.35, tariffCode: '3303.00.00' },
        { description: 'Dior Sauvage Elixir 60ml', price_a: 145.00, price_b: 135.00, price_c: 128.00, cost: 90.00, sku: 'PAR-DSA', unitsPerBox: 24, weight: 0.25, tariffCode: '3303.00.00' },
        { description: 'Johnnie Walker Black Label 1L', price_a: 35.00, price_b: 32.00, price_c: 30.00, cost: 22.00, sku: 'LIC-JWBL', unitsPerBox: 12, weight: 1.5, tariffCode: '2208.30.00' },
        { description: 'Buchanan\'s 12 Years 750ml', price_a: 28.00, price_b: 26.00, price_c: 24.50, cost: 18.00, sku: 'LIC-B12', unitsPerBox: 12, weight: 1.2, tariffCode: '2208.30.00' },
        { description: 'Ron Abuelo 12 Años', price_a: 22.00, price_b: 20.00, price_c: 19.00, cost: 14.50, sku: 'LIC-AB12', unitsPerBox: 6, weight: 1.4, tariffCode: '2208.40.00' },
        { description: 'Sarten Oster Pro-Ceramic', price_a: 25.00, price_b: 22.00, price_c: 20.00, cost: 12.00, sku: 'HOG-OST', unitsPerBox: 4, weight: 2.1, tariffCode: '7323.93.00' },
    ];
    for (const p of productsData) {
        let product = await prisma.product.findFirst({
            where: { tenantId: tenant.id, description: p.description }
        });
        const productData = {
            price_a: p.price_a,
            price_b: p.price_b,
            price_c: p.price_c,
            lastFobCost: p.cost,
            lastCifCost: p.cost * 1.15,
            unitsPerBox: p.unitsPerBox,
            weight: p.weight,
            codigoArancelario: p.tariffCode,
            updatedBy: 'system',
        };
        if (product) {
            product = await prisma.product.update({
                where: { id: product.id },
                data: productData,
            });
        }
        else {
            product = await prisma.product.create({
                data: {
                    ...productData,
                    tenantId: tenant.id,
                    description: p.description,
                    createdBy: 'system',
                    barcodes: {
                        create: {
                            tenantId: tenant.id,
                            barcode: p.sku
                        }
                    }
                },
            });
        }
        await prisma.inventory.upsert({
            where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: bodega.id, productId: product.id } },
            update: { quantity: 100 },
            create: { tenantId: tenant.id, branchId: bodega.id, productId: product.id, quantity: 100 },
        });
        await prisma.inventory.upsert({
            where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: tienda.id, productId: product.id } },
            update: { quantity: 20 },
            create: { tenantId: tenant.id, branchId: tienda.id, productId: product.id, quantity: 20 },
        });
    }
    const b2bCustomer = await prisma.customer.upsert({
        where: { tenantId_taxId: { tenantId: tenant.id, taxId: '8-999-1234' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Logística Global S.A.',
            email: 'compras@logistica.com',
            taxId: '8-999-1234',
            creditLimit: 5000.00,
            createdBy: 'system',
        },
    });
    let genericCustomer = await prisma.customer.findFirst({
        where: { tenantId: tenant.id, email: 'final@cliente.com' }
    });
    if (!genericCustomer) {
        genericCustomer = await prisma.customer.create({
            data: {
                tenantId: tenant.id,
                name: 'Cliente Genérico',
                email: 'final@cliente.com',
                createdBy: 'system',
            },
        });
    }
    const ariel = await prisma.user.findFirst({ where: { email: 'ariel@evolution.com' } });
    const ch5 = await prisma.product.findFirst({ where: { description: 'Chanel No. 5 100ml' } });
    if (ariel && ch5) {
        const existingSale = await prisma.sale.findFirst({ where: { quoteNumber: 'COT-0001', tenantId: tenant.id } });
        if (!existingSale) {
            await prisma.sale.create({
                data: {
                    tenantId: tenant.id,
                    branchId: bodega.id,
                    customerId: b2bCustomer.id,
                    quoteNumber: 'COT-0001',
                    status: 'PENDING',
                    subtotal: 1000.00,
                    tax: 70.00,
                    total: 1070.00,
                    paymentMethod: 'CREDIT',
                    createdBy: ariel.id,
                    items: {
                        create: [
                            {
                                tenantId: tenant.id,
                                productId: ch5.id,
                                quantity: 10,
                                unitPrice: 100.00,
                                total: 1000.00,
                                discountAmount: 0,
                                taxAmount: 70.00
                            }
                        ]
                    }
                }
            });
            console.log('✅ Venta PENDIENTE "COT-0001" creada.');
        }
    }
    const invNum = 'FV-COL-000001';
    const existingInv = await prisma.invoice.findFirst({ where: { tenantId: tenant.id, invoiceNumber: invNum } });
    if (!existingInv) {
        const cashier = await prisma.user.findFirst({ where: { email: 'vendedor@evolution.com' } });
        if (cashier) {
            const session = await prisma.cashSession.create({
                data: {
                    tenantId: tenant.id,
                    branchId: tienda.id,
                    userId: cashier.id,
                    status: 'CLOSED',
                    openingBalance: 100.00,
                    expectedBalance: 350.00,
                    actualBalance: 350.00,
                    difference: 0,
                    openedAt: new Date(Date.now() - 3600000 * 4),
                    closedAt: new Date(Date.now() - 3600000 * 1),
                }
            });
            const inv = await prisma.invoice.create({
                data: {
                    tenantId: tenant.id,
                    branchId: tienda.id,
                    invoiceNumber: invNum,
                    sequenceNumber: 1,
                    customerName: 'Juan Perez',
                    subtotal: 250.00,
                    discountTotal: 0,
                    taxTotal: 17.50,
                    total: 267.50,
                }
            });
            await prisma.payment.create({
                data: {
                    tenantId: tenant.id,
                    invoiceId: inv.id,
                    amount: 267.50,
                    method: 'CASH',
                    status: 'COMPLETED',
                    sessionId: session.id,
                }
            });
            console.log('✅ Datos POS históricos creados.');
        }
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-evolution.js.map