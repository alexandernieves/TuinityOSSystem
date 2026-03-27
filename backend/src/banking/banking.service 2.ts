import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
    BankTransactionType, BankTxStatus, ReconciliationStatus, PeriodStatus
} from '@prisma/client';

@Injectable()
export class BankingService {
    constructor(
        private prisma: PrismaService,
        private accountingService: AccountingService,
        private notificationsService: NotificationsService,
    ) {}

    // ─────────────────────────────────────────────
    // BANK ACCOUNTS
    // ─────────────────────────────────────────────

    async getBankAccounts() {
        return this.prisma.bankAccount.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { transactions: true } } }
        });
    }

    async getBankAccountById(id: string) {
        const acc = await this.prisma.bankAccount.findUnique({ where: { id } });
        if (!acc) throw new NotFoundException(`Cuenta bancaria ${id} no encontrada`);
        return acc;
    }

    async createBankAccount(dto: any) {
        return this.prisma.bankAccount.create({
            data: {
                name: dto.name,
                bankName: dto.bankName,
                accountNumber: dto.accountNumber,
                currency: dto.currency || 'USD',
                accountingCode: dto.accountingCode,
                currentBalance: dto.openingBalance || 0,
                color: dto.color,
                notes: dto.notes,
            }
        });
    }

    async updateBankAccount(id: string, dto: any) {
        await this.getBankAccountById(id);
        return this.prisma.bankAccount.update({
            where: { id },
            data: {
                name: dto.name,
                bankName: dto.bankName,
                accountNumber: dto.accountNumber,
                accountingCode: dto.accountingCode,
                isActive: dto.isActive,
                color: dto.color,
                notes: dto.notes,
            }
        });
    }

    async getBankAccountSummary(id: string) {
        const account = await this.getBankAccountById(id);
        const stats = await this.prisma.bankTransaction.aggregate({
            where: { bankAccountId: id },
            _sum: { amount: true },
            _count: { id: true }
        });
        const unmatched = await this.prisma.bankTransaction.count({
            where: { bankAccountId: id, status: 'UNMATCHED' }
        });
        return { account, totalTransactions: stats._count.id, totalAmount: stats._sum.amount, unmatchedCount: unmatched };
    }

    // ─────────────────────────────────────────────
    // BANK TRANSACTIONS
    // ─────────────────────────────────────────────

    async getTransactions(bankAccountId: string, filters: any = {}) {
        return this.prisma.bankTransaction.findMany({
            where: {
                bankAccountId,
                ...(filters.status ? { status: filters.status as BankTxStatus } : {}),
                ...(filters.startDate || filters.endDate ? {
                    transactionDate: {
                        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
                    }
                } : {}),
            },
            include: {
                journalEntry: { select: { number: true, memo: true } },
                matchLines: { select: { matchType: true, notes: true } }
            },
            orderBy: { transactionDate: 'desc' }
        });
    }

    async createTransaction(dto: any) {
        const amount = Number(dto.amount);
        const type: BankTransactionType = amount >= 0 ? 'DEBIT' : 'CREDIT';

        return this.prisma.bankTransaction.create({
            data: {
                bankAccountId: dto.bankAccountId,
                transactionDate: new Date(dto.transactionDate),
                valueDate: dto.valueDate ? new Date(dto.valueDate) : undefined,
                description: dto.description,
                reference: dto.reference,
                amount,
                type,
            }
        });
    }

    // ─────────────────────────────────────────────
    // CSV IMPORT
    // ─────────────────────────────────────────────

    async importCSV(bankAccountId: string, csvContent: string, userId?: string) {
        await this.getBankAccountById(bankAccountId);

        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) throw new BadRequestException('CSV vacío o sin datos');

        // Detect separator
        const separator = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, '').toLowerCase());

        // Flexible header mapping
        const colIdx = (names: string[]) => {
            for (const n of names) {
                const idx = headers.findIndex(h => h.includes(n));
                if (idx >= 0) return idx;
            }
            return -1;
        };

        const dateIdx = colIdx(['fecha', 'date', 'trans_date', 'transaction date']);
        const descIdx = colIdx(['descripcion', 'description', 'detalle', 'concepto', 'memo']);
        const amtIdx = colIdx(['monto', 'amount', 'importe', 'valor']);
        const debitIdx = colIdx(['debito', 'debe', 'debit', 'cargo']);
        const creditIdx = colIdx(['credito', 'haber', 'credit', 'abono']);
        const refIdx = colIdx(['referencia', 'reference', 'ref', 'numero']);
        const balIdx = colIdx(['saldo', 'balance', 'running_balance']);

        if (dateIdx < 0 || descIdx < 0) {
            throw new BadRequestException('CSV no tiene columnas reconocibles. Se necesita: fecha, descripción, monto/débito/crédito');
        }

        const batchId = `IMPORT-${Date.now()}`;
        const imported: any[] = [];
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const raw = lines[i].trim();
            if (!raw) continue;

            const cols = raw.split(separator).map(c => c.trim().replace(/"/g, ''));

            try {
                const rawDate = cols[dateIdx];
                const txDate = this.parseDate(rawDate);
                if (!txDate) continue;

                const desc = cols[descIdx] || 'Sin descripción';
                const ref = refIdx >= 0 ? cols[refIdx] : undefined;
                const bal = balIdx >= 0 ? this.parseNum(cols[balIdx]) : undefined;

                let amount = 0;
                if (amtIdx >= 0) {
                    amount = this.parseNum(cols[amtIdx]);
                } else if (debitIdx >= 0 || creditIdx >= 0) {
                    const deb = debitIdx >= 0 ? this.parseNum(cols[debitIdx]) : 0;
                    const cred = creditIdx >= 0 ? this.parseNum(cols[creditIdx]) : 0;
                    amount = deb > 0 ? deb : -cred; // Deposits positive, withdrawals negative
                }

                if (amount === 0) continue;

                const type: BankTransactionType = amount >= 0 ? 'DEBIT' : 'CREDIT';

                const tx = await this.prisma.bankTransaction.create({
                    data: {
                        bankAccountId,
                        transactionDate: txDate,
                        description: desc,
                        reference: ref,
                        amount,
                        runningBalance: bal,
                        type,
                        importBatchId: batchId,
                        status: 'UNMATCHED',
                    }
                });
                imported.push(tx);
            } catch (e) {
                errorCount++;
            }
        }

        // Auto-match after import
        const matched = await this.autoMatch(bankAccountId, imported.map(t => t.id));

        return {
            imported: imported.length,
            matched,
            errors: errorCount,
            batchId,
        };
    }

    // ─────────────────────────────────────────────
    // AUTO-MATCHING
    // ─────────────────────────────────────────────

    async autoMatch(bankAccountId: string, transactionIds?: string[]) {
        const txWhere: any = {
            bankAccountId,
            status: 'UNMATCHED',
            ...(transactionIds ? { id: { in: transactionIds } } : {})
        };

        const unmatchedTxs = await this.prisma.bankTransaction.findMany({ where: txWhere });

        let matchedCount = 0;

        for (const tx of unmatchedTxs) {
            // Find journal entry lines that match by amount and approximate date
            const txAmt = Math.abs(Number(tx.amount));
            const txDate = new Date(tx.transactionDate);
            const dateFrom = new Date(txDate);
            dateFrom.setDate(dateFrom.getDate() - 5);
            const dateTo = new Date(txDate);
            dateTo.setDate(dateTo.getDate() + 5);

            const matchingEntry = await this.prisma.journalEntry.findFirst({
                where: {
                    status: 'POSTED',
                    entryDate: { gte: dateFrom, lte: dateTo },
                    bankTransactions: { none: {} }, // not already matched
                    lines: {
                        some: {
                            OR: [
                                { debit: txAmt },
                                { credit: txAmt }
                            ]
                        }
                    }
                }
            });

            if (matchingEntry) {
                await this.prisma.bankTransaction.update({
                    where: { id: tx.id },
                    data: {
                        status: 'MATCHED',
                        journalEntryId: matchingEntry.id,
                    }
                });
                matchedCount++;
            }
        }

        return matchedCount;
    }

    async manualMatch(bankTransactionId: string, journalEntryId: string, reconciliationId: string, notes?: string, userId?: string) {
        const tx = await this.prisma.bankTransaction.findUnique({ where: { id: bankTransactionId } });
        if (!tx) throw new NotFoundException('Transacción bancaria no encontrada');

        await this.prisma.bankTransaction.update({
            where: { id: bankTransactionId },
            data: { status: 'MATCHED', journalEntryId }
        });

        return this.prisma.bankReconciliationMatch.create({
            data: {
                reconciliationId,
                bankTransactionId,
                journalEntryId,
                matchType: 'MANUAL',
                notes,
            }
        });
    }

    async ignoreTransaction(id: string) {
        return this.prisma.bankTransaction.update({
            where: { id },
            data: { status: 'IGNORED' }
        });
    }

    async unmatchTransaction(id: string) {
        await this.prisma.bankReconciliationMatch.deleteMany({ where: { bankTransactionId: id } });
        return this.prisma.bankTransaction.update({
            where: { id },
            data: { status: 'UNMATCHED', journalEntryId: null }
        });
    }

    // ─────────────────────────────────────────────
    // RECONCILIATION
    // ─────────────────────────────────────────────

    async getReconciliations(bankAccountId?: string) {
        return this.prisma.bankReconciliation.findMany({
            where: bankAccountId ? { bankAccountId } : {},
            include: {
                bankAccount: { select: { name: true, bankName: true } },
                _count: { select: { transactions: true, matches: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getReconciliationById(id: string) {
        const rec = await this.prisma.bankReconciliation.findUnique({
            where: { id },
            include: {
                bankAccount: true,
                transactions: {
                    include: {
                        journalEntry: { select: { number: true, memo: true } }
                    },
                    orderBy: { transactionDate: 'asc' }
                },
                matches: {
                    include: {
                        bankTransaction: true,
                        journalEntry: { select: { number: true, memo: true } }
                    }
                }
            }
        });
        if (!rec) throw new NotFoundException('Conciliación no encontrada');
        return rec;
    }

    async createReconciliation(dto: any, userId?: string) {
        const reconciliation = await this.prisma.bankReconciliation.create({
            data: {
                bankAccountId: dto.bankAccountId,
                periodStart: new Date(dto.periodStart),
                periodEnd: new Date(dto.periodEnd),
                statementBalance: Number(dto.statementBalance),
                bookBalance: Number(dto.bookBalance || 0),
                difference: Number(dto.statementBalance) - Number(dto.bookBalance || 0),
                notes: dto.notes,
                createdByUserId: userId,
            }
        });

        // Associate unmatched transactions for this period
        await this.prisma.bankTransaction.updateMany({
            where: {
                bankAccountId: dto.bankAccountId,
                transactionDate: {
                    gte: new Date(dto.periodStart),
                    lte: new Date(dto.periodEnd),
                },
                status: { in: ['UNMATCHED', 'MATCHED'] }
            },
            data: { reconciliationId: reconciliation.id }
        });

        // Auto-run matching for this account
        await this.autoMatch(dto.bankAccountId);

        return this.getReconciliationById(reconciliation.id);
    }

    async closeReconciliation(id: string, userId?: string) {
        const rec = await this.getReconciliationById(id);

        // Recalculate difference
        const reconciledTotal = rec.transactions
            .filter(t => ['MATCHED', 'RECONCILED'].includes(t.status))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const bookBalance = rec.bookBalance ? Number(rec.bookBalance) : 0;
        const difference = Number(rec.statementBalance) - bookBalance;

        // Mark all matched transactions as reconciled
        await this.prisma.bankTransaction.updateMany({
            where: { reconciliationId: id, status: 'MATCHED' },
            data: { status: 'RECONCILED', reconciledAt: new Date(), reconciledByUserId: userId }
        });

        return this.prisma.bankReconciliation.update({
            where: { id },
            data: {
                status: 'CLOSED',
                difference,
                closedAt: new Date(),
                closedByUserId: userId,
            }
        });
    }

    async updateBookBalance(id: string, bookBalance: number) {
        const rec = await this.prisma.bankReconciliation.findUnique({ where: { id } });
        if (!rec) throw new NotFoundException('Conciliación no encontrada');
        const difference = Number(rec.statementBalance) - bookBalance;
        return this.prisma.bankReconciliation.update({
            where: { id },
            data: { bookBalance, difference }
        });
    }

    // ─────────────────────────────────────────────
    // BANK-TO-BANK TRANSFER
    // ─────────────────────────────────────────────

    async createTransfer(dto: any, userId?: string) {
        const { fromBankId, toBankId, amount, description, date, reference } = dto;
        if (fromBankId === toBankId) throw new BadRequestException('El origen y destino no pueden ser el mismo banco');
        const amt = Math.abs(Number(amount));

        return this.prisma.$transaction(async tx => {
            // Outflow from source
            const outTx = await tx.bankTransaction.create({
                data: {
                    bankAccountId: fromBankId,
                    transactionDate: date ? new Date(date) : new Date(),
                    description: description || `Transferencia a banco`,
                    reference,
                    amount: -amt,
                    type: 'CREDIT',
                    status: 'MATCHED',
                }
            });

            // Inflow to dest
            const inTx = await tx.bankTransaction.create({
                data: {
                    bankAccountId: toBankId,
                    transactionDate: date ? new Date(date) : new Date(),
                    description: description || `Transferencia desde banco`,
                    reference,
                    amount: amt,
                    type: 'DEBIT',
                    status: 'MATCHED',
                }
            });

            // Update balances
            await tx.bankAccount.update({ where: { id: fromBankId }, data: { currentBalance: { decrement: amt } } });
            await tx.bankAccount.update({ where: { id: toBankId }, data: { currentBalance: { increment: amt } } });

            // Auto accounting entry
            await this.accountingService.generateAutoEntry({
                operationType: 'BANK_TRANSFER',
                referenceId: outTx.id,
                amount: amt,
                memo: description || 'Transferencia entre bancos',
                userId,
            });

            await this.notificationsService.notifyRole('CONTADURIA', {
                type: 'BANK_TRANSFER',
                title: 'Nueva Transferencia Bancaria',
                message: `${description || 'Transferencia entre bancos'} por ${amt.toLocaleString('es-PA', { style: 'currency', currency: 'USD' })}`,
                module: 'BANKING',
                entityType: 'BankTransaction',
                entityId: outTx.id,
                severity: 'INFO',
                actionUrl: `/contabilidad/tesoreria`,
            });

            return { outTx, inTx };
        });
    }

    // ─────────────────────────────────────────────
    // ACCOUNTING PERIODS
    // ─────────────────────────────────────────────

    async getPeriods() {
        return this.prisma.accountingPeriod.findMany({
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
    }

    async getPeriodById(id: string) {
        const p = await this.prisma.accountingPeriod.findUnique({ where: { id } });
        if (!p) throw new NotFoundException('Período no encontrado');
        return p;
    }

    async getOrCreateCurrentPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const monthName = now.toLocaleDateString('es-PA', { month: 'long', year: 'numeric' });

        return this.prisma.accountingPeriod.upsert({
            where: { year_month: { year, month } },
            update: {},
            create: { year, month, name: monthName, status: 'OPEN' }
        });
    }

    async closePeriod(id: string, userId: string) {
        const period = await this.getPeriodById(id);
        if (period.status === 'CLOSED') throw new BadRequestException('El período ya está cerrado');

        // Compute P&L for this period
        const startDate = new Date(period.year, period.month - 1, 1);
        const endDate = new Date(period.year, period.month, 0, 23, 59, 59);

        const pnl = await this.accountingService.getProfitAndLoss({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        });

        const checklist = {
            journalBalanced: true,
            reconciliationReviewed: true,
            pnlReviewed: true,
            closedAt: new Date().toISOString(),
        };

        const updatedPeriod = await this.prisma.accountingPeriod.update({
            where: { id },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                closedByUserId: userId,
                totalRevenue: pnl.totalRevenue,
                totalExpenses: pnl.totalExpenses,
                netIncome: pnl.netIncome,
                checklist,
            }
        });

        await this.notificationsService.notifyRole('CONTADURIA', {
            type: 'PERIOD_CLOSED',
            title: 'Periodo Contable Cerrado',
            message: `El periodo ${period.name} ha sido cerrado exitosamente.`,
            module: 'ACCOUNTING',
            severity: 'SUCCESS',
            actionUrl: `/contabilidad/cierres`,
        });

        return updatedPeriod;
    }

    async reopenPeriod(id: string, userId: string) {
        const period = await this.getPeriodById(id);
        if (period.status !== 'CLOSED') throw new BadRequestException('Solo se pueden reabrir períodos cerrados');

        const updatedPeriod = await this.prisma.accountingPeriod.update({
            where: { id },
            data: {
                status: 'REOPENED',
                reopenedAt: new Date(),
                reopenedByUserId: userId,
            }
        });

        await this.notificationsService.notifyRole('CONTADURIA', {
            type: 'PERIOD_REOPENED',
            title: 'Periodo Contable REABIERTO',
            message: `El periodo ${period.name} ha sido reabierto por el usuario.`,
            module: 'ACCOUNTING',
            severity: 'WARNING',
            actionUrl: `/contabilidad/cierres`,
        });

        return updatedPeriod;
    }

    async getPeriodChecklist(id: string) {
        const period = await this.getPeriodById(id);
        const startDate = new Date(period.year, period.month - 1, 1);
        const endDate = new Date(period.year, period.month, 0, 23, 59, 59);

        // Check unbalanced entries
        const allEntries = await this.prisma.journalEntry.findMany({
            where: {
                status: 'POSTED',
                entryDate: { gte: startDate, lte: endDate }
            },
            include: { lines: true }
        });

        let unbalancedCount = 0;
        for (const entry of allEntries) {
            const deb = entry.lines.reduce((s, l) => s + Number(l.debit), 0);
            const cred = entry.lines.reduce((s, l) => s + Number(l.credit), 0);
            if (Math.abs(deb - cred) > 0.01) unbalancedCount++;
        }

        // Check open reconciliations
        const openReconciliations = await this.prisma.bankReconciliation.count({
            where: { status: { in: ['IN_PROGRESS'] } }
        });

        return {
            period,
            checks: {
                journalEntries: { total: allEntries.length, unbalanced: unbalancedCount, ok: unbalancedCount === 0 },
                bankReconciliation: { openCount: openReconciliations, ok: openReconciliations === 0 },
            },
            canClose: unbalancedCount === 0,
        };
    }

    // ─────────────────────────────────────────────
    // CASH FLOW REAL
    // ─────────────────────────────────────────────

    async getCashFlowByBank(filters: any = {}) {
        const { startDate, endDate } = filters;
        const bankAccounts = await this.prisma.bankAccount.findMany({ where: { isActive: true } });

        const result: any[] = [];
        for (const bank of bankAccounts) {
            const txs = await this.prisma.bankTransaction.findMany({
                where: {
                    bankAccountId: bank.id,
                    ...(startDate || endDate ? {
                        transactionDate: {
                            ...(startDate ? { gte: new Date(startDate) } : {}),
                            ...(endDate ? { lte: new Date(endDate) } : {}),
                        }
                    } : {})
                }
            });

            const cashIn = txs.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
            const cashOut = txs.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

            result.push({
                bank,
                cashIn,
                cashOut,
                netFlow: cashIn - cashOut,
                transactionCount: txs.length,
            });
        }

        return {
            banks: result,
            totalCashIn: result.reduce((s, b) => s + b.cashIn, 0),
            totalCashOut: result.reduce((s, b) => s + b.cashOut, 0),
            totalNet: result.reduce((s, b) => s + b.netFlow, 0),
        };
    }

    // ─────────────────────────────────────────────
    // FINANCIAL REPORTS ADVANCED
    // ─────────────────────────────────────────────

    async getMonthlyComparison(year: number) {
        const months: any[] = [];
        for (let m = 1; m <= 12; m++) {
            const startDate = new Date(year, m - 1, 1).toISOString().split('T')[0];
            const endDate = new Date(year, m, 0).toISOString().split('T')[0];
            const pnl = await this.accountingService.getProfitAndLoss({ startDate, endDate });
            const monthName = new Date(year, m - 1, 1).toLocaleDateString('es-PA', { month: 'short' });
            months.push({ month: m, label: monthName, ...pnl });
        }
        return { year, months };
    }

    async getChannelComparison(filters: any = {}) {
        const [b2b, b2c, consolidated] = await Promise.all([
            this.accountingService.getProfitAndLoss({ ...filters, segment: 'B2B' }),
            this.accountingService.getProfitAndLoss({ ...filters, segment: 'B2C' }),
            this.accountingService.getProfitAndLoss({ ...filters }),
        ]);
        return { b2b, b2c, consolidated };
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    private parseDate(raw: string): Date | null {
        if (!raw) return null;
        // Try common formats: dd/mm/yyyy, mm/dd/yyyy, yyyy-mm-dd
        const clean = raw.trim().replace(/"/g, '');
        const formats = [
            /^(\d{2})\/(\d{2})\/(\d{4})$/, // dd/mm/yyyy
            /^(\d{4})-(\d{2})-(\d{2})$/,   // yyyy-mm-dd
            /^(\d{2})-(\d{2})-(\d{4})$/,   // dd-mm-yyyy
        ];

        for (const fmt of formats) {
            const m = clean.match(fmt);
            if (m) {
                if (fmt === formats[0]) return new Date(+m[3], +m[2] - 1, +m[1]);
                if (fmt === formats[1]) return new Date(+m[1], +m[2] - 1, +m[3]);
                if (fmt === formats[2]) return new Date(+m[3], +m[2] - 1, +m[1]);
            }
        }

        const d = new Date(clean);
        return isNaN(d.getTime()) ? null : d;
    }

    private parseNum(raw: string): number {
        if (!raw) return 0;
        const clean = raw.replace(/[^0-9.\-,]/g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    }
}
