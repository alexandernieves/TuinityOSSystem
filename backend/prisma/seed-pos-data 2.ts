require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run prisma seed');
}

const prisma = new PrismaClient({
  __internal: {
    engine: {
      binaryPath: './node_modules/.prisma/client'
    }
  }
});

// Helper functions
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals = 2): number => {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
};

// Type definitions for our data structures
interface InvoiceData {
  id: string;
  tenantId: string;
  branchId: string;
  issuedByUserId: string | null;
  status: string;
  invoiceNumber: string;
  sequenceNumber: number;
  currency: string;
  customerName: string;
  customerTaxId: string | null;
  customerPhone: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  issuedAt: Date;
  createdAt: Date;
}

interface InvoiceLineData {
  id: string;
  tenantId: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountType: string;
  discountValue: number;
  taxable: boolean;
  taxRate: number;
  lineSubtotal: number;
  lineDiscount: number;
  lineTax: number;
  lineTotal: number;
}

interface PaymentData {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: string;
  status: string;
  paidAt: Date;
  createdAt: Date;
  metadata?: any;
}

interface ReturnData {
  id: string;
  tenantId: string;
  invoiceId: string;
  returnNumber: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: Date;
}

// Mock data generators
const customerNames = [
  'Carlos Rodríguez', 'María González', 'José Martínez', 'Ana López', 'Luis Hernández',
  'Carmen Sánchez', 'Juan García', 'Patricia Morales', 'Miguel Torres', 'Sofía Vargas',
  'Roberto Díaz', 'Laura Castro', 'Fernando Ruiz', 'Isabel Jiménez', 'Ricardo Silva',
  'Gabriela Mendoza', 'Andrés Ortiz', 'Monica Herrera', 'Diego Flores', 'Valentina Aguilar'
];

const productCategories = ['Electrónica', 'Ropa', 'Alimentos', 'Hogar', 'Deportes', 'Libros', 'Juguetes', 'Salud'];

const products = [
  { name: 'Laptop Dell Inspiron', category: 'Electrónica', basePrice: 899.99 },
  { name: 'iPhone 14 Pro', category: 'Electrónica', basePrice: 1299.99 },
  { name: 'Samsung Smart TV 55"', category: 'Electrónica', basePrice: 749.99 },
  { name: 'Sony PlayStation 5', category: 'Electrónica', basePrice: 499.99 },
  { name: 'Nike Air Max', category: 'Ropa', basePrice: 129.99 },
  { name: 'Levi\'s 501 Jeans', category: 'Ropa', basePrice: 89.99 },
  { name: 'Adidas Running Shoes', category: 'Ropa', basePrice: 109.99 },
  { name: 'North Face Jacket', category: 'Ropa', basePrice: 199.99 },
  { name: 'Arroz Integral 5kg', category: 'Alimentos', basePrice: 12.99 },
  { name: 'Aceite de Oliva Extra Virgen', category: 'Alimentos', basePrice: 8.99 },
  { name: 'Café Premium 1kg', category: 'Alimentos', basePrice: 24.99 },
  { name: 'Miel Orgánica', category: 'Alimentos', basePrice: 6.99 },
  { name: 'Oster Blender', category: 'Hogar', basePrice: 79.99 },
  { name: 'Instant Pot Duo', category: 'Hogar', basePrice: 149.99 },
  { name: 'Dyson Vacuum Cleaner', category: 'Hogar', basePrice: 399.99 },
  { name: 'Philips Air Fryer', category: 'Hogar', basePrice: 129.99 },
  { name: 'Wilson Tennis Racket', category: 'Deportes', basePrice: 159.99 },
  { name: 'Yoga Mat Premium', category: 'Deportes', basePrice: 39.99 },
  { name: 'Dumbbells Set 20kg', category: 'Deportes', basePrice: 89.99 },
  { name: 'Running Belt', category: 'Deportes', basePrice: 29.99 },
  { name: 'Programming Book Set', category: 'Libros', basePrice: 149.99 },
  { name: 'Fiction Bestseller', category: 'Libros', basePrice: 24.99 },
  { name: 'Cookbook Collection', category: 'Libros', basePrice: 39.99 },
  { name: 'Science Encyclopedia', category: 'Libros', basePrice: 89.99 },
  { name: 'LEGO Creative Set', category: 'Juguetes', basePrice: 79.99 },
  { name: 'Barbie Dream House', category: 'Juguetes', basePrice: 199.99 },
  { name: 'Remote Control Car', category: 'Juguetes', basePrice: 59.99 },
  { name: 'Board Game Collection', category: 'Juguetes', basePrice: 49.99 },
  { name: 'Vitamin C Supplement', category: 'Salud', basePrice: 19.99 },
  { name: 'Protein Powder 2kg', category: 'Salud', basePrice: 49.99 },
  { name: 'Yoga Block Set', category: 'Salud', basePrice: 24.99 },
  { name: 'Fitness Tracker', category: 'Salud', basePrice: 99.99 }
];

const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia'];
const cardTypes = ['Visa', 'Mastercard', 'American Express'];
const banks = ['Banco Nacional', 'Banco General', 'Banco Popular', 'Banco Delta', 'Banco Multibank'];
const returnReasons = ['Defectuoso', 'Devolución', 'Cambio', 'Error', 'No gustó', 'Talla incorrecta'];

