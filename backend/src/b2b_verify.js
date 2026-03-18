
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING B2B PIPELINE SIMULATION ---');
    
    const productId = '0e209191-bc74-401a-8237-6971fd3c6ed9';
    const customerId = '9e60ed97-dbbd-4de6-b9a4-9050c8a9ef2e';
    const warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) throw new Error('No warehouse found');
    const warehouseId = warehouse.id;

    // 0. Reset Stock for clean test
    await prisma.inventoryExistence.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        update: { existence: 100, available: 100, reserved: 0 },
        create: { productId, warehouseId, existence: 100, available: 100, reserved: 0 }
    });

    console.log('0. INICIAL: Stock 100, Reservado 0');

    // 1. Crear Cotización -> Pedido
    const order = await prisma.salesOrder.create({
        data: {
            number: 'PED-TEST-' + Date.now(),
            customerId,
            warehouseId,
            status: 'DRAFT',
            orderDate: new Date(),
            subtotal: 100,
            total: 100,
            lines: {
                create: [{
                    productId,
                    quantityOrdered: 10,
                    unitPrice: 10,
                    lineTotal: 100
                }]
            }
        },
        include: { lines: true }
    });
    console.log('1. PEDIDO CREADO:', order.number);

    // 2. Aprobar Pedido (Simular RESERVED)
    await prisma.$transaction(async (tx) => {
        await tx.salesOrder.update({ where: { id: order.id }, data: { status: 'RESERVED' } });
        await tx.inventoryExistence.update({
            where: { productId_warehouseId: { productId, warehouseId } },
            data: { 
                reserved: { increment: 10 },
                available: { decrement: 10 }
            }
        });
    });
    const stockAfterApprove = await prisma.inventoryExistence.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } });
    console.log('2. PEDIDO APROBADO (RESERVADO): Stock Físico:', Number(stockAfterApprove.existence), 'Reservado:', Number(stockAfterApprove.reserved), 'Available:', Number(stockAfterApprove.available));

    // 3. Crear Packing List (DRAFT)
    const packing = await prisma.packingList.create({
        data: {
            number: 'PKG-TEST-' + Date.now(),
            salesOrderId: order.id,
            status: 'DRAFT',
            packingDate: new Date(),
            lines: {
                create: [{
                    salesOrderLineId: order.lines[0].id,
                    productId,
                    quantityOrdered: 10,
                    quantityPacked: 10
                }]
            }
        },
        include: { lines: true }
    });
    console.log('3. PACKING LIST GENERADO (BORRADOR):', packing.number);

    // 4. Confirmar Packing (Simular confirmPackingList)
    await prisma.$transaction(async (tx) => {
        await tx.inventoryExistence.update({
            where: { productId_warehouseId: { productId, warehouseId } },
            data: { 
                existence: { decrement: 10 },
                reserved: { decrement: 10 }
            }
        });

        await tx.inventoryMovement.create({
            data: {
                productId,
                warehouseId,
                movementType: 'SALE',
                quantity: -10,
                referenceType: 'packing_list',
                referenceId: packing.id,
                occurredAt: new Date()
            }
        });

        await tx.packingList.update({ where: { id: packing.id }, data: { status: 'CONFIRMED' } });
        await tx.salesOrder.update({ where: { id: order.id }, data: { status: 'DISPATCHED' } });
    });

    const stockAfterPack = await prisma.inventoryExistence.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } });
    const movement = await prisma.inventoryMovement.findFirst({ where: { referenceId: packing.id } });
    
    console.log('4. PACKING CONFIRMADO (STOCK DESCONTADO):');
    console.log('   - Stock Físico:', Number(stockAfterPack.existence));
    console.log('   - Reservado:', Number(stockAfterPack.reserved));
    console.log('   - Available:', Number(stockAfterPack.available));
    console.log('   - Kardex registrado:', !!movement, 'Qty:', movement.quantity);

    // 5. Generar Factura
    const invoice = await prisma.invoice.create({
        data: {
            number: 'FAC-TEST-' + Date.now(),
            customerId,
            salesOrderId: order.id,
            status: 'ISSUED',
            invoiceDate: new Date(),
            subtotal: 100,
            total: 100
        }
    });
    await prisma.salesOrder.update({ where: { id: order.id }, data: { status: 'INVOICED' } });

    const finalStock = await prisma.inventoryExistence.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } });
    console.log('5. FACTURA GENERADA:', invoice.number);
    console.log('   - Stock Final (No debe haber cambiado):', Number(finalStock.existence));

    console.log('--- PIPELINE COMPLETED SUCCESSFULLY ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
