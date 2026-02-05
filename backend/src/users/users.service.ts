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
}
