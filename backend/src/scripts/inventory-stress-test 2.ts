
import { PrismaClient, InventoryMovementType, WarehouseType, Prisma } from '@prisma/client';
import { InventoryService } from '../services/inventory/inventory.service';
import { AuditService } from '../services/audit/audit.service';

async function runStressTest() {
  const prisma = new PrismaClient();
  const notificationsService = {} as any;
  const inventoryService = new InventoryService(prisma as any, notificationsService);
  const auditService = new AuditService(prisma as any);

  console.log('🚀 Starting EvolutionOS Inventory Stress Test');
  console.log('----------------------------------------------------');

  try {
    // 0. Setup: Ensure we have essential data
    console.log('Phase 0: Environment Setup...');
    const warehouse = await prisma.warehouse.upsert({
      where: { code: 'WH-MAIN' },
      update: {},
      create: {
        code: 'WH-MAIN',
        name: 'Bodega Central de Distribución',
        type: WarehouseType.B2B,
      }
    });

    const categories = ['Whisky', 'Bourbon', 'Vodka', 'Tequila', 'Rum', 'Wine', 'Beer', 'Liqueur'];
    const categoryModels = await Promise.all(categories.map(name => 
      prisma.productGroup.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    ));

    const brands = ['Johnnie Walker', 'Jack Daniels', 'Absolut', 'Jose Cuervo', 'Bacardi', 'Concha y Toro', 'Heineken', 'Baileys'];
    const brandModels = await Promise.all(brands.map(name => 
      prisma.brand.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    ));

    const user = await prisma.user.findFirst();
    const userId = user?.id;

    // Phase 1: Product Generation (100 products)
    console.log('\nPhase 1: Generating 100 Products...');
    const products: any[] = [];
    const productIds: string[] = [];

    for (let i = 1; i <= 100; i++) {
      const category = categoryModels[Math.floor(Math.random() * categoryModels.length)];
      const brand = brandModels[Math.floor(Math.random() * brandModels.length)];
      const cost = 20 + Math.random() * 100;
      const sku = `STRESS-PROD-${String(i).padStart(3, '0')}`;
      
      const p = await prisma.product.upsert({
        where: { sku },
        update: { isActive: true },
        create: {
          sku,
          name: `${category.name} Premium Edition ${String(i).padStart(3, '0')}`,
          brandId: brand.id,
          groupId: category.id,
          unitsPerBox: 12,
          standardCost: new Prisma.Decimal(cost),
          isActive: true,
          prices: {
            create: [
              { level: 'A', price: new Prisma.Decimal(cost * 1.8) },
              { level: 'B', price: new Prisma.Decimal(cost * 1.7) },
              { level: 'C', price: new Prisma.Decimal(cost * 1.6) },
              { level: 'D', price: new Prisma.Decimal(cost * 1.5) },
              { level: 'E', price: new Prisma.Decimal(cost * 1.4) },
            ]
          }
        }
      });
      products.push(p);
      productIds.push(p.id);
      if (i % 20 === 0) console.log(`  - Generated ${i} products...`);
    }

    // Phase 2: Lot Generation (2-4 per product)
    console.log('\nPhase 2: Generating Lots (FEFO/FIFO Data)...');
    let totalLots = 0;
    let initialTotalUnits = 0;
    for (const prod of products) {
      const numLots = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numLots; j++) {
        const qty = 20 + Math.floor(Math.random() * 80);
        const daysToExpiry = 30 + Math.floor(Math.random() * 365);
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + daysToExpiry);
        
        const lot = await prisma.productLot.create({
          data: {
            productId: prod.id,
            warehouseId: warehouse.id,
            lotNumber: `LOT-${prod.sku.split('-').pop()}-${String(j+1).padStart(2, '0')}`,
            receivedQuantity: new Prisma.Decimal(qty),
            availableQuantity: new Prisma.Decimal(qty),
            expirationDate,
            createdAt: new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 30),
            isActive: true,
          }
        });
        
        await prisma.inventoryMovement.create({
          data: {
            productId: prod.id,
            warehouseId: warehouse.id,
            productLotId: lot.id,
            movementType: InventoryMovementType.PURCHASE_RECEIPT,
            quantity: new Prisma.Decimal(qty),
            occurredAt: lot.createdAt,
            notes: 'Carga inicial Stress Test',
            createdByUserId: userId
          }
        });

        totalLots++;
        initialTotalUnits += qty;
      }
    }
    console.log(`  - Generated ${totalLots} lots with a total of ${initialTotalUnits} units.`);

    // Phase 3: Sales Simulation (200 random sales)
    console.log('\nPhase 3: Simulating 200 Sales (FEFO Consumption)...');
    let successfulSales = 0;
    let totalUnitsSold = 0;
    let saleErrors = 0;

    for (let s = 1; s <= 200; s++) {
      const itemsInSale = 1 + Math.floor(Math.random() * 5);
      const selectedProductsInOrder: any[] = [];
      for(let i=0; i<itemsInSale; i++) {
          selectedProductsInOrder.push(products[Math.floor(Math.random() * products.length)]);
      }

      await prisma.$transaction(async (tx) => {
        for (const prod of selectedProductsInOrder) {
          const qtyRequested = 1 + Math.floor(Math.random() * 15);
          
          try {
            const selectedLots = await inventoryService.selectLotsForDispatch(prod.id, warehouse.id, qtyRequested, tx as any);
            
            for (const selection of selectedLots) {
              await inventoryService.applyLotStockImpact(selection.lotId, InventoryMovementType.SALE, selection.quantityToConsume, tx as any);
              
              await tx.inventoryMovement.create({
                data: {
                  productId: prod.id,
                  warehouseId: warehouse.id,
                  productLotId: selection.lotId,
                  movementType: InventoryMovementType.SALE,
                  quantity: new Prisma.Decimal(selection.quantityToConsume),
                  occurredAt: new Date(),
                  notes: `Venta Stress Test #${s}`,
                  createdByUserId: userId
                }
              });
              totalUnitsSold += selection.quantityToConsume;
            }
          } catch (e) {
            saleErrors++;
          }
        }
      });

      successfulSales++;
      if (s % 50 === 0) console.log(`  - Processed ${s} sales orders...`);
    }
    console.log(`  - Completed simulation. Sales processed: ${successfulSales}. Units sold: ${totalUnitsSold}. Stockouts encountered: ${saleErrors}`);

    // Phase 4: Validation
    console.log('\nPhase 4: Automatic Validation...');
    
    const negativeLotsCount = await prisma.productLot.count({
      where: { availableQuantity: { lt: 0 } }
    });
    console.log(`  - Lots with negative stock: ${negativeLotsCount} (Expect: 0)`);

    const currentLotsSum = await prisma.productLot.aggregate({
      where: { productId: { in: productIds } },
      _sum: { availableQuantity: true }
    });
    const finalTotalUnits = Number(currentLotsSum._sum?.availableQuantity || 0);
    const expectedFinal = initialTotalUnits - totalUnitsSold;
    
    console.log(`  - Initial Units: ${initialTotalUnits}`);
    console.log(`  - Units Sold: ${totalUnitsSold}`);
    console.log(`  - Final Units (DB): ${finalTotalUnits}`);
    console.log(`  - Variance: ${Math.abs(expectedFinal - finalTotalUnits)}`);

    // Phase 6: Automatic Alerts Report
    console.log('\nPhase 6: Generating Alertas Report...');
    const lowStock = await prisma.productLot.findMany({
      where: { 
        availableQuantity: { gt: 0, lt: 10 }, 
        productId: { in: productIds } 
      },
      include: { product: true },
      take: 5
    });
    
    const nearExpiryDate = new Date();
    nearExpiryDate.setDate(nearExpiryDate.getDate() + 30);
    const nearExpiry = await prisma.productLot.findMany({
      where: { 
        expirationDate: { lt: nearExpiryDate, gt: new Date() }, 
        productId: { in: productIds } 
      },
      include: { product: true },
      take: 5
    });

    console.log('--- ALERTS SUMMARY ---');
    console.log(`Low Stock Alerts: Found ${lowStock.length} samples.`);
    lowStock.forEach((l: any) => console.log(`  [LOW] ${l.product.sku}: ${l.availableQuantity} units left in ${l.lotNumber}`));
    
    console.log(`Near Expiry Alerts (30 days): Found ${nearExpiry.length} samples.`);
    nearExpiry.forEach((l: any) => console.log(`  [EXP] ${l.product.sku}: Lot ${l.lotNumber} expires on ${l.expirationDate?.toLocaleDateString()}`));

    console.log('\n----------------------------------------------------');
    console.log('✅ Stress Test Finished Successfully');

  } catch (error) {
    console.error('❌ Error during stress test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runStressTest();
