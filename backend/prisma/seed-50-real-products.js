const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://dynamo:dynamo@localhost:5433/dynamo?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const tenantSlugs = ['test-company', 'evolution', 'zonalibre'];

    for (const tenantSlug of tenantSlugs) {
        // Locate or Create Tenant
        let tenant = await prisma.tenant.findUnique({
            where: { slug: tenantSlug },
        });

        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    name: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1),
                    slug: tenantSlug,
                    status: 'ACTIVE'
                }
            });
        }

        const tenantId = tenant.id;
        console.log(`Seeding for tenant: ${tenant.name} (${tenantId})`);

        // Locate or Create Main Branch
        let branch = await prisma.branch.findFirst({ where: { tenantId } });
        if (!branch) {
            branch = await prisma.branch.create({
                data: {
                    name: 'Principal',
                    code: 'MAIN',
                    tenantId
                }
            });
        }

        // Categories
        const categoriesData = [
            'WHISKY', 'VODKA', 'TEQUILA', 'RON', 'GIN', 'WINE', 'BEER', 'COGNAC', 'LIQUEUR', 'SNACKS'
        ];

        const categoryMap = {};
        for (const name of categoriesData) {
            let category = await prisma.category.findFirst({
                where: { tenantId, name, parentId: null }
            });
            if (!category) {
                category = await prisma.category.create({
                    data: { name, tenantId }
                });
            }
            categoryMap[name] = category.id;
        }

        // Brands
        const brandsData = [
            'JOHNNIE WALKER', 'CHIVAS REGAL', 'MACALLAN', 'BUCHANANS', 'GLENLIVET',
            'GREY GOOSE', 'ABSOLUT', 'CIROC', 'STOLICHNAYA',
            'PATRON', 'DON JULIO', 'JOSE CUERVO', 'CASAMIGOS',
            'ZACAPA', 'BACARDI', 'CAPTAIN MORGAN', 'DIPLOMATICO',
            'HENDRICKS', 'TANQUERAY', 'BOMBAY SAPPHIRE',
            'MOET & CHANDON', 'DOM PERIGNON', 'VEUVE CLICQUOT',
            'CORONA', 'HEINEKEN', 'STELLA ARTOIS',
            'HENNESSY', 'REMY MARTIN',
            'PRINGLES', 'LAYS', 'DORITOS'
        ];
        const brandMap = {};
        for (const name of brandsData) {
            const created = await prisma.brand.upsert({
                where: { tenantId_name: { tenantId, name } },
                update: {},
                create: { name, tenantId }
            });
            brandMap[name] = created.id;
        }

        const productsToSeed = [
            // WHISKY
            { desc: 'JOHNNIE WALKER BLACK LABEL 1L', brand: 'JOHNNIE WALKER', cat: 'WHISKY', price: 35.00, ref: 'JW-BL-1L', barcode: '5000267023656' },
            { desc: 'JOHNNIE WALKER BLUE LABEL 750ML', brand: 'JOHNNIE WALKER', cat: 'WHISKY', price: 220.00, ref: 'JW-BLUE-750', barcode: '5000267115023' },
            { desc: 'CHIVAS REGAL 12 YEARS 1L', brand: 'CHIVAS REGAL', cat: 'WHISKY', price: 38.00, ref: 'CH-12-1L', barcode: '5000299292211' },
            { desc: 'CHIVAS REGAL 18 YEARS 750ML', brand: 'CHIVAS REGAL', cat: 'WHISKY', price: 85.00, ref: 'CH-18-750', barcode: '5000299211328' },
            { desc: 'MACALLAN 12 DOUBLE CASK 700ML', brand: 'MACALLAN', cat: 'WHISKY', price: 95.00, ref: 'MAC-12-700', barcode: '5010314305840' },
            { desc: 'MACALLAN 18 SHERRY OAK 700ML', brand: 'MACALLAN', cat: 'WHISKY', price: 450.00, ref: 'MAC-18-700', barcode: '5010314301804' },
            { desc: 'BUCHANANS 12 DELUXE 1L', brand: 'BUCHANANS', cat: 'WHISKY', price: 42.00, ref: 'BUCH-12-1L', barcode: '5000267013503' },
            { desc: 'BUCHANANS 18 SPECIAL RESERVE 750ML', brand: 'BUCHANANS', cat: 'WHISKY', price: 90.00, ref: 'BUCH-18-750', barcode: '5000267011400' },
            { desc: 'GLENLIVET 12 YEARS 750ML', brand: 'GLENLIVET', cat: 'WHISKY', price: 48.00, ref: 'GLEN-12-750', barcode: '5000299225011' },
            // VODKA
            { desc: 'GREY GOOSE VODKA 1L', brand: 'GREY GOOSE', cat: 'VODKA', price: 45.00, ref: 'GG-VOD-1L', barcode: '080480280040' },
            { desc: 'ABSOLUT VODKA ORIGINAL 1L', brand: 'ABSOLUT', cat: 'VODKA', price: 22.00, ref: 'ABS-ORI-1L', barcode: '7312040017034' },
            { desc: 'CIROC VODKA SNAP FROST 750ML', brand: 'CIROC', cat: 'VODKA', price: 38.00, ref: 'CIR-SF-750', barcode: '088076166578' },
            { desc: 'STOLICHNAYA VODKA 1L', brand: 'STOLICHNAYA', cat: 'VODKA', price: 18.00, ref: 'STOLI-1L', barcode: '5060132331004' },
            // TEQUILA
            { desc: 'PATRON SILVER TEQUILA 750ML', brand: 'PATRON', cat: 'TEQUILA', price: 55.00, ref: 'PAT-SIL-750', barcode: '721733000001' },
            { desc: 'PATRON REPOSADO 750ML', brand: 'PATRON', cat: 'TEQUILA', price: 62.00, ref: 'PAT-REP-750', barcode: '721733000025' },
            { desc: 'DON JULIO 1942 750ML', brand: 'DON JULIO', cat: 'TEQUILA', price: 180.00, ref: 'DJ-1942', barcode: '674545000305' },
            { desc: 'DON JULIO REPOSADO 750ML', brand: 'DON JULIO', cat: 'TEQUILA', price: 68.00, ref: 'DJ-REP-750', barcode: '674545000053' },
            { desc: 'JOSE CUERVO ESPECIAL GOLD 1L', brand: 'JOSE CUERVO', cat: 'TEQUILA', price: 25.00, ref: 'JC-GOLD-1L', barcode: '030040000329' },
            { desc: 'CASAMIGOS BLANCO 750ML', brand: 'CASAMIGOS', cat: 'TEQUILA', price: 58.00, ref: 'CASA-BL-750', barcode: '0855235004124' },
            // RON
            { desc: 'ZACAPA CENTENARIO 23 750ML', brand: 'ZACAPA', cat: 'RON', price: 55.00, ref: 'ZAC-23-750', barcode: '7401005010014' },
            { desc: 'BACARDI CARTA BLANCA 1L', brand: 'BACARDI', cat: 'RON', price: 18.00, ref: 'BAC-CB-1L', barcode: '076111111001' },
            { desc: 'CAPTAIN MORGAN SPICED 1L', brand: 'CAPTAIN MORGAN', cat: 'RON', price: 20.00, ref: 'CAP-SPI-1L', barcode: '087000002164' },
            { desc: 'DIPLOMATICO RESERVA EXCLUSIVA 700ML', brand: 'DIPLOMATICO', cat: 'RON', price: 42.00, ref: 'DIP-RES-700', barcode: '7591471000624' },
            // GIN
            { desc: 'HENDRICKS GIN 750ML', brand: 'HENDRICKS', cat: 'GIN', price: 48.00, ref: 'HEN-GIN-750', barcode: '5010314050221' },
            { desc: 'TANQUERAY LONDON DRY 1L', brand: 'TANQUERAY', cat: 'GIN', price: 28.00, ref: 'TAN-LD-1L', barcode: '5000291024346' },
            { desc: 'BOMBAY SAPPHIRE 1L', brand: 'BOMBAY SAPPHIRE', cat: 'GIN', price: 32.00, ref: 'BOM-SAP-1L', barcode: '5000281024354' },
            // WINE / CHAMPAGNE
            { desc: 'MOET & CHANDON IMPERIAL 750ML', brand: 'MOET \u0026 CHANDON', cat: 'WINE', price: 65.00, ref: 'MOET-IMP-750', barcode: '3185370000335' },
            { desc: 'DOM PERIGNON VINTAGE 750ML', brand: 'DOM PERIGNON', cat: 'WINE', price: 280.00, ref: 'DOM-VIN-750', barcode: '3185370603352' },
            { desc: 'VEUVE CLICQUOT YELLOW LABEL 750ML', brand: 'VEUVE CLICQUOT', cat: 'WINE', price: 72.00, ref: 'VEUVE-750', barcode: '3049610004104' },
            // BEER
            { desc: 'CORONA EXTRA 24 PACK', brand: 'CORONA', cat: 'BEER', price: 32.00, ref: 'COR-24PK', barcode: '7501064191636' },
            { desc: 'HEINEKEN 24 PACK', brand: 'HEINEKEN', cat: 'BEER', price: 35.00, ref: 'HEIN-24PK', barcode: '072890000164' },
            { desc: 'STELLA ARTOIS 24 PACK', brand: 'STELLA ARTOIS', cat: 'BEER', price: 38.00, ref: 'STELLA-24PK', barcode: '018200110471' },
            // COGNAC
            { desc: 'HENNESSY VS 750ML', brand: 'HENNESSY', cat: 'COGNAC', price: 52.00, ref: 'HEN-VS-750', barcode: '081753041300' },
            { desc: 'REMY MARTIN VSOP 750ML', brand: 'REMY MARTIN', cat: 'COGNAC', price: 65.00, ref: 'REMY-VSOP-750', barcode: '030281022031' },
            // SNACKS
            { desc: 'PRINGLES ORIGINAL 158G', brand: 'PRINGLES', cat: 'SNACKS', price: 2.50, ref: 'PRING-ORI', barcode: '038000138416' },
            { desc: 'PRINGLES SOUR CREAM & ONION 158G', brand: 'PRINGLES', cat: 'SNACKS', price: 2.50, ref: 'PRING-SC', barcode: '038000138430' },
            { desc: 'PRINGLES BBQ 158G', brand: 'PRINGLES', cat: 'SNACKS', price: 2.50, ref: 'PRING-BBQ', barcode: '038000138454' },
            { desc: 'LAYS CLASSIC FAMILY SIZE', brand: 'LAYS', cat: 'SNACKS', price: 4.50, ref: 'LAYS-FAM', barcode: '028400000132' },
            { desc: 'DORITOS NACHO CHEESE LARGE', brand: 'DORITOS', cat: 'SNACKS', price: 4.50, ref: 'DOR-NACHO', barcode: '028400029362' },
            { desc: 'DORITOS COOL RANCH LARGE', brand: 'DORITOS', cat: 'SNACKS', price: 4.50, ref: 'DOR-COOL', barcode: '028400029379' },
            // MORE WHISKY
            { desc: 'JOHNNIE WALKER DOUBLE BLACK 750ML', brand: 'JOHNNIE WALKER', cat: 'WHISKY', price: 55.00, ref: 'JW-DB-750', barcode: '5000267119106' },
            { desc: 'JOHNNIE WALKER GOLD LABEL 750ML', brand: 'JOHNNIE WALKER', cat: 'WHISKY', price: 78.00, ref: 'JW-GOLD-750', barcode: '5000267116129' },
            { desc: 'JOHNNIE WALKER GREEN LABEL 750ML', brand: 'JOHNNIE WALKER', cat: 'WHISKY', price: 82.00, ref: 'JW-GREEN-750', barcode: '5000267113111' },
            { desc: 'CHIVAS REGAL EXTRA 750ML', brand: 'CHIVAS REGAL', cat: 'WHISKY', price: 45.00, ref: 'CH-EXT-750', barcode: '5000299600121' },
            { desc: 'MACALLAN 15 DOUBLE CASK 700ML', brand: 'MACALLAN', cat: 'WHISKY', price: 160.00, ref: 'MAC-15-700', barcode: '5010314309718' },
            { desc: 'BUCHANANS SELECT 15 YEARS 750ML', brand: 'BUCHANANS', cat: 'WHISKY', price: 65.00, ref: 'BUCH-15-750', barcode: '5000267175218' },
            { desc: 'GLENLIVET 15 YEARS FRENCH OAK 750ML', brand: 'GLENLIVET', cat: 'WHISKY', price: 75.00, ref: 'GLEN-15-750', barcode: '5000299225158' },
            { desc: 'GLENLIVET 18 YEARS 750ML', brand: 'GLENLIVET', cat: 'WHISKY', price: 140.00, ref: 'GLEN-18-750', barcode: '5000299225189' },
            { desc: 'JACK DANIELS GENTLEMAN JACK 750ML', brand: 'JACK DANIELS', cat: 'WHISKY', price: 45.00, ref: 'JD-GJ-750', barcode: '081128021020' },
            { desc: 'JACK DANIELS SINGLE BARREL 750ML', brand: 'JACK DANIELS', cat: 'WHISKY', price: 65.00, ref: 'JD-SB-750', barcode: '081128021044' }
        ];

        for (const p of productsToSeed) {
            // Upsert product
            const existingProduct = await prisma.product.findFirst({ where: { tenantId, description: p.desc } });

            const product = await prisma.product.upsert({
                where: { id: existingProduct?.id || '00000000-0000-0000-0000-000000000000' },
                update: {
                    price_a: p.price,
                    price_b: p.price * 0.95,
                    price_c: p.price * 0.90,
                    price_d: p.price * 0.85,
                    price_e: p.price * 0.80,
                    internalReference: p.ref,
                    showroomCode: p.ref,
                    categoryId: categoryMap[p.cat],
                    brandId: brandMap[p.brand],
                    paisOrigen: 'Various',
                    codigoArancelario: '2208.30.00'
                },
                create: {
                    tenantId,
                    description: p.desc,
                    internalReference: p.ref,
                    showroomCode: p.ref,
                    description_es: p.desc,
                    categoryId: categoryMap[p.cat],
                    brandId: brandMap[p.brand],
                    price_a: p.price,
                    price_b: p.price * 0.95,
                    price_c: p.price * 0.90,
                    price_d: p.price * 0.85,
                    price_e: p.price * 0.80,
                    paisOrigen: 'Various',
                    codigoArancelario: '2208.30.00',
                    createdBy: 'system-seed'
                }
            });

            // Add barcode
            await prisma.productBarcode.upsert({
                where: { tenantId_barcode: { tenantId, barcode: p.barcode } },
                update: { productId: product.id },
                create: {
                    tenantId,
                    barcode: p.barcode,
                    productId: product.id
                }
            });

            // Add inventory
            await prisma.inventory.upsert({
                where: { tenantId_branchId_productId: { tenantId, branchId: branch.id, productId: product.id } },
                update: { quantity: Math.floor(Math.random() * 500) + 20 },
                create: {
                    tenantId,
                    branchId: branch.id,
                    productId: product.id,
                    quantity: Math.floor(Math.random() * 500) + 20,
                    minStock: 24
                }
            });

            console.log(`[${tenantSlug}] Seeded: ${p.desc}`);
        }
    }

    console.log('Seeding finished successfully!');
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
