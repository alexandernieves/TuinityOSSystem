import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { JournalEntry, JournalEntryDocument } from './schemas/journal-entry.schema';

@Injectable()
export class AccountingService implements OnModuleInit {
    constructor(
        @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
        @InjectModel(JournalEntry.name) private entryModel: Model<JournalEntryDocument>,
    ) { }

    async onModuleInit() {
        await this.seedCOA();
    }

    async findAllAccounts() {
        return this.accountModel.find().sort({ code: 1 }).exec();
    }

    async createAccount(dto: any) {
        const existing = await this.accountModel.findOne({ code: dto.code });
        if (existing) throw new BadRequestException('Account code already exists');
        return new this.accountModel(dto).save();
    }

    async findAllEntries() {
        return this.entryModel.find()
            .populate('createdBy', 'name')
            .sort({ date: -1, createdAt: -1 })
            .exec();
    }

    async createEntry(dto: any) {
        // Validate debits and credits balance
        const totalDebit = dto.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
        const totalCredit = dto.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new BadRequestException('Debits and Credits must balance');
        }

        // Generate reference
        const count = await this.entryModel.countDocuments();
        const year = new Date().getFullYear();
        const reference = `AS-${year}-${String(count + 1).padStart(4, '0')}`;

        const entry = new this.entryModel({
            ...dto,
            reference,
            status: 'posted'
        });

        const savedEntry = await entry.save();

        // Update Account Balances
        for (const line of dto.lines) {
            const amount = (line.debit || 0) - (line.credit || 0);
            await this.updateAccountBalance(line.accountId, amount);
        }

        return savedEntry;
    }

    private async updateAccountBalance(accountId: Types.ObjectId | string, amount: number) {
        const account = await this.accountModel.findById(accountId);
        if (!account) return;

        // Assets and Expenses increase with Debit (+)
        // Liabilities, Equity, and Revenue increase with Credit (-)
        // In our simple balance, we'll store as a signed number where Asset/Expense are normally positive
        // We can refine this logic later if needed.

        account.balance += amount;
        await account.save();

        // Recursively update parents if any
        if (account.parentId) {
            const parent = await this.accountModel.findOne({ code: account.parentId });
            if (parent) {
                parent.balance += amount;
                await parent.save();
            }
        }
    }

    async seedCOA() {
        const count = await this.accountModel.countDocuments();
        if (count > 0) return { message: 'COA already seeded' };

        const initialCOA = [
            { code: '1', name: 'ACTIVOS', type: 'asset', isGroup: true },
            { code: '1010', name: 'Efectivo y Equivalentes', type: 'asset', isGroup: true, parentId: '1' },
            { code: '1010.01', name: 'Caja General', type: 'asset', parentId: '1010' },
            { code: '1010.02', name: 'Banco General - Operativa', type: 'asset', parentId: '1010' },
            { code: '1020', name: 'Cuentas por Cobrar', type: 'asset', isGroup: true, parentId: '1' },
            { code: '1020.01', name: 'Clientes Locales', type: 'asset', parentId: '1020' },
            { code: '1030', name: 'Inventarios', type: 'asset', isGroup: true, parentId: '1' },
            { code: '1030.01', name: 'Inventario de Mercancía', type: 'asset', parentId: '1030' },

            { code: '2', name: 'PASIVOS', type: 'liability', isGroup: true },
            { code: '2010', name: 'Cuentas por Pagar', type: 'liability', isGroup: true, parentId: '2' },
            { code: '2010.01', name: 'Proveedores Nacionales', type: 'liability', parentId: '2010' },

            { code: '3', name: 'CAPITAL', type: 'equity', isGroup: true },
            { code: '3010', name: 'Capital Social', type: 'equity', parentId: '3' },

            { code: '4', name: 'INGRESOS', type: 'revenue', isGroup: true },
            { code: '4010', name: 'Ventas de Mercancía', type: 'revenue', parentId: '4' },

            { code: '5', name: 'GASTOS', type: 'expense', isGroup: true },
            { code: '5010', name: 'Costo de Ventas', type: 'expense', parentId: '5' },
            { code: '5020', name: 'Gastos Administrativos', type: 'expense', parentId: '5' },
        ];

        for (const item of initialCOA) {
            await new this.accountModel(item).save();
        }

        return { message: 'COA seeded successfully' };
    }
}
