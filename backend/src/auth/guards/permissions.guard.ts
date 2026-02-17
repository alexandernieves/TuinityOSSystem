import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionKey } from '../enums/permission-key.enum';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionKey[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'] || user?.tenantId;

    if (!user || !tenantId) {
      throw new ForbiddenException('User or Tenant context missing');
    }

    // Fetch user permissions for this tenant
    // A user can have multiple roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.sub || user.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const userPermissions = new Set<string>();
    userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        userPermissions.add(rp.permission.key);
      });
    });

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.sub || user.id },
    });
    if (fullUser?.role === 'OWNER') {
      request.permissions = Array.from(userPermissions);
      request.role = 'OWNER';
      return true;
    }

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Attach permissions to request for use in interceptor/RequestContext
    request.permissions = Array.from(userPermissions);
    request.role = fullUser?.role;

    return true;
  }
}
