import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    if (!tenant) { console.error('Tenant evolution no encontrado'); return; }

    // Get first 10 products
    const products = await prisma.product.findMany({
        where: { tenantId: tenant.id, deletedAt: null },
        take: 10,
        orderBy: { description: 'asc' },
    });

    if (products.length === 0) { console.log('No hay productos para asignar barcodes.'); return; }

    const types = ['EAN13', 'UPC-A', 'CODE128', 'EAN8', 'QR'];

    for (const product of products) {
        // Generate a fake EAN13 barcode (13 digits)
        const base = String(Math.floor(Math.random() * 9000000000000) + 1000000000000);
        const ean = base.substring(0, 13);
        const type = types[Math.floor(Math.random() * types.length)];

        await prisma.productBarcode.upsert({
            where: { tenantId_barcode: { tenantId: tenant.id, barcode: ean } },
            update: {},
            create: {
                tenantId: tenant.id,
                productId: product.id,
                barcode: ean,
                type,
                isDefault: true,
                description: `Código principal - ${product.description}`,
            },
        });
        console.log(`✅ Barcode ${ean} (${type}) → ${product.description}`);
    }

    console.log('\n✅ Seed de barcodes completo!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
