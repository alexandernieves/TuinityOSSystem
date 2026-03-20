import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../services/shared/prisma.service';

@Controller('commissions')
export class CommissionsController {
  constructor(
    private readonly commissionsService: CommissionsService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async getCommissions(@Query() query: any, @Req() req: any) {
    const { sellerId, collectionStatus, commissionStatus, startDate, endDate } = query;
    const where: any = {};

    // Filter by date
    if (startDate && endDate) {
      where.saleDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      where.saleDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.saleDate = { lte: new Date(endDate) };
    }

    if (sellerId && sellerId !== 'all') where.sellerUserId = sellerId;
    if (collectionStatus && collectionStatus !== 'all') where.collectionStatus = collectionStatus;
    if (commissionStatus && commissionStatus !== 'all') where.commissionStatus = commissionStatus;

    // Check user role: If not admin/finance, only show their own commissions.
    // Assume req.user has role information. For now, we support filtering by sellerId normally.
    // In a real app with strict auth, we'd enforce it here.

    const records = await this.prisma.commissionRecord.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, legalName: true, code: true } },
        invoice: { select: { id: true, number: true } }
      },
      orderBy: { saleDate: 'desc' },
      take: 100 // pagination could be added
    });

    return records;
  }

  @Get('summary')
  async getCommissionsSummary(@Query() query: any) {
    const { sellerId, startDate, endDate } = query;
    const where: any = {};
    if (startDate && endDate) {
      where.saleDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    if (sellerId && sellerId !== 'all') where.sellerUserId = sellerId;

    const records = await this.prisma.commissionRecord.findMany({ where });

    let invoiceTotal = 0;
    let commissionableAmount = 0;
    let commissionEligibleAmount = 0;
    let commissionPendingAmount = 0;

    for (const r of records) {
      invoiceTotal += Number(r.invoiceTotal);
      commissionableAmount += Number(r.commissionableAmount);
      commissionEligibleAmount += Number(r.commissionEligibleAmount);
      commissionPendingAmount += Number(r.commissionPendingAmount);
    }

    return {
      invoiceTotal,
      commissionableAmount,
      commissionEligibleAmount,
      commissionPendingAmount
    };
  }

  @Post('recalculate/:invoiceId')
  async recalculate(@Param('invoiceId') invoiceId: string) {
    await this.commissionsService.recalculateEligibleCommission(invoiceId);
    return { success: true };
  }

  @Post('liquidate')
  async liquidate(@Body() body: { ids: string[] }, @Req() req: any) {
    const result = await this.prisma.commissionRecord.updateMany({
      where: {
        id: { in: body.ids },
        commissionStatus: 'ELIGIBLE' 
      },
      data: {
        commissionStatus: 'LIQUIDATED',
        liquidatedAt: new Date(),
        liquidatedByUserId: req.user?.id || null, // Assuming user ID is attached to request
      }
    });

    return { success: true, count: result.count };
  }
}
