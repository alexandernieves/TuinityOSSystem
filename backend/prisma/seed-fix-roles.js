require('dotenv/config');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['info', 'warn', 'error'] });

const PLATFORM_ROLES = [
    { name: 'OWNER', description: 'Dueño / Gerente - Acceso total al sistema' },
    { name: 'ADMIN', description: 'Administrador - Gestión completa excepto configuración crítica' },
    { name: 'SALES', description: 'Vendedores - Acceso a ventas y clientes (sin ver costos)' },
    { name: 'WAREHOUSE', description: 'Bodega / Almacén - Gestión de inventario y compras (sin ver precios)' },
    { name: 'TRAFFIC', description: 'Tráfico / Logística - Gestión de despachos y documentos' },
    { name: 'CLIENT', description: 'Cliente B2B - Acceso limitado para clientes' },
    { name: 'MEMBER', description: 'Miembro General - Acceso básico de lectura' },
];

async function main() {
    console.log('🔧 Limpiando y actualizando sistema de roles...\n');

    // 1. Obtener todos los tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`📋 Encontrados ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
        console.log(`\n🏢 Procesando tenant: ${tenant.name} (${tenant.slug})`);

        // 2. Eliminar todos los roles antiguos de este tenant
        const deletedUserRoles = await prisma.userRole.deleteMany({
            where: {
                role: {
                    tenantId: tenant.id
                }
            }
        });
        console.log(`   ✓ Eliminadas ${deletedUserRoles.count} asignaciones de roles antiguas`);

        const deletedRolePermissions = await prisma.rolePermission.deleteMany({
            where: {
                role: {
                    tenantId: tenant.id
                }
            }
        });
        console.log(`   ✓ Eliminados ${deletedRolePermissions.count} permisos de roles antiguos`);

        const deletedRoles = await prisma.role.deleteMany({
            where: {
                tenantId: tenant.id
            }
        });
        console.log(`   ✓ Eliminados ${deletedRoles.count} roles antiguos`);

        // 3. Crear los nuevos roles de la plataforma
        for (const roleData of PLATFORM_ROLES) {
            await prisma.role.create({
                data: {
                    tenantId: tenant.id,
                    name: roleData.name,
                }
            });
        }
        console.log(`   ✓ Creados ${PLATFORM_ROLES.length} roles de la plataforma`);

        // 4. Actualizar usuarios para que tengan roles válidos
        const users = await prisma.user.findMany({
            where: { tenantId: tenant.id }
        });

        for (const user of users) {
            // Si el usuario tiene un rol que no está en PLATFORM_ROLES, asignar CLIENT por defecto
            const validRoles = PLATFORM_ROLES.map(r => r.name);
            if (!validRoles.includes(user.role)) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: 'CLIENT' }
                });
                console.log(`   ⚠️  Usuario ${user.email} tenía rol inválido, actualizado a CLIENT`);
            }

            // Vincular el usuario con su rol en la tabla Role
            const roleRecord = await prisma.role.findFirst({
                where: {
                    tenantId: tenant.id,
                    name: user.role
                }
            });

            if (roleRecord) {
                await prisma.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: roleRecord.id
                    }
                });
            }
        }
        console.log(`   ✓ Vinculados ${users.length} usuarios con sus roles`);
    }

    console.log('\n✅ Sistema de roles actualizado correctamente\n');
    console.log('📋 Roles de la plataforma:');
    PLATFORM_ROLES.forEach(role => {
        console.log(`   • ${role.name}: ${role.description}`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
