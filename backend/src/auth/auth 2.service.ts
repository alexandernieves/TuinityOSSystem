import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { RegisterClientDto } from './dto/register-client.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  private getAccessTokenTtlSeconds() {
    const raw = this.configService.get<string>('JWT_ACCESS_TTL_SECONDS');
    const ttl = raw ? Number(raw) : 900;
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 900;
  }

  private getRefreshTokenTtlDays() {
    const raw = this.configService.get<string>('JWT_REFRESH_TTL_DAYS');
    const ttl = raw ? Number(raw) : 30;
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 30;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async registerTenant(dto: RegisterTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: {
        slug: dto.tenantSlug,
      },
    });

    if (existing) {
      throw new BadRequestException('Tenant slug already exists');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          slug: dto.tenantSlug,
        },
      });

      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: dto.branchName,
          code: dto.branchCode,
        },
      });

      // Definición de roles y sus permisos según requerimientos
      const roleDefinitions = [
        {
          name: 'OWNER',
          permissions: [
            'MANAGE_TENANT',
            'MANAGE_USERS',
            'VIEW_COSTS',
            'EDIT_PRODUCTS',
            'DELETE_PRODUCTS',
            'BULK_EDIT_PRICES',
            'VIEW_PRICES',
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
          ],
        },
        {
          name: 'ADMIN',
          permissions: [
            'MANAGE_USERS',
            'VIEW_COSTS',
            'EDIT_PRODUCTS',
            'DELETE_PRODUCTS',
            'BULK_EDIT_PRICES',
            'VIEW_PRICES',
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
          ],
        },
        {
          name: 'SALES',
          permissions: [
            'CREATE_SALE',
            'VIEW_SALES',
            'VIEW_PRICES',
            'VIEW_INVENTORY',
            'MANAGE_CLIENTS',
          ],
        },
        {
          name: 'WAREHOUSE',
          permissions: [
            'VIEW_INVENTORY',
            'ADJUST_INVENTORY',
            'MANAGE_TRAFFIC',
            'VIEW_TRAFFIC',
          ],
        },
        {
          name: 'TRAFFIC',
          permissions: [
            'MANAGE_TRAFFIC',
            'VIEW_TRAFFIC',
            'VIEW_SALES',
            'VIEW_INVENTORY',
          ],
        },
        {
          name: 'CLIENT',
          permissions: ['VIEW_SALES'],
        },
        {
          name: 'MEMBER',
          permissions: ['VIEW_INVENTORY', 'VIEW_SALES'],
        },
      ];

      // Asegurar que los permisos existan en la tabla Permission
      const allPermissionKeys = Array.from(
        new Set(roleDefinitions.flatMap((r) => r.permissions)),
      );
      await tx.permission.createMany({
        data: allPermissionKeys.map((key) => ({ key })),
        skipDuplicates: true,
      });

      // Obtener todos los permisos creados/existentes
      const allPermissions = await tx.permission.findMany({
        where: { key: { in: allPermissionKeys } },
      });

      const permissionMap = new Map(allPermissions.map((p) => [p.key, p.id]));

      // Crear Roles y sus relaciones de permisos
      const createdRoles: any[] = [];
      for (const roleDef of roleDefinitions) {
        const role = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: roleDef.name,
          },
        });
        createdRoles.push(role);

        // Crear relaciones RolePermission
        const rolePermissionData = roleDef.permissions
          .map((pKey) => {
            const pId = permissionMap.get(pKey);
            return pId ? { roleId: role.id, permissionId: pId } : null;
          })
          .filter(
            (rp): rp is { roleId: string; permissionId: string } => rp !== null,
          );

        if (rolePermissionData.length > 0) {
          await tx.rolePermission.createMany({
            data: rolePermissionData,
          });
        }
      }

      const ownerRole = createdRoles.find((r) => r.name === 'OWNER');

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail.toLowerCase(),
          passwordHash,
          role: 'OWNER',
        },
      });

      if (ownerRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: ownerRole.id,
          },
        });
      }

      return { tenant, branch, ownerRole, user };
    });

    return {
      tenantId: result.tenant.id,
      tenantSlug: result.tenant.slug,
      adminUserId: result.user.id,
    };
  }

  async registerClient(dto: RegisterClientDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug: dto.tenantSlug,
      },
    });

    if (!tenant) {
      throw new BadRequestException('Empresa no encontrada');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: dto.email,
        },
      },
    });

    if (existingUser) {
      throw new BadRequestException('El usuario ya existe');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash,
          role: 'CLIENT',
        },
      });

      // 2. Assign CLIENT Role (if exists)
      const clientRole = await tx.role.findUnique({
        where: { tenantId_name: { tenantId: tenant.id, name: 'CLIENT' } },
      });

      if (clientRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: clientRole.id,
          },
        });
      }

      // 3. Optional: Link to Customer record if email matches (or create new?)
      // For now, checks if a Customer with this email already exists to link context conceptually
      // We don't have a direct link in DB yet, but creating the Customer record helps CRM.
      const existingCustomer = await tx.customer.findFirst({
        where: { tenantId: tenant.id, email: dto.email },
      });

      if (!existingCustomer) {
        await tx.customer.create({
          data: {
            tenantId: tenant.id,
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            customerType: 'CASH', // Default
            createdBy: user.id, // Self-created
          },
        });
      }

      return user;
    });

    // 4. Auto Login
    const accessTokenTtlSeconds = this.getAccessTokenTtlSeconds();
    const accessToken = await this.jwtService.signAsync(
      {
        sub: result.id,
        tenantId: tenant.id,
      },
      {
        expiresIn: accessTokenTtlSeconds,
      } as any,
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000,
    );

    await this.prisma.session.create({
      data: {
        userId: result.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tenantId: tenant.id,
      userId: result.id,
    };
  }

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug: dto.tenantSlug,
      },
    });

    if (!tenant) {
      throw new ForbiddenException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: dto.email.toLowerCase(),
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (user.status === 'DISABLED') {
      throw new ForbiddenException('User is disabled');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (user.status === 'PENDING') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });
    }

    const wasFirstLogin = user.status === 'PENDING';

    const accessTokenTtlSeconds = this.getAccessTokenTtlSeconds();
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        tenantId: tenant.id,
      },
      {
        expiresIn: accessTokenTtlSeconds,
      } as any,
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000,
    );

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tenantId: tenant.id,
      userId: user.id,
      requiresPasswordChange: wasFirstLogin,
    };
  }

  async refresh(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);

    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const accessTokenTtlSeconds = this.getAccessTokenTtlSeconds();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: session.userId,
        tenantId: session.user.tenantId,
      },
      {
        expiresIn: accessTokenTtlSeconds,
      } as any,
    );

    const newRefreshToken = randomBytes(48).toString('hex');
    const newRefreshTokenHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date(
      Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
      this.prisma.session.create({
        data: {
          userId: session.userId,
          tokenHash: newRefreshTokenHash,
          expiresAt,
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);

    // Find the session to get the userId
    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: refreshTokenHash,
        revokedAt: null,
      },
    });

    if (!session) {
      // Even if session not found, return ok (idempotent)
      return { ok: true };
    }

    // Revoke ALL sessions for this user (logout from all devices)
    await this.prisma.session.updateMany({
      where: {
        userId: session.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { ok: true };
  }

  async deleteTenantAccount(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new ForbiddenException('Acceso denegado');
    }

    if (user.role !== 'OWNER') {
      throw new ForbiddenException('Solo el OWNER puede eliminar la cuenta');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.salesAnalytics.deleteMany({ where: { tenantId } });
      await tx.product.deleteMany({ where: { tenantId } });
      await tx.tenant.delete({ where: { id: tenantId } });
    });

    return { ok: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new ForbiddenException('La contraseña actual es incorrecta');
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { ok: true };
  }

  async cleanupExpiredSessions() {
    // Delete sessions that have been expired for more than 7 days
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: cutoffDate,
            },
          },
          {
            revokedAt: {
              lt: cutoffDate,
            },
          },
        ],
      },
    });
  }
}
