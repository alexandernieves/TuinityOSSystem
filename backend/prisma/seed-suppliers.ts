import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('📦 Sembrando proveedores de prueba...');

    const tenant = await prisma.tenant.findUnique({
        where: { slug: 'evolution' },
    });

    if (!tenant) {
        console.error('❌ Tenant "evolution" no encontrado.');
        return;
    }

    const suppliers = [
        { name: 'ADYCORP' },
        { name: 'AGUA DE ORO S.A.' },
        { name: 'ALIANCE SALES LOGISTIC &' },
        { name: 'ANCHI S.A.' },
        { name: 'ARYAN INTERNACIONAL' },
        { name: 'ASEAM VENTURES, INC.' },
        { name: 'B2B SALES' },
        { name: 'BARCELONA DUTY FREE S.A.' },
        { name: 'BASE ZONA LIBRE, S.A.' },
        { name: 'BATLANTICA S.A.' },
        { name: 'BAUVIC PANAMA S.A.' },
        { name: 'BELMIRACH' },
        { name: 'BEST BUY CROCERS' },
        { name: 'BJ\'S WHOLESALE CLUB, INC. ("BJ\'S")' },
        { name: 'BODEGA EVOLUTION' },
        { name: 'BRANDA, LTD' },
        { name: 'BRANDS COLLECTION B.V.' },
        { name: 'BRANDS TRADING, S.A' },
        { name: 'BROUWERIJ MARTENS NV' },
        { name: 'CANAL DISTRIBUTION, S.A.' },
        { name: 'CARIBBEAN SHIPSTORES' },
        { name: 'CARLSBERG BREWERIES' },
        { name: 'CB INTERNATIONAL GROUP INC' },
        { name: 'CERVECERIA NACIONAL' },
        { name: 'CHINDO INTERNACIONAL, S.A.' },
        { name: 'CL LOGISTIC CORP' },
        { name: 'COAST SUPPLIER PANAMA' },
        { name: 'COBELO, S.A.' },
    ].map((s, i) => ({
        ...s,
        code: `SUP-${String(i + 1).padStart(3, '0')}`,
        email: `contacto@${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: `+507 200-${String(1000 + i)}`,
        phone2: `+507 6000-${String(1000 + i)}`,
        contactPerson: 'Ventas Corporativas',
        address: 'Zona Libre de Colón',
        country: 'PANAMÁ',
        poBox: `0801-${String(i + 100)}`,
        isActive: true,
        inventoryAccount: '1001-A',
        supplierAccount: '2001-B',
    }));

    for (const s of suppliers) {
        await prisma.supplier.upsert({
            where: {
                tenantId_name: {
                    tenantId: tenant.id,
                    name: s.name,
                }
            },
            update: {
                code: s.code,
                email: s.email,
                phone: s.phone,
                phone2: s.phone2,
                contactPerson: s.contactPerson,
                address: s.address,
                country: s.country,
                poBox: s.poBox,
                isActive: s.isActive,
                inventoryAccount: s.inventoryAccount,
                supplierAccount: s.supplierAccount,
            },
            create: {
                tenantId: tenant.id,
                name: s.name,
                code: s.code,
                email: s.email,
                phone: s.phone,
                phone2: s.phone2,
                contactPerson: s.contactPerson,
                address: s.address,
                country: s.country,
                poBox: s.poBox,
                isActive: s.isActive,
                inventoryAccount: s.inventoryAccount,
                supplierAccount: s.supplierAccount,
            }
        });
    }

    console.log(`✅ ${suppliers.length} Proveedores sembrados correctamente.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
