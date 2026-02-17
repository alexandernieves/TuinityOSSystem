require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no encontrada en el entorno.');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚀 Reiniciando con Roles y Permisos en DB...');

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'evolution' } });
    const passwordHash = await bcrypt.hash('Evolution2026!', 10);

    // 1. PERMISOS
    const permKeys = [
        'MANAGE_TENANT', 'MANAGE_USERS', 'VIEW_COSTS', 'EDIT_PRODUCTS',
        'DELETE_PRODUCTS', 'BULK_EDIT_PRICES', 'VIEW_PRICES', 'CREATE_SALE',
        'VIEW_SALES', 'EDIT_SALES', 'APPROVE_SALES', 'VOID_SALES',
        'MANAGE_CLIENTS', 'VIEW_INVENTORY', 'ADJUST_INVENTORY', 'VIEW_BRANCHES',
        'MANAGE_BRANCHES', 'MANAGE_POS', 'MANAGE_CASH_REGISTERS'
    ];
    const permMap = {};
    for (const key of permKeys) {
        permMap[key] = await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
    }

    // 2. ROLES
    const rolesData = [
        { name: 'OWNER', perms: permKeys },
        { name: 'SALES', perms: ['CREATE_SALE', 'VIEW_SALES', 'EDIT_SALES', 'MANAGE_CLIENTS', 'VIEW_INVENTORY', 'MANAGE_POS', 'VIEW_PRICES'] },
        { name: 'WAREHOUSE', perms: ['VIEW_INVENTORY', 'ADJUST_INVENTORY', 'VIEW_COSTS', 'VIEW_BRANCHES', 'EDIT_PRODUCTS'] },
    ];

    for (const rd of rolesData) {
        const role = await prisma.role.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name: rd.name } },
            update: {},
            create: { tenantId: tenant.id, name: rd.name }
        });

        // Assign permissions to role
        for (const pk of rd.perms) {
            const permissionId = permMap[pk].id;
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: role.id, permissionId } },
                update: {},
                create: { roleId: role.id, permissionId }
            });
        }
        rd.dbId = role.id;
    }

    // 3. ACTUALIZAR USUARIOS Y LINK ROLES
    const users = await prisma.user.findMany({ where: { tenantId: tenant.id } });
    for (const u of users) {
        const roleName = u.role; // OWNER, SALES, WAREHOUSE
        const targetRole = rolesData.find(r => r.name === roleName);
        if (targetRole) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: u.id, roleId: targetRole.dbId } },
                update: {},
                create: { userId: u.id, roleId: targetRole.dbId }
            });
        }
    }

    console.log('✅ Roles y Permisos vinculados correctamente.');
}

main().catch(e => console.error(e)).finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
