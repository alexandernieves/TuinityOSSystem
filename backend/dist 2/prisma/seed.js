"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run prisma seed');
}
const prisma = new PrismaClient({});
async function main() {
    const permissionKeys = [
        'MANAGE_TENANT',
        'MANAGE_USERS',
        'VIEW_COSTS',
        'EDIT_PRODUCTS',
        'DELETE_PRODUCTS',
        'BULK_EDIT_PRICES',
        'CREATE_SALE',
        'VIEW_SALES',
        'EDIT_SALES',
        'APPROVE_SALES',
        'VOID_SALES',
        'MANAGE_CLIENTS',
        'VIEW_INVENTORY',
        'ADJUST_INVENTORY',
        'MANAGE_BRANCHES',
        'MANAGE_TRAFFIC',
        'VIEW_TRAFFIC',
    ];
    await prisma.permission.createMany({
        data: permissionKeys.map((key) => ({ key })),
        skipDuplicates: true,
    });
    const tenantSlug = 'test-company';
    const email = 'admin@test.com';
    const password = 'admin123';
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    const tenant = await prisma.tenant.upsert({
        where: { slug: tenantSlug },
        update: {},
        create: {
            name: 'Test Company',
            slug: tenantSlug,
        },
    });
    await prisma.branch.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'MAIN' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Main Branch',
            code: 'MAIN',
        },
    });
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
    console.log('✅ Seed complete with test user: admin@test.com / admin123 (Tenant: test-company)');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
});
//# sourceMappingURL=seed.js.map