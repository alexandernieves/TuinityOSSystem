import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('No tenant found');
    const tenantId = tenant.id;

    const branch = await prisma.branch.findFirst({ where: { tenantId } });
    if (!branch) throw new Error('No branch found');
    const branchId = branch.id;

    const product = await prisma.product.findFirst({ where: { tenantId } });
    if (!product) throw new Error('No product found');

    const fobValue = 1000.00;
    const freightCost = 100.00;
    const totalCifValue = fobValue + freightCost;

    const order = await prisma.purchaseOrder.create({
        data: {
            tenantId,
            branchId,
            supplierName: 'Apple Inc.',
            invoiceNumber: `TEST-ORD-${Date.now()}`,
            fobValue,
            freightCost,
            insuranceCost: 0,
            dutiesCost: 0,
            otherCosts: 0,
            totalCifValue,
            status: 'DRAFT',
            orderDate: new Date(),
            createdBy: 'system',
            items: {
                create: [
                    {
                        tenantId,
                        productId: product.id,
                        quantity: 10,
                        receivedQuantity: 0,
                        unitFobValue: 100.00,
                        unitCifValue: 110.00,
                        subtotalFob: 1000.00,
                        subtotalCif: 1100.00,
                    }
                ]
            }
        }
    });

    console.log(`Test Order Created: ${order.id} | Supplier: ${order.supplierName} | Invoice: ${order.invoiceNumber}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
