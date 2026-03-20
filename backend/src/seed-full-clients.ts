import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './services/shared/prisma.service';
import { AccountsReceivableEntryType, InvoiceStatus, ReceiptStatus, ReceiptMethod, PriceLevel } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

async function seed() {
    console.log('--- Seeding 124 Realistic Clients with History ---');
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    // 1. Limpiar datos previos de clientes y finanzas (Cuidado con el orden por Cascadas)
    await prisma.accountsReceivableEntry.deleteMany({});
    await prisma.receiptApplication.deleteMany({});
    await prisma.receipt.deleteMany({});
    await prisma.invoiceLine.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.customerCreditProfile.deleteMany({});
    await prisma.customerAddress.deleteMany({});
    await prisma.customerContact.deleteMany({});
    await prisma.customer.deleteMany({});

    const clientTypes = ['IMPORTADORA', 'DISTRIBUIDORA', 'RETAIL', 'LOGÍSTICA', 'COMERCIALIZADORA', 'SERVICIOS'];
    const names = ['ATLANTIC', 'GLOBAL', 'PACIFIC', 'CENTRAL', 'EL ÉXITO', 'PREMIUM', 'SUPPLY', 'INNOVATION', 'DYNAMIC', 'FAST', 'RELIABLE', 'EXPERT', 'TOTAL', 'UNIVERSE'];
    const suffixes = ['PANAMÁ S.A.', 'LATAM CORP.', 'DE LAS AMÉRICAS', '& CO.', 'TRADING', 'GROUP INC.', 'ENTERPRISES'];
    const cities = ['Panama City', 'David', 'Colón', 'Chitré', 'Santiago', 'Chorrera'];

    console.log('Generating 124 clients...');
    
    for (let i = 1; i <= 124; i++) {
        const type = clientTypes[Math.floor(Math.random() * clientTypes.length)];
        const namePart = names[Math.floor(Math.random() * names.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const legalName = `${type} ${namePart} ${suffix} ${i}`;
        const code = `CLI-${String(i).padStart(3, '0')}`;
        const taxId = `${Math.floor(Math.random() * 9000000)}-${Math.floor(Math.random() * 9)}-${Math.floor(Math.random() * 900000)}`;
        
        const client = await prisma.customer.create({
            data: {
                code,
                legalName,
                tradeName: `${namePart} ${type}`,
                taxId,
                email: `contacto@${namePart.toLowerCase().replace(/ /g, '')}${i}.com.pa`,
                phone: `+507 ${Math.floor(Math.random() * 800)}-${Math.floor(Math.random() * 9000)}`,
                country: 'Panamá',
                creditProfile: {
                    create: {
                        creditLimit: new Decimal(5000 + (Math.random() * 20000)),
                        creditDays: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
                        priceLevel: (['A', 'B', 'C'][Math.floor(Math.random() * 3)]) as PriceLevel,
                        currentBalance: new Decimal(0), // Calculated later
                    }
                },
                addresses: {
                    create: {
                        label: 'Principal',
                        addressLine1: `Via España, Edif ${namePart}, Piso ${Math.floor(Math.random() * 20)}`,
                        city: cities[Math.floor(Math.random() * cities.length)],
                        country: 'Panamá',
                        isPrimary: true
                    }
                },
                contacts: {
                    create: {
                        name: `Encargado ${i}`,
                        position: 'Compras / Contabilidad',
                        isPrimary: true
                    }
                }
            }
        });

        // Generar historial para algunos clientes (aprox el 30%)
        if (i % 3 === 0) {
            let runningBalance = new Decimal(0);
            const numDocs = 5 + Math.floor(Math.random() * 10);
            
            for (let d = 1; d <= numDocs; d++) {
                const date = new Date();
                date.setDate(date.getDate() - (numDocs - d) * 15); // Spread over months

                const amount = new Decimal(500 + Math.random() * 2000);
                const isPaid = d < (numDocs - 2); // Final 2 are usually unpaid
                
                // Create Invoice
                const invoice = await prisma.invoice.create({
                    data: {
                        number: `INV-${code}-${d}`,
                        customerId: client.id,
                        invoiceDate: date,
                        subtotal: amount,
                        total: amount,
                        dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
                        status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.ISSUED,
                    }
                });

                runningBalance = runningBalance.add(amount);
                
                // AR Entry for Invoice
                await prisma.accountsReceivableEntry.create({
                    data: {
                        customerId: client.id,
                        invoiceId: invoice.id,
                        entryType: AccountsReceivableEntryType.INVOICE_CHARGE,
                        amount: amount,
                        balanceAfter: runningBalance,
                        occurredAt: date,
                        notes: `Factura ${invoice.number}`
                    }
                });

                if (isPaid) {
                    const payDate = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
                    // Create Receipt
                    const receipt = await prisma.receipt.create({
                        data: {
                            number: `REC-${code}-${d}`,
                            customerId: client.id,
                            receiptDate: payDate,
                            method: ReceiptMethod.BANK_TRANSFER,
                            status: ReceiptStatus.CONFIRMED,
                            amount: amount,
                            reference: `TRF-${Math.floor(Math.random() * 1000000)}`
                        }
                    });

                    runningBalance = runningBalance.sub(amount);

                    // AR Entry for Payment
                    await prisma.accountsReceivableEntry.create({
                        data: {
                            customerId: client.id,
                            receiptId: receipt.id,
                            entryType: AccountsReceivableEntryType.PAYMENT,
                            amount: amount.neg(),
                            balanceAfter: runningBalance,
                            occurredAt: payDate,
                            notes: `Pago recibido ${receipt.number}`
                        }
                    });

                    // Link receipt to invoice
                    await prisma.receiptApplication.create({
                        data: {
                            receiptId: receipt.id,
                            invoiceId: invoice.id,
                            appliedAmount: amount
                        }
                    });
                }
            }

            // Update final balance in profile
            await prisma.customerCreditProfile.update({
                where: { customerId: client.id },
                data: { currentBalance: runningBalance }
            });
        }
    }

    console.log('--- Seeding Finished Successfully ---');
    await app.close();
}

seed().catch(err => {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
});
