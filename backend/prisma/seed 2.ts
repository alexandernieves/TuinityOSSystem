require('dotenv/config');

const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run prisma seed');
}

const prisma = new PrismaClient({});

async function main() {
  const permissionKeys = [
    'saas.tenant.read',
    'saas.tenant.write',
    'saas.user.read',
    'saas.user.write',
    'pos.sale.read',
    'pos.sale.write',
    'inventory.product.read',
    'inventory.product.write',
    'inventory.stock.read',
    'inventory.stock.write',
    'reports.read',
  ] as const;

  await prisma.permission.createMany({
    data: permissionKeys.map((key) => ({ key })),
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });
