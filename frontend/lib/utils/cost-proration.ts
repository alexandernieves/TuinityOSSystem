/**
 * Cost Proration Utility (F11)
 * Distributes expenses proportionally by FOB value across purchase order lines.
 * Calculates CIF cost and detects cost increases > 10%.
 */

import type { PurchaseOrderLine, ExpenseBreakdown } from '@/lib/types/purchase-order';

export interface ProrationResult {
  lines: ProratedLine[];
  totalFOB: number;
  totalExpenses: number;
  totalCIF: number;
  hasAlerts: boolean;
  alerts: ProrationAlert[];
}

export interface ProratedLine {
  lineId: string;
  productId: string;
  productReference: string;
  productDescription: string;
  quantity: number;
  unitCostFOB: number;
  totalFOB: number;
  // Prorated values
  expenseShare: number;       // Share of total expenses for this line
  totalCIF: number;           // totalFOB + expenseShare
  unitCostCIF: number;        // totalCIF / quantity
  // Alert info
  previousCostCIF?: number;   // Previous CIF cost for comparison
  costIncrease?: number;      // % increase vs previous
  hasAlert: boolean;          // true if increase > 10%
}

export interface ProrationAlert {
  productReference: string;
  productDescription: string;
  previousCost: number;
  newCost: number;
  increasePercent: number;
}

/**
 * Prorate expenses across purchase order lines proportionally by FOB value.
 *
 * Formula: line_expense = (line_totalFOB / sum_totalFOB) * total_expenses
 * CIF = FOB + prorated_expenses
 */
export function prorateCosts(
  lines: PurchaseOrderLine[],
  expenses: ExpenseBreakdown,
  previousCosts?: Record<string, number> // productId -> previous CIF cost
): ProrationResult {
  const totalFOB = lines.reduce((sum, l) => sum + l.totalFOB, 0);
  const totalExpenses = expenses.total;
  const alerts: ProrationAlert[] = [];

  const proratedLines: ProratedLine[] = lines.map((line) => {
    // Weight = proportion of this line's FOB to total FOB
    const weight = totalFOB > 0 ? line.totalFOB / totalFOB : 0;
    const expenseShare = Math.round(weight * totalExpenses * 100) / 100;
    const totalCIF = line.totalFOB + expenseShare;
    const unitCostCIF = line.quantity > 0 ? Math.round((totalCIF / line.quantity) * 100) / 100 : 0;

    // Check for cost increase
    const previousCostCIF = previousCosts?.[line.productId];
    let costIncrease: number | undefined;
    let hasAlert = false;

    if (previousCostCIF && previousCostCIF > 0) {
      costIncrease = ((unitCostCIF - previousCostCIF) / previousCostCIF) * 100;
      if (costIncrease > 10) {
        hasAlert = true;
        alerts.push({
          productReference: line.productReference,
          productDescription: line.productDescription,
          previousCost: previousCostCIF,
          newCost: unitCostCIF,
          increasePercent: Math.round(costIncrease * 100) / 100,
        });
      }
    }

    return {
      lineId: line.id,
      productId: line.productId,
      productReference: line.productReference,
      productDescription: line.productDescription,
      quantity: line.quantity,
      unitCostFOB: line.unitCostFOB,
      totalFOB: line.totalFOB,
      expenseShare,
      totalCIF,
      unitCostCIF,
      previousCostCIF,
      costIncrease,
      hasAlert,
    };
  });

  return {
    lines: proratedLines,
    totalFOB,
    totalExpenses,
    totalCIF: totalFOB + totalExpenses,
    hasAlerts: alerts.length > 0,
    alerts,
  };
}

/**
 * Calculate expense breakdown from a percentage (quick mode)
 */
export function calculateExpensesFromPercentage(
  totalFOB: number,
  percentage: number
): ExpenseBreakdown {
  const total = Math.round(totalFOB * (percentage / 100) * 100) / 100;
  // Default distribution: 40% freight, 15% insurance, 25% customs, 15% handling, 5% other
  return {
    freight: Math.round(total * 0.40 * 100) / 100,
    insurance: Math.round(total * 0.15 * 100) / 100,
    customs: Math.round(total * 0.25 * 100) / 100,
    handling: Math.round(total * 0.15 * 100) / 100,
    other: Math.round(total * 0.05 * 100) / 100,
    total,
  };
}

/**
 * Format currency for display
 */
export function formatCostCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
