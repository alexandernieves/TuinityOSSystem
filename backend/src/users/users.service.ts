import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContext } from '../common/request-context';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

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

  async updateUserRole(userId: string, tenantId: string, role: 'CLIENT' | 'MEMBER' | 'ADMIN' | 'OWNER') {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
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
