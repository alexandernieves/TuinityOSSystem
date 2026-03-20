import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configurable owner email for development
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'owner@evolutionos.dev';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'admin123';

// Base roles for the ERP
const ROLES = [
  { name: 'owner', description: 'Dueño del sistema - acceso completo' },
  { name: 'gerencia', description: 'Gerencia - acceso administrativo' },
  { name: 'ventas_b2b', description: 'Ventas B2B - gestión de clientes y ventas' },
  { name: 'compras', description: 'Compras - gestión de proveedores y órdenes' },
  { name: 'bodega', description: 'Bodega - gestión de inventario' },
  { name: 'trafico', description: 'Tráfico - logística y envíos' },
  { name: 'contabilidad', description: 'Contabilidad - finanzas y reportes' },
  { name: 'pos', description: 'POS - punto de venta' },
];

// Base permissions by resource and action
const PERMISSIONS = [
  // Users permissions
  { resource: 'users', action: 'create', description: 'Crear usuarios' },
  { resource: 'users', action: 'read', description: 'Ver usuarios' },
  { resource: 'users', action: 'update', description: 'Actualizar usuarios' },
  { resource: 'users', action: 'delete', description: 'Eliminar usuarios' },
  
  // Roles permissions
  { resource: 'roles', action: 'create', description: 'Crear roles' },
  { resource: 'roles', action: 'read', description: 'Ver roles' },
  { resource: 'roles', action: 'update', description: 'Actualizar roles' },
  { resource: 'roles', action: 'delete', description: 'Eliminar roles' },
  
  // Permissions permissions
  { resource: 'permissions', action: 'create', description: 'Crear permisos' },
  { resource: 'permissions', action: 'read', description: 'Ver permisos' },
  { resource: 'permissions', action: 'update', description: 'Actualizar permisos' },
  { resource: 'permissions', action: 'delete', description: 'Eliminar permisos' },
  
  // Audit logs permissions
  { resource: 'audit_logs', action: 'read', description: 'Ver logs de auditoría' },
];

// Role permissions mapping
const ROLE_PERMISSIONS = {
  owner: ['*'], // Owner has all permissions
  gerencia: [
    'users:read', 'users:update',
    'roles:read', 'permissions:read',
    'audit_logs:read'
  ],
  ventas_b2b: ['users:read', 'users:create', 'users:update'],
  compras: ['users:read', 'users:create', 'users:update'],
  bodega: ['users:read'],
  trafico: ['users:read'],
  contabilidad: ['users:read', 'audit_logs:read'],
  pos: ['users:read'],
};

async function seed() {
  console.log('🌱 Starting security seed...');

  try {
    // Create roles
    console.log('📋 Creating roles...');
    const createdRoles = await Promise.all(
      ROLES.map(async (role) => {
        return await prisma.role.upsert({
          where: { name: role.name },
          update: { description: role.description },
          create: role,
        });
      })
    );

    // Create permissions
    console.log('🔐 Creating permissions...');
    const createdPermissions = await Promise.all(
      PERMISSIONS.map(async (permission) => {
        return await prisma.permission.upsert({
          where: { resource_action: { resource: permission.resource, action: permission.action } },
          update: { description: permission.description },
          create: permission,
        });
      })
    );

    // Create role permissions
    console.log('🔗 Creating role permissions...');
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = createdRoles.find(r => r.name === roleName);
      if (!role) continue;

      if (permissions.includes('*')) {
        // Owner gets all permissions
        await Promise.all(
          createdPermissions.map(async (permission) => {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
          })
        );
      } else {
        // Other roles get specific permissions
        await Promise.all(
          permissions.map(async (permKey) => {
            const [resource, action] = permKey.split(':');
            const permission = createdPermissions.find(p => p.resource === resource && p.action === action);
            if (permission) {
              await prisma.rolePermission.upsert({
                where: {
                  roleId_permissionId: {
                    roleId: role.id,
                    permissionId: permission.id,
                  },
                },
                update: {},
                create: {
                  roleId: role.id,
                  permissionId: permission.id,
                },
              });
            }
          })
        );
      }
    }

    // Create owner user
    console.log('👤 Creating owner user...');
    const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);
    
    const ownerUser = await prisma.user.upsert({
      where: { email: OWNER_EMAIL },
      update: {
        passwordHash: hashedPassword,
        name: 'System Owner',
        isActive: true,
      },
      create: {
        email: OWNER_EMAIL,
        passwordHash: hashedPassword,
        name: 'System Owner',
        isActive: true,
      },
    });

    // Assign owner role to owner user
    console.log('🔑 Assigning owner role...');
    const ownerRole = createdRoles.find(r => r.name === 'owner');
    if (ownerRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: ownerUser.id,
            roleId: ownerRole.id,
          },
        },
        update: {},
        create: {
          userId: ownerUser.id,
          roleId: ownerRole.id,
        },
      });
    }

    console.log('✅ Security seed completed successfully!');
    console.log(`📧 Owner user: ${OWNER_EMAIL}`);
    console.log(`🔑 Owner password: ${OWNER_PASSWORD}`);
    console.log(`👥 Created ${createdRoles.length} roles`);
    console.log(`🔐 Created ${createdPermissions.length} permissions`);

  } catch (error) {
    console.error('❌ Error seeding security:', error);
    throw error;
  }
}

async function main() {
  await seed();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
