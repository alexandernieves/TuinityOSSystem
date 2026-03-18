
import { PrismaClient, InventoryMovementType } from '@prisma/client';
import { InventoryService } from '../services/inventory/inventory.service';

async function runTest() {
  const prisma = new PrismaClient();
  const inventoryService = new InventoryService(prisma as any);

  console.log('--- Starting Functional Test: Lots & FEFO ---');

  // 0. Setup Data (Warehouse, Brand, Group)
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-TEST' },
    update: { isActive: true },
    create: {
      code: 'WH-TEST',
      name: 'Bodega de Pruebas',
      type: 'B2B',
      isActive: true,
    }
  });

  const brand = await prisma.brand.upsert({ 
    where: { name: 'Test Brand' }, 
    update: {}, 
    create: { name: 'Test Brand' }
  });
  
  const group = await prisma.productGroup.upsert({ 
    where: { name: 'Test Group' }, 
    update: {}, 
    create: { name: 'Test Group' }
  });

  // 1. Create Product
  const product = await prisma.product.upsert({
    where: { sku: 'TEST-LOT-001' },
    update: { unitsPerBox: 12, isActive: true },
    create: {
      sku: 'TEST-LOT-001',
      name: 'Whisky Test Lotes',
      unitsPerBox: 12,
      brandId: brand.id,
      groupId: group.id,
      isActive: true,
    }
  });
  console.log(`Product: ${product.name} (SKU: ${product.sku})`);

  // Cleanup old lots for this product to ensure clean test
  await prisma.productLot.updateMany({
      where: { productId: product.id, warehouseId: warehouse.id },
      data: { isActive: false }
  });

  // 2. Register Inventory Entry with multiple lots
  // Lot 1: LOT-A, 50 units, Expire 2026-06-01
  const lotA = await prisma.productLot.create({
    data: {
      productId: product.id,
      warehouseId: warehouse.id,
      lotNumber: 'LOT-A',
      receivedQuantity: 50,
      availableQuantity: 50,
      expirationDate: new Date('2026-06-01'),
      createdAt: new Date('2026-01-01'),
    }
  });

  // Lot 2: LOT-B, 50 units, Expire 2026-12-01
  const lotB = await prisma.productLot.create({
    data: {
      productId: product.id,
      warehouseId: warehouse.id,
      lotNumber: 'LOT-B',
      receivedQuantity: 50,
      availableQuantity: 50,
      expirationDate: new Date('2026-12-01'),
      createdAt: new Date('2026-03-01'),
    }
  });

  console.log('Lots created:');
  console.log(`- LOT-A: 50 units, Expiry: 2026-06-01`);
  console.log(`- LOT-B: 50 units, Expiry: 2026-12-01`);

  // 4. Simular venta de 60 unidades
  const requiredQuantity = 60;
  console.log(`\nSimulating dispatch of ${requiredQuantity} units...`);
  
  try {
    const selectedLots = await inventoryService.selectLotsForDispatch(product.id, warehouse.id, requiredQuantity);

    console.log('Policy: FEFO (First Expired, First Out)');
    console.log('Lots selected for dispatch:');
    selectedLots.forEach(lot => {
        console.log(`  -> Lot ${lot.lotNumber}: Consuming ${lot.quantityToConsume} units`);
    });

    // 5. Apply impacts
    for (const selection of selectedLots) {
        await inventoryService.applyLotStockImpact(selection.lotId, InventoryMovementType.SALE, selection.quantityToConsume);
        
        // Record movement for history
        await prisma.inventoryMovement.create({
            data: {
                productId: product.id,
                warehouseId: warehouse.id,
                productLotId: selection.lotId,
                movementType: InventoryMovementType.SALE,
                quantity: selection.quantityToConsume,
                occurredAt: new Date(),
                notes: `Test dispatch for ${product.sku}`,
            }
        });
    }

    // 6. Confirm results
    const updatedLotA = await prisma.productLot.findUnique({ where: { id: lotA.id } });
    const updatedLotB = await prisma.productLot.findUnique({ where: { id: lotB.id } });

    console.log('\n--- FINAL VERIFICATION ---');
    console.log(`LOT-A (Expected: 0, Actual: ${Number(updatedLotA?.availableQuantity)})`);
    console.log(`LOT-B (Expected: 40, Actual: ${Number(updatedLotB?.availableQuantity)})`);

    const isSuccess = Number(updatedLotA?.availableQuantity) === 0 && Number(updatedLotB?.availableQuantity) === 40;
    
    if (isSuccess) {
        console.log('\nTEST RESULT: PASSED ✅');
        console.log('Behavior confirmed: LOT-A (earlier expiry) was consumed first, followed by remaining units from LOT-B.');
    } else {
        console.log('\nTEST RESULT: FAILED ❌');
    }

  } catch (error) {
    console.error('Error during test execution:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
