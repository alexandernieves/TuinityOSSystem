import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { RequestContext } from './request-context';
import { PrismaService } from '../prisma/prisma.service';

type RequestWithUser = {
  path?: string;
  user?: {
    sub?: string;
    tenantId?: string;
  };
  tenant?: {
    slug?: string;
  };
};

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithUser>();

    const path = req?.path ?? '';
    const bypassTenantIsolation =
      path.startsWith('/auth') || path.startsWith('/health');

    return from(
      (async () => {
        if (bypassTenantIsolation) {
          return {
            bypassTenantIsolation: true,
            tenantId: req?.user?.tenantId,
            userId: req?.user?.sub,
          };
        }

        let tenantId = req?.user?.tenantId;
        const userId = req?.user?.sub;

        if (!tenantId) {
          const slug = req?.tenant?.slug;
          if (slug) {
            const tenant = await this.prisma.tenant.findUnique({
              where: {
                slug,
              },
              select: {
                id: true,
              },
            });
            tenantId = tenant?.id;
          }
        }

        let role = (req as any).role;
        let permissions = (req as any).permissions;

        if (userId && !role) {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
          });
          role = user?.role;

          const userRoles = await this.prisma.userRole.findMany({
            where: { userId },
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

          const perms = new Set<string>();
          userRoles.forEach((ur) => {
            ur.role.rolePermissions.forEach((rp) => {
              perms.add(rp.permission.key);
            });
          });
          permissions = Array.from(perms);
        }

        return {
          bypassTenantIsolation: false,
          tenantId,
          userId,
          role,
          permissions,
        };
      })(),
    ).pipe(
      mergeMap(
        (store) =>
          RequestContext.run(store, () =>
            next.handle(),
          ) as unknown as Observable<unknown>,
      ),
    );
  }
}
