require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no encontrada en el entorno.');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚀 Iniciando Seed Evolution con Driver Adapter...');

    // 1. TENANT
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'evolution' },
        update: {},
        create: { name: 'Evolution Zona Libre', slug: 'evolution' },
    });

    // 2. SUCURSALES
    const bzr = await prisma.branch.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'BZR' } },
        update: {},
        create: { tenantId: tenant.id, name: 'Bodega Zona Libre', code: 'BZR' },
    });
    const col = await prisma.branch.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'COL' } },
        update: {},
        create: { tenantId: tenant.id, name: 'Tienda Colón', code: 'COL' },
    });

    // 3. PERMISOS
    const permKeys = [
        'MANAGE_TENANT', 'MANAGE_USERS', 'VIEW_COSTS', 'EDIT_PRODUCTS',
        'DELETE_PRODUCTS', 'BULK_EDIT_PRICES', 'VIEW_PRICES', 'CREATE_SALE',
        'VIEW_SALES', 'EDIT_SALES', 'APPROVE_SALES', 'VOID_SALES',
        'MANAGE_CLIENTS', 'VIEW_INVENTORY', 'ADJUST_INVENTORY', 'VIEW_BRANCHES',
        'MANAGE_BRANCHES', 'MANAGE_POS', 'MANAGE_CASH_REGISTERS'
    ];
    for (const key of permKeys) {
        await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
    }

    const passwordHash = await bcrypt.hash('Evolution2026!', 10);

    // 4. USUARIOS
    const ariel = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'ariel@evolution.com' } },
        update: { passwordHash, role: 'OWNER' },
        create: { tenantId: tenant.id, email: 'ariel@evolution.com', name: 'Ariel Manager', passwordHash, role: 'OWNER' }
    });
    const margarita = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'margarita@evolution.com' } },
        update: { passwordHash, role: 'SALES' },
        create: { tenantId: tenant.id, email: 'margarita@evolution.com', name: 'Margarita Ventas', passwordHash, role: 'SALES' }
    });
    const celly = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'celly@evolution.com' } },
        update: { passwordHash, role: 'WAREHOUSE' },
        create: { tenantId: tenant.id, email: 'celly@evolution.com', name: 'Celly Bodega', passwordHash, role: 'WAREHOUSE' }
    });
    await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'vendedor@evolution.com' } },
        update: { passwordHash, role: 'SALES' },
        create: { tenantId: tenant.id, email: 'vendedor@evolution.com', name: 'Vendedor Tienda', passwordHash, role: 'SALES' }
    });

    // 5. PRODUCTOS
    const prods = [
        { desc: 'Chanel No. 5 100ml', price: 120, cost: 75 },
        { desc: 'Dior Sauvage 60ml', price: 145, cost: 90 },
        { desc: 'JW Black Label 1L', price: 35, cost: 22 }
    ];

    for (const p of prods) {
        let product = await prisma.product.findFirst({ where: { tenantId: tenant.id, description: p.desc } });
        if (!product) {
            product = await prisma.product.create({
                data: {
                    tenantId: tenant.id,
                    description: p.desc,
                    price_a: p.price,
                    lastFobCost: p.cost,
                    createdBy: ariel.id
                }
            });
        }

        // Inventory
        await prisma.inventory.upsert({
            where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: bzr.id, productId: product.id } },
            update: { quantity: 100 },
            create: { tenantId: tenant.id, branchId: bzr.id, productId: product.id, quantity: 100 }
        });
        await prisma.inventory.upsert({
            where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: col.id, productId: product.id } },
            update: { quantity: 50 },
            create: { tenantId: tenant.id, branchId: col.id, productId: product.id, quantity: 50 }
        });
    }

    // 6. CLIENTES
    const b2b = await prisma.customer.upsert({
        where: { tenantId_taxId: { tenantId: tenant.id, taxId: 'EXP-B2B-001' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Importaciones Caribe S.A.',
            taxId: 'EXP-B2B-001',
            email: 'ventas@caribe.com',
            priceLevel: 'B',
            creditLimit: 10000,
            createdBy: ariel.id
        }
    });

    // 7. VENTA PENDIENTE
    const p1 = await prisma.product.findFirst({ where: { description: prods[0].desc } });
    await prisma.sale.create({
        data: {
            tenantId: tenant.id,
            branchId: bzr.id,
            customerId: b2b.id,
            quoteNumber: 'COT-EVO-001',
            status: 'PENDING',
            subtotal: 1200,
            tax: 84,
            discount: 0,
            total: 1284,
            paymentMethod: 'CREDIT',
            createdBy: ariel.id,
            items: {
                create: [{
                    tenantId: tenant.id,
                    productId: p1.id,
                    quantity: 10,
                    unitPrice: 120,
                    discountAmount: 0,
                    taxAmount: 84,
                    total: 1284
                }]
            }
        }
    });

    // 8. POS DATA
    const session = await prisma.cashSession.create({
        data: {
            tenantId: tenant.id,
            branchId: col.id,
            userId: ariel.id,
            status: 'CLOSED',
            openingBalance: 100,
            expectedBalance: 245,
            actualBalance: 245,
            difference: 0,
            openedAt: new Date(Date.now() - 7200000),
            closedAt: new Date(Date.now() - 3600000),
        }
    });

    const inv = await prisma.invoice.create({
        data: {
            tenantId: tenant.id,
            branchId: col.id,
            invoiceNumber: 'INV-POS-001',
            sequenceNumber: 1,
            customerName: 'Cliente Contado',
            subtotal: 145,
            discountTotal: 0,
            taxTotal: 10.15,
            total: 155.15,
        }
    });

    await prisma.payment.create({
        data: {
            tenantId: tenant.id,
            invoiceId: inv.id,
            amount: 155.15,
            method: 'CASH',
            status: 'COMPLETED',
            sessionId: session.id,
        }
    });

    console.log('\n🌟 SEED EVOLUTION EXITOSO (con Driver Adapter)');
    console.log('-----------------------------------');
    console.log('Ariel (Owner): ariel@evolution.com');
    console.log('Margarita (Ventas): margarita@evolution.com');
    console.log('Celly (Bodega): celly@evolution.com');
    console.log('Password: Evolution2026!');
    console.log('-----------------------------------\n');
}

main()
    .catch(e => console.error('❌ Error en el seed:', e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
