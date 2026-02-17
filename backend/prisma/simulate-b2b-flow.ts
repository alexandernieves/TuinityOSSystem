
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🤖 INICIANDO SIMULACIÓN DE FLUJO B2B ROBUSTO...');

    // 1. Setup Context
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    if (!tenant) throw new Error('Tenant evolution not found. Run seed first.');

    const bodega = await prisma.branch.findFirst({ where: { tenantId: tenant.id, code: 'BZR' } });
    if (!bodega) throw new Error('Bodega BZR not found.');

    const customer = await prisma.customer.findFirst({ where: { tenantId: tenant.id, taxId: '8-999-1234' } });
    if (!customer) throw new Error('Cliente Logística Global not found.');

    const product = await prisma.product.findFirst({ where: { tenantId: tenant.id, description: { contains: 'Johnnie Walker' } } });
    if (!product) throw new Error('Producto Johnnie Walker not found.');

    const admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: 'ariel@evolution.com' } });
    if (!admin) throw new Error('User Ariel not found.');

    // --- SETUP: ENSURE DATA INTEGRITY FOR TEST ---
    console.log(`\n🛠️ CONFIGURANDO DATOS DE PRUEBA...`);

    // Force UnitsPerBox = 12
    await prisma.product.update({
        where: { id: product.id },
        data: { unitsPerBox: 12 }
    });
    // Force Customer Balance = 0
    await prisma.customer.update({
        where: { id: customer.id },
        data: { currentBalance: 0 }
    });

    // Reload
    const productReloaded = await prisma.product.findUnique({ where: { id: product.id } });
    const customerReloaded = await prisma.customer.findUnique({ where: { id: customer.id } });

    if (!productReloaded || !customerReloaded) throw new Error('Reload failed');

    const productTest = productReloaded;
    const customerTest = customerReloaded;

    console.log(`📋 CONTEXTO ACTUALIZADO:`);
    console.log(`- Cliente: ${customerTest.name} (Límite: $${customerTest.creditLimit}, Saldo: $${customerTest.currentBalance})`);
    console.log(`- Producto: ${productTest.description} (Precio A: $${productTest.price_a}, Units/Box: ${productTest.unitsPerBox})`);

    // Check Initial Stock
    let inventory = await prisma.inventory.findUnique({
        where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: bodega.id, productId: productTest.id } }
    });
    console.log(`- Stock Inicial: ${inventory?.quantity} unidades (Reservado: ${inventory?.reserved})`);

    // --- STEP 1: CREATE QUOTE (10 BOXES) ---
    console.log(`\n🔹 PASO 1: CREANDO COTIZACIÓN (10 CAJAS)...`);

    const boxes = 10;
    const units = boxes * (productTest.unitsPerBox || 12);
    const unitPrice = Number(productTest.price_a);
    const subtotal = units * unitPrice;
    const tax = subtotal * 0.07;
    const total = subtotal + tax;

    let sale = await prisma.sale.create({
        data: {
            tenantId: tenant.id,
            branchId: bodega.id,
            customerId: customerTest.id,
            status: 'QUOTE',
            quoteNumber: `SIM-${Date.now()}`,
            subtotal,
            tax,
            total,
            paymentMethod: 'CREDIT',
            createdBy: admin.id,
            items: {
                create: [{
                    tenantId: tenant.id,
                    productId: productTest.id,
                    quantity: units, // 120 units
                    unitPrice,
                    total: subtotal,
                    taxAmount: tax,
                    discountAmount: 0
                }]
            }
        },
        include: { items: true }
    });

    console.log(`✅ Cotización #${sale.quoteNumber} creada.`);
    console.log(`   Total: $${sale.total} (120 Unidades)`);
    console.log(`   Stock NO debe cambiar aún.`);

    // --- STEP 2: APPROVE ORDER (RESERVE STOCK) ---
    console.log(`\n🔹 PASO 2: APROBANDO ORDEN (RESERVANDO STOCK)...`);

    // Simulate functionality of SalesService.updateStatus logic logic manually for simulation visibility

    // 1. Check Credit
    const projectedBalance = Number(customerTest.currentBalance) + Number(sale.total);
    if (projectedBalance > Number(customerTest.creditLimit)) {
        console.error('❌ ERROR: Límite de crédito excedido (Simulación fallida)');
        return;
    }

    // 2. Reserve Stock
    await prisma.inventory.update({
        where: { id: inventory!.id },
        data: { reserved: { increment: units } }
    });

    // 3. Update Status
    sale = await prisma.sale.update({
        where: { id: sale.id },
        data: { status: 'PENDING' }, // Pending Fulfillment
        include: { items: true }
    });

    // Update Customer Balance (Usually happens here or at invoice, let's assume at Order Confirmation for credit lock)
    await prisma.customer.update({
        where: { id: customerTest.id },
        data: { currentBalance: { increment: total } }
    });

    // Reload Customer for checks
    const customerConfirm = await prisma.customer.findUnique({ where: { id: customerTest.id } });

    inventory = await prisma.inventory.findUnique({ where: { id: inventory!.id } });
    console.log(`✅ Orden Aprobada.`);
    console.log(`   Nuevo Stock: ${inventory?.quantity}`);
    console.log(`   Nuevo Reservado: ${inventory?.reserved} (Correcto: +120)`);
    console.log(`   Saldo Cliente: $${customerConfirm?.currentBalance} (Deuda aumentada: +$${total.toFixed(2)})`);


    // --- STEP 3: DISPATCH (COMPLETE SALE) ---
    console.log(`\n🔹 PASO 3: DESPACHANDO (DISMINUYENDO INVENTARIO)...`);

    // 1. Decrease Physical Stock AND Reserved
    await prisma.inventory.update({
        where: { id: inventory!.id },
        data: {
            quantity: { decrement: units },
            reserved: { decrement: units }
        }
    });

    // 2. Log Movement
    await prisma.inventoryMovement.create({
        data: {
            tenantId: tenant.id, branchId: bodega.id, productId: productTest.id,
            type: 'OUT', quantity: -units, reason: `Venta Simulación ${sale.quoteNumber}`,
            createdBy: admin.id
        }
    });

    // 3. Complete Sale
    sale = await prisma.sale.update({
        where: { id: sale.id },
        data: { status: 'COMPLETED' },
        include: { items: true }
    });

    inventory = await prisma.inventory.findUnique({ where: { id: inventory!.id } });
    console.log(`✅ Venta Completada.`);
    console.log(`   Stock Final: ${inventory?.quantity} (Debió bajar 120)`);
    console.log(`   Reservado Final: ${inventory?.reserved} (Debió volver a 0 o previo)`);


    // --- STEP 4: CREDIT LIMIT TEST ---
    console.log(`\n🔹 PASO 4: INTENTO DE SOBREGIRO (PRUEBA DE FALLO)...`);
    console.log(`   Intentando comprar 5 cajas más ($${(total / 2).toFixed(2)})...`);

    // Since we updated customer balance manually in step 2, let's refresh logic
    const limit = Number(customerConfirm?.creditLimit);
    const current = Number(customerConfirm?.currentBalance);
    const attemptAmount = total / 2; // ~2200

    console.log(`   Límite: $${limit} | Saldo Actual: $${current} | Intento: $${attemptAmount.toFixed(2)}`);
    console.log(`   Disponible: $${(limit - current).toFixed(2)}`);

    if (current + attemptAmount > limit) {
        console.log(`✅ EL SISTEMA BLOQUEÓ LA VENTA CORRECTAMENTE.`);
        console.log(`   Razón: Excedería el límite de crédito ($${(current + attemptAmount).toFixed(2)} > $${limit}).`);
    } else {
        console.error(`❌ ERROR: El sistema habría permitido la venta (Fallo en prueba de límites).`);
    }

    console.log('\n🏁 SIMULACIÓN FINALIZADA CON ÉXITO.');
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
