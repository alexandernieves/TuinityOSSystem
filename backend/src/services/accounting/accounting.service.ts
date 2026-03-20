import { Injectable } from '@nestjs/common';
import { PrismaService, BaseService } from '../shared';
import {
  Account,
  JournalEntry,
  JournalEntryLine,
  PrismaClient,
  AccountType,
  JournalEntryStatus
} from '@prisma/client';

export interface CreateAccountData {
  code: string;
  name: string;
  type: AccountType;
  parentAccountId?: string;
}

export interface CreateJournalEntryData {
  entryDate: Date;
  memo?: string;
  referenceType?: string;
  referenceId?: string;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    memo?: string;
  }>;
  createdByUserId?: string;
}

export interface PostJournalEntryData {
  journalEntryId: string;
  postedByUserId: string;
}

@Injectable()
export class AccountingService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Create account
   */
  async createAccount(data: CreateAccountData): Promise<Account> {
    return this.prisma.account.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        parentAccountId: data.parentAccountId,
        isActive: true,
      },
      include: {
        parentAccount: true,
        childAccounts: true,
      },
    });
  }

  /**
   * Create journal entry
   */
  async createJournalEntry(data: CreateJournalEntryData): Promise<JournalEntry> {
    // Validate debits equal credits
    const totalDebits = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Total debits must equal total credits');
    }

    const number = this.generateNumber('JE');

    return this.transaction(async (prisma) => {
      // Create journal entry header
      const journalEntry = await prisma.journalEntry.create({
        data: {
          number,
          entryDate: data.entryDate,
          status: JournalEntryStatus.DRAFT,
          memo: data.memo,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          createdByUserId: data.createdByUserId,
        },
      });

      // Create journal entry lines
      await Promise.all(
        data.lines.map((line) =>
          prisma.journalEntryLine.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              memo: line.memo,
            },
          })
        )
      );

      return prisma.journalEntry.findUnique({
        where: { id: journalEntry.id },
        include: {
          lines: {
            include: { account: true },
          },
          createdByUser: true,
        },
      }) as Promise<JournalEntry>;
    });
  }

  /**
   * Post journal entry
   */
  async postJournalEntry(data: PostJournalEntryData): Promise<JournalEntry> {
    return this.transaction(async (prisma) => {
      // Validate journal entry exists and is in DRAFT status
      const journalEntry = await prisma.journalEntry.findUnique({
        where: { id: data.journalEntryId },
        include: { lines: true },
      });

      if (!journalEntry) {
        throw new Error('Journal entry not found');
      }

      if (journalEntry.status !== JournalEntryStatus.DRAFT) {
        throw new Error('Journal entry must be in DRAFT status to post');
      }

      // Update journal entry status
      const updatedEntry = await prisma.journalEntry.update({
        where: { id: data.journalEntryId },
        data: {
          status: JournalEntryStatus.POSTED,
          postedByUserId: data.postedByUserId,
          postedAt: new Date(),
        },
        include: {
          lines: {
            include: { account: true },
          },
          createdByUser: true,
          postedByUser: true,
        },
      });

      return updatedEntry;
    });
  }

  /**
   * Reverse journal entry
   */
  async reverseJournalEntry(
    journalEntryId: string,
    reason?: string,
    postedByUserId?: string
  ): Promise<JournalEntry> {
    return this.transaction(async (prisma) => {
      // Get original journal entry
      const originalEntry = await prisma.journalEntry.findUnique({
        where: { id: journalEntryId },
        include: { lines: true },
      });

      if (!originalEntry) {
        throw new Error('Original journal entry not found');
      }

      if (originalEntry.status !== JournalEntryStatus.POSTED) {
        throw new Error('Only posted journal entries can be reversed');
      }

      // Create reversing entry
      const reverseNumber = `${originalEntry.number}-REV`;
      const reverseEntry = await prisma.journalEntry.create({
        data: {
          number: reverseNumber,
          entryDate: new Date(),
          status: JournalEntryStatus.POSTED,
          memo: `Reversal of ${originalEntry.number}${reason ? ': ' + reason : ''}`,
          referenceType: originalEntry.referenceType,
          referenceId: originalEntry.referenceId,
          createdByUserId: postedByUserId,
          postedByUserId: postedByUserId,
          postedAt: new Date(),
        },
      });

      // Create reversing lines (swap debits and credits)
      await Promise.all(
        originalEntry.lines.map((line) =>
          prisma.journalEntryLine.create({
            data: {
              journalEntryId: reverseEntry.id,
              accountId: line.accountId,
              debit: line.credit, // Swap
              credit: line.debit, // Swap
              memo: `Reversal of: ${line.memo || 'Original line'}`,
            },
          })
        )
      );

      // Update original entry status
      await prisma.journalEntry.update({
        where: { id: journalEntryId },
        data: { status: JournalEntryStatus.REVERSED },
      });

      return prisma.journalEntry.findUnique({
        where: { id: reverseEntry.id },
        include: {
          lines: {
            include: { account: true },
          },
          createdByUser: true,
          postedByUser: true,
        },
      }) as Promise<JournalEntry>;
    });
  }

  /**
   * Get account hierarchy
   */
  async getAccountHierarchy(): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { isActive: true },
      include: {
        parentAccount: true,
        childAccounts: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(asOfDate?: Date): Promise<any> {
    const cutoffDate = asOfDate || new Date();

    const accounts = await this.prisma.account.findMany({
      where: { isActive: true },
    });

    const trialBalance = await Promise.all(accounts.map(async account => {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          accountId: account.id,
          journalEntry: {
            status: JournalEntryStatus.POSTED,
            entryDate: { lte: cutoffDate },
          },
        },
      });

      const totalDebits = lines.reduce((sum, line) => sum + Number(line.debit), 0);
      const totalCredits = lines.reduce((sum, line) => sum + Number(line.credit), 0);

      let balance = 0;
      let balanceType: 'debit' | 'credit' = 'debit';

      const typeStr = account.type as string;
      if (['ASSET', 'EXPENSE'].includes(typeStr)) {
        balance = totalDebits - totalCredits;
        balanceType = balance >= 0 ? 'debit' : 'credit';
      } else {
        balance = totalCredits - totalDebits;
        balanceType = balance >= 0 ? 'credit' : 'debit';
      }

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        totalDebits,
        totalCredits,
        balance: Math.abs(balance),
        balanceType,
      };
    }));

    const totalDebits = trialBalance.reduce((sum, account) => sum + account.totalDebits, 0);
    const totalCredits = trialBalance.reduce((sum, account) => sum + account.totalCredits, 0);

    return {
      asOfDate: cutoffDate,
      accounts: trialBalance,
      totals: {
        debits: totalDebits,
        credits: totalCredits,
        balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
    };
  }

  /**
   * Get general ledger
   */
  async getGeneralLedger(filters: {
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      status: JournalEntryStatus.POSTED,
    };

    if (filters.startDate || filters.endDate) {
      where.entryDate = {};
      if (filters.startDate) where.entryDate.gte = filters.startDate;
      if (filters.endDate) where.entryDate.lte = filters.endDate;
    }

    const journalEntries = await this.prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: { account: true },
          where: filters.accountId ? { accountId: filters.accountId } : undefined,
        },
        createdByUser: true,
        postedByUser: true,
      },
      orderBy: { entryDate: 'desc' },
    });

    // Filter out entries with no matching lines if accountId is specified
    const filteredEntries = journalEntries.filter(entry => 
      !filters.accountId || entry.lines.length > 0
    );

    return filteredEntries;
  }

  /**
   * Get chart of accounts
   */
  async getChartOfAccounts(): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { isActive: true },
      include: {
        parentAccount: true,
        childAccounts: true,
        _count: {
          select: { journalEntryLines: true },
        },
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' },
      ],
    });
  }
}
