import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Execute a function within a Prisma transaction
   * @param fn - Function to execute within transaction
   * @param options - Transaction options (timeout, isolationLevel)
   * @returns Result of the transaction
   */
  async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
  ): Promise<T> {
    return this.$transaction(fn, options);
  }

  /**
   * Execute multiple operations in a batch
   * @param operations - Array of Prisma operations
   * @returns Array of results
   */
  async batch<T>(operations: Prisma.PrismaPromise<T>[]): Promise<T[]> {
    return this.$transaction(operations);
  }
}
