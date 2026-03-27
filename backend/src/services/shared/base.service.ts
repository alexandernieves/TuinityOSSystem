import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export abstract class BaseService {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Execute operation within a transaction
   */
  protected async transaction<T>(
    fn: (prisma: PrismaClient | any) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
  ): Promise<T> {
    return this.prisma.transaction(fn, options);
  }

  /**
   * Execute multiple operations in a batch
   */
  protected async batch<T>(operations: Prisma.PrismaPromise<T>[]): Promise<T[]> {
    return this.prisma.batch(operations);
  }

  /**
   * Helper to generate unique numbers
   */
  protected generateNumber(prefix: string, length: number = 8): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, length);
    return `${prefix}${timestamp.slice(-6)}${random}`.toUpperCase();
  }
}
