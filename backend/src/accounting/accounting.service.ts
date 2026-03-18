import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { JournalEntryStatus, AccountType } from '@prisma/client';

@Injectable()
export class AccountingService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
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

            return tx.journalEntry.create({
                data: {
                    number,
                    entryDate: new Date(),
                    status: 'POSTED',
                    memo: `REVERSO de ${original.number}: ${reason}`,
                    referenceType: 'reversal',
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
            
            { code: '5', name: 'GASTOS', type: 'EXPENSE' },
            { code: '5010', name: 'Costo de Ventas', type: 'EXPENSE', parent: '5' },
            { code: '5010.01', name: 'Costo de Mercancía Vendida', type: 'EXPENSE', parent: '5010' },
            { code: '5020', name: 'Gastos Operativos', type: 'EXPENSE', parent: '5' },
            { code: '5030', name: 'Gastos de Tráfico y Documentación', type: 'EXPENSE', parent: '5' },
        ];

        for (const item of coaStructure) {
            const existing = await this.prisma.account.findFirst({ where: { code: item.code } });
            if (existing) continue; // already seeded

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

        return { message: 'COA seeded successfully' };
    }
}
