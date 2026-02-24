import 'dotenv/config';
import { PrismaClient, UserRoleType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚀 Iniciando Seed Maestro (v2) para Evolution Zona Libre...');

    // 1. TENANT
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'evolution' },
        update: {},
        create: { name: 'Evolution Zona Libre', slug: 'evolution' },
    });

    // 2. SUCURSALES
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

    // 3. PERMISOS Y ROLES (RBAC Actualizado)
    const permissionsList = [
        'MANAGE_TENANT', 'MANAGE_USERS', 'VIEW_COSTS', 'EDIT_PRODUCTS',
        'DELETE_PRODUCTS', 'BULK_EDIT_PRICES', 'VIEW_PRICES', 'CREATE_SALE',
        'VIEW_SALES', 'EDIT_SALES', 'APPROVE_SALES', 'VOID_SALES',
        'MANAGE_CLIENTS', 'VIEW_INVENTORY', 'ADJUST_INVENTORY', 'VIEW_BRANCHES',
        'MANAGE_BRANCHES', 'MANAGE_TRAFFIC', 'VIEW_TRAFFIC', 'MANAGE_POS',
        'MANAGE_CASH_REGISTERS', 'VIEW_PRODUCTS'
    ];

    const permMap = new Map<string, string>();
    for (const key of permissionsList) {
        const p = await prisma.permission.upsert({
            where: { key },
            update: {},
            create: { key },
        });
        permMap.set(key, p.id);
    }

    // Definir Roles y sus Permisos
    const rolesConfig: Record<string, string[]> = {
        OWNER: permissionsList, // Acceso Total
        SALES: ['VIEW_BRANCHES', 'CREATE_SALE', 'VIEW_SALES', 'VIEW_PRICES', 'MANAGE_CLIENTS', 'MANAGE_POS', 'VIEW_PRODUCTS'],
        WAREHOUSE: ['VIEW_BRANCHES', 'VIEW_INVENTORY', 'ADJUST_INVENTORY', 'MANAGE_TRAFFIC', 'VIEW_TRAFFIC', 'VIEW_PRODUCTS'],
    };

    const roleMap = new Map<string, string>(); // Name -> ID

    for (const [roleName, rolePerms] of Object.entries(rolesConfig)) {
        const role = await prisma.role.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
            update: {},
            create: { tenantId: tenant.id, name: roleName },
        });
        roleMap.set(roleName, role.id);

        // Asignar permisos al rol
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

    // 4. USUARIOS
    const usersData = [
        { email: 'ariel@evolution.com', name: 'Ariel (Manager)', role: 'OWNER' as UserRoleType },
        { email: 'margarita@evolution.com', name: 'Margarita (Ventas)', role: 'SALES' as UserRoleType },
        { email: 'celly@evolution.com', name: 'Celly (Bodega)', role: 'WAREHOUSE' as UserRoleType },
        { email: 'vendedor@evolution.com', name: 'Vendedor Tienda', role: 'SALES' as UserRoleType },
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

        // Asignar Rol en tabla UserRole (Vital for PermissionsGuard)
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

    // 5. PRODUCTOS
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
            lastCifCost: p.cost * 1.15, // Simulating 15% logistic cost
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
        } else {
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
            update: { quantity: 100 }, // Stock inicial para pruebas
            create: { tenantId: tenant.id, branchId: bodega.id, productId: product.id, quantity: 100 },
        });
        await prisma.inventory.upsert({
            where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: tienda.id, productId: product.id } },
            update: { quantity: 20 },
            create: { tenantId: tenant.id, branchId: tienda.id, productId: product.id, quantity: 20 },
        });
    }

    // 6. CLIENTES
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

    // 7. VENTA PENDIENTE
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

    // 8. POS DATA (Cierre de Caja previo)
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
