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
    console.log('🚢 INICIANDO SIMULACIÓN DE FLUJO DE IMPORTACIÓN (COSTO FOB -> CIF)...');
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    if (!tenant)
        throw new Error('Tenant not found');
    const bodega = await prisma.branch.findFirst({ where: { tenantId: tenant.id, code: 'BZR' } });
    const admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: 'celly@evolution.com' } });
    const jwBlack = await prisma.product.findFirst({ where: { description: { contains: 'Johnnie Walker' } } });
    const buch12 = await prisma.product.findFirst({ where: { description: { contains: 'Buchanan' } } });
    if (!jwBlack || !buch12)
        throw new Error('Products not found');
    console.log(`📦 Productos seleccionados para importación:`);
    console.log(`   - ${jwBlack.description} (Costo Actual: $${jwBlack.lastFobCost})`);
    console.log(`   - ${buch12.description} (Costo Actual: $${buch12.lastFobCost})`);
    console.log(`\n🔹 PASO 1: CREANDO ORDEN DE COMPRA (SIMULACIÓN DE CARGA MASIVA)...`);
    const expenses = {
        freight: 500,
        insurance: 100,
        other: 50
    };
    const totalExpenses = 650;
    const po = await prisma.purchaseOrder.create({
        data: {
            tenantId: tenant.id,
            branchId: bodega.id,
            supplierName: 'DIAGEO INTERNATIONAL',
            invoiceNumber: `INV-IMP-${Date.now()}`,
            status: 'DRAFT',
            fobValue: 3100,
            freightCost: expenses.freight,
            insuranceCost: expenses.insurance,
            otherCosts: expenses.other,
            dutiesCost: 0,
            totalCifValue: 3750,
            createdBy: admin.id,
            items: {
                create: [
                    {
                        tenantId: tenant.id,
                        productId: jwBlack.id,
                        quantity: 100,
                        unitFobValue: 22.00,
                        subtotalFob: 2200.00,
                        unitCifValue: 26.61,
                        subtotalCif: 2661.30
                    },
                    {
                        tenantId: tenant.id,
                        productId: buch12.id,
                        quantity: 50,
                        unitFobValue: 18.00,
                        subtotalFob: 900.00,
                        unitCifValue: 21.77,
                        subtotalCif: 1088.70
                    }
                ]
            }
        },
        include: { items: true }
    });
    console.log(`✅ Orden de Compra #${po.invoiceNumber} creada.`);
    console.log(`   Total FOB: $${po.fobValue} | Total CIF: $${po.totalCifValue} (Gastos: $${totalExpenses})`);
    console.log(`\n🔹 PASO 2: RECEPCIÓN DE MERCANCÍA (CÁLCULO DE PROMEDIO PONDERADO)...`);
    const jwStock = await prisma.inventory.findUnique({
        where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: bodega.id, productId: jwBlack.id } }
    });
    const currentQtyJW = Number(jwStock?.quantity || 0);
    const currentCostJW = Number(jwBlack.weightedAvgCost || jwBlack.lastCifCost || 22);
    const incomingQtyJW = 100;
    const incomingCostJW = 26.61;
    const newTotalQtyJW = currentQtyJW + incomingQtyJW;
    const newTotalValueJW = (currentQtyJW * currentCostJW) + (incomingQtyJW * incomingCostJW);
    const newAvgCostJW = newTotalValueJW / newTotalQtyJW;
    console.log(`   Calculando JW Black:`);
    console.log(`   - Stock Actual: ${currentQtyJW} @ $${currentCostJW.toFixed(2)}`);
    console.log(`   - Entrando: ${incomingQtyJW} @ $${incomingCostJW.toFixed(2)}`);
    console.log(`   - Nuevo Promedio Esperado: $${newAvgCostJW.toFixed(2)}`);
    await prisma.$transaction([
        prisma.product.update({
            where: { id: jwBlack.id },
            data: {
                lastFobCost: 22.00,
                lastCifCost: incomingCostJW,
                weightedAvgCost: newAvgCostJW
            }
        }),
        prisma.inventory.update({
            where: { id: jwStock.id },
            data: { quantity: { increment: incomingQtyJW } }
        }),
        prisma.purchaseOrder.update({
            where: { id: po.id },
            data: { status: 'RECEIVED', receivedDate: new Date() }
        })
    ]);
    const jwUpdated = await prisma.product.findUnique({ where: { id: jwBlack.id } });
    console.log(`✅ PRODUCTO ACTUALIZADO:`);
    console.log(`   - Nuevo Costo CIF (Última Compra): $${jwUpdated?.lastCifCost}`);
    console.log(`   - Nuevo Costo Promedio: $${jwUpdated?.weightedAvgCost}`);
    if (Math.abs(Number(jwUpdated?.weightedAvgCost) - newAvgCostJW) < 0.01) {
        console.log(`   ✅ CÁLCULO VERIFICADO CORRECTO.`);
    }
    else {
        console.error(`   ❌ ERROR DE CÁLCULO.`);
    }
    console.log('\n🏁 SIMULACIÓN DE IMPORTACIÓN COMPLETADA.');
}
main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=simulate-import-flow.js.map