const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://dynamo:dynamo@localhost:5433/dynamo?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const tenantSlug = 'evolution';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

    if (!tenant) {
        console.error('Tenant evolution not found');
        return;
    }

    const branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
    if (!branch) {
        console.error('No branch found for evolution');
        return;
    }

    const products = await prisma.product.findMany({
        where: { tenantId: tenant.id },
        include: { inventory: true }
    });

    console.log(`Updating ${products.length} products...`);

    for (const product of products) {
        const p_a = Number(product.price_a) || 100;

        // Update product prices and codes if missing
        await prisma.product.update({
            where: { id: product.id },
            data: {
                price_b: product.price_b && Number(product.price_b) > 0 ? product.price_b : (p_a * 0.95),
                price_c: product.price_c && Number(product.price_c) > 0 ? product.price_c : (p_a * 0.90),
                price_d: product.price_d && Number(product.price_d) > 0 ? product.price_d : (p_a * 0.85),
                price_e: product.price_e && Number(product.price_e) > 0 ? product.price_e : (p_a * 0.80),
                internalReference: product.internalReference || `REF-${product.id.substring(0, 8).toUpperCase()}`,
                showroomCode: product.showroomCode || product.id.substring(0, 10).toUpperCase(),
                unitOfMeasure: product.unitOfMeasure || 'CJA'
            }
        });

        // Ensure inventory exists
        const mainInventory = product.inventory.find(inv => inv.branchId === branch.id);
        if (!mainInventory) {
            await prisma.inventory.create({
                data: {
                    productId: product.id,
                    branchId: branch.id,
                    tenantId: tenant.id,
                    quantity: Math.floor(Math.random() * 500) + 50,
                    minStock: 20
                }
            });
        } else if (mainInventory.quantity === 0) {
            await prisma.inventory.update({
                where: { id: mainInventory.id },
                data: { quantity: Math.floor(Math.random() * 500) + 50 }
            });
        }
    }

    console.log('Update complete');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
