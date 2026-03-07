/**
 * Reorder Point Recommendation Engine (F2)
 * Suggests optimal reorder points based on mock sales velocity data.
 *
 * Algorithm (mock):
 *   recommended = avg_monthly_sales × lead_time_months × safety_factor
 *
 * In production this would use real sales history; here we approximate
 * from the product's stock turnover patterns.
 */

import type { Product } from '@/lib/types/product';

export interface ReorderRecommendation {
  productId: string;
  productReference: string;
  productDescription: string;
  group: string;
  currentReorderPoint: number | undefined;
  recommendedReorderPoint: number;
  difference: number; // recommended - current (positive = should increase)
  avgMonthlySales: number;
  leadTimeDays: number;
  safetyFactor: number;
  confidence: 'alta' | 'media' | 'baja';
  status: 'pending' | 'accepted' | 'adjusted' | 'rejected';
}

// Mock average monthly sales based on stock patterns
function estimateMonthlySales(product: Product): number {
  // Simulate: higher-stock products sell more, premium products sell less
  const baseRate = product.stock.existence > 0
    ? Math.max(5, Math.round(product.stock.existence * 0.3))
    : Math.max(3, Math.round(product.minimumQty * 0.5));

  // Adjust by price tier: cheaper products move faster
  const priceAdjust = product.prices.A < 100 ? 1.5
    : product.prices.A < 300 ? 1.0
    : product.prices.A < 600 ? 0.7
    : 0.4;

  return Math.round(baseRate * priceAdjust);
}

// Mock lead time by supplier country
function estimateLeadTimeDays(product: Product): number {
  const countryLeadTimes: Record<string, number> = {
    'ESCOCIA': 45,
    'MEXICO': 30,
    'ITALIA': 40,
    'ESTADOS UNIDOS': 25,
    'VENEZUELA': 20,
    'JAMAICA': 35,
  };
  return countryLeadTimes[product.country] || 35;
}

/**
 * Generate reorder point recommendations for all products
 */
export function generateRecommendations(products: Product[]): ReorderRecommendation[] {
  const SAFETY_FACTOR = 1.3; // 30% safety margin

  return products
    .filter((p) => p.status === 'active')
    .map((product) => {
      const avgMonthlySales = estimateMonthlySales(product);
      const leadTimeDays = estimateLeadTimeDays(product);
      const leadTimeMonths = leadTimeDays / 30;

      const recommended = Math.ceil(avgMonthlySales * leadTimeMonths * SAFETY_FACTOR);
      const current = product.reorderPoint;
      const difference = recommended - (current ?? 0);

      // Confidence based on stock history indicators
      const confidence: 'alta' | 'media' | 'baja' =
        product.stock.existence > 0 && product.stock.reserved > 0 ? 'alta'
        : product.stock.existence > 0 ? 'media'
        : 'baja';

      return {
        productId: product.id,
        productReference: product.reference,
        productDescription: product.description,
        group: product.group,
        currentReorderPoint: current,
        recommendedReorderPoint: recommended,
        difference,
        avgMonthlySales,
        leadTimeDays,
        safetyFactor: SAFETY_FACTOR,
        confidence,
        status: 'pending' as const,
      };
    })
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference)); // Biggest gaps first
}

/**
 * Get summary stats for recommendations
 */
export function getRecommendationStats(recommendations: ReorderRecommendation[]) {
  const needsIncrease = recommendations.filter((r) => r.difference > 0).length;
  const needsDecrease = recommendations.filter((r) => r.difference < 0).length;
  const noChange = recommendations.filter((r) => r.difference === 0).length;
  const notSet = recommendations.filter((r) => r.currentReorderPoint == null).length;

  return { total: recommendations.length, needsIncrease, needsDecrease, noChange, notSet };
}
