const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const permissions = [
        // General
        'MANAGE_TENANT', 'MANAGE_USERS',
        // Products
        'VIEW_COSTS', 'EDIT_PRODUCTS', 'DELETE_PRODUCTS', 'BULK_EDIT_PRICES',
        // Sales
        'CREATE_SALE', 'VIEW_SALES', 'EDIT_SALES', 'APPROVE_SALES', 'VOID_SALES', 'MANAGE_CLIENTS',
        // Inventory
        'VIEW_INVENTORY', 'ADJUST_INVENTORY', 'MANAGE_BRANCHES',
        // Traffic
        'MANAGE_TRAFFIC', 'VIEW_TRAFFIC'
    ];

    console.log('Seeding permissions...');

    for (const key of permissions) {
        await prisma.permission.upsert({
            where: { key },
            update: {},
            create: { key },
        });
    }

    console.log(`Permissions seeded: ${permissions.length}`);

    // Update OWNER roles for all tenants to have ALL permissions
    const tenants = await prisma.tenant.findMany();
    for (const tenant of tenants) {
        const ownerRole = await prisma.role.findFirst({
            where: { tenantId: tenant.id, name: 'OWNER' }
        });

        if (ownerRole) {
            const allPermissions = await prisma.permission.findMany();
            for (const perm of allPermissions) {
                await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: {
                            roleId: ownerRole.id,
                            permissionId: perm.id
                        }
                    },
                    update: {},
                    create: {
                        roleId: ownerRole.id,
                        permissionId: perm.id
                    }
                });
            }
            console.log(`Linked all permissions to OWNER role for tenant: ${tenant.name}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
