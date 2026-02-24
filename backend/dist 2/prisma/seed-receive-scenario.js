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
    console.log('📦 PREPARING RECEIVE SCENARIO...');
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    const bodega = await prisma.branch.findFirst({ where: { tenantId: tenant.id, code: 'BZR' } });
    const admin = await prisma.user.findFirst({ where: { tenantId: tenant.id } });
    const product = await prisma.product.findFirst({ where: { description: { contains: 'Johnnie Walker' } } });
    const po = await prisma.purchaseOrder.create({
        data: {
            tenantId: tenant.id,
            branchId: bodega.id,
            supplierName: 'DIAGEO TEST RECEIVE',
            invoiceNumber: `INV-REC-${Date.now()}`,
            status: 'DRAFT',
            fobValue: 2200,
            totalCifValue: 2600,
            createdBy: admin.id,
            items: {
                create: [
                    {
                        tenantId: tenant.id,
                        productId: product.id,
                        quantity: 100,
                        unitFobValue: 22.00,
                        unitCifValue: 26.00,
                        subtotalFob: 2200,
                        subtotalCif: 2600
                    }
                ]
            }
        }
    });
    console.log(`✅ Purchase Order Created: ${po.id}`);
    console.log(`   Invoice: ${po.invoiceNumber}`);
    console.log(`   URL: http://localhost:3000/dashboard/compras/${po.id}`);
}
main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-receive-scenario.js.map