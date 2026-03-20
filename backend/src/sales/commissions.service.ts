import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates invoice lines, calculates margins, and creates an initial CommissionRecord.
   * Call this when a new B2B invoice is generated.
   */
  async calculateInitialCommission(invoiceId: string) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          lines: {
            include: {
              product: true,
              salesOrderLine: true,
            },
          },
        },
      });

      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === 'CANCELLED') return;

      // Default rate if needed, or lookup from CommercialParams/User overrides.
      const params = await this.prisma.commercialParams.findFirst();
      const globalCommissionRate = params?.commissionRates ? (params.commissionRates as any)?.baseRate || 3.0 : 3.0;

      let commissionableAmount = new Decimal(0);

      // Evaluate business rule: Margin >= 10%
      for (const line of invoice.lines) {
        // Fallback cost hierarchy: SO Line -> Product Avg -> Product Standard -> 0
        const unitCostStr = line.salesOrderLine?.unitCost 
          || line.product.costAvgWeighted 
          || line.product.standardCost 
          || 0;
        
        const unitCost = new Decimal(unitCostStr as any);
        const unitPrice = new Decimal(line.unitPrice as any);
        const lineTotal = new Decimal(line.lineTotal as any);

        // Business rule Margin: (Price - Cost) / Price
        // Or if you use markup: (Price - Cost) / Cost
        // Let's use standard margin over price:
        let marginPercentage = new Decimal(0);
        if (unitPrice.gt(0)) {
          marginPercentage = unitPrice.minus(unitCost).div(unitPrice).times(100);
        }

        if (marginPercentage.gte(10)) {
          commissionableAmount = commissionableAmount.plus(lineTotal);
        }
      }

      const invoiceTotal = new Decimal(invoice.total as any);
      // Ensure commissionable amount never exceeds invoice total
      commissionableAmount = Decimal.min(commissionableAmount, invoiceTotal);
      const nonCommissionableAmount = invoiceTotal.minus(commissionableAmount);

      // Check if Seller exists (the user who created invoice or assigned to Customer/SO)
      let sellerUserId = invoice.createdByUserId;
      if (!sellerUserId) {
         // Try to find customer's assigned user
         const customer = await this.prisma.customer.findUnique({ where: { id: invoice.customerId }});
         sellerUserId = customer?.assignedSalesUserId || null;
      }
      
      if (!sellerUserId) {
         this.logger.warn(`No seller user found for invoice ${invoice.number}, skipping commission record.`);
         return;
      }

      const pendingAmount = commissionableAmount;

      await this.prisma.commissionRecord.create({
        data: {
          sellerUserId,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          saleDate: invoice.invoiceDate,
          invoiceTotal: invoiceTotal,
          commissionableAmount: commissionableAmount,
          nonCommissionableAmount: nonCommissionableAmount,
          paidAmount: 0,
          commissionEligibleAmount: 0,
          commissionPendingAmount: pendingAmount,
          commissionRate: globalCommissionRate,
          collectionStatus: 'PENDING',
          commissionStatus: 'PENDING_COLLECTION',
          periodMonth: invoice.invoiceDate.getMonth() + 1,
          periodYear: invoice.invoiceDate.getFullYear()
        }
      });
      
      this.logger.log(`Created CommissionRecord for Invoice ${invoice.number} - Commissionable: ${commissionableAmount}`);

    } catch (error) {
      this.logger.error(`Error calculating commission for invoice ${invoiceId}`, error);
      throw error;
    }
  }

  /**
   * Recalculates the eligible commission based on actual payment (receipt application).
   * Call this when a payment is applied, modified, or canceled for this invoice.
   */
  async recalculateEligibleCommission(invoiceId: string) {
    try {
      const record = await this.prisma.commissionRecord.findUnique({
        where: { invoiceId }
      });
      if (!record) return;

      // Sum all applied payments (where Receipt status is CONFIRMED)
      const apps = await this.prisma.receiptApplication.findMany({
        where: { 
          invoiceId,
          receipt: { status: 'CONFIRMED' }
        }
      });

      const totalPaid = apps.reduce((sum, app) => sum.plus(new Decimal(app.appliedAmount as any)), new Decimal(0));
      
      const invoiceTotal = new Decimal(record.invoiceTotal as any);
      const commissionableAmount = new Decimal(record.commissionableAmount as any);

      // Determine proportional payment
      let proportion = new Decimal(0);
      if (invoiceTotal.gt(0)) {
        proportion = totalPaid.div(invoiceTotal);
      }
      // Cap at 1 (100%)
      proportion = Decimal.min(proportion, 1);

      const eligibleAmount = commissionableAmount.times(proportion).toDecimalPlaces(2);
      const pendingAmount = commissionableAmount.minus(eligibleAmount);

      // Determine statuses
      let collectionStatus = 'PENDING';
      let commissionStatus = 'PENDING_COLLECTION';

      if (proportion.gte(1)) {
        collectionStatus = 'PAID';
        // Only mark ELIGIBLE if it hasn't been liquidated yet
        commissionStatus = record.commissionStatus === 'LIQUIDATED' ? 'LIQUIDATED' : 'ELIGIBLE';
      } else if (proportion.gt(0)) {
        collectionStatus = 'PARTIAL';
        commissionStatus = record.commissionStatus === 'LIQUIDATED' ? 'LIQUIDATED' : 'PARTIAL_ELIGIBLE';
      }

      await this.prisma.commissionRecord.update({
        where: { id: record.id },
        data: {
          paidAmount: totalPaid,
          commissionEligibleAmount: eligibleAmount,
          commissionPendingAmount: pendingAmount,
          collectionStatus,
          commissionStatus
        }
      });

      this.logger.log(`Recalculated CommissionRecord for Invoice ${invoiceId} - Paid: ${totalPaid}, Eligible: ${eligibleAmount}`);

    } catch (error) {
      this.logger.error(`Error recalculating commission for invoice ${invoiceId}`, error);
      throw error;
    }
  }
}
