import { PrismaClient, SalesOrderStatus, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Starting commercial history seed...');

  const owner = await prisma.user.findFirst({ where: { email: 'owner@evolutionos.dev' } });
  const warehouse = await prisma.warehouse.findFirst();
  const products = await prisma.product.findMany();
  
  // We want to seed sales only for active clients
  const allActiveClients = await prisma.customer.findMany({ 
    where: { isActive: true },
    include: { creditProfile: true }
  });

  if (!owner || !warehouse || products.length === 0 || allActiveClients.length === 0) {
    console.error('❌ Required data missing. Ensure base and clients seeds are run first.');
    return;
  }

  // Pick a subset of clients to have history (leaves some without history for testing purposes)
  const historicalClients = allActiveClients.slice(0, 30); // First 30 clients will have history, the rest won't
  
  let salesOrderCount = 0;
  let invoiceCount = 0;

  for (const client of historicalClients) {
    // Generate 1 to 3 orders per client
    const numOrders = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 1; j <= numOrders; j++) {
      // Recent vs old purchases: Order date between 2 days and 90 days ago
      const daysAgo = Math.floor(Math.random() * 90) + 2; 
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);
      
      const soNumber = `SO-${client.code}-${j}-${daysAgo}`;
      const invNumber = `INV-${client.code}-${j}-${daysAgo}`;
      
      // Determine how many lines
      const numLines = Math.floor(Math.random() * 4) + 1;
      
      const linesData: any[] = [];
      let subtotal = 0;
      
      for (let k = 0; k < numLines; k++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 50) + 1;
        // Price varying +/- 20% from a base typical price
        const basePrice = Number(product.standardCost || 50) * 1.5; 
        const unitPrice = basePrice * (0.8 + (Math.random() * 0.4));
        const lineTotal = qty * unitPrice;
        
        linesData.push({
          productId: product.id,
          quantityOrdered: qty,
          quantityInvoiced: qty, // Fully invoiced
          quantityDispatched: qty,
          unitPrice: new Decimal(unitPrice.toFixed(2)),
          unitCost: product.standardCost || new Decimal(30.0),
          lineTotal: new Decimal(lineTotal.toFixed(2)),
          createdAt: orderDate
        });
        
        subtotal += lineTotal;
      }
      
      const total = new Decimal(subtotal.toFixed(2));
      
      // Create Sales Order
      const salesOrder = await prisma.salesOrder.upsert({
        where: { number: soNumber },
        update: {},
        create: {
          number: soNumber,
          customerId: client.id,
          warehouseId: warehouse.id,
          orderDate: orderDate,
          status: SalesOrderStatus.INVOICED,
          subtotal: total,
          total: total,
          createdByUserId: owner.id,
          createdAt: orderDate,
          lines: {
            create: linesData
          }
        },
        include: { lines: true }
      });
      salesOrderCount++;
      
      // Create Invoice immediately based on the Sales Order
      const invoiceLinesData = salesOrder.lines.map(line => ({
        salesOrderLineId: line.id,
        productId: line.productId,
        quantity: line.quantityInvoiced,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        createdAt: orderDate
      }));
      
      await prisma.invoice.upsert({
        where: { number: invNumber },
        update: {},
        create: {
          number: invNumber,
          customerId: client.id,
          salesOrderId: salesOrder.id,
          invoiceDate: orderDate,
          status: InvoiceStatus.PAID,
          subtotal: total,
          total: total,
          createdByUserId: owner.id,
          createdAt: orderDate,
          lines: {
            create: invoiceLinesData
          }
        }
      });
      invoiceCount++;
    }
  }

  console.log(`✅ ${salesOrderCount} Historical Sales Orders created.`);
  console.log(`✅ ${invoiceCount} Historical Invoices created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
