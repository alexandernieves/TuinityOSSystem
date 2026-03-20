import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('PurchaseOrder:', !!prisma.purchaseOrder);
console.log('AccountsPayableEntry:', !!prisma.accountsPayableEntry);
prisma.$disconnect();
