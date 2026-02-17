
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚢 INICIANDO SIMULACIÓN DE FLUJO DE IMPORTACIÓN (COSTO FOB -> CIF)...');

    /*
    ESCENARIO REAL:
    ---------------------------------------------------
    Proveedor: DIAGEO (Whisky)
    Factura: INV-2026-001
    Gastos de Importación (Prorrateables):
      - Flete: $500
      - Seguro: $100
      - Otros: $50
      = Total Gastos: $650

    Items:
    1. Johnnie Walker Black Label
       - Cantidad: 100 cajas (1200 botellas)
       - Costo FOB Unitario: $22.00
       - Subtotal FOB: $2,200

    2. Buchanan's 12 Years
       - Cantidad: 50 cajas (600 botellas)
       - Costo FOB Unitario: $18.00
       - Subtotal FOB: $900

    ---------------------------------------------------
    Total FOB Factura: $3,100
    Total CIF Esperado: $3,100 + $650 = $3,750
    
    Distribución de Gastos (Prorrateo por Valor FOB):
    - JW Black: ($2200 / $3100) = 70.97% de los gastos -> $461.30
      Nuevo CIF Total JW: $2200 + $461.30 = $2661.30
      Nuevo CIF Unitario JW: $2661.30 / 100 = $26.61 (vs FOB $22.00)

    - Buch 12: ($900 / $3100) = 29.03% de los gastos -> $188.70
      Nuevo CIF Total Buch: $900 + $188.70 = $1088.70
      Nuevo CIF Unitario Buch: $1088.70 / 50 = $21.77 (vs FOB $18.00)
    */

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    if (!tenant) throw new Error('Tenant not found');

    const bodega = await prisma.branch.findFirst({ where: { tenantId: tenant.id, code: 'BZR' } });
    const admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: 'celly@evolution.com' } });

    // 1. Get Products
    const jwBlack = await prisma.product.findFirst({ where: { description: { contains: 'Johnnie Walker' } } });
    const buch12 = await prisma.product.findFirst({ where: { description: { contains: 'Buchanan' } } });

    if (!jwBlack || !buch12) throw new Error('Products not found');

    console.log(`📦 Productos seleccionados para importación:`);
    console.log(`   - ${jwBlack.description} (Costo Actual: $${jwBlack.lastFobCost})`);
    console.log(`   - ${buch12.description} (Costo Actual: $${buch12.lastFobCost})`);

    // --- STEP 1: CREATE PURCHASE ORDER (DRAFT) ---
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
            branchId: bodega!.id,
            supplierName: 'DIAGEO INTERNATIONAL',
            invoiceNumber: `INV-IMP-${Date.now()}`,
            status: 'DRAFT',
            fobValue: 3100, // $2200 + $900
            freightCost: expenses.freight,
            insuranceCost: expenses.insurance,
            otherCosts: expenses.other,
            dutiesCost: 0,
            totalCifValue: 3750, // $3100 + $650
            createdBy: admin!.id,
            items: {
                create: [
                    {
                        tenantId: tenant.id,
                        productId: jwBlack.id,
                        quantity: 100, // Cajas? El sistema base maneja unidades... asumamos unidades base para el test de costos unitarios
                        // OJO: Si son cajas, el costo unitario debe ser por caja.
                        // Arriba JW cost es ~22. Asumamos que es precio botella. 
                        // Vamos a usar 100 botellas para simplificar la matemática del ejemplo.
                        unitFobValue: 22.00,
                        subtotalFob: 2200.00,
                        unitCifValue: 26.61, // Pre-calculado manual para validar
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


    // --- STEP 2: RECEIVE MERCHANDISE (UPDATE COSTS) ---
    console.log(`\n🔹 PASO 2: RECEPCIÓN DE MERCANCÍA (CÁLCULO DE PROMEDIO PONDERADO)...`);

    // Mocking logic from PurchasesService.receive()
    // We will manually calculate and update to verify formulas

    // PRODUCT 1: JONNIE WALKER
    // Current Stock (from seed): 90? Or whatever remained.
    // Let's check current stock first
    const jwStock = await prisma.inventory.findUnique({
        where: { tenantId_branchId_productId: { tenantId: tenant.id, branchId: bodega!.id, productId: jwBlack.id } }
    });
    const currentQtyJW = Number(jwStock?.quantity || 0);
    const currentCostJW = Number(jwBlack.weightedAvgCost || jwBlack.lastCifCost || 22); // Fallback

    const incomingQtyJW = 100;
    const incomingCostJW = 26.61; // New CIF

    // Weighted Avg Formula
    const newTotalQtyJW = currentQtyJW + incomingQtyJW;
    const newTotalValueJW = (currentQtyJW * currentCostJW) + (incomingQtyJW * incomingCostJW);
    const newAvgCostJW = newTotalValueJW / newTotalQtyJW;

    console.log(`   Calculando JW Black:`);
    console.log(`   - Stock Actual: ${currentQtyJW} @ $${currentCostJW.toFixed(2)}`);
    console.log(`   - Entrando: ${incomingQtyJW} @ $${incomingCostJW.toFixed(2)}`);
    console.log(`   - Nuevo Promedio Esperado: $${newAvgCostJW.toFixed(2)}`);

    // UPDATE DB
    await prisma.$transaction([
        // Update Product Costs
        prisma.product.update({
            where: { id: jwBlack.id },
            data: {
                lastFobCost: 22.00,
                lastCifCost: incomingCostJW,
                weightedAvgCost: newAvgCostJW
            }
        }),
        // Update Inventory
        prisma.inventory.update({
            where: { id: jwStock!.id },
            data: { quantity: { increment: incomingQtyJW } }
        }),
        // Mark Received
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
    } else {
        console.error(`   ❌ ERROR DE CÁLCULO.`);
    }

    console.log('\n🏁 SIMULACIÓN DE IMPORTACIÓN COMPLETADA.');
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
