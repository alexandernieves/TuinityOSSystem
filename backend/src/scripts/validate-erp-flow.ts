
import { PrismaClient, SalesOrderStatus, InvoiceStatus, JournalEntryStatus, InventoryMovementType } from '@prisma/client';
import { SalesService } from '../services/sales/sales.service';
import { InventoryService } from '../services/inventory/inventory.service';
import { AccountingService } from '../services/accounting/accounting.service';
import { PrismaService } from '../services/shared/prisma.service';

async function runTest() {
  const prismaRaw = new PrismaClient();
  const prismaService = new PrismaService();
  const inventoryService = new InventoryService(prismaService);
  const salesService = new SalesService(prismaService, inventoryService);

  console.log('🧪 Starting ERP Technical Test...');

  // 0. Setup Context
  const warehouse = await prismaRaw.warehouse.findUnique({ where: { code: 'WH-MAIN' } });
  const product = await prismaRaw.product.findUnique({ where: { sku: 'TEST-LOT-001' } });
  const customer = await prismaRaw.customer.findUnique({ where: { code: 'CUST-TEST-001' } });

  if (!warehouse || !product || !customer) {
    throw new Error('Missing seed data. Please run seed-erp-flow.ts first.');
  }

  // Need a real user ID or null for createdBy fields in Prisma
  const user = await prismaRaw.user.findFirst();
  const userId = user?.id;

  console.log('--- Phase 1: Quotation ---');
  const quotation = await salesService.createQuotation({
    customerId: customer.id,
    lines: [{
        productId: product.id,
        quantity: 60,
        unitPrice: 150.00
    }],
    notes: 'Prueba de flujo completo 60 unidades',
    createdByUserId: userId
  });
  console.log(`✅ Quotation created: ${quotation.number}`);

  console.log('--- Phase 2: Sales Order ---');
  const salesOrder = await salesService.convertQuotationToSalesOrder(quotation.id, userId);
  console.log(`✅ Sales Order created: ${salesOrder.number}`);

  await prismaRaw.salesOrder.update({
    where: { id: salesOrder.id },
    data: { status: SalesOrderStatus.APPROVED }
  });
  console.log(`✅ Sales Order Approved`);

  console.log('--- Phase 3: Invoicing ---');
  const invoice = await salesService.issueInvoiceFromSalesOrder(salesOrder.id, new Date(), 'Factura de prueba', userId);
  console.log(`✅ Invoice issued: ${invoice.number}`);
  
  const arEntry = await prismaRaw.accountsReceivableEntry.findFirst({ where: { invoiceId: invoice.id } });
  if (!arEntry || Number(arEntry.amount) !== Number(invoice.total)) {
      throw new Error('AR Entry mismatch or missing');
  }
  console.log(`✅ Accounts Receivable Entry verified ($${arEntry.amount})`);

  const journalEntry = await prismaRaw.journalEntry.findFirst({ 
      where: { referenceId: invoice.id, referenceType: 'INVOICE' },
      include: { lines: true }
  });
  if (!journalEntry || journalEntry.status !== JournalEntryStatus.POSTED) {
      throw new Error('Journal Entry missing or not posted');
  }
  const debits = journalEntry.lines.reduce((s, l) => s + Number(l.debit), 0);
  const credits = journalEntry.lines.reduce((s, l) => s + Number(l.credit), 0);
  if (debits !== credits || Math.abs(debits - Number(invoice.total)) > 0.01) {
      throw new Error(`Accounting imbalance: D=${debits} C=${credits} InvTotal=${invoice.total}`);
  }
  console.log(`✅ Journal Entry verified and balanced`);

  console.log('--- Phase 4: Dispatch (FEFO) ---');
  const dispatchedSO = await salesService.dispatchSalesOrder(salesOrder.id, warehouse.id, userId || '');
  console.log(`✅ Sales Order Dispatched. New status: ${dispatchedSO.status}`);

  console.log('--- Phase 5: Stock Validation ---');
  const lot1 = await prismaRaw.productLot.findFirst({ where: { lotNumber: 'LOT-001', productId: product.id } });
  const lot2 = await prismaRaw.productLot.findFirst({ where: { lotNumber: 'LOT-002', productId: product.id } });
  const lot3 = await prismaRaw.productLot.findFirst({ where: { lotNumber: 'LOT-003', productId: product.id } });

  console.log(`LOT-001 Stock: ${lot1?.availableQuantity} (Expected: 0)`);
  console.log(`LOT-002 Stock: ${lot2?.availableQuantity} (Expected: 0)`);
  console.log(`LOT-003 Stock: ${lot3?.availableQuantity} (Expected: 20)`);

  if (Number(lot1?.availableQuantity) !== 0 || Number(lot2?.availableQuantity) !== 0 || Number(lot3?.availableQuantity) !== 20) {
      throw new Error('FEFO consumption logic failed. Stock levels are incorrect.');
  }
  console.log('✅ FEFO Consumption Logic verified successfully!');

  console.log('--- Phase 6: Consistency Check ---');
  const finalSO = await prismaRaw.salesOrder.findUnique({
      where: { id: salesOrder.id },
      include: { lines: true }
  });
  const line = finalSO?.lines[0];
  console.log(`SO Line: Ordered=${line?.quantityOrdered}, Invoiced=${line?.quantityInvoiced}, Dispatched=${line?.quantityDispatched}`);
  
  if (Number(line?.quantityInvoiced) !== 60 || Number(line?.quantityDispatched) !== 60) {
      throw new Error('SO Line accumulation mismatch');
  }

  console.log('\n🌟 ALL TESTS PASSED SUCCESSFULLY! 🌟');
}

runTest()
  .catch(e => {
    console.error('❌ TEST FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    const p = new PrismaClient();
    await p.$disconnect();
  });
