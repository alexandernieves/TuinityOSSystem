import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  private get p(): any {
    return this.prisma;
  }

  // --- CHART OF ACCOUNTS ---

  async initializeDefaultCOA(tenantId: string) {
    // Basic COA structure for Panama
    const defaults = [
      { code: '1', name: 'ACTIVOS', type: 'ASSET', level: 1 },
      {
        code: '1.1',
        name: 'Activos Corrientes',
        type: 'ASSET',
        level: 2,
        parentCode: '1',
      },
      {
        code: '1.1.01',
        name: 'Caja y Bancos',
        type: 'ASSET',
        level: 3,
        parentCode: '1.1',
      },
      {
        code: '1.1.02',
        name: 'Cuentas por Cobrar',
        type: 'ASSET',
        level: 3,
        parentCode: '1.1',
      },
      {
        code: '1.1.03',
        name: 'Inventario de Mercancía',
        type: 'ASSET',
        level: 3,
        parentCode: '1.1',
      },

      { code: '2', name: 'PASIVOS', type: 'LIABILITY', level: 1 },
      {
        code: '2.1',
        name: 'Pasivos Corrientes',
        type: 'LIABILITY',
        level: 2,
        parentCode: '2',
      },
      {
        code: '2.1.01',
        name: 'Cuentas por Pagar Proveedores',
        type: 'LIABILITY',
        level: 3,
        parentCode: '2.1',
      },
      {
        code: '2.1.02',
        name: 'ITBMS por Pagar',
        type: 'LIABILITY',
        level: 3,
        parentCode: '2.1',
      },

      { code: '3', name: 'PATRIMONIO', type: 'EQUITY', level: 1 },
      {
        code: '3.1',
        name: 'Capital Social',
        type: 'EQUITY',
        level: 2,
        parentCode: '3',
      },

      { code: '4', name: 'INGRESOS', type: 'REVENUE', level: 1 },
      {
        code: '4.1',
        name: 'Ventas de Mercancía',
        type: 'REVENUE',
        level: 2,
        parentCode: '4',
      },

      { code: '5', name: 'COSTOS Y GASTOS', type: 'EXPENSE', level: 1 },
      {
        code: '5.1',
        name: 'Costo de Ventas',
        type: 'EXPENSE',
        level: 2,
        parentCode: '5',
      },
      {
        code: '5.2',
        name: 'Gastos Administrativos',
        type: 'EXPENSE',
        level: 2,
        parentCode: '5',
      },
    ];

    for (const item of defaults) {
      const parent = item.parentCode
        ? await this.p.account.findFirst({
            where: { tenantId, code: item.parentCode },
          })
        : null;

      await this.p.account.upsert({
        where: { tenantId_code: { tenantId, code: item.code } },
        update: {},
        create: {
          tenantId,
          code: item.code,
          name: item.name,
          type: item.type,
          level: item.level,
          parentId: parent?.id,
        },
      });
    }

    return { message: 'Plan de cuentas inicializado' };
  }

  async getAccounts(tenantId: string) {
    return this.p.account.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  // --- JOURNAL ENTRIES ---

  async createEntry(dto: any, tenantId: string, userId: string) {
    const {
      description,
      entryDate,
      reference,
      branchId,
      lines,
      sourceType,
      sourceId,
    } = dto;

    // Validate balance
    const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce(
      (sum, l) => sum + Number(l.credit || 0),
      0,
    );

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Journal entry is out of balance. Debit: ${totalDebit}, Credit: ${totalCredit}`,
      );
    }

    return this.p.journalEntry.create({
      data: {
        tenantId,
        branchId,
        description,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        reference,
        sourceType,
        sourceId,
        createdBy: userId,
        lines: {
          create: lines.map((line) => ({
            tenantId,
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: { lines: true },
    });
  }

  // --- AUTOMATIC JOURNALING ---

  async autoJournalSale(saleId: string, tenantId: string, userId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: { include: { product: true } } },
    });
    if (!sale) return;

    // Accounts logic
    const aReceivable = await this.p.account.findFirst({
      where: { tenantId, code: '1.1.02' },
    });
    const aSales = await this.p.account.findFirst({
      where: { tenantId, code: '4.1' },
    });
    const aInventory = await this.p.account.findFirst({
      where: { tenantId, code: '1.1.03' },
    });
    const aCOGS = await this.p.account.findFirst({
      where: { tenantId, code: '5.1' },
    });

    if (!aReceivable || !aSales || !aInventory || !aCOGS) {
      console.warn('COA not initialized properly for auto-journaling');
      return;
    }

    const lines: any[] = [
      {
        accountId: aReceivable.id,
        debit: Number(sale.total),
        credit: 0,
        description: `Venta ${sale.id}`,
      },
      {
        accountId: aSales.id,
        debit: 0,
        credit: Number(sale.total),
        description: `Venta ${sale.id}`,
      },
    ];

    // Cost of Goods Sold logic
    let totalCost = 0;
    for (const item of sale.items) {
      const cost = Number(item.product.weightedAvgCost) || 0;
      totalCost += cost * Number(item.quantity);
    }

    if (totalCost > 0) {
      lines.push({
        accountId: aCOGS.id,
        debit: totalCost,
        credit: 0,
        description: `Costo Venta ${sale.id}`,
      });
      lines.push({
        accountId: aInventory.id,
        debit: 0,
        credit: totalCost,
        description: `Descargo Inv. ${sale.id}`,
      });
    }

    return this.createEntry(
      {
        description: `Generado por Venta ${sale.id}`,
        reference: sale.id,
        entryDate: sale.createdAt,
        sourceType: 'SALE',
        sourceId: sale.id,
        lines,
      },
      tenantId,
      userId,
    );
  }

  // --- FINANCIAL REPORTS ---

  async getProfitAndLoss(tenantId: string, startDate: Date, endDate: Date) {
    // Get all revenue and expense lines
    const lines = await this.p.journalLine.findMany({
      where: {
        tenantId,
        journalEntry: {
          entryDate: { gte: startDate, lte: endDate },
        },
        account: {
          type: { in: ['REVENUE', 'EXPENSE'] as any },
        },
      },
      include: { account: true },
    });

    const report: any = { revenue: [], expense: [], netIncome: 0 };
    let totalRev = 0;
    let totalExp = 0;

    const accountSummaries = new Map<string, any>();
    for (const line of lines) {
      if (!accountSummaries.has(line.accountId)) {
        accountSummaries.set(line.accountId, {
          name: line.account.name,
          code: line.account.code,
          type: line.account.type,
          balance: 0,
        });
      }
      const summary = accountSummaries.get(line.accountId);
      // Revenue increases with credit, Expenses increase with debit
      if (line.account.type === 'REVENUE') {
        summary.balance += Number(line.credit) - Number(line.debit);
      } else {
        summary.balance += Number(line.debit) - Number(line.credit);
      }
    }

    accountSummaries.forEach((acc) => {
      if (acc.type === 'REVENUE') {
        report.revenue.push(acc);
        totalRev += acc.balance;
      } else {
        report.expense.push(acc);
        totalExp += acc.balance;
      }
    });

    report.totalRevenue = totalRev;
    report.totalExpense = totalExp;
    report.netIncome = totalRev - totalExp;

    return report;
  }

  async getBalanceSheet(tenantId: string, date: Date) {
    // Accumulate all balances up to date
    const lines = await this.p.journalLine.findMany({
      where: {
        tenantId,
        journalEntry: { entryDate: { lte: date } },
        account: {
          type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] as any },
        },
      },
      include: { account: true },
    });

    const report: any = { assets: [], liabilities: [], equity: [] };
    const accountSummaries = new Map<string, any>();

    for (const line of lines) {
      if (!accountSummaries.has(line.accountId)) {
        accountSummaries.set(line.accountId, {
          name: line.account.name,
          code: line.account.code,
          type: line.account.type,
          balance: 0,
        });
      }
      const summary = accountSummaries.get(line.accountId);

      if (line.account.type === 'ASSET') {
        summary.balance += Number(line.debit) - Number(line.credit);
      } else {
        summary.balance += Number(line.credit) - Number(line.debit);
      }
    }

    accountSummaries.forEach((acc) => {
      if (acc.type === 'ASSET') report.assets.push(acc);
      else if (acc.type === 'LIABILITY') report.liabilities.push(acc);
      else report.equity.push(acc);
    });

    return report;
  }
}
