import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    if (!tenant) { console.error('Tenant evolution no encontrado'); return; }

    const warehouses = [
        { name: 'ALMACÉN PRINCIPAL', code: 'ALM-001', description: 'Bodega central de inventario', address: 'Zona Libre de Colón, Edificio Central', isActive: true },
        { name: 'BODEGA SECUNDARIA', code: 'ALM-002', description: 'Almacén de desborde y staging', address: 'Zona Libre de Colón, Nave 2', isActive: true },
        { name: 'DEPÓSITO NORTE', code: 'ALM-003', description: 'Depósito para importaciones del norte', address: 'Puerto Manzanillo, Galpón 1', isActive: true },
    ];

    const locationTypes = ['PASILLO', 'ESTANTE', 'ZONA', 'PISO', 'GENERAL'] as const;

    for (const wData of warehouses) {
        const warehouse = await prisma.warehouse.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name: wData.name } },
            update: { ...wData },
            create: { ...wData, tenantId: tenant.id },
        });
        console.log(`✅ Almacén: ${warehouse.name}`);

        // create 8 locations per warehouse
        const locationTemplates = [
            { name: 'PASILLO-A', type: 'PASILLO', code: `${warehouse.code}-PA`, description: 'Pasillo A principal', capacity: 500 },
            { name: 'PASILLO-B', type: 'PASILLO', code: `${warehouse.code}-PB`, description: 'Pasillo B secundario', capacity: 450 },
            { name: 'ESTANTE-01', type: 'ESTANTE', code: `${warehouse.code}-E01`, description: 'Estante nivel bajo', capacity: 200 },
            { name: 'ESTANTE-02', type: 'ESTANTE', code: `${warehouse.code}-E02`, description: 'Estante nivel medio', capacity: 200 },
            { name: 'ZONA-FRIA', type: 'ZONA', code: `${warehouse.code}-ZF`, description: 'Zona de temperatura controlada', capacity: 100 },
            { name: 'ZONA-SECA', type: 'ZONA', code: `${warehouse.code}-ZS`, description: 'Zona seca de almacenamiento', capacity: 300 },
            { name: 'PISO-1', type: 'PISO', code: `${warehouse.code}-P1`, description: 'Primer piso', capacity: 1000 },
            { name: 'RECEPCION', type: 'GENERAL', code: `${warehouse.code}-REC`, description: 'Área de recepción de mercancía', capacity: 150 },
        ];

        for (const loc of locationTemplates) {
            await prisma.location.upsert({
                where: { tenantId_warehouseId_name: { tenantId: tenant.id, warehouseId: warehouse.id, name: loc.name } },
                update: { ...loc, isActive: true },
                create: { ...loc, tenantId: tenant.id, warehouseId: warehouse.id, isActive: true },
            });
        }
        console.log(`   → ${locationTemplates.length} ubicaciones creadas`);
    }

    console.log('\n✅ Seed de ubicaciones completo!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
