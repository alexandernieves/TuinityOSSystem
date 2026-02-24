const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

async function main() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://dynamo:dynamo@localhost:5433/dynamo?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const tenantSlug = 'evolution';
    const email = 'admin@evolution.com';
    const password = 'admin123';

    console.log(`Setting up tenant: ${tenantSlug}`);

    // 1. Ensure Tenant
    let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: { name: 'Evolution', slug: tenantSlug, status: 'ACTIVE' }
        });
    }

    // 2. Ensure Branch
    let branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
    if (!branch) {
        branch = await prisma.branch.create({
            data: { name: 'Principal', code: 'MAIN', tenantId: tenant.id }
        });
    }

    // 3. Ensure OWNER Role
    let role = await prisma.role.findUnique({
        where: { tenantId_name: { tenantId: tenant.id, name: 'OWNER' } }
    });
    if (!role) {
        role = await prisma.role.create({
            data: { tenantId: tenant.id, name: 'OWNER' }
        });
    }

    // 4. Ensure Permissions (minimal for owner)
    const permissions = [
        'MANAGE_TENANT', 'MANAGE_USERS', 'VIEW_COSTS', 'EDIT_PRODUCTS',
        'DELETE_PRODUCTS', 'BULK_EDIT_PRICES', 'VIEW_PRICES', 'CREATE_SALE',
        'VIEW_SALES', 'VIEW_INVENTORY', 'ADJUST_INVENTORY'
    ];

    await prisma.permission.createMany({
        data: permissions.map(key => ({ key })),
        skipDuplicates: true
    });

    const allPerms = await prisma.permission.findMany({
        where: { key: { in: permissions } }
    });

    await prisma.rolePermission.createMany({
        data: allPerms.map(p => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true
    });

    // 5. Ensure User
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email } },
        update: { passwordHash, role: 'OWNER' },
        create: {
            tenantId: tenant.id,
            email,
            name: 'Admin Evolution',
            passwordHash,
            role: 'OWNER'
        }
    });

    // 6. Link User to Role
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id }
    });

    console.log(`Setup complete for ${email}`);
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
