
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚢 INICIANDO SIMULACIÓN DE TRÁFICO Y D OCUMENTACIÓN...');

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    if (!tenant) throw new Error('Tenant not found');

    const bodega = await prisma.branch.findFirst({ where: { tenantId: tenant.id, code: 'BZR' } });
    const admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: 'ariel@evolution.com' } });

    // 1. Get Products with different Tariffs
    const whisky = await prisma.product.findFirst({ where: { description: { contains: 'Walker' } } });
    const perfume = await prisma.product.findFirst({ where: { description: { contains: 'Chanel' } } });

    if (!whisky || !perfume) throw new Error('Products not found');

    console.log(`📦 Productos seleccionados:`);
    console.log(`   - ${whisky.description} (Tariff: ${whisky.codigoArancelario})`);
    console.log(`   - ${perfume.description} (Tariff: ${perfume.codigoArancelario})`);

    // 2. Create a Sales Order (APPROVED)
    console.log(`\n🔹 PASO 1: CREANDO ORDEN DE VENTA MIXTA...`);
    const sale = await prisma.sale.create({
        data: {
            tenantId: tenant.id,
            branchId: bodega!.id,
            status: 'APPROVED_ORDER',
            subtotal: 1000, tax: 0, total: 1000,
            paymentMethod: 'CREDIT',
            createdBy: admin!.id,
            orderNumber: `ORD-${Date.now()}`,
            items: {
                create: [
                    {
                        tenantId: tenant.id, productId: whisky.id, quantity: 10, unitPrice: 35, total: 350,
                        taxAmount: 0, discountAmount: 0
                    },
                    {
                        tenantId: tenant.id, productId: perfume.id, quantity: 5, unitPrice: 120, total: 600,
                        taxAmount: 0, discountAmount: 0
                    }
                ]
            }
        },
        include: { items: true }
    });
    console.log(`✅ Orden ${sale.orderNumber} creada con 2 items.`);

    // 3. Simulate "Create Shipment" (Logic from Service)
    console.log(`\n🔹 PASO 2: GENERANDO ENVÍO (SNAPSHOT DE DATOS)...`);

    const shipmentItemsData: any[] = [];
    for (const item of sale.items) {
        // Fetch product to get latest tariff/weight info
        const p = item.productId === whisky.id ? whisky : perfume;

        shipmentItemsData.push({
            tenantId: tenant.id,
            saleItemId: item.id,
            productId: item.productId,
            quantity: item.quantity,
            tariffCode: p.codigoArancelario, // CRITICAL: Snapshotted here
            weight: Number(p.weight) * Number(item.quantity),
            volume: 0 // Simplification
        });
    }

    const shipment = await prisma.shipment.create({
        data: {
            tenantId: tenant.id,
            shipmentNumber: `SH-SIM-${Date.now()}`,
            status: 'DRAFT',
            destination: 'San Andres, Colombia',
            createdBy: admin!.id,
            items: { create: shipmentItemsData }
        },
        include: { items: { include: { product: true, saleItem: { include: { sale: true } } } } }
    });

    console.log(`✅ Envío ${shipment.shipmentNumber} creado.`);

    // 4. Test "Group by Tariff" Logic (Logic from Service)
    console.log(`\n🔹 PASO 3: GENERANDO PACKING LIST AGRUPADO (REQUERIMIENTO DE ARIEL)...`);

    const groupedByTariff: Record<string, any[]> = {};

    for (const item of shipment.items) {
        const code = item.tariffCode || 'NO-CODE';
        if (!groupedByTariff[code]) {
            groupedByTariff[code] = [];
        }
        groupedByTariff[code].push({
            description: item.product.description,
            quantity: item.quantity,
            weight: item.weight,
        });
    }

    console.log(JSON.stringify(groupedByTariff, null, 2));

    const tariffKeys = Object.keys(groupedByTariff);
    if (tariffKeys.length === 2 && tariffKeys.includes('2208.30.00') && tariffKeys.includes('3303.00.00')) {
        console.log(`\n✅ ÉXITO: Los productos se agruparon correctamente por partida arancelaria.`);
    } else {
        console.error(`\n❌ ERROR: La agrupación falló. Se esperaban 2 partidas.`);
    }

    console.log('\n🏁 SIMULACIÓN DE TRÁFICO COMPLETADA.');
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
