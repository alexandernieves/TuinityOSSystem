import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.purchaseOrder.findMany();
    console.log('Orders in DB:', orders.length);
    if (orders.length > 0) {
        console.log('Sample order:', JSON.stringify(orders[0], null, 2));
    }
}
main().finally(() => prisma.$disconnect());
