/**
 * KYC / Due Diligence Types (F9)
 * Formulario de Debida Diligencia integrado en el perfil de cliente.
 */

export type KYCStatus = 'not_required' | 'pending' | 'in_review' | 'approved' | 'expired' | 'rejected';

export interface KYCForm {
  id: string;
  clientId: string;
  clientName: string;
  status: KYCStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  approvedAt?: string;
  expiresAt?: string;         // 1 year from approval
  rejectionReason?: string;

  // Beneficiary info
  beneficiaryName: string;
  beneficiaryIdType: string;  // "Cédula", "Pasaporte", "RUC"
  beneficiaryIdNumber: string;
  beneficiaryNationality: string;
  beneficiaryAddress: string;
  beneficiaryPhone: string;
  beneficiaryEmail: string;

  // Source of funds
  sourceOfFunds: string;       // "Actividad Comercial", "Inversiones", "Herencia", "Otro"
  sourceOfFundsDetail?: string;
  annualRevenue?: string;      // Revenue range

  // PEP (Politically Exposed Person)
  isPEP: boolean;
  pepDetail?: string;

  // Company info (if applicable)
  companyRegistration?: string;
  companyActivity?: string;
  companyYearsInBusiness?: number;

  // Documents (mock - just names)
  documents: KYCDocument[];

  // Notes
  notes?: string;
}

export interface KYCDocument {
  id: string;
  name: string;
  type: 'id_copy' | 'company_registration' | 'financial_statement' | 'reference_letter' | 'other';
  uploadedAt: string;
  fileName: string;
  status: 'pending' | 'verified' | 'rejected';
}

export const KYC_STATUS_CONFIG: Record<KYCStatus, { bg: string; text: string; label: string }> = {
  not_required: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'No Requerido' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Pendiente' },
  in_review: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'En Revisión' },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Aprobado' },
  expired: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Vencido' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Rechazado' },
};

export const SOURCE_OF_FUNDS_OPTIONS = [
  'Actividad Comercial',
  'Inversiones',
  'Herencia',
  'Remesas',
  'Otro',
];

export const ID_TYPE_OPTIONS = [
  'Cédula',
  'Pasaporte',
  'RUC',
  'NIT',
  'EIN',
];

export const ANNUAL_REVENUE_RANGES = [
  'Menos de $50,000',
  '$50,000 - $200,000',
  '$200,000 - $500,000',
  '$500,000 - $1,000,000',
  'Más de $1,000,000',
];
