require('dotenv/config');

const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run prisma seed');
}

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Helper functions
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
};

// Mock data
const customerNames = [
  'Carlos Rodríguez', 'María González', 'José Martínez', 'Ana López', 'Luis Hernández',
  'Carmen Sánchez', 'Juan García', 'Patricia Morales', 'Miguel Torres', 'Sofía Vargas'
];

const products = [
  { name: 'Laptop Dell Inspiron', category: 'Electrónica', basePrice: 899.99 },
  { name: 'iPhone 14 Pro', category: 'Electrónica', basePrice: 1299.99 },
  { name: 'Samsung Smart TV 55"', category: 'Electrónica', basePrice: 749.99 },
  { name: 'Nike Air Max', category: 'Ropa', basePrice: 129.99 },
  { name: 'Arroz Integral 5kg', category: 'Alimentos', basePrice: 12.99 },
  { name: 'Oster Blender', category: 'Hogar', basePrice: 79.99 }
];

async function main() {
  console.log('Starting simple POS data seeding...');

  // Get existing tenant and branches
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error('No tenant found. Please run the main seed first.');
  }

  const branches = await prisma.branch.findMany({
    where: { tenantId: tenant.id }
  });

  if (branches.length === 0) {
    throw new Error('No branches found. Please create branches first.');
  }

  console.log(`Found ${branches.length} branches for tenant: ${tenant.name}`);

  // Create invoice sequences for each branch
  console.log('Creating invoice sequences...');
  for (const branch of branches) {
    await prisma.invoiceSequence.upsert({
      where: {
        tenantId_branchId: {
          tenantId: tenant.id,
          branchId: branch.id
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        prefix: 'FAC',
        lastNumber: 100
      }
    });
  }

  // Generate some sample invoices
  console.log('Generating sample invoices...');
  const invoices = [];
  const invoiceLines = [];

  for (let i = 0; i < 50; i++) {
    const branch = randomChoice(branches);
    const sequence = await prisma.invoiceSequence.findUnique({
      where: { tenantId_branchId: { tenantId: tenant.id, branchId: branch.id } }
    });

    if (!sequence) continue;

    const newSequenceNumber = sequence.lastNumber + 1;
    const invoiceNumber = `${sequence.prefix}-${String(newSequenceNumber).padStart(4, '0')}`;

    // Update sequence
    await prisma.invoiceSequence.update({
      where: { id: sequence.id },
      data: { lastNumber: newSequenceNumber }
    });

    const customerName = randomChoice(customerNames);
    const customerPhone = `${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;

    // Generate invoice lines
    const linesCount = randomInt(1, 3);
    let subtotal = 0;
    let taxTotal = 0;

    for (let j = 0; j < linesCount; j++) {
      const product = randomChoice(products);
      const quantity = randomInt(1, 3);
      const unitPrice = randomFloat(product.basePrice * 0.9, product.basePrice * 1.1);
      const lineSubtotal = quantity * unitPrice;
      const taxable = Math.random() > 0.1;
      const taxRate = 0.07;
      const lineTax = taxable ? lineSubtotal * taxRate : 0;
      const lineTotal = lineSubtotal + lineTax;

      invoiceLines.push({
        id: `line-${i}-${j}`,
        tenantId: tenant.id,
        invoiceId: `invoice-${i}`,
        description: product.name,
        quantity: quantity,
        unitPrice: unitPrice,
        discountType: 'NONE',
        discountValue: 0,
        taxable: taxable,
        taxRate: taxRate,
        lineSubtotal: lineSubtotal,
        lineDiscount: 0,
        lineTax: lineTax,
        lineTotal: lineTotal
      });

      subtotal += lineSubtotal;
      taxTotal += lineTax;
    }

    const total = subtotal + taxTotal;

    invoices.push({
      id: `invoice-${i}`,
      tenantId: tenant.id,
      branchId: branch.id,
      issuedByUserId: null,
      status: 'PAID',
      invoiceNumber: invoiceNumber,
      sequenceNumber: newSequenceNumber,
      currency: 'USD',
      customerName: customerName,
      customerTaxId: null,
      customerPhone: customerPhone,
      subtotal: subtotal,
      discountTotal: 0,
      taxTotal: taxTotal,
      total: total,
      issuedAt: new Date(),
      createdAt: new Date()
    });
  }

  // Insert all data
  console.log('Inserting invoices...');
  await prisma.invoice.createMany({
    data: invoices,
    skipDuplicates: true
  });

  console.log('Inserting invoice lines...');
  await prisma.invoiceLine.createMany({
    data: invoiceLines,
    skipDuplicates: true
  });

  console.log('Simple POS data seeding completed successfully!');
  console.log(`Generated ${invoices.length} invoices with ${invoiceLines.length} total lines`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
