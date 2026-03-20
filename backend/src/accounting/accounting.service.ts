import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { JournalEntryStatus, AccountType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AccountingService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async onModuleInit() {
        // COA is seeded on demand via POST /accounting/seed
    }

    async findAllAccounts() {
        return this.prisma.account.findMany({
            orderBy: { code: 'asc' }
        });
    }

    async getAccountByCode(code: string) {
        const account = await this.prisma.account.findUnique({ where: { code } });
        if (!account) throw new NotFoundException(`Cuenta contable con código ${code} no encontrada`);
        return account;
    }

    async updateAccount(id: string, dto: any) {
        let parentAccountId = dto.parentAccountId;
        if (dto.parentId && !parentAccountId) {
            const parent = await this.prisma.account.findUnique({ where: { code: dto.parentId } });
            if (parent) parentAccountId = parent.id;
        }

        return this.prisma.account.update({
            where: { id },
            data: {
                code: dto.code,
                name: dto.name,
                type: dto.type ? (dto.type.toUpperCase() as AccountType) : undefined,
                parentAccountId,
                isActive: dto.isActive,
            }
        });
    }

    async createAccount(dto: any) {
        const existing = await this.prisma.account.findUnique({ where: { code: dto.code } });
        if (existing) throw new BadRequestException('El código de cuenta ya existe');
        
        let parentAccountId = dto.parentAccountId;
        if (dto.parentId && !parentAccountId) {
            const parent = await this.prisma.account.findUnique({ where: { code: dto.parentId } });
            if (parent) parentAccountId = parent.id;
        }

        return this.prisma.account.create({
            data: {
                code: dto.code,
                name: dto.name,
                type: dto.type.toUpperCase() as AccountType,
                parentAccountId,
                isActive: dto.isActive ?? true,
            }
        });
    }

    async findAllEntries(filters: any = {}) {
        return this.prisma.journalEntry.findMany({
            where: {
                ...(filters.status ? { status: filters.status } : {}),
                ...(filters.startDate || filters.endDate ? {
                    entryDate: {
                        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
                    }
                } : {}),
                ...(filters.sourceType ? { referenceType: filters.sourceType } : {}),
            },
            include: {
                createdByUser: { select: { name: true } },
                lines: { include: { account: { select: { name: true, code: true } } } }
            },
            orderBy: { entryDate: 'desc' }
        });
    }

    async findEntryById(id: string) {
        const entry = await this.prisma.journalEntry.findUnique({
            where: { id },
            include: {
                createdByUser: { select: { name: true } },
                postedByUser: { select: { name: true } },
                lines: { include: { account: true } }
            }
        });
        if (!entry) throw new NotFoundException('Asiento no encontrado');
        return entry;
    }

    async createEntry(dto: any) {
        // Validation: Sum of debits must equal sum of credits
        const lines = dto.lines || [];
        const totalDebit = lines.reduce((sum: number, l: any) => sum + Number(l.debit || 0), 0);
        const totalCredit = lines.reduce((sum: number, l: any) => sum + Number(l.credit || 0), 0);

        // Allow for small floating point diffs
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new BadRequestException(`El asiento no está balanceado. Débitos: ${totalDebit}, Créditos: ${totalCredit}`);
        }

        // Generate Number AS-YYYY-XXXX
        const count = await this.prisma.journalEntry.count();
        const year = new Date().getFullYear();
        const number = `AS-${year}-${String(count + 1).padStart(5, '0')}`;

        return this.prisma.journalEntry.create({
            data: {
                number,
                entryDate: dto.date || new Date(),
                status: (dto.status || 'POSTED') as JournalEntryStatus,
                memo: dto.description || dto.memo,
                referenceType: dto.sourceType,
                referenceId: dto.sourceId,
                createdByUserId: dto.createdByUserId,
                lines: {
                    create: lines.map((l: any) => ({
                        accountId: l.accountId,
                        debit: l.debit || 0,
                        credit: l.credit || 0,
                        memo: l.memo
                    }))
                }
            },
            include: { lines: true }
        });
    }

    async reverseEntry(id: string, userId: string, reason: string) {
        const original = await this.findEntryById(id);
        if (original.status === 'REVERSED') throw new BadRequestException('Este asiento ya fue revertido');

        return this.prisma.$transaction(async (tx) => {
            // 1. Mark original as reversed
            await tx.journalEntry.update({
                where: { id },
                data: { status: 'REVERSED' }
            });

            // 2. Create contrapartida (reverse lines)
            const count = await tx.journalEntry.count();
            const year = new Date().getFullYear();
            const number = `REV-${year}-${String(count + 1).padStart(5, '0')}`;

            const reversedEntry = await tx.journalEntry.create({
                data: {
                    number,
                    entryDate: new Date(),
                    status: 'POSTED',
                    memo: `REVERSO de ${original.number}: ${reason}`,
                    referenceType: 'REVERSAL',
                    referenceId: original.id,
                    createdByUserId: userId,
                    lines: {
                        create: original.lines.map(l => ({
                            accountId: l.accountId,
                            debit: l.credit, // Swap debit/credit
                            credit: l.debit,
                            memo: `Contrapartida de ${original.number}`
                        }))
                    }
                }
            });

            await this.notificationsService.notifyRole('GERENCIA', {
                type: 'JOURNAL_REVERSED',
                title: 'Asiento Diario Revertido',
                message: `El asiento ${original.number} ha sido revertido. Razón: ${reason}`,
                module: 'ACCOUNTING',
                entityType: 'JournalEntry',
                entityId: original.id,
                severity: 'CRITICAL',
                actionUrl: `/contabilidad/libro-mayor`,
            });

            return reversedEntry;
        });
    }

    async generateAutoEntry(options: {
        operationType: string;
        referenceId: string;
        amount: number;
        memo: string;
        userId?: string;
        date?: Date;
        segment?: string;
        country?: string;
    }) {
        const mapping = await this.prisma.accountingMapping.findUnique({
            where: { operationType: options.operationType }
        });

        if (!mapping || !mapping.debitAccountId || !mapping.creditAccountId) {
            console.warn(`No active accounting mapping found for operation: ${options.operationType}. Skipping auto-entry.`);
            return null; // Don't block operation if mapping is missing
        }

        if (options.amount <= 0) return null; // No zero amount entries

        const count = await this.prisma.journalEntry.count();
        const year = (options.date || new Date()).getFullYear();
        const number = `AS-${year}-${String(count + 1).padStart(5, '0')}`;

        // Determine segment
        let segment = options.segment || 'CONSOLIDATED';
        if (!options.segment) {
            if (options.operationType.startsWith('POS_')) segment = 'B2C';
            if (options.operationType.startsWith('B2B_')) segment = 'B2B';
        }

        return this.prisma.journalEntry.create({
            data: {
                number,
                entryDate: options.date || new Date(),
                status: 'POSTED',
                memo: options.memo,
                referenceType: options.operationType,
                referenceId: options.referenceId,
                createdByUserId: options.userId,
                segment,
                country: options.country || 'PA',
                lines: {
                    create: [
                        {
                            accountId: mapping.debitAccountId,
                            debit: options.amount,
                            credit: 0,
                            memo: options.memo
                        },
                        {
                            accountId: mapping.creditAccountId,
                            debit: 0,
                            credit: options.amount,
                            memo: options.memo
                        }
                    ]
                }
            }
        });
    }

    // --- MAPPINGS ---
    async getMappings() {
        return this.prisma.accountingMapping.findMany({
            include: {
                debitAccount: { select: { code: true, name: true } },
                creditAccount: { select: { code: true, name: true } }
            }
        });
    }

    async getMapping(operationType: string) {
        return this.prisma.accountingMapping.findUnique({
            where: { operationType }
        });
    }

    async saveMapping(operationType: string, debitAccountId: string | null, creditAccountId: string | null, description: string) {
        return this.prisma.accountingMapping.upsert({
            where: { operationType },
            update: { debitAccountId, creditAccountId, description },
            create: { operationType, debitAccountId, creditAccountId, description }
        });
    }

    async seedCOA() {
        // Always run upserts to ensure COA structure is up to date

        const coaStructure = [
            { code: '1', name: 'ACTIVOS', type: 'ASSET' },
            { code: '1010', name: 'Efectivo y Equivalentes', type: 'ASSET', parent: '1' },
            { code: '1010.01', name: 'Caja General', type: 'ASSET', parent: '1010' },
            { code: '1010.02', name: 'Banco General - Operativa', type: 'ASSET', parent: '1010' },
            { code: '1020', name: 'Cuentas por Cobrar', type: 'ASSET', parent: '1' },
            { code: '1020.01', name: 'Clientes Locales (CxC)', type: 'ASSET', parent: '1020' },
            { code: '1030', name: 'Inventarios', type: 'ASSET', parent: '1' },
            { code: '1030.01', name: 'Inventario de Mercancía', type: 'ASSET', parent: '1030' },
            
            { code: '2', name: 'PASIVOS', type: 'LIABILITY' },
            { code: '2010', name: 'Cuentas por Pagar', type: 'LIABILITY', parent: '2' },
            { code: '2010.01', name: 'Proveedores Nacionales (CxP)', type: 'LIABILITY', parent: '2010' },
            { code: '2010.02', name: 'Proveedores Internacionales', type: 'LIABILITY', parent: '2010' },
            
            { code: '3', name: 'CAPITAL', type: 'EQUITY' },
            { code: '3010', name: 'Capital Social', type: 'EQUITY', parent: '3' },
            { code: '3020', name: 'Utilidades Retenidas', type: 'EQUITY', parent: '3' },
            
            { code: '4', name: 'INGRESOS', type: 'REVENUE' },
            { code: '4010', name: 'Ventas de Mercancía', type: 'REVENUE', parent: '4' },
            { code: '4010.01', name: 'Ingresos por Ventas B2B', type: 'REVENUE', parent: '4010' },
            { code: '4010.02', name: 'Ingresos por Ventas POS', type: 'REVENUE', parent: '4010' },
            
            { code: '5', name: 'GASTOS', type: 'EXPENSE' },
            { code: '5010', name: 'Costo de Ventas', type: 'EXPENSE', parent: '5' },
            { code: '5010.01', name: 'Costo de Mercancía Vendida B2B', type: 'EXPENSE', parent: '5010' },
            { code: '5010.02', name: 'Costo de Mercancía Vendida POS', type: 'EXPENSE', parent: '5010' },
            { code: '5020', name: 'Gastos Operativos', type: 'EXPENSE', parent: '5' },
            { code: '5030', name: 'Gastos de Tráfico y Documentación', type: 'EXPENSE', parent: '5' },
        ];

        for (const item of coaStructure) {
            const existing = await this.prisma.account.findFirst({ where: { code: item.code } });
            if (existing) continue;

            let parentAccountId: string | null = null;
            if (item.parent) {
                const parent = await this.prisma.account.findFirst({ where: { code: item.parent } });
                parentAccountId = parent?.id || null;
            }

            await this.prisma.account.create({
                data: {
                    code: item.code,
                    name: item.name,
                    type: item.type as AccountType,
                    parentAccountId
                }
            });
        }

        // Seed Default Mappings
        const getAcct = async (code: string) => {
            const a = await this.prisma.account.findFirst({ where: { code } });
            return a?.id || null;
        }

        const mappings = [
            { op: 'B2B_INVOICE', deb: '1020.01', cred: '4010.01', desc: 'Facturación B2B (CxC vs Ingresos)' },
            { op: 'B2B_INVOICE_COST', deb: '5010.01', cred: '1030.01', desc: 'Costo Facturación B2B (Costo vs Inventario)' },
            { op: 'B2B_COLLECTION', deb: '1010.02', cred: '1020.01', desc: 'Cobro Cliente B2B (Banco vs CxC)' },
            { op: 'POS_SALE', deb: '1010.02', cred: '4010.02', desc: 'Venta Punto de Venta (Banco/Caja vs Ingreso)' },
            { op: 'POS_SALE_COST', deb: '5010.02', cred: '1030.01', desc: 'Costo Venta POS (Costo vs Inventario)' },
            { op: 'POS_RETURN', deb: '4010.02', cred: '1010.02', desc: 'Devolución Punto de Venta (Ingreso vs Banco/Caja)' },
            { op: 'POS_RETURN_COST', deb: '1030.01', cred: '5010.02', desc: 'Costo Devolución POS (Inventario vs Costo)' },
            { op: 'PURCHASE_RECEIPT', deb: '1030.01', cred: '2010.01', desc: 'Recepción de Mercancía (Inventario vs CxP)' },
            { op: 'SUPPLIER_PAYMENT', deb: '2010.01', cred: '1010.02', desc: 'Pago a Proveedor (CxP vs Banco)' }
        ];

        for (const map of mappings) {
            const debAcct = await getAcct(map.deb);
            const credAcct = await getAcct(map.cred);
            if (debAcct && credAcct) {
                await this.prisma.accountingMapping.upsert({
                    where: { operationType: map.op },
                    update: { debitAccountId: debAcct, creditAccountId: credAcct, description: map.desc },
                    create: { operationType: map.op, debitAccountId: debAcct, creditAccountId: credAcct, description: map.desc }
                });
            }
        }

        return { message: 'COA y Mapeos cargados correctamente' };
    }

    // ---- FINANCIAL STATEMENTS ----

    async getLedger(accountId: string, filters: any = {}) {
        const account = await this.prisma.account.findUnique({ where: { id: accountId } });
        if (!account) throw new NotFoundException('Cuenta no encontrada');

        const lines = await this.prisma.journalEntryLine.findMany({
            where: {
                accountId,
                journalEntry: {
                    status: 'POSTED',
                    ...(filters.startDate || filters.endDate ? {
                        entryDate: {
                            ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                            ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
                        }
                    } : {}),
                }
            },
            include: {
                journalEntry: {
                    include: { createdByUser: { select: { name: true } } }
                }
            },
            orderBy: { journalEntry: { entryDate: 'asc' } }
        });

        let runningBalance = 0;
        const rows = lines.map(l => {
            const debit = Number(l.debit);
            const credit = Number(l.credit);
            runningBalance += debit - credit;
            return {
                date: l.journalEntry.entryDate,
                entryNumber: l.journalEntry.number,
                entryId: l.journalEntryId,
                referenceType: l.journalEntry.referenceType,
                referenceId: l.journalEntry.referenceId,
                memo: l.memo || l.journalEntry.memo,
                user: l.journalEntry.createdByUser?.name,
                debit,
                credit,
                balance: runningBalance,
            };
        });

        return { account, rows, finalBalance: runningBalance };
    }

    async getProfitAndLoss(filters: any = {}) {
        const { startDate, endDate, segment } = filters;
        const where: any = {
            journalEntry: {
                status: 'POSTED',
                ...(startDate || endDate ? {
                    entryDate: {
                        ...(startDate ? { gte: new Date(startDate) } : {}),
                        ...(endDate ? { lte: new Date(endDate) } : {}),
                    }
                } : {}),
                // Segment filter
                ...(segment ? {
                    OR: [
                        { segment },
                        // Fallback logic for old entries
                        ...(segment === 'B2B' ? [{ referenceType: { in: ['B2B_INVOICE', 'B2B_INVOICE_COST', 'B2B_COLLECTION', 'REVERSAL'] } }] : []),
                        ...(segment === 'B2C' ? [{ referenceType: { in: ['POS_SALE', 'POS_SALE_COST', 'POS_RETURN', 'POS_RETURN_COST'] } }] : [])
                    ]
                } : {})
            }
        };

        const lines = await this.prisma.journalEntryLine.findMany({
            where,
            include: { account: true }
        });

        const revenue: Record<string, any> = {};
        const expenses: Record<string, any> = {};

        for (const line of lines) {
            const { account } = line;
            const debit = Number(line.debit);
            const credit = Number(line.credit);

            if (account.type === 'REVENUE') {
                if (!revenue[account.id]) revenue[account.id] = { code: account.code, name: account.name, total: 0 };
                revenue[account.id].total += credit - debit; // Revenue increases with credit
            } else if (account.type === 'EXPENSE') {
                if (!expenses[account.id]) expenses[account.id] = { code: account.code, name: account.name, total: 0 };
                expenses[account.id].total += debit - credit; // Expense increases with debit
            }
        }

        const totalRevenue = Object.values(revenue).reduce((s: number, a: any) => s + a.total, 0);
        const totalExpenses = Object.values(expenses).reduce((s: number, a: any) => s + a.total, 0);
        const netIncome = totalRevenue - totalExpenses;

        return {
            revenue: Object.values(revenue).sort((a: any, b: any) => a.code.localeCompare(b.code)),
            expenses: Object.values(expenses).sort((a: any, b: any) => a.code.localeCompare(b.code)),
            totalRevenue,
            totalExpenses,
            netIncome,
        };
    }

    async getBalanceSheet(filters: any = {}) {
        const { asOfDate } = filters;
        const where: any = {
            journalEntry: {
                status: 'POSTED',
                ...(asOfDate ? { entryDate: { lte: new Date(asOfDate) } } : {}),
            }
        };

        const lines = await this.prisma.journalEntryLine.findMany({
            where,
            include: { account: true }
        });

        const balances: Record<string, any> = {};

        for (const line of lines) {
            const { account } = line;
            const key = account.id;
            if (!balances[key]) balances[key] = { code: account.code, name: account.name, type: account.type, total: 0 };
            // Assets: Dr-Cr, Liabilities/Equity: Cr-Dr
            if (account.type === 'ASSET') {
                balances[key].total += Number(line.debit) - Number(line.credit);
            } else if (account.type === 'LIABILITY' || account.type === 'EQUITY') {
                balances[key].total += Number(line.credit) - Number(line.debit);
            }
        }

        const entries = Object.values(balances);
        const assets = entries.filter((e: any) => e.type === 'ASSET' && e.total !== 0);
        const liabilities = entries.filter((e: any) => e.type === 'LIABILITY' && e.total !== 0);
        const equity = entries.filter((e: any) => e.type === 'EQUITY' && e.total !== 0);

        const totalAssets = assets.reduce((s: number, a: any) => s + a.total, 0);
        const totalLiabilities = liabilities.reduce((s: number, a: any) => s + a.total, 0);
        const totalEquity = equity.reduce((s: number, a: any) => s + a.total, 0);

        return {
            assets: assets.sort((a: any, b: any) => a.code.localeCompare(b.code)),
            liabilities: liabilities.sort((a: any, b: any) => a.code.localeCompare(b.code)),
            equity: equity.sort((a: any, b: any) => a.code.localeCompare(b.code)),
            totalAssets,
            totalLiabilities,
            totalEquity,
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        };
    }

    async getCashFlow(filters: any = {}) {
        const { startDate, endDate } = filters;
        // Cash accounts: 1010.01 (Caja) and 1010.02 (Banco)
        const cashAccounts = await this.prisma.account.findMany({
            where: { code: { in: ['1010.01', '1010.02'] } }
        });

        const cashAccountIds = cashAccounts.map(a => a.id);

        const lines = await this.prisma.journalEntryLine.findMany({
            where: {
                accountId: { in: cashAccountIds },
                journalEntry: {
                    status: 'POSTED',
                    ...(startDate || endDate ? {
                        entryDate: {
                            ...(startDate ? { gte: new Date(startDate) } : {}),
                            ...(endDate ? { lte: new Date(endDate) } : {}),
                        }
                    } : {})
                }
            },
            include: {
                account: { select: { code: true, name: true } },
                journalEntry: { select: { number: true, entryDate: true, referenceType: true, memo: true } }
            },
            orderBy: { journalEntry: { entryDate: 'asc' } }
        });

        const cashIn = lines.reduce((s, l) => s + Number(l.debit), 0);
        const cashOut = lines.reduce((s, l) => s + Number(l.credit), 0);
        const netCash = cashIn - cashOut;

        // Group by referenceType for categorization
        const byCategory: Record<string, { in: number; out: number }> = {};
        for (const line of lines) {
            const cat = line.journalEntry.referenceType || 'OTHER';
            if (!byCategory[cat]) byCategory[cat] = { in: 0, out: 0 };
            byCategory[cat].in += Number(line.debit);
            byCategory[cat].out += Number(line.credit);
        }

        return { cashIn, cashOut, netCash, byCategory, movements: lines };
    }
}