async function main() {
  console.log('Starting POS data seeding...');

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

  // Generate invoices for the last 90 days
  console.log('Generating invoices...');
  const invoices: InvoiceData[] = [];
  const invoiceLines: InvoiceLineData[] = [];
  const payments: PaymentData[] = [];
  const returns: ReturnData[] = [];

  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const invoiceDate = new Date();
    invoiceDate.setDate(invoiceDate.getDate() - dayOffset);
    invoiceDate.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);

    const invoicesPerDay = randomInt(3, 12);
    
    for (let i = 0; i < invoicesPerDay; i++) {
      const branch = randomChoice(branches) as any;
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
      const customerPhone = faker.phone.number('####-####');
      const customerTaxId = Math.random() > 0.3 ? faker.string.alphanumeric({ length: 10 }) : null;

      // Generate invoice lines
      const linesCount = randomInt(1, 5);
      const currentInvoiceLines: InvoiceLineData[] = [];
      let subtotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;

      for (let j = 0; j < linesCount; j++) {
        const product = randomChoice(products);
        const quantity = randomInt(1, 5);
        const unitPrice = randomFloat(product.basePrice * 0.9, product.basePrice * 1.1);
        const lineSubtotal = quantity * unitPrice;
        
        const discountType = Math.random() > 0.8 ? 'PERCENTAGE' : 'NONE';
        const discountValue = discountType === 'PERCENTAGE' ? randomFloat(5, 15) : 0;
        const lineDiscount = discountType === 'PERCENTAGE' ? lineSubtotal * (discountValue / 100) : 0;
        
        const taxable = Math.random() > 0.1;
        const taxRate = 0.07;
        const lineTax = taxable ? (lineSubtotal - lineDiscount) * taxRate : 0;
        const lineTotal = lineSubtotal - lineDiscount + lineTax;

        const lineData: InvoiceLineData = {
          id: faker.string.uuid(),
          tenantId: tenant.id,
          invoiceId: '', // Will be set after invoice creation
          description: product.name,
          quantity: quantity,
          unitPrice: unitPrice,
          discountType: discountType,
          discountValue: discountValue,
          taxable: taxable,
          taxRate: taxRate,
          lineSubtotal: lineSubtotal,
          lineDiscount: lineDiscount,
          lineTax: lineTax,
          lineTotal: lineTotal
        };

        currentInvoiceLines.push(lineData);
        subtotal += lineSubtotal;
        discountTotal += lineDiscount;
        taxTotal += lineTax;
      }

      const total = subtotal - discountTotal + taxTotal;

      // Create invoice
      const invoice: InvoiceData = {
        id: faker.string.uuid(),
        tenantId: tenant.id,
        branchId: (branch as any).id,
        issuedByUserId: null, // Will be set later if needed
        status: randomChoice(['ISSUED', 'PAID', 'CANCELLED']),
        invoiceNumber: invoiceNumber,
        sequenceNumber: newSequenceNumber,
        currency: 'USD',
        customerName: customerName,
        customerTaxId: customerTaxId,
        customerPhone: customerPhone,
        subtotal: subtotal,
        discountTotal: discountTotal,
        taxTotal: taxTotal,
        total: total,
        issuedAt: invoiceDate,
        createdAt: invoiceDate
      };

      invoices.push(invoice);

      // Add lines with invoiceId
      currentInvoiceLines.forEach(line => {
        invoiceLines.push({
          ...line,
          invoiceId: invoice.id
        });
      });

      // Generate payment
      if (invoice.status !== 'CANCELLED') {
        const paymentMethod = randomChoice(paymentMethods);
        const paymentData: PaymentData = {
          id: faker.string.uuid(),
          tenantId: tenant.id,
          invoiceId: invoice.id,
          amount: total,
          method: paymentMethod,
          status: 'COMPLETED',
          paidAt: new Date(invoiceDate.getTime() + randomInt(0, 3600000)), // Within 1 hour
          createdAt: invoiceDate
        };

        if (paymentMethod === 'Tarjeta') {
          payments.push({
            ...paymentData,
            metadata: {
              cardType: randomChoice(cardTypes),
              lastFour: Math.floor(Math.random() * 9000) + 1000,
              bank: randomChoice(banks),
              authCode: `A${randomInt(1000, 9999)}B${randomInt(1000, 9999)}`
            }
          });
        } else {
          payments.push(paymentData);
        }
      }

      // Generate returns (10% chance)
      if (Math.random() < 0.1 && invoice.status === 'PAID') {
        const returnAmount = total * randomFloat(0.1, 0.8);
        const returnData: ReturnData = {
          id: faker.string.uuid(),
          tenantId: tenant.id,
          invoiceId: invoice.id,
          returnNumber: `NC-${String(randomInt(1000, 9999)).padStart(4, '0')}`,
          amount: returnAmount,
          reason: randomChoice(returnReasons),
          status: 'PROCESSED',
          createdAt: new Date(invoiceDate.getTime() + randomInt(3600000, 86400000)) // Within 1 day
        };
        returns.push(returnData);
      }
    }
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

  // Note: Payment and Return models would need to be created in schema
  // For now, we'll store them as metadata in audit logs or create temporary tables

  console.log('POS data seeding completed successfully!');
  console.log(`Generated ${invoices.length} invoices with ${invoiceLines.length} total lines`);
  console.log(`Generated ${payments.length} payments`);
  console.log(`Generated ${returns.length} returns`);
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
