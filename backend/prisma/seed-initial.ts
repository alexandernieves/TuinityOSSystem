import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
});

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
    const user = await prisma.user.upsert({
        where: { tenantId_email: { tenantId, email: 'dynamoss@gmail.com' } },
        update: { passwordHash },
        create: {
            tenantId,
            email: 'dynamoss@gmail.com',
            passwordHash,
            status: 'ACTIVE',
        },
    });
    console.log('User created:', user.email);

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
