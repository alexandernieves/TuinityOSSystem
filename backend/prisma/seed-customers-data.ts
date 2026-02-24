import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🤖 INICIANDO SEED DE MÓDULO DE CLIENTES...');

    // Try to find the evolution tenant or create it
    let tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    if (!tenant) {
        console.log('➕ Creando Tenant evolution...');
        tenant = await prisma.tenant.create({
            data: {
                name: 'Evolution Corp',
                slug: 'evolution',
            }
        });
    }

    // Ensure roles exist for the tenant
    const roles = ['OWNER', 'ADMIN', 'SALES', 'WAREHOUSE', 'TRAFFIC', 'CLIENT', 'MEMBER'];
    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
            update: {},
            create: {
                tenantId: tenant.id,
                name: roleName,
            },
        });
    }

    let admin = await prisma.user.findFirst({ where: { tenantId: tenant.id } });
    if (!admin) {
        console.log('➕ Creando Usuario Admin...');
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('password123', 12);
        admin = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: 'admin@evolution.com',
                name: 'Admin Evolution',
                passwordHash,
                role: 'OWNER'
            }
        });
    }

    // Ensure a branch exists
    let branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
    if (!branch) {
        console.log('➕ Creando Sucursal Principal...');
        branch = await prisma.branch.create({
            data: {
                tenantId: tenant.id,
                name: 'Sucursal Principal',
                code: 'MAIN',
            }
        });
    }

    // 1. ÁREAS
    console.log('\n📦 Creando Áreas...');
    let area1 = await prisma.customerArea.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'ZN-01' } },
        update: {},
        create: { tenantId: tenant.id, code: 'ZN-01', name: 'Zona Norte', description: 'Región norte del país' }
    });
    let area2 = await prisma.customerArea.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'ZS-02' } },
        update: {},
        create: { tenantId: tenant.id, code: 'ZS-02', name: 'Zona Sur', description: 'Región sur del país' }
    });
    console.log('✅ Áreas creadas.');

    // 2. SUB-ÁREAS
    console.log('\n📦 Creando Sub-Áreas...');
    let subArea1 = await prisma.customerSubArea.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'SN-01' } },
        update: {},
        create: { tenantId: tenant.id, areaId: area1.id, code: 'SN-01', name: 'Miranda Norte' }
    });
    console.log('✅ Sub-Áreas creadas.');

    // 3. VENDEDORES
    console.log('\n👔 Creando Vendedores...');
    let vendor1 = await prisma.salesperson.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'V01' } },
        update: {},
        create: {
            tenantId: tenant.id, code: 'V01', name: 'Carlos García',
            email: 'carlos@vendedor.com', phone: '+58-412-5551234',
            areaId: area1.id, subAreaId: subArea1.id, commissionRate: 5.0
        }
    });
    console.log('✅ Vendedores creados.');

    // 4. CLIENTES
    console.log('\n👥 Creando Clientes Contado y Crédito...');
    const clientsData = [
        {
            name: 'Juan Pérez', taxId: 'V-12345678', customerType: 'CASH',
            phone: '+58-424-9876543', address: 'Av. Principal',
            creditLimit: 0, paymentTermDays: 0, priceLevel: 'A',
            createdBy: admin.id, balance: 0
        },
        {
            name: 'Distribuidora Norte C.A.', taxId: 'J-12345678-9', customerType: 'CREDIT',
            phone: '+58-412-1234567', email: 'norte@distribuidora.com', address: 'Av. Bolivar, Local 5, Caracas',
            creditLimit: 5000, paymentTermDays: 30, priceLevel: 'B',
            createdBy: admin.id, balance: 2500
        },
        {
            name: 'Inversiones Sur C.A.', taxId: 'J-98765432-1', customerType: 'CREDIT',
            phone: '+58-414-7654321', email: 'sur@inversiones.com', address: 'Zona Industrial Sur',
            creditLimit: 10000, paymentTermDays: 60, priceLevel: 'C',
            createdBy: admin.id, balance: 8500
        },
        {
            name: 'Comercializadora Central', taxId: 'J-55555555-5', customerType: 'CREDIT',
            phone: '+58-416-5555555', email: 'central@comercial.com', address: 'Centro Empresarial',
            creditLimit: 2000, paymentTermDays: 15, priceLevel: 'A',
            createdBy: admin.id, balance: 1950 // Near limit
        }
    ];

    const customerIds: any = {};
    for (const data of clientsData) {
        let customer = await prisma.customer.findFirst({
            where: { tenantId: tenant.id, taxId: data.taxId }
        });
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    tenantId: tenant.id,
                    name: data.name,
                    taxId: data.taxId,
                    customerType: data.customerType as any,
                    phone: data.phone,
                    email: data.email,
                    address: data.address,
                    creditLimit: data.creditLimit,
                    paymentTermDays: data.paymentTermDays,
                    priceLevel: data.priceLevel as any,
                    createdBy: data.createdBy,
                    currentBalance: data.balance,
                }
            });
        }
        customerIds[customer.taxId as string] = customer;
    }
    console.log('✅ Clientes creados.');

    // 5. TRANSACCIONES (Facturas, Abonos, para ver el Aging Report)
    console.log('\n💸 Creando Transacciones (CxC y Morosidad)...');

    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Skip creating transactions if they already exist to avoid bloating
    const txCount = await prisma.customerTransaction.count({ where: { tenantId: tenant.id } });
    if (txCount === 0) {
        // Distribuidora Norte (J-12345678-9) -> Balance: 2500, Corriente
        const cNorte = customerIds['J-12345678-9'];
        if (cNorte) {
            await prisma.customerTransaction.create({
                data: {
                    tenantId: tenant.id,
                    customerId: cNorte.id,
                    branchId: branch.id,
                    type: 'INVOICE',
                    transactionNumber: 'INV-001001',
                    description: 'Factura de Mercancía Varia',
                    amount: 3000,
                    balance: 3000,
                    transactionDate: daysAgo(10), // 10 days ago
                    dueDate: daysAgo(10 - 30), // due in 20 days (Corriente)
                    createdBy: admin.id
                }
            });
            await prisma.customerTransaction.create({
                data: {
                    tenantId: tenant.id,
                    customerId: cNorte.id,
                    branchId: branch.id,
                    type: 'PAYMENT',
                    transactionNumber: 'PAY-001002',
                    description: 'Abono Parcial Zelle',
                    amount: 500,
                    balance: 2500,
                    transactionDate: daysAgo(2),
                    createdBy: admin.id
                }
            });
        }

        // Inversiones Sur (J-98765432-1) -> Balance: 8500, Overdue (Morosidad Alta)
        const cSur = customerIds['J-98765432-1'];
        if (cSur) {
            await prisma.customerTransaction.create({
                data: {
                    tenantId: tenant.id,
                    customerId: cSur.id,
                    branchId: branch.id,
                    type: 'INVOICE',
                    transactionNumber: 'INV-001003',
                    description: 'Lote de Equipos',
                    amount: 8500,
                    balance: 8500,
                    transactionDate: daysAgo(100), // 100 days ago
                    dueDate: daysAgo(100 - 60), // due 40 days ago (31-60 days segment)
                    createdBy: admin.id
                }
            });
        }

        // Comercializadora Central -> Balance: 1950, Almost at credit limit (2000)
        const cCentral = customerIds['J-55555555-5'];
        if (cCentral) {
            await prisma.customerTransaction.create({
                data: {
                    tenantId: tenant.id,
                    customerId: cCentral.id,
                    branchId: branch.id,
                    type: 'INVOICE',
                    transactionNumber: 'INV-001004',
                    description: 'Suministros Básicos',
                    amount: 1950,
                    balance: 1950,
                    transactionDate: daysAgo(20), // 20 days ago
                    dueDate: daysAgo(20 - 15), // due 5 days ago (1-30 days segment)
                    createdBy: admin.id
                }
            });
        }
    }

    console.log('✅ Transacciones creadas.');
    console.log('\n🏁 SEED DE CLIENTES FINALIZADO CON ÉXITO.');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
