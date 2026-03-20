import { api } from '@/lib/services/api';

export interface CommissionRecord {
  id: string;
  sellerUserId: string;
  invoiceId: string;
  customerId: string;
  saleDate: string;
  invoiceTotal: string;
  commissionableAmount: string;
  nonCommissionableAmount: string;
  paidAmount: string;
  commissionEligibleAmount: string;
  commissionPendingAmount: string;
  commissionRate: string | null;
  collectionStatus: 'PENDING' | 'PARTIAL' | 'PAID';
  commissionStatus: 'PENDING_COLLECTION' | 'PARTIAL_ELIGIBLE' | 'ELIGIBLE' | 'LIQUIDATED';
  seller: { id: string; name: string; email: string; };
  customer: { id: string; legalName: string; code: string; };
  invoice: { id: string; number: string; };
}

export interface CommissionsSummary {
  invoiceTotal: number;
  commissionableAmount: number;
  commissionEligibleAmount: number;
  commissionPendingAmount: number;
}

export const commissionsService = {
  getAll: async (params?: Record<string, string>): Promise<CommissionRecord[]> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const { data } = await api.get(`/commissions?${searchParams.toString()}`);
    return data;
  },

  getSummary: async (params?: Record<string, string>): Promise<CommissionsSummary> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const { data } = await api.get(`/commissions/summary?${searchParams.toString()}`);
    return data;
  },

  liquidate: async (ids: string[]): Promise<any> => {
    const { data } = await api.post(`/commissions/liquidate`, { ids });
    return data;
  },
  
  recalculate: async (invoiceId: string): Promise<any> => {
    const { data } = await api.post(`/commissions/recalculate/${invoiceId}`);
    return data;
  }
};
