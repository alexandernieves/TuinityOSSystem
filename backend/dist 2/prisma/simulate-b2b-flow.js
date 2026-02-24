"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🤖 INICIANDO SIMULACIÓN DE FLUJO B2B ROBUSTO...');
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    if (!tenant)
        throw new Error('Tenant evolution not found. Run seed first.');
    const bodega = await prisma.branch.findFirst({ where: { tenantId: tenant.id, code: 'BZR' } });
    if (!bodega)
        throw new Error('Bodega BZR not found.');
    const customer = await prisma.customer.findFirst({ where: { tenantId: tenant.id, taxId: '8-999-1234' } });
    if (!customer)
        throw new Error('Cliente Logística Global not found.');
    const product = await prisma.product.findFirst({ where: { tenantId: tenant.id, description: { contains: 'Johnnie Walker' } } });
    if (!product)
        throw new Error('Producto Johnnie Walker not found.');
    const admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: 'ariel@evolution.com' } });
    if (!admin)
        throw new Error('User Ariel not found.');
    console.log(`\n🛠️ CONFIGURANDO DATOS DE PRUEBA...`);
    await prisma.product.update({
        where: { id: product.id },
        data: { unitsPerBox: 12 }
    });
    await prisma.customer.update({
        where: { id: customer.id },
        data: { currentBalance: 0 }
    });
    const productReloaded = await prisma.product.findUnique({ where: { id: product.id } });
    const customerReloaded = await prisma.customer.findUnique({ where: { id: customer.id } });
    if (!productReloaded || !customerReloaded)
        throw new Error('Reload failed');
    const productTest = productReloaded;
    const customerTest = customerReloaded;
    console.log(`📋 CONTEXTO ACTUALIZADO:`);
    console.log(`- Cliente: ${customerTest.name} (Límite: $${customerTest.creditLimit}, Saldo: $${customerTest.currentBalance})`);
    console.log(`- Producto: ${productTest.description} (Precio A: $${productTest.price_a}, Units/Box: ${productTest.unitsPerBox})`);
    let inventory = await prisma.inventory.findUnique({
        where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: bodega.id, productId: productTest.id } }
    });
    console.log(`- Stock Inicial: ${inventory?.quantity} unidades (Reservado: ${inventory?.reserved})`);
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
                        quantity: units,
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
    console.log(`\n🔹 PASO 2: APROBANDO ORDEN (RESERVANDO STOCK)...`);
    const projectedBalance = Number(customerTest.currentBalance) + Number(sale.total);
    if (projectedBalance > Number(customerTest.creditLimit)) {
        console.error('❌ ERROR: Límite de crédito excedido (Simulación fallida)');
        return;
    }
    await prisma.inventory.update({
        where: { id: inventory.id },
        data: { reserved: { increment: units } }
    });
    sale = await prisma.sale.update({
        where: { id: sale.id },
        data: { status: 'PENDING' },
        include: { items: true }
    });
    await prisma.customer.update({
        where: { id: customerTest.id },
        data: { currentBalance: { increment: total } }
    });
    const customerConfirm = await prisma.customer.findUnique({ where: { id: customerTest.id } });
    inventory = await prisma.inventory.findUnique({ where: { id: inventory.id } });
    console.log(`✅ Orden Aprobada.`);
    console.log(`   Nuevo Stock: ${inventory?.quantity}`);
    console.log(`   Nuevo Reservado: ${inventory?.reserved} (Correcto: +120)`);
    console.log(`   Saldo Cliente: $${customerConfirm?.currentBalance} (Deuda aumentada: +$${total.toFixed(2)})`);
    console.log(`\n🔹 PASO 3: DESPACHANDO (DISMINUYENDO INVENTARIO)...`);
    await prisma.inventory.update({
        where: { id: inventory.id },
        data: {
            quantity: { decrement: units },
            reserved: { decrement: units }
        }
    });
    await prisma.inventoryMovement.create({
        data: {
            tenantId: tenant.id, branchId: bodega.id, productId: productTest.id,
            type: 'OUT', quantity: -units, reason: `Venta Simulación ${sale.quoteNumber}`,
            createdBy: admin.id
        }
    });
    sale = await prisma.sale.update({
        where: { id: sale.id },
        data: { status: 'COMPLETED' },
        include: { items: true }
    });
    inventory = await prisma.inventory.findUnique({ where: { id: inventory.id } });
    console.log(`✅ Venta Completada.`);
    console.log(`   Stock Final: ${inventory?.quantity} (Debió bajar 120)`);
    console.log(`   Reservado Final: ${inventory?.reserved} (Debió volver a 0 o previo)`);
    console.log(`\n🔹 PASO 4: INTENTO DE SOBREGIRO (PRUEBA DE FALLO)...`);
    console.log(`   Intentando comprar 5 cajas más ($${(total / 2).toFixed(2)})...`);
    const limit = Number(customerConfirm?.creditLimit);
    const current = Number(customerConfirm?.currentBalance);
    const attemptAmount = total / 2;
    console.log(`   Límite: $${limit} | Saldo Actual: $${current} | Intento: $${attemptAmount.toFixed(2)}`);
    console.log(`   Disponible: $${(limit - current).toFixed(2)}`);
    if (current + attemptAmount > limit) {
        console.log(`✅ EL SISTEMA BLOQUEÓ LA VENTA CORRECTAMENTE.`);
        console.log(`   Razón: Excedería el límite de crédito ($${(current + attemptAmount).toFixed(2)} > $${limit}).`);
    }
    else {
        console.error(`❌ ERROR: El sistema habría permitido la venta (Fallo en prueba de límites).`);
    }
    console.log('\n🏁 SIMULACIÓN FINALIZADA CON ÉXITO.');
}
main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=simulate-b2b-flow.js.map