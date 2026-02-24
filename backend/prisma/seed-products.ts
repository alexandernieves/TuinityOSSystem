// @ts-nocheck
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const tenantSlug = 'test-company';

    // Locate Tenant
    const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
    });

    if (!tenant) {
        console.error(`Tenant '${tenantSlug}' not found.`);
        return;
    }

    const tenantId = tenant.id;
    console.log(`Seeding for tenant: ${tenant.name} (${tenantId})`);

    // Locate Main Branch
    const branch = await prisma.branch.findFirst({ where: { tenantId } });
    if (!branch) {
        console.error('No branch found for tenant.');
        return;
    }

    // 1. Create/Update Categories (Manual Upsert)
    const categoriesData = [
        { name: 'WHISKY', parentId: null },
        { name: 'VODKA', parentId: null },
        { name: 'TEQUILA', parentId: null },
        { name: 'CHIPS', parentId: null },
        { name: 'RUM', parentId: null },
        { name: 'GIN', parentId: null },
        { name: 'WINE', parentId: null },
        { name: 'BEER', parentId: null },
        { name: 'COGNAC', parentId: null },
        { name: 'LIQUEUR', parentId: null }
    ];

    const categoryMap = {};

    for (const cat of categoriesData) {
        const existing = await prisma.category.findFirst({
            where: { tenantId, name: cat.name, parentId: null }
        });

        if (existing) {
            categoryMap[cat.name] = existing.id;
        } else {
            const created = await prisma.category.create({
                data: { name: cat.name, tenantId }
            });
            categoryMap[cat.name] = created.id;
        }
    }

    // 2. Create/Update Brands (Manual Upsert)
    const brandsData = [
        'BLACK & WHITE', 'PRINGLES', 'GLENLIVET', 'CROWN ROYAL', 'CAPTAIN MORGAN',
        'CIROC', 'CASAMIGOS', 'JOHNNIE WALKER', 'GREY GOOSE', 'PATRON',
        'BACARDI', 'BOMBAY SAPPHIRE', 'MOET', 'HENNESSY', 'LAY\'S',
        'CORONA', 'HEINEKEN', 'JACK DANIELS', 'ABSOLUT', 'CHIVAS REGAL'
    ];
    const brandMap = {};

    for (const name of brandsData) {
        const existing = await prisma.brand.findFirst({
            where: { tenantId, name }
        });

        if (existing) {
            brandMap[name] = existing.id;
        } else {
            const created = await prisma.brand.create({
                data: { name, tenantId }
            });
            brandMap[name] = created.id;
        }
    }

    // 3. Create Products
    const products = [
        {
            internalReference: '0000050196166',
            description: 'WHISKY BLACK & WHITE 24X375ML 40%VOL',
            barcode: '10764009031560',
            brand: 'BLACK & WHITE',
            category: 'WHISKY',
            unitsPerBox: 24,
            volume: 0.0216,
            weight: 17.30,
            price_a: 111.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '0038000138591',
            description: 'PAPITAS PRINGLES SAL Y VINAGRE 14X158G',
            barcode: '0038000138591',
            brand: 'PRINGLES',
            category: 'CHIPS',
            unitsPerBox: 14,
            price_a: 24.50,
            mainImageUrl: 'https://images.unsplash.com/photo-1566478919030-261742da368f?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '0080432400708',
            description: 'WHISKY GLENLIVET 12YO DOUBLE OAK R GB 12X1000ML',
            barcode: '10080432400705',
            brand: 'GLENLIVET',
            category: 'WHISKY',
            unitsPerBox: 12,
            price_a: 420.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '0088076178113',
            description: 'VODKA CIROC PEACH 12X1000ML 35%VOL',
            barcode: '0088076178113',
            brand: 'CIROC',
            category: 'VODKA',
            unitsPerBox: 12,
            price_a: 380.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1613208455503-42cc1c1ed91d?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '0088076184305',
            description: 'TEQUILA CASAMIGOS BLANCO 6X1000ML 40%VOL',
            barcode: '0088076184305',
            brand: 'CASAMIGOS',
            category: 'TEQUILA',
            unitsPerBox: 6,
            price_a: 290.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1516535794938-606387ce56dc?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '088076176317',
            description: 'VODKA GREY GOOSE 6X1000ML',
            barcode: '088076176317',
            brand: 'GREY GOOSE',
            category: 'VODKA',
            unitsPerBox: 6,
            price_a: 250.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1598155523122-38423bb4d693?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '5000281024354',
            description: 'GIN BOMBAY SAPPHIRE 12X1000ML',
            barcode: '5000281024354',
            brand: 'BOMBAY SAPPHIRE',
            category: 'GIN',
            unitsPerBox: 12,
            price_a: 280.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '5000299292211',
            description: 'WHISKY JOHNNIE WALKER BLACK 12X1000ML',
            barcode: '5000299292211',
            brand: 'JOHNNIE WALKER',
            category: 'WHISKY',
            unitsPerBox: 12,
            price_a: 420.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1582236838380-49658e38dcc4?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '080432400630',
            description: 'WHISKY CHIVAS REGAL 12 12X1000ML',
            barcode: '080432400630',
            brand: 'CHIVAS REGAL',
            category: 'WHISKY',
            unitsPerBox: 12,
            price_a: 410.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1563510522-316223297a73?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '031234567890',
            description: 'CHIPS LAYS CLASSIC 24X150G',
            barcode: '031234567890',
            brand: 'LAY\'S',
            category: 'CHIPS',
            unitsPerBox: 24,
            price_a: 36.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1621447504864-284aa8778bf6?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '3185370000335',
            description: 'CHAMPAGNE MOET IMPERIAL 6X750ML',
            barcode: '3185370000335',
            brand: 'MOET',
            category: 'WINE',
            unitsPerBox: 6,
            price_a: 390.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1598153346810-860daa0d6cac?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '3245990000019',
            description: 'COGNAC HENNESSY VS 12X700ML',
            barcode: '3245990000019',
            brand: 'HENNESSY',
            category: 'COGNAC',
            unitsPerBox: 12,
            price_a: 550.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1616428468791-383794b63390?auto=format&fit=crop&w=400&q=80'
        },
        {
            internalReference: '041331040330',
            description: 'WHISKY JACK DANIELS OLD NO.7 12X1000ML',
            barcode: '041331040330',
            brand: 'JACK DANIELS',
            category: 'WHISKY',
            unitsPerBox: 12,
            price_a: 310.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=400&q=80' // Using whisky fallback
        },
        {
            internalReference: '7501064191636',
            description: 'CERVEZA CORONA EXTRA 24X355ML',
            barcode: '7501064191636',
            brand: 'CORONA',
            category: 'BEER',
            unitsPerBox: 24,
            price_a: 42.00,
            mainImageUrl: 'https://images.unsplash.com/photo-1605218457335-5a7aee2a0210?auto=format&fit=crop&w=400&q=80'
        }
    ];

    for (const p of products) {
        const existing = await prisma.product.findFirst({
            where: { tenantId, description: p.description }
        });

        if (!existing) {
            // Use ANY to bypass strict type checking for this seed script
            const productData = {
                tenantId,
                internalReference: p.internalReference,
                description: p.description,
                showroomCode: p.internalReference.substring(0, 8),
                categoryId: categoryMap[p.category],
                brandId: brandMap[p.brand],
                unitsPerBox: p.unitsPerBox,
                price_a: p.price_a,
                mainImageUrl: p.mainImageUrl,
                createdBy: 'system-seed',
                barcodes: {
                    create: {
                        barcode: p.barcode,
                        tenantId
                    }
                },
                inventory: {
                    create: {
                        branchId: branch.id,
                        tenantId,
                        quantity: Math.floor(Math.random() * 200) + 10,
                        minStock: 10
                    }
                }
            };

            if (p.volume) productData.volume = p.volume;
            if (p.weight) productData.weight = p.weight;

            await prisma.product.create({
                data: productData
            });
            console.log(`Created product: ${p.description}`);
        } else {
            console.log(`Skipping existing product: ${p.description}`);
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
