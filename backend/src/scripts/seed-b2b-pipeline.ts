import { PrismaClient, PriceLevel, WarehouseType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding B2B Sales Pipeline scenario...');

  // 1. Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'ZL' },
    update: {},
    create: {
      name: 'Bodega Zona Libre',
      code: 'ZL',
      type: WarehouseType.B2B,
      isActive: true,
    },
  });
  console.log(`✅ Warehouse: ${warehouse.code}`);

  // 2. Client
  const client = await prisma.customer.upsert({
    where: { code: 'CURACAO-001' },
    update: {},
    create: {
      code: 'CURACAO-001',
      legalName: 'BRAND DISTRIBUIDOR CURACAO',
      taxId: 'CUR-123456',
      isActive: true,
      creditProfile: {
        create: {
          creditLimit: 50000,
          priceLevel: PriceLevel.B,
        }
      }
    },
  });
  console.log(`✅ Client: ${client.legalName}`);

  // 3. Products
  const products = [
    {
      sku: 'JW-RED-750',
      name: 'WHISKY JOHNNIE WALKER RED LABEL 12x750ML',
      prices: [
        { level: PriceLevel.A, price: 120 },
        { level: PriceLevel.B, price: 115 },
        { level: PriceLevel.C, price: 110 },
      ],
      stock: 100
    },
    {
      sku: 'JW-BLACK-375',
      name: 'WHISKY JOHNNIE WALKER BLACK 12YRS 24x375ML',
      prices: [
        { level: PriceLevel.A, price: 240 },
        { level: PriceLevel.B, price: 230 },
        { level: PriceLevel.C, price: 220 },
      ],
      stock: 50
    },
    {
      sku: 'DJ-1942-750',
      name: 'TEQUILA DON JULIO 1942 6x750ML',
      prices: [
        { level: PriceLevel.A, price: 780 },
        { level: PriceLevel.B, price: 750 },
        { level: PriceLevel.C, price: 720 },
      ],
      stock: 20
    }
  ];

  const group = await prisma.productGroup.upsert({
    where: { name: 'LICORES' },
    update: {},
    create: { name: 'LICORES' },
  });

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        groupId: group.id,
        isActive: true,
        prices: {
          create: p.prices.map(pr => ({
            level: pr.level,
            price: pr.price,
          }))
        }
      },
    });

    await prisma.inventoryExistence.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id
        }
      },
      update: {
        existence: p.stock,
        available: p.stock
      },
      create: {
        productId: product.id,
        warehouseId: warehouse.id,
        existence: p.stock,
        available: p.stock
      }
    });
    console.log(`✅ Product & Stock: ${product.sku}`);
  }

  console.log('✨ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
