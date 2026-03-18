const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

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
        if (response.status === 401) {
            console.error(`[API] Session invalidated by server (401) at ${endpoint}. Cleaning local state.`);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('evolution_auth_token');
                localStorage.removeItem('evolution_auth_user');
                // Optional: refresh page to trigger redirect from dashboard layout
                window.location.reload();
            }
            throw new Error('Sesión expirada. Por favor, inicie sesión de nuevo.');
        }
        const error = await response.json().catch(() => ({ message: 'Error desconocido en el servidor' }));
        throw new Error(error.message || `Error del servidor (${response.status})`);
    }

    const data = await response.json();
    return data;
}

const mapProduct = (p: any) => ({
    ...p,
    id: p.id || p._id,
    reference: p.sku || p.reference || 'S/R',
    description: p.description || p.name || 'Sin nombre',
    name: p.name || p.description || 'Sin nombre',
    status: p.isActive === false ? 'inactive' : 'active',
    country: p.country || p.countryOfOrigin || '-',
    unit: p.unit || '-',
    unitsPerCase: p.unitsPerCase || p.unitsPerBox || 1,
    minimumQty: p.minimumQty || p.minimumQuantity || 0,
    image: p.image || null,
});

export const api = {
    // Products
    getProducts: async () => {
        const products = await fetcher('/products');
        return (products || []).map(mapProduct);
    },
    getProductById: async (id: string) => {
        const p = await fetcher(`/products/${id}`);
        return mapProduct(p);
    },
    createProduct: (data: any) => {
        // Ensure name is sent for backend schema
        const payload = {
            ...data,
            name: data.name || data.description || 'Nuevo Producto',
            sku: data.sku || data.reference,
        };
        return fetcher(`/products`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    updateProduct: (id: string, data: any) => {
        // Map status/description for backend consistency if present
        const payload = { ...data };
        if (data.description && !data.name) payload.name = data.description;
        if (data.status) payload.isActive = data.status === 'active';
        
        return fetcher(`/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },
    deleteProduct: (id: string) => fetcher(`/products/${id}`, {
        method: 'DELETE',
    }),
    bulkDeleteProducts: (ids: string[]) => fetcher(`/products/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
    }),
    uploadProductImage: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('evolution_auth_token') : null;
        
        const response = await fetch(`${API_URL}/products/${id}/image`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`Error al subir imagen (${response.status})`);
        }

        return response.json();
    },
    importProducts: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('evolution_auth_token') : null;
        
        const response = await fetch(`${API_URL}/products/batch-import`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error al importar' }));
            throw new Error(error.message || `Error al importar (${response.status})`);
        }

        return response.json();
    },
    exportProducts: async (format: 'xlsx' | 'csv', ids?: string[]) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('evolution_auth_token') : null;
        const queryParams = ids && ids.length > 0 ? `?ids=${ids.join(',')}` : '';
        const response = await fetch(`${API_URL}/products/export/${format}${queryParams}`, {
            method: 'GET',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`Error al exportar productos (${response.status})`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `productos_${new Date().getTime()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    },
    importProductsBatch: (batch: any[]) => fetcher('/products/batch-import-json', {
        method: 'POST',
        body: JSON.stringify({ batch })
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
        return (users || []).map((u: any) => ({ ...u, id: u._id || u.id }));
    },
    createUser: (data: any) => fetcher('/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id: string, data: any) => fetcher(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    toggleUserActive: (id: string, isActive: boolean) => fetcher(`/users/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    getPendingUsers: async () => {
        const users = await fetcher('/users/pending');
        return (users || []).map((u: any) => ({ ...u, id: u._id || u.id }));
    },
    approveUser: (id: string, role: string) => fetcher(`/users/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    uploadUserAvatar: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('evolution_auth_token') : null;
        
        const response = await fetch(`${API_URL}/users/${id}/avatar`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`Error al subir imagen (${response.status})`);
        }

        return response.json();
    },

    // Suppliers
    getSuppliers: async () => {
        const suppliers = await fetcher('/suppliers');
        return (suppliers || []).map((s: any) => ({ ...s, id: s._id || s.id }));
    },
    getSupplierById: async (id: string) => {
        const s = await fetcher(`/suppliers/${id}`);
        return { ...s, id: s._id || s.id };
    },
    createSupplier: (data: any) => fetcher('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    updateSupplier: (id: string, data: any) => fetcher(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteSupplier: (id: string) => fetcher(`/suppliers/${id}`, { method: 'DELETE' }),
    getApSummary: (asOf?: string) => fetcher(`/suppliers/cxp/summary${asOf ? `?asOf=${asOf}` : ''}`),
    getSupplierBalance: (id: string, asOf?: string) => fetcher(`/suppliers/${id}/balance${asOf ? `?asOf=${asOf}` : ''}`),
    getSupplierLedger: (id: string, filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        return fetcher(`/suppliers/${id}/cxp-ledger${query ? `?${query}` : ''}`);
    },
    getPoComparison: (poId: string) => fetcher(`/suppliers/cxp/comparison/${poId}`),

    // Purchase Orders
    getPurchaseOrders: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        const path = `/purchase-orders${query ? `?${query}` : ''}`;
        const orders = await fetcher(path);
        return (orders || []).map((o: any) => ({ ...o, id: o._id || o.id }));
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
        return (sales || []).map((s: any) => ({ ...s, id: s._id || s.id }));
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
    createQuotation: (data: any) => fetcher('/sales/quotations', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    approveQuotation: (id: string) => fetcher(`/sales/quotations/${id}/approve`, {
        method: 'POST'
    }),
    convertQuotationToOrder: (id: string) => fetcher(`/sales/quotations/${id}/convert`, {
        method: 'POST'
    }),
    approveSalesOrder: (id: string) => fetcher(`/sales/${id}/approve`, {
        method: 'POST'
    }),
    packSalesOrder: (id: string) => fetcher(`/sales/${id}/pack`, {
        method: 'POST'
    }),
    confirmPackingList: (id: string) => fetcher(`/sales/packing/${id}/confirm`, {
        method: 'POST'
    }),
    invoiceSalesOrder: (id: string) => fetcher(`/sales/${id}/invoice`, {
        method: 'POST'
    }),
    getProductHistory: (productId: string, customerId: string) => 
        fetcher(`/sales/product-history/${productId}/${customerId}`),

    // Clients
    getClients: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        const path = `/clients${query ? `?${query}` : ''}`;
        const clients = await fetcher(path);
        return (clients || []).map((c: any) => ({ ...c, id: c._id || c.id }));
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
    importClients: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetcher('/clients/batch-import', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set multipart content type
        });
    },
    importClientsBatch: (batch: any[]) => fetcher('/clients/batch-import-json', {
        method: 'POST',
        body: JSON.stringify({ batch })
    }),
    exportClients: async (format: 'xlsx' | 'csv', ids?: string[]) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('evolution_auth_token') : null;
        const queryParams = ids && ids.length > 0 ? `?ids=${ids.join(',')}` : '';
        const response = await fetch(`${API_URL}/clients/export/${format}${queryParams}`, {
            method: 'GET',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`Error al exportar clientes (${response.status})`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clientes_${new Date().getTime()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    },
    getArSummary: () => fetcher('/clients/cxc/summary'),
    getClientTransactions: (id: string, filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        return fetcher(`/clients/${id}/transactions${query ? `?${query}` : ''}`);
    },
    getClientBalance: (id: string) => fetcher(`/clients/${id}/balance`),

    // Payments (CXC / CXP)
    getPayments: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        const path = `/payments${query ? `?${query}` : ''}`;
        const payments = await fetcher(path);
        return (payments || []).map((p: any) => ({ ...p, id: p._id || p.id }));
    },
    getPaymentById: async (id: string) => {
        const p = await fetcher(`/payments/${id}`);
        return { ...p, id: p._id };
    },
    createPayment: (data: any) => fetcher('/payments', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    applyReceipt: (receiptId: string, invoiceId: string, amount: number) => fetcher(`/payments/${receiptId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ invoiceId, amount })
    }),
    applyVendorPayment: (paymentId: string, purchaseOrderId: string, amount: number) => fetcher(`/payments/${paymentId}/apply-vendor`, {
        method: 'POST',
        body: JSON.stringify({ purchaseOrderId, amount })
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
        return (warehouses || []).map((w: any) => ({ ...w, id: w._id || w.id }));
    },

    // Stock
    getStocks: (warehouseId?: string) => fetcher(`/stock${warehouseId ? `?warehouseId=${warehouseId}` : ''}`),
    getInventoryItems: () => fetcher('/stock/items'),

    // ERP Prisma Inventory
    getLots: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        return fetcher(`/erp/inventory/lots${query ? `?${query}` : ''}`);
    },
    getInventoryMovements: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        return fetcher(`/erp/inventory/movements${query ? `?${query}` : ''}`);
    },

    // Adjustments
    getAdjustments: () => fetcher('/adjustments'),
    getAdjustmentById: (id: string) => fetcher(`/adjustments/${id}`),
    createAdjustment: (data: any) => fetcher('/adjustments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    uploadAdjustmentEvidence: async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('evolution_auth_token') : null;
        
        const response = await fetch(`${API_URL}/adjustments/upload-evidence`, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`Error al subir evidencia (${response.status})`);
        }

        return response.json();
    },
    updateAdjustmentStatus: (id: string, status: string) => fetcher(`/adjustments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    }),

    // Traffic
    getTrafficStats: () => fetcher('/traffic/stats'),
    getExpedients: () => fetcher('/traffic/expedients'),
    getExpedientById: (id: string) => fetcher(`/traffic/expedients/${id}`),
    createExpedient: (data: any) => fetcher('/traffic/expedients', { method: 'POST', body: JSON.stringify(data) }),
    createExpedientFromInvoice: (invoiceId: string) => fetcher(`/traffic/expedients/from-invoice/${invoiceId}`, { method: 'POST' }),
    updateExpedientStatus: (id: string, status: string) => fetcher(`/traffic/expedients/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    createDMC: (data: any) => fetcher('/traffic/dmc', { method: 'POST', body: JSON.stringify(data) }),
    prefillDMC: (expedientId: string) => fetcher(`/traffic/expedients/${expedientId}/prefill-dmc`, { method: 'POST' }),
    createBL: (data: any) => fetcher('/traffic/bl', { method: 'POST', body: JSON.stringify(data) }),
    prefillBL: (expedientId: string) => fetcher(`/traffic/expedients/${expedientId}/prefill-bl`, { method: 'POST' }),

    // Accounting
    getAccounts: () => fetcher('/accounting/accounts'),
    createAccount: (data: any) => fetcher('/accounting/accounts', { method: 'POST', body: JSON.stringify(data) }),
    getJournalEntries: () => fetcher('/accounting/entries'),
    createJournalEntry: (data: any) => fetcher('/accounting/entries', { method: 'POST', body: JSON.stringify(data) }),
    seedCOA: () => fetcher('/accounting/seed', { method: 'POST' }),
    // Settings
    getCommercialParams: () => fetcher('/settings/commercial-params'),
    getDocumentNumbering: () => fetcher('/settings/document-numbering'),
};

