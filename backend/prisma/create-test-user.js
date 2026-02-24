require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    const tenantSlug = 'test-company';
    const email = 'admin@test.com';
    const password = 'admin123';

    console.log('Creating test tenant and user...');

    // 1. Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: tenantSlug },
        update: {},
        create: {
            name: 'Test Company',
            slug: tenantSlug,
        },
    });

    // 2. Create Branch
    const branch = await prisma.branch.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'MAIN' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Main Branch',
            code: 'MAIN',
        },
    });

    // 3. Create Roles
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

    const ownerRole = await prisma.role.findFirst({
        where: { tenantId: tenant.id, name: 'OWNER' }
    });

    // 4. Create User
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email } },
        update: { passwordHash },
        create: {
            tenantId: tenant.id,
            email,
            name: 'Admin User',
            passwordHash,
            role: 'OWNER',
        },
    });

    // 5. Link User to Role
    if (ownerRole) {
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: ownerRole.id } },
            update: {},
            create: {
                userId: user.id,
                roleId: ownerRole.id,
            },
        });
    }

    console.log('✅ Test user created successfully!');
    console.log(`Tenant Slug: ${tenantSlug}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
