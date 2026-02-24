import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';

@Injectable()
export class CashSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveSession(userId: string, tenantId: string) {
    return (this.prisma as any).cashSession.findFirst({
      where: {
        userId,
        tenantId,
        status: 'OPEN',
      },
      include: {
        payments: true,
      },
    });
  }

  async openSession(dto: OpenSessionDto, userId: string, tenantId: string) {
    const existing = await this.getActiveSession(userId, tenantId);
    if (existing) {
      throw new BadRequestException(
        'Ya existe una sesión abierta para este usuario.',
      );
    }

    return (this.prisma as any).cashSession.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        userId,
        openingBalance: new Prisma.Decimal(dto.openingBalance),
        status: 'OPEN',
      },
    });
  }

  async closeSession(
    id: string,
    dto: CloseSessionDto,
    userId: string,
    tenantId: string,
  ) {
    const session = await (this.prisma as any).cashSession.findFirst({
      where: { id, tenantId, status: 'OPEN' },
      include: { payments: true },
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada o ya cerrada.');
    }

    const cashPayments = session.payments
      .filter((p) => p.method === 'CASH')
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const expectedBalance = Number(session.openingBalance) + cashPayments;
    const actualBalance = dto.actualBalance;
    const difference = actualBalance - expectedBalance;

    return (this.prisma as any).cashSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        expectedBalance: new Prisma.Decimal(expectedBalance),
        actualBalance: new Prisma.Decimal(actualBalance),
        difference: new Prisma.Decimal(difference),
        closedAt: new Date(),
        notes: dto.notes,
      },
    });
  }

  async getSessionReport(id: string, tenantId: string) {
    const session = await (this.prisma as any).cashSession.findFirst({
      where: { id, tenantId },
      include: {
        payments: {
          include: {
            invoice: true,
          },
        },
        user: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    if (!session) throw new NotFoundException('Session not found');

    const totalsByMethod = session.payments.reduce(
      (acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      ...session,
      totalsByMethod,
    };
  }
}
