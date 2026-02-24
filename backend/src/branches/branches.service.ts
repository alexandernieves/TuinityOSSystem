import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContext } from '../common/request-context';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTenant() {
    const store = RequestContext.getStore();
    const tenantId = store?.tenantId;

    if (!tenantId) {
      throw new Error('Missing tenantId in request context');
    }

    return this.prisma.branch.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: [{ name: 'asc' }],
    });
  }
}
