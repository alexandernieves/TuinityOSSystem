const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://dynamo:dynamo@localhost:5433/dynamo?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const tenantSlug = 'evolution';
    console.log(`Searching for tenant: ${tenantSlug}`);

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
        console.error('Tenant not found. Run seed-evolution-user.js first.');
        process.exit(1);
    }

    const branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
    if (!branch) {
        console.error('Branch not found.');
        process.exit(1);
    }

    const products = [
        { sku: 'TEST-001', desc: 'Smartphone Galaxy S23 Ultra', initial: 100, moves: [{ type: 'OUT', qty: -20 }, { type: 'ADJUSTMENT', qty: -5 }], wrongStock: 500 },
        { sku: 'TEST-002', desc: 'Laptop MacBook Pro M2', initial: 50, moves: [{ type: 'IN', qty: 10 }, { type: 'OUT', qty: -5 }], wrongStock: 10 },
        { sku: 'TEST-003', desc: 'Monitor LG OLED 27"', initial: 30, moves: [{ type: 'OUT', qty: -2 }], wrongStock: 0 }
    ];

    for (const p of products) {
        console.log(`Creating product: ${p.desc}`);

        let product = await prisma.product.findFirst({
            where: { tenantId: tenant.id, internalReference: p.sku }
        });

        if (product) {
            await prisma.product.update({
                where: { id: product.id },
                data: { deletedAt: null }
            });
        } else {
            product = await prisma.product.create({
                data: {
                    tenantId: tenant.id,
                    description: p.desc,
                    internalReference: p.sku,
                    unitsPerBox: 1,
                }
            });
        }

        // 1. Clear movements for this product to start fresh
        await prisma.inventoryMovement.deleteMany({ where: { productId: product.id } });

        // 2. Create Initial Movement
        await prisma.inventoryMovement.create({
            data: {
                tenantId: tenant.id,
                branchId: branch.id,
                productId: product.id,
                type: 'IN',
                quantity: p.initial,
                reason: 'Stock Inicial (Seed)',
                createdBy: 'system'
            }
        });

        // 3. Create subsequent movements
        for (const m of p.moves) {
            await prisma.inventoryMovement.create({
                data: {
                    tenantId: tenant.id,
                    branchId: branch.id,
                    productId: product.id,
                    type: m.type,
                    quantity: m.qty,
                    reason: 'Movimiento de prueba',
                    createdBy: 'system'
                }
            });
        }

        // 4. SET WRONG STOCK in Inventory table
        await prisma.inventory.upsert({
            where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: branch.id, productId: product.id } },
            update: { quantity: p.wrongStock },
            create: {
                tenantId: tenant.id,
                branchId: branch.id,
                productId: product.id,
                quantity: p.wrongStock
            }
        });

        console.log(`Created ${p.sku} with discrepancy. Current table stock: ${p.wrongStock}. History stock should be: ${p.initial + p.moves.reduce((s, m) => s + m.qty, 0)}`);
    }

    console.log('Seed finished successfully.');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
