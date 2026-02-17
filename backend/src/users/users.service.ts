import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContext } from '../common/request-context';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenantAndEmail(tenantId: string, email: string) {
    return this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });
  }

  async findById(userId: string) {
    const store = RequestContext.getStore();
    const tenantId = store?.tenantId;

    if (!tenantId) {
      throw new Error('Missing tenantId in request context');
    }

    return this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });
  }

  async findByIdAndTenant(userId: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Super-admin: listar usuarios de todos los tenants
  async findAllUsersAllTenants() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Super-admin: listar tenants con conteos básicos
  async findAllTenantsWithStats() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            branches: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createUser(
    tenantId: string,
    dto: { email: string; name: string; passwordHash: string; role: any },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear el usuario
      const user = await tx.user.create({
        data: {
          tenantId,
          email: dto.email.toLowerCase(),
          name: dto.name,
          passwordHash: dto.passwordHash,
          role: dto.role,
        },
      });

      // 2. Buscar el ID del rol en este tenant
      const role = await tx.role.findFirst({
        where: {
          tenantId,
          name: dto.role,
        },
      });

      // 3. Vincular si existe
      if (role) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
      }

      return user;
    });
  }

  async updateUserRole(
    userId: string,
    tenantId: string,
    role:
      | 'CLIENT'
      | 'MEMBER'
      | 'ADMIN'
      | 'OWNER'
      | 'SALES'
      | 'WAREHOUSE'
      | 'TRAFFIC',
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar el enum en el modelo User
      const user = await tx.user.update({
        where: { id: userId },
        data: { role: role as any },
      });

      // 2. Eliminar roles anteriores de la tabla de unión
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // 3. Buscar el nuevo rol por nombre en este tenant
      const roleRecord = await tx.role.findFirst({
        where: {
          tenantId,
          name: role,
        },
      });

      // 4. Crear la nueva vinculación
      if (roleRecord) {
        await tx.userRole.create({
          data: {
            userId,
            roleId: roleRecord.id,
          },
        });
      }

      return user;
    });
  }

  async deleteUser(userId: string, tenantId: string) {
    return this.prisma.user.delete({
      where: {
        id: userId,
      },
    });
  }
}
