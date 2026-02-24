require('dotenv/config');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['info', 'warn', 'error'] });

async function main() {
    const tenantId = 'tenant-001';
    const branchId = 'branch-001';

    console.log('Seeding initial data...');

    // Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'Dynamo Solutions',
            slug: 'dynamo',
            status: 'ACTIVE',
        },
    });
    console.log('Tenant created:', tenant.name);

    // Create Branch
    const branch = await prisma.branch.upsert({
        where: { id: branchId },
        update: {},
        create: {
            id: branchId,
            tenantId: tenantId,
            name: 'Main Branch',
            code: 'MAIN',
        },
    });
    console.log('Branch created:', branch.name);

    // Create User
    const passwordHash = await bcrypt.hash('Dynamoss1234?', 10);

    // Create default CLIENT user (dynamoss)
    const clientUser = await prisma.user.upsert({
        where: { tenantId_email: { tenantId, email: 'dynamoss@gmail.com' } },
        update: { passwordHash, role: 'CLIENT', name: 'Usuario Dynamoss' },
        create: {
            tenantId,
            email: 'dynamoss@gmail.com',
            name: 'Usuario Dynamoss',
            passwordHash,
            status: 'ACTIVE',
            role: 'CLIENT',
        },
    });
    console.log('User created:', clientUser.email, 'Role:', clientUser.role);

    // Create OWNER user (qwerty)
    const ownerUser = await prisma.user.upsert({
        where: { tenantId_email: { tenantId, email: 'qwerty@gmail.com' } },
        update: { passwordHash, role: 'OWNER', name: 'Administrador Qwerty' },
        create: {
            tenantId,
            email: 'qwerty@gmail.com',
            name: 'Administrador Qwerty',
            passwordHash,
            status: 'ACTIVE',
            role: 'OWNER',
        },
    });
    console.log('User created:', ownerUser.email, 'Role:', ownerUser.role);

    console.log('Initial seed completed');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
