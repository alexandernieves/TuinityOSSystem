
import { PrismaClient, AccountType, InventoryMovementType, WarehouseType, SalesOrderStatus, InvoiceStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting ERP Flow Seed...');

  // 1. User/Owner
  let user = await prisma.user.findFirst();
  const userId = user?.id;

  // 2. Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: { isActive: true },
    create: {
      name: 'Bodega Principal ERP',
      code: 'WH-MAIN',
      type: WarehouseType.B2B,
      isActive: true,
    },
  });
  console.log(`✅ Warehouse: ${warehouse.code}`);

  // 3. Accounting Accounts
  const arAccount = await prisma.account.upsert({
    where: { code: 'AR_TRADE' },
    update: {},
    create: {
      code: 'AR_TRADE',
      name: 'Cuentas por Cobrar Clientes',
      type: AccountType.ASSET,
      isActive: true,
    },
  });

  const revenueAccount = await prisma.account.upsert({
    where: { code: 'SALES_REVENUE' },
    update: {},
    create: {
      code: 'SALES_REVENUE',
      name: 'Ingresos por Ventas',
      type: AccountType.REVENUE,
      isActive: true,
    },
  });
  console.log(`✅ Accounts: ${arAccount.code}, ${revenueAccount.code}`);

  // 4. Product Group/Subgroup/Brand
  const group = await prisma.productGroup.upsert({
    where: { name: 'BEBIDAS' },
    update: {},
    create: { name: 'BEBIDAS' },
  });

  const brand = await prisma.brand.upsert({
    where: { name: 'TEST-BRAND' },
    update: {},
    create: { name: 'TEST-BRAND' },
  });

  // 5. Product
  const product = await prisma.product.upsert({
    where: { sku: 'TEST-LOT-001' },
    update: {},
    create: {
      sku: 'TEST-LOT-001',
      name: 'Producto Test Lotes',
      description: 'Producto para validar lógica FEFO',
      groupId: group.id,
      brandId: brand.id,
      unitsPerBox: 12,
      isActive: true,
    },
  });
  console.log(`✅ Product: ${product.sku}`);

  // 6. Customer
  const customer = await prisma.customer.upsert({
    where: { code: 'CUST-TEST-001' },
    update: {},
    create: {
      code: 'CUST-TEST-001',
      legalName: 'Cliente Prueba ERP S.A.',
      tradeName: 'Cliente ERP',
      taxId: '8-000-000',
      isActive: true,
    },
  });
  console.log(`✅ Customer: ${customer.legalName}`);

  // 7. Lots
  const lots = [
    { number: 'LOT-001', qty: 10, exp: new Date('2026-05-01') },
    { number: 'LOT-002', qty: 20, exp: new Date('2026-12-31') },
    { number: 'LOT-003', qty: 50, exp: null },
  ];

  for (const l of lots) {
    // Check if lot exists by manual query because upsert unique is complex here
    let lot = await prisma.productLot.findFirst({
        where: {
            productId: product.id,
            lotNumber: l.number,
            warehouseId: warehouse.id,
            expirationDate: l.exp
        }
    });

    if (!lot) {
        lot = await prisma.productLot.create({
            data: {
                productId: product.id,
                lotNumber: l.number,
                warehouseId: warehouse.id,
                receivedQuantity: l.qty,
                availableQuantity: l.qty,
                expirationDate: l.exp,
                isActive: true,
            }
        });
    } else {
        lot = await prisma.productLot.update({
            where: { id: lot.id },
            data: {
                availableQuantity: l.qty,
                receivedQuantity: l.qty
            }
        });
    }

    // Create a generic entry movement
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        productLotId: lot.id,
        movementType: InventoryMovementType.PURCHASE_RECEIPT,
        quantity: l.qty,
        occurredAt: new Date(),
        referenceType: 'INITIAL_LOAD',
        referenceId: uuidv4(),
        notes: `Initial stock for ${l.number}`,
        createdByUserId: userId,
      }
    });
  }

  console.log('✨ Seed complete. You can now test FEFO flow with 80 units total.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
