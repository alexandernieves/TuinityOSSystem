const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetcher(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('evolution_auth_token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || 'API request failed');
    }

    return response.json();
}

export const api = {
    // Products
    getProducts: async () => {
        const products = await fetcher('/products');
        return products.map((p: any) => ({
            ...p,
            id: p._id, // Normalización para el frontend
        }));
    },
    getProductById: async (id: string) => {
        const p = await fetcher(`/products/${id}`);
        return { ...p, id: p._id };
    },
    createProduct: (data: any) => fetcher(`/products`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateProduct: (id: string, data: any) => fetcher(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    deleteProduct: (id: string) => fetcher(`/products/${id}`, {
        method: 'DELETE',
    }),


    // Transfers
    getTransfers: () => fetcher('/transfers'),
    getTransferById: (id: string) => fetcher(`/transfers/${id}`),
    createTransfer: (data: any) => fetcher('/transfers', { method: 'POST', body: JSON.stringify(data) }),
    updateTransferStatus: (id: string, data: any) => fetcher(`/transfers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),

    // Users
    getUsers: async () => {
        const users = await fetcher('/users');
        return users.map((u: any) => ({ ...u, id: u._id }));
    },
    createUser: (data: any) => fetcher('/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id: string, data: any) => fetcher(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    toggleUserActive: (id: string, isActive: boolean) => fetcher(`/users/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),

    // Suppliers
    getSuppliers: async () => {
        const suppliers = await fetcher('/suppliers');
        return suppliers.map((s: any) => ({ ...s, id: s._id }));
    },
    getSupplierById: async (id: string) => {
        const s = await fetcher(`/suppliers/${id}`);
        return { ...s, id: s._id };
    },
    createSupplier: (data: any) => fetcher('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    updateSupplier: (id: string, data: any) => fetcher(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteSupplier: (id: string) => fetcher(`/suppliers/${id}`, { method: 'DELETE' }),

    // Purchase Orders
    getPurchaseOrders: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        const path = `/purchase-orders${query ? `?${query}` : ''}`;
        const orders = await fetcher(path);
        return orders.map((o: any) => ({ ...o, id: o._id }));
    },
    getPurchaseOrderById: async (id: string) => {
        const o = await fetcher(`/purchase-orders/${id}`);
        return { ...o, id: o._id };
    },
    createPurchaseOrder: (data: any) => fetcher('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    updatePurchaseOrderStatus: (id: string, status: string) => fetcher(`/purchase-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    }),
    receiveMerchandise: (id: string, receptionData: any) => fetcher(`/purchase-orders/${id}/receive`, {
        method: 'POST',
        body: JSON.stringify(receptionData)
    }),

    // Sales
    getSales: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        const path = `/sales${query ? `?${query}` : ''}`;
        const sales = await fetcher(path);
        return sales.map((s: any) => ({ ...s, id: s._id }));
    },
    getSaleById: async (id: string) => {
        const s = await fetcher(`/sales/${id}`);
        return { ...s, id: s._id };
    },
    createSale: (data: any) => fetcher('/sales', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateSaleStatus: (id: string, status: string) => fetcher(`/sales/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    }),

    // Clients
    getClients: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        const path = `/clients${query ? `?${query}` : ''}`;
        const clients = await fetcher(path);
        return clients.map((c: any) => ({ ...c, id: c._id }));
    },
    getClientById: async (id: string) => {
        const c = await fetcher(`/clients/${id}`);
        return { ...c, id: c._id };
    },
    createClient: (data: any) => fetcher('/clients', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateClient: (id: string, data: any) => fetcher(`/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),
    deleteClient: (id: string) => fetcher(`/clients/${id}`, {
        method: 'DELETE'
    }),

    // Payments (CXC / CXP)
    getPayments: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        const path = `/payments${query ? `?${query}` : ''}`;
        const payments = await fetcher(path);
        return payments.map((p: any) => ({ ...p, id: p._id }));
    },
    getPaymentById: async (id: string) => {
        const p = await fetcher(`/payments/${id}`);
        return { ...p, id: p._id };
    },
    createPayment: (data: any) => fetcher('/payments', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    // POS & Cash Register
    getPOSRegisterStatus: () => fetcher('/sales/pos/register'),
    openPOSRegister: (openingAmount: number) => fetcher('/sales/pos/register/open', {
        method: 'POST',
        body: JSON.stringify({ openingAmount })
    }),
    closePOSRegister: (id: string, closingAmount: number, notes?: string) => fetcher(`/sales/pos/register/close/${id}`, {
        method: 'POST',
        body: JSON.stringify({ closingAmount, notes })
    }),
    processPOSSale: (data: any) => fetcher('/sales/pos/sale', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    // Analytics
    getDashboardAnalytics: () => fetcher('/analytics/dashboard'),

    // Warehouses
    getWarehouses: async () => {
        const warehouses = await fetcher('/warehouses');
        return warehouses.map((w: any) => ({ ...w, id: w._id }));
    },

    // Stock
    getStock: () => fetcher('/stock'),
    getInventoryItems: () => fetcher('/stock/items'),
    getStockByProduct: (productId: string) => fetcher(`/stock/product/${productId}`),
    getStockByWarehouse: (warehouseId: string) => fetcher(`/stock/warehouse/${warehouseId}`),


    // Adjustments
    getAdjustments: () => fetcher('/adjustments'),
    getAdjustmentById: (id: string) => fetcher(`/adjustments/${id}`),
    createAdjustment: (data: any) => fetcher('/adjustments', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateAdjustmentStatus: (id: string, status: string) => fetcher(`/adjustments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    }),

    // Traffic
    getTrafficStats: () => fetcher('/traffic/stats'),
    getExpedients: () => fetcher('/traffic/expedients'),
    getExpedientById: (id: string) => fetcher(`/traffic/expedients/${id}`),
    createExpedient: (data: any) => fetcher('/traffic/expedients', { method: 'POST', body: JSON.stringify(data) }),
    updateExpedientStatus: (id: string, status: string) => fetcher(`/traffic/expedients/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    createDMC: (data: any) => fetcher('/traffic/dmc', { method: 'POST', body: JSON.stringify(data) }),
    createBL: (data: any) => fetcher('/traffic/bl', { method: 'POST', body: JSON.stringify(data) }),

    // Accounting
    getAccounts: () => fetcher('/accounting/accounts'),
    createAccount: (data: any) => fetcher('/accounting/accounts', { method: 'POST', body: JSON.stringify(data) }),
    getJournalEntries: () => fetcher('/accounting/entries'),
    createJournalEntry: (data: any) => fetcher('/accounting/entries', { method: 'POST', body: JSON.stringify(data) }),
    seedCOA: () => fetcher('/accounting/seed', { method: 'POST' }),
};

