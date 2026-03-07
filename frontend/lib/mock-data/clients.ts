/**
 * Mock data for Clients (Ventas B2B module)
 * Based on Document 005 specifications
 * Store-backed: data persists in localStorage
 */

import type {
  Client,
  ClientContact,
  ClientFilters,
  ClientStats,
  ClientStatus,
  CreditStatus,
  PriceLevel,
  ShippingAddress,
} from '@/lib/types/client';
import { loadCollection, saveCollection, createSubscribers } from '@/lib/store/local-store';

// Seed data (used on first load only)
const SEED_CLIENTS: Client[] = [
  {
    id: 'CLI-00007',
    name: 'MARIA DEL MAR PEREZ SV',
    tradeName: 'Distribuidora Del Mar',
    taxId: '0614-150120-102-7',
    taxIdType: 'NIT',
    country: 'El Salvador',
    city: 'San Salvador',
    address: 'Calle Max Block, Centro Comercial Las Cascadas',
    priceLevel: 'B',
    creditLimit: 50000,
    creditUsed: 14040,
    creditAvailable: 35960,
    paymentTerms: 'credito_30',
    contacts: [
      {
        id: 'CON-001',
        name: 'María del Mar Pérez',
        email: 'mdelmar@distribuidoradelmar.sv',
        phone: '+503 2222-3333',
        role: 'Gerente General',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-001',
        label: 'Principal',
        address: 'Calle Max Block, Centro Comercial Las Cascadas',
        city: 'San Salvador',
        country: 'El Salvador',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    kycStatus: 'approved',
    kycExpiresAt: '2026-12-15T00:00:00Z',
    status: 'active',
    createdAt: '2020-03-15T10:00:00Z',
    updatedAt: '2026-02-24T08:30:00Z',
    lastOrderDate: '2026-02-23T14:00:00Z',
    totalOrders: 156,
    totalPurchases: 485000,
    averageOrderValue: 3109,
  },
  {
    id: 'CLI-00509',
    name: 'SULTAN WHOLESALE',
    tradeName: 'Sultan Trading LLC',
    taxId: '98-7654321',
    taxIdType: 'EIN',
    country: 'Estados Unidos',
    city: 'Miami',
    address: '1200 Brickell Ave, Suite 500',
    priceLevel: 'A',
    creditLimit: 500000,
    creditUsed: 182557,
    creditAvailable: 317443,
    paymentTerms: 'credito_60',
    contacts: [
      {
        id: 'CON-002',
        name: 'Ahmed Sultan',
        email: 'ahmed@sultanwholesale.com',
        phone: '+1 305-555-1234',
        role: 'CEO',
        isPrimary: true,
      },
      {
        id: 'CON-003',
        name: 'Sofia Martinez',
        email: 'sofia@sultanwholesale.com',
        phone: '+1 305-555-1235',
        role: 'Compras',
        isPrimary: false,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-002',
        label: 'Warehouse Miami',
        address: '8000 NW 25th St, Doral, FL 33122',
        city: 'Miami',
        country: 'Estados Unidos',
        postalCode: '33122',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    kycStatus: 'expired',
    kycExpiresAt: '2025-11-01T00:00:00Z',
    status: 'active',
    createdAt: '2019-06-20T10:00:00Z',
    updatedAt: '2026-02-24T09:00:00Z',
    lastOrderDate: '2026-01-30T11:00:00Z',
    totalOrders: 89,
    totalPurchases: 2850000,
    averageOrderValue: 32022,
  },
  {
    id: 'CLI-00032',
    name: 'PONCHO PLACE',
    tradeName: 'Poncho Place S.A.S.',
    taxId: '900123456-7',
    taxIdType: 'NIT',
    country: 'Colombia',
    city: 'Bogotá',
    address: 'Carrera 7 #127-35, Oficina 401',
    priceLevel: 'B',
    creditLimit: 0, // Contado
    creditUsed: 0,
    creditAvailable: 0,
    paymentTerms: 'contado',
    contacts: [
      {
        id: 'CON-004',
        name: 'Alfonso "Poncho" Rodriguez',
        email: 'poncho@ponchoplace.co',
        phone: '+57 1 555 4567',
        role: 'Propietario',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-003',
        label: 'Bogotá',
        address: 'Carrera 7 #127-35',
        city: 'Bogotá',
        country: 'Colombia',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    status: 'active',
    createdAt: '2021-02-10T10:00:00Z',
    updatedAt: '2026-02-24T10:00:00Z',
    lastOrderDate: '2026-02-24T08:00:00Z',
    totalOrders: 67,
    totalPurchases: 425000,
    averageOrderValue: 6343,
  },
  {
    id: 'CLI-00077',
    name: 'MEDIMEX, S.A.',
    tradeName: 'Medimex Importaciones',
    taxId: '155678-1-456789',
    taxIdType: 'RUC',
    country: 'Panamá',
    city: 'Ciudad de Panamá',
    address: 'Vía España, Torre Banco General, Piso 12',
    priceLevel: 'B',
    creditLimit: 100000,
    creditUsed: 12780,
    creditAvailable: 87220,
    paymentTerms: 'credito_30',
    contacts: [
      {
        id: 'CON-005',
        name: 'Roberto Medina',
        email: 'rmedina@medimex.pa',
        phone: '+507 263-4567',
        role: 'Director Comercial',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-004',
        label: 'Oficina Central',
        address: 'Vía España, Torre Banco General',
        city: 'Ciudad de Panamá',
        country: 'Panamá',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    kycStatus: 'pending',
    status: 'active',
    createdAt: '2018-11-05T10:00:00Z',
    updatedAt: '2026-02-20T14:00:00Z',
    lastOrderDate: '2026-02-04T09:00:00Z',
    totalOrders: 234,
    totalPurchases: 1250000,
    averageOrderValue: 5342,
  },
  {
    id: 'CLI-00896',
    name: 'INVERSIONES DISCARIBBEAN SAS',
    tradeName: 'DisCaribbean',
    taxId: '860034567-1',
    taxIdType: 'NIT',
    country: 'Colombia',
    city: 'Cartagena',
    address: 'Centro Histórico, Calle del Arsenal #6-25',
    priceLevel: 'C',
    creditLimit: 0, // Contado
    creditUsed: 0,
    creditAvailable: 0,
    paymentTerms: 'contado',
    contacts: [
      {
        id: 'CON-006',
        name: 'Carolina Herrera',
        email: 'carolina@discaribbean.co',
        phone: '+57 5 664 8900',
        role: 'Gerente de Compras',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-005',
        label: 'Cartagena',
        address: 'Centro Histórico, Calle del Arsenal #6-25',
        city: 'Cartagena',
        country: 'Colombia',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    status: 'active',
    createdAt: '2023-04-15T10:00:00Z',
    updatedAt: '2026-02-19T16:00:00Z',
    lastOrderDate: '2026-02-19T10:00:00Z',
    totalOrders: 28,
    totalPurchases: 85000,
    averageOrderValue: 3036,
  },
  {
    id: 'CLI-00979',
    name: 'GIACOMO PAOLO LECCESE TURCONI',
    tradeName: 'GP Imports',
    taxId: 'IT-12345678901',
    taxIdType: 'VAT',
    country: 'Italia',
    city: 'Milano',
    address: 'Via Monte Napoleone 8',
    priceLevel: 'B',
    creditLimit: 0, // Contado
    creditUsed: 0,
    creditAvailable: 0,
    paymentTerms: 'contado',
    contacts: [
      {
        id: 'CON-007',
        name: 'Giacomo Paolo Leccese',
        email: 'giacomo@gpimports.it',
        phone: '+39 02 7601 8888',
        role: 'Propietario',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-006',
        label: 'Milano',
        address: 'Via Monte Napoleone 8',
        city: 'Milano',
        country: 'Italia',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    status: 'active',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2026-02-19T11:00:00Z',
    lastOrderDate: '2026-02-19T09:00:00Z',
    totalOrders: 12,
    totalPurchases: 95000,
    averageOrderValue: 7917,
  },
  {
    id: 'CLI-00045',
    name: 'DT LICORES',
    tradeName: 'DT Licores Distribuciones',
    taxId: '0801-199005-123-4',
    taxIdType: 'RTN',
    country: 'Honduras',
    city: 'Tegucigalpa',
    address: 'Boulevard Morazán, Centro Comercial Plaza Miraflores',
    priceLevel: 'B',
    creditLimit: 75000,
    creditUsed: 3957,
    creditAvailable: 71043,
    paymentTerms: 'credito_30',
    contacts: [
      {
        id: 'CON-008',
        name: 'Daniel Torres',
        email: 'dtorres@dtlicores.hn',
        phone: '+504 2234-5678',
        role: 'Director',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-007',
        label: 'Tegucigalpa',
        address: 'Boulevard Morazán, Centro Comercial Plaza Miraflores',
        city: 'Tegucigalpa',
        country: 'Honduras',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    status: 'active',
    createdAt: '2019-08-10T10:00:00Z',
    updatedAt: '2026-02-24T07:00:00Z',
    lastOrderDate: '2026-02-24T07:00:00Z',
    totalOrders: 145,
    totalPurchases: 520000,
    averageOrderValue: 3586,
  },
  {
    id: 'CLI-00123',
    name: 'BRAND DISTRIBUIDOR CURACAO',
    tradeName: 'Brand Curacao NV',
    taxId: 'CW-89012345',
    taxIdType: 'CRIB',
    country: 'Curazao',
    city: 'Willemstad',
    address: 'Handelskade 12, Punda',
    priceLevel: 'A',
    creditLimit: 300000,
    creditUsed: 45000,
    creditAvailable: 255000,
    paymentTerms: 'credito_45',
    contacts: [
      {
        id: 'CON-009',
        name: 'Willem Brand',
        email: 'willem@brandcuracao.cw',
        phone: '+599 9 461 2345',
        role: 'Managing Director',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-008',
        label: 'Willemstad',
        address: 'Handelskade 12, Punda',
        city: 'Willemstad',
        country: 'Curazao',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    status: 'active',
    notes: 'Cliente VIP - Compra lotes completos. Negociación directa con Javier.',
    createdAt: '2017-03-01T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
    lastOrderDate: '2026-02-15T10:00:00Z',
    totalOrders: 78,
    totalPurchases: 4500000,
    averageOrderValue: 57692,
  },
  {
    id: 'CLI-00088',
    name: 'MERCANSA',
    tradeName: 'Mercansa Comercial S.A.',
    taxId: '3-101-123456',
    taxIdType: 'Cédula Jurídica',
    country: 'Costa Rica',
    city: 'San José',
    address: 'La Uruca, Zona Industrial',
    priceLevel: 'B',
    creditLimit: 80000,
    creditUsed: 22500,
    creditAvailable: 57500,
    paymentTerms: 'credito_30',
    contacts: [
      {
        id: 'CON-010',
        name: 'Carlos Mercado',
        email: 'cmercado@mercansa.cr',
        phone: '+506 2222-4567',
        role: 'Gerente General',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-009',
        label: 'San José',
        address: 'La Uruca, Zona Industrial',
        city: 'San José',
        country: 'Costa Rica',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    status: 'active',
    createdAt: '2018-05-15T10:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z',
    lastOrderDate: '2026-02-10T10:00:00Z',
    totalOrders: 189,
    totalPurchases: 890000,
    averageOrderValue: 4709,
  },
  {
    id: 'CLI-00234',
    name: 'LEONILDE SANCHEZ PEÑA',
    tradeName: 'Distribuidora Sanchez',
    taxId: '155234-1-567890',
    taxIdType: 'RUC',
    country: 'Panamá',
    city: 'David',
    address: 'Calle Central, Barrio Bolívar',
    priceLevel: 'C',
    creditLimit: 25000,
    creditUsed: 15002,
    creditAvailable: 9998,
    paymentTerms: 'credito_15',
    contacts: [
      {
        id: 'CON-011',
        name: 'Leonilde Sanchez',
        email: 'lsanchez@distsanchez.com',
        phone: '+507 775-1234',
        role: 'Propietaria',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-010',
        label: 'David',
        address: 'Calle Central, Barrio Bolívar',
        city: 'David',
        country: 'Panamá',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    status: 'active',
    createdAt: '2019-09-20T10:00:00Z',
    updatedAt: '2026-01-25T10:00:00Z',
    lastOrderDate: '2026-01-25T10:00:00Z',
    totalOrders: 98,
    totalPurchases: 245000,
    averageOrderValue: 2500,
  },
  {
    id: 'CLI-00567',
    name: 'FLOCK-COMERCIO DE BEBIDAS',
    tradeName: 'Flock Bebidas Ltda',
    taxId: '12.345.678/0001-90',
    taxIdType: 'CNPJ',
    country: 'Brasil',
    city: 'São Paulo',
    address: 'Av. Paulista 1000, Conjunto 501',
    priceLevel: 'A',
    creditLimit: 400000,
    creditUsed: 60025,
    creditAvailable: 339975,
    paymentTerms: 'credito_60',
    contacts: [
      {
        id: 'CON-012',
        name: 'Ricardo Flock',
        email: 'ricardo@flockbebidas.com.br',
        phone: '+55 11 3456-7890',
        role: 'Diretor Comercial',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-011',
        label: 'São Paulo',
        address: 'Av. Paulista 1000, Conjunto 501',
        city: 'São Paulo',
        country: 'Brasil',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    status: 'active',
    createdAt: '2018-02-10T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
    lastOrderDate: '2026-02-01T10:00:00Z',
    totalOrders: 56,
    totalPurchases: 3200000,
    averageOrderValue: 57143,
  },
  {
    id: 'CLI-00890',
    name: 'GUILLERMO SOSA VELEZ',
    tradeName: 'Sosa Imports',
    taxId: '8-234-567',
    taxIdType: 'Cédula',
    country: 'Panamá',
    city: 'Ciudad de Panamá',
    address: 'Calle 50, Edificio Global Bank, Piso 8',
    priceLevel: 'C',
    creditLimit: 35000,
    creditUsed: 31030,
    creditAvailable: 3970,
    paymentTerms: 'credito_30',
    contacts: [
      {
        id: 'CON-013',
        name: 'Guillermo Sosa',
        email: 'gsosa@sosaimports.com',
        phone: '+507 264-5678',
        role: 'Propietario',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-012',
        label: 'Panamá City',
        address: 'Calle 50, Edificio Global Bank',
        city: 'Ciudad de Panamá',
        country: 'Panamá',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    status: 'active',
    notes: 'Crédito cercano al límite - revisar antes de aprobar nuevos pedidos.',
    createdAt: '2020-06-15T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
    lastOrderDate: '2026-02-20T10:00:00Z',
    totalOrders: 67,
    totalPurchases: 310000,
    averageOrderValue: 4627,
  },
  {
    id: 'CLI-00456',
    name: 'FRANCISCO QUINTERO',
    tradeName: 'Quintero Distribuciones',
    taxId: '155345-1-678901',
    taxIdType: 'RUC',
    country: 'Panamá',
    city: 'Colón',
    address: 'Zona Libre de Colón, Edificio 45',
    priceLevel: 'B',
    creditLimit: 60000,
    creditUsed: 11800,
    creditAvailable: 48200,
    paymentTerms: 'credito_30',
    contacts: [
      {
        id: 'CON-014',
        name: 'Francisco Quintero',
        email: 'fquintero@quinterodist.com',
        phone: '+507 441-2345',
        role: 'Gerente',
        isPrimary: true,
      },
    ],
    shippingAddresses: [
      {
        id: 'ADDR-013',
        label: 'Zona Libre',
        address: 'Zona Libre de Colón, Edificio 45',
        city: 'Colón',
        country: 'Panamá',
        isDefault: true,
      },
    ],
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    status: 'active',
    createdAt: '2019-04-10T10:00:00Z',
    updatedAt: '2026-02-18T10:00:00Z',
    lastOrderDate: '2026-02-18T10:00:00Z',
    totalOrders: 112,
    totalPurchases: 580000,
    averageOrderValue: 5179,
  },
  {
    id: 'CLI-00999',
    name: 'CLIENTE BLOQUEADO EJEMPLO',
    tradeName: 'Empresa Morosa',
    taxId: '123456789',
    taxIdType: 'NIT',
    country: 'Venezuela',
    city: 'Caracas',
    address: 'Av. Francisco de Miranda',
    priceLevel: 'D',
    creditLimit: 20000,
    creditUsed: 25000,
    creditAvailable: -5000,
    paymentTerms: 'credito_30',
    contacts: [
      {
        id: 'CON-015',
        name: 'Juan Moroso',
        email: 'jmoroso@example.com',
        phone: '+58 212 123 4567',
        role: 'Contacto',
        isPrimary: true,
      },
    ],
    shippingAddresses: [],
    status: 'blocked',
    notes: 'BLOQUEADO: Excede límite de crédito. Deuda vencida de 90+ días.',
    createdAt: '2022-01-01T10:00:00Z',
    updatedAt: '2025-06-15T10:00:00Z',
    lastOrderDate: '2025-03-01T10:00:00Z',
    totalOrders: 15,
    totalPurchases: 45000,
    averageOrderValue: 3000,
  },
];

// ============================================================================
// STORE INFRASTRUCTURE
// ============================================================================

let _clients: Client[] = SEED_CLIENTS;
let _initialized = false;
const { subscribe: subscribeClients, notify: _notifyClients } = createSubscribers();

function ensureInitialized(): void {
  if (typeof window === 'undefined' || _initialized) return;
  _clients = loadCollection<Client>('clients', SEED_CLIENTS);
  _initialized = true;
}

export function getClientsData(): Client[] {
  ensureInitialized();
  return _clients;
}

export { subscribeClients };

// Backward-compatible export
export const MOCK_CLIENTS: Client[] = new Proxy(SEED_CLIENTS as Client[], {
  get(_target, prop, receiver) {
    ensureInitialized();
    return Reflect.get(_clients, prop, receiver);
  },
});

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export function addClient(client: Client): void {
  ensureInitialized();
  _clients = [..._clients, client];
  saveCollection('clients', _clients);
  _notifyClients();
}

export function updateClient(id: string, updates: Partial<Client>): void {
  ensureInitialized();
  _clients = _clients.map((c) =>
    c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
  );
  saveCollection('clients', _clients);
  _notifyClients();
}

export function removeClient(id: string): void {
  ensureInitialized();
  _clients = _clients.filter((c) => c.id !== id);
  saveCollection('clients', _clients);
  _notifyClients();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getClientById(id: string): Client | undefined {
  ensureInitialized();
  return _clients.find((client) => client.id === id);
}

export function getClients(filters?: ClientFilters): Client[] {
  ensureInitialized();
  let clients = [..._clients];

  if (!filters) return clients;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.tradeName?.toLowerCase().includes(searchLower) ||
        c.taxId.toLowerCase().includes(searchLower) ||
        c.id.toLowerCase().includes(searchLower)
    );
  }

  if (filters.priceLevel && filters.priceLevel !== 'all') {
    clients = clients.filter((c) => c.priceLevel === filters.priceLevel);
  }

  if (filters.country) {
    clients = clients.filter((c) => c.country === filters.country);
  }

  if (filters.status && filters.status !== 'all') {
    clients = clients.filter((c) => c.status === filters.status);
  }

  if (filters.hasCreditAvailable) {
    clients = clients.filter((c) => c.creditAvailable > 0);
  }

  if (filters.salesRepId) {
    clients = clients.filter((c) => c.salesRepId === filters.salesRepId);
  }

  return clients;
}

export function getClientStats(): ClientStats {
  ensureInitialized();
  const totalClients = _clients.length;
  const activeClients = _clients.filter((c) => c.status === 'active').length;
  const withCreditAvailable = _clients.filter(
    (c) => c.status === 'active' && c.creditAvailable > 0
  ).length;
  const blockedClients = _clients.filter((c) => c.status === 'blocked').length;
  const totalCreditLimit = _clients.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalCreditUsed = _clients.reduce((sum, c) => sum + c.creditUsed, 0);

  return {
    totalClients,
    activeClients,
    withCreditAvailable,
    blockedClients,
    totalCreditLimit,
    totalCreditUsed,
  };
}

export function getCreditStatus(client: Client): CreditStatus {
  const percentUsed =
    client.creditLimit > 0
      ? (client.creditUsed / client.creditLimit) * 100
      : 0;

  let status: CreditStatus['status'];
  let message: string;

  if (client.status === 'blocked') {
    status = 'blocked';
    message = 'Cliente bloqueado';
  } else if (client.creditLimit === 0) {
    status = 'ok';
    message = 'Solo contado';
  } else if (client.creditAvailable < 0) {
    status = 'exceeded';
    message = `Excede por $${Math.abs(client.creditAvailable).toLocaleString()}`;
  } else if (percentUsed >= 80) {
    status = 'warning';
    message = `${percentUsed.toFixed(0)}% utilizado`;
  } else {
    status = 'ok';
    message = `$${client.creditAvailable.toLocaleString()} disponible`;
  }

  return {
    available: client.creditAvailable,
    used: client.creditUsed,
    limit: client.creditLimit,
    percentUsed,
    status,
    message,
  };
}

export function getUniqueCountries(): string[] {
  ensureInitialized();
  return [...new Set(_clients.map((c) => c.country))].sort();
}

export function checkCreditForOrder(
  clientId: string,
  orderAmount: number
): { allowed: boolean; message: string; newBalance: number } {
  const client = getClientById(clientId);

  if (!client) {
    return { allowed: false, message: 'Cliente no encontrado', newBalance: 0 };
  }

  if (client.status === 'blocked') {
    return {
      allowed: false,
      message: 'Cliente bloqueado - no se permiten nuevos pedidos',
      newBalance: client.creditUsed,
    };
  }

  if (client.paymentTerms === 'contado') {
    return { allowed: true, message: 'Cliente de contado - no aplica crédito', newBalance: 0 };
  }

  const newBalance = client.creditUsed + orderAmount;
  const wouldExceed = newBalance > client.creditLimit;

  if (wouldExceed) {
    return {
      allowed: false,
      message: `Excedería el límite por $${(newBalance - client.creditLimit).toLocaleString()}`,
      newBalance,
    };
  }

  return {
    allowed: true,
    message: `Crédito disponible: $${(client.creditLimit - newBalance).toLocaleString()}`,
    newBalance,
  };
}

// ============================================================================
// F8 — Auto-generated client codes by country
// ============================================================================

const COUNTRY_ISO_MAP: Record<string, string> = {
  'Colombia': 'CO',
  'Venezuela': 'VE',
  'Panamá': 'PA',
  'Panama': 'PA',
  'El Salvador': 'SV',
  'Costa Rica': 'CR',
  'Honduras': 'HN',
  'Guatemala': 'GT',
  'Nicaragua': 'NI',
  'México': 'MX',
  'Mexico': 'MX',
  'República Dominicana': 'DO',
  'Republica Dominicana': 'DO',
  'Curazao': 'CW',
  'Curacao': 'CW',
  'Aruba': 'AW',
  'Jamaica': 'JM',
  'Trinidad y Tobago': 'TT',
  'San Andrés': 'CO', // Uses Colombia ISO
  'Estados Unidos': 'US',
  'Chile': 'CL',
  'Perú': 'PE',
  'Peru': 'PE',
  'Ecuador': 'EC',
};

/**
 * Generates a new client code in {ISO}-{SEQ} format.
 * Example: CO-0001, VE-0002
 */
export function generateClientCode(country: string): string {
  const iso = COUNTRY_ISO_MAP[country] || country.slice(0, 2).toUpperCase();
  const clients = getClientsData();
  const prefix = `${iso}-`;
  const existing = clients
    .filter((c) => c.id.startsWith(prefix))
    .map((c) => {
      const seq = parseInt(c.id.replace(prefix, ''), 10);
      return isNaN(seq) ? 0 : seq;
    });
  const nextSeq = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${iso}-${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Gets ISO code for a country name
 */
export function getCountryISO(country: string): string {
  return COUNTRY_ISO_MAP[country] || country.slice(0, 2).toUpperCase();
}

// Re-export types for convenience
export type { Client, ClientContact, ShippingAddress, ClientFilters, ClientStats, CreditStatus };
