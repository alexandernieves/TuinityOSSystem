import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('📦 SEEDING PURCHASE ORDERS FOR REVERSAL...');

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    if (!tenant) {
        console.error('❌ Tenant "evolution" not found. Run seed-evolution.ts first.');
        return;
    }

    const branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
    const admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: 'OWNER' } });
    const products = await prisma.product.findMany({ where: { tenantId: tenant.id }, take: 5 });

    if (!branch || !admin || products.length === 0) {
        console.error('❌ Missing branch, admin or products. Run seed-evolution.ts first.');
        return;
    }

    const suppliers = ['DIAGEO PANAMA', 'IMPORTADORA MADURO', 'DISTRIBUIDORA MOTTA', 'GLOBAL BRANDS'];

    for (let i = 0; i < 5; i++) {
        const supplier = suppliers[i % suppliers.length];
        const invoiceNum = `FAC-${2024000 + i}`;

        const po = await prisma.purchaseOrder.create({
            data: {
                tenantId: tenant.id,
                branchId: branch.id,
                supplierName: supplier,
                invoiceNumber: invoiceNum,
                status: 'RECEIVED' as any,
                fobValue: 1000 + (i * 200),
                totalCifValue: 1200 + (i * 240),
                orderDate: new Date(Date.now() - (i * 86400000)),
                receivedDate: new Date(Date.now() - (i * 3600000)),
                createdBy: admin.id,
                items: {
                    create: products.slice(0, 2).map((p, idx) => ({
                        tenantId: tenant.id,
                        productId: p.id,
                        quantity: 50,
                        receivedQuantity: 50,
                        unitFobValue: 10 + idx,
                        unitCifValue: 12 + idx,
                        subtotalFob: 500 + (idx * 50),
                        subtotalCif: 600 + (idx * 60),
                    }))
                }
            }
        });
        console.log(`✅ Created RECEIVED PO: ${po.invoiceNumber} (${po.id})`);
    }

    console.log('✨ Purchase reversal seed completed!');
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
