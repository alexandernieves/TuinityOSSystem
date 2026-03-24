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
    id: p.id,
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
    getProducts: async (warehouseId?: string) => {
        const products = await fetcher(`/products${warehouseId ? `?warehouseId=${warehouseId}` : ''}`);
        return (products || []).map(mapProduct);
    },
    getProductById: async (id: string) => {
        const p = await fetcher(`/products/${id}`);
        return mapProduct(p);
    },
    createProduct: (data: any) => {
        // Remove mongo specific fields if they leak in
        delete (data as any)._id;
        delete (data as any).__v;
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
        return (users || []).map((u: any) => ({ ...u }));
    },
    createUser: (data: any) => fetcher('/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id: string, data: any) => fetcher(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    toggleUserActive: (id: string, isActive: boolean) => fetcher(`/users/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    getPendingUsers: async () => {
        const users = await fetcher('/users/pending');
        return (users || []).map((u: any) => ({ ...u }));
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
        return (suppliers || []).map((s: any) => ({ ...s, name: s.legalName }));
    },
    getSupplierById: async (id: string) => {
        const s = await fetcher(`/suppliers/${id}`);
        return { ...s };
    },
    createSupplier: (data: any) => fetcher('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    importSuppliersBatch: (batch: any[]) => fetcher('/suppliers/batch-import-json', {
        method: 'POST',
        body: JSON.stringify({ batch })
    }),
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
        return (orders || []).map((o: any) => ({ ...o, id: o.id }));
    },
    getPurchaseOrderById: async (id: string) => {
        const o = await fetcher(`/purchase-orders/${id}`);
        return { ...o, id: o.id };
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
        return (sales || []).map((s: any) => ({ ...s, id: s.id }));
    },
    getSaleById: async (id: string) => {
        const s = await fetcher(`/sales/${id}`);
        return { ...s, id: s.id };
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
        return (clients || []).map((c: any) => ({ ...c, id: c.id }));
    },
    getClientById: async (id: string) => {
        const c = await fetcher(`/clients/${id}`);
        return { ...c, id: c.id };
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
    getClientPOSHistory: (id: string) => fetcher(`/clients/${id}/pos-history`),

    // Payments (CXC / CXP)
    getPayments: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        const path = `/payments${query ? `?${query}` : ''}`;
        const payments = await fetcher(path);
        return (payments || []).map((p: any) => ({ ...p, id: p.id }));
    },
    getPaymentById: async (id: string) => {
        const p = await fetcher(`/payments/${id}`);
        return { ...p, id: p.id };
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

    // Analytics & Reports
    getDashboardAnalytics: () => fetcher('/erp/reports/dashboard'),
    getReportsSales: (startDate: string, endDate: string, channel?: string) => {
        let url = `/erp/reports/sales?startDate=${startDate}&endDate=${endDate}`;
        if (channel && channel !== 'ALL') url += `&channel=${channel}`;
        return fetcher(url);
    },
    getReportsCashRegisters: (filters: any) => {
        const query = new URLSearchParams(filters).toString();
        return fetcher(`/erp/reports/cash-registers?${query}`);
    },
    getReportsInventory: () => fetcher('/erp/reports/inventory'),

    // Warehouses
    getWarehouses: () => fetcher('/warehouses'),
    createWarehouse: (data: any) => fetcher('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
    updateWarehouse: (id: string, data: any) => fetcher(`/warehouses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteWarehouse: (id: string) => fetcher(`/warehouses/${id}`, { method: 'DELETE' }),
    setMainBranch: (id: string) => fetcher(`/warehouses/${id}/set-main`, { method: 'PATCH' }),

    // Settings
    getCommercialParams: () => fetcher('/settings/commercial-params'),
    updateCommercialParams: (data: any) => fetcher('/settings/commercial-params', { method: 'PUT', body: JSON.stringify(data) }),
    getDocumentNumbering: () => fetcher('/settings/document-numbering'),
    updateDocumentNumbering: (id: string, data: any) => fetcher(`/settings/document-numbering/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // POS
    getPOSInvoices: () => fetcher('/pos/invoices'),
    createPOSInvoice: (data: any) => fetcher('/pos/invoices', { method: 'POST', body: JSON.stringify(data) }),
    getPOSClients: () => fetcher('/clients?type=B2C'),
    getPOSProducts: () => fetcher('/pos/products'),
    getCashRegisterStatus: () => fetcher('/pos/cash-register/status'),
    openCashRegister: (data: any) => fetcher('/pos/cash-register/open', { method: 'POST', body: JSON.stringify(data) }),
    closeCashRegister: (data: any) => fetcher('/pos/cash-register/close', { method: 'POST', body: JSON.stringify(data) }),
    addCashMovement: (data: any) => fetcher('/pos/cash-register/movement', { method: 'POST', body: JSON.stringify(data) }),

    // Stock
    getStocks: (warehouseId?: string) => fetcher(`/stock${warehouseId ? `?warehouseId=${warehouseId}` : ''}`),
    getInventoryItems: (warehouseId?: string) => fetcher(`/stock/items${warehouseId ? `?warehouseId=${warehouseId}` : ''}`),

    // ERP Prisma Inventory
    getLots: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        return fetcher(`/erp/inventory/lots${query ? `?${query}` : ''}`);
    },
    getInventoryMovements: async (filters: any = {}) => {
        const query = new URLSearchParams(filters).toString();
        return fetcher(`/erp/inventory/movements${query ? `?${query}` : ''}`);
    },
    batchTransfer: (data: { sourceWarehouseId: string; destinationWarehouseId: string; items: { productId: string; quantity: number }[]; userId?: string }) => 
        fetcher('/erp/inventory/batch-transfer', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    // Adjustments
    getAdjustments: (warehouseId?: string) => fetcher(`/adjustments${warehouseId ? `?warehouseId=${warehouseId}` : ''}`),
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

    // POS
    posStartSession: (data: { userId: string; openingAmount: number; warehouseId?: string }) =>
        fetcher('/pos/session/start', { method: 'POST', body: JSON.stringify(data) }),
    posCloseSession: (id: string, data: { closingAmount: number; notes?: string }) =>
        fetcher(`/pos/session/close/${id}`, { method: 'POST', body: JSON.stringify(data) }),
    posGetActiveSession: (userId: string) => fetcher(`/pos/session/active/${userId}`),
    posCreateSale: (data: any) =>
        fetcher('/pos/sale', { method: 'POST', body: JSON.stringify(data) }),
    posGetReceipt: (id: string) => fetcher(`/pos/receipt/${id}`),
    posSearchSales: (filters: any) => {
        const query = new URLSearchParams(filters).toString();
        return fetcher(`/pos/sales${query ? `?${query}` : ''}`);
    },
    posGetSaleById: (id: string) => fetcher(`/pos/sales/${id}`),
    posVoidSale: (id: string, userId: string, reason: string) =>
        fetcher(`/pos/sales/${id}/void`, { method: 'POST', body: JSON.stringify({ userId, reason }) }),
    posSearchOriginalSale: (ticketNumber: string) => fetcher(`/pos/returns/search?ticketNumber=${ticketNumber}`),
    posCreateReturn: (data: any) => fetcher('/pos/returns', { method: 'POST', body: JSON.stringify(data) }),

    // CONTABILIDAD
    getAccounts: () => fetcher('/accounting/accounts'),
    createAccount: (data: any) => fetcher('/accounting/accounts', { method: 'POST', body: JSON.stringify(data) }),
    updateAccount: (id: string, data: any) => fetcher(`/accounting/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getAccountingMappings: () => fetcher('/accounting/mappings'),
    saveAccountingMapping: (data: any) => fetcher('/accounting/mappings', { method: 'POST', body: JSON.stringify(data) }),
    getJournalEntries: (filters?: Record<string, string>) => {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return fetcher(`/accounting/entries${q ? `?${q}` : ''}`);
    },
    getJournalEntryById: (id: string) => fetcher(`/accounting/entries/${id}`),
    createJournalEntry: (data: any) => fetcher('/accounting/entries', { method: 'POST', body: JSON.stringify(data) }),
    reverseJournalEntry: (id: string, reason: string) =>
        fetcher(`/accounting/entries/${id}/reverse`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getLedger: (accountId: string, filters?: Record<string, string>) => {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return fetcher(`/accounting/ledger/${accountId}${q ? `?${q}` : ''}`);
    },
    getProfitAndLoss: (filters?: Record<string, string>) => {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return fetcher(`/accounting/financials/pnl${q ? `?${q}` : ''}`);
    },
    getBalanceSheet: (filters?: Record<string, string>) => {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return fetcher(`/accounting/financials/balance-sheet${q ? `?${q}` : ''}`);
    },
    getCashFlow: (filters?: Record<string, string>) => {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return fetcher(`/accounting/financials/cash-flow${q ? `?${q}` : ''}`);
    },
    seedAccountingCOA: () => fetcher('/accounting/seed', { method: 'POST' }),

    // Banking & Treasury
    getBankAccounts: () => fetcher('/banking/accounts'),
    getBankAccountById: (id: string) => fetcher(`/banking/accounts/${id}`),
    getBankAccountSummary: (id: string) => fetcher(`/banking/accounts/${id}/summary`),
    createBankAccount: (data: any) => fetcher('/banking/accounts', { method: 'POST', body: JSON.stringify(data) }),
    updateBankAccount: (id: string, data: any) => fetcher(`/banking/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getBankTransactions: (accountId: string, filters?: any) => {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return fetcher(`/banking/accounts/${accountId}/transactions${q ? `?${q}` : ''}`);
    },
    createBankTransaction: (accountId: string, data: any) =>
        fetcher(`/banking/accounts/${accountId}/transactions`, { method: 'POST', body: JSON.stringify(data) }),
    importBankCSV: (accountId: string, csv: string) =>
        fetcher(`/banking/accounts/${accountId}/import`, { method: 'POST', body: JSON.stringify({ csv }) }),
    autoMatchTransactions: (accountId: string) => fetcher(`/banking/accounts/${accountId}/auto-match`, { method: 'POST' }),
    manualMatchTx: (txId: string, data: any) =>
        fetcher(`/banking/transactions/${txId}/match`, { method: 'POST', body: JSON.stringify(data) }),
    ignoreBankTx: (txId: string) => fetcher(`/banking/transactions/${txId}/ignore`, { method: 'POST' }),
    unmatchBankTx: (txId: string) => fetcher(`/banking/transactions/${txId}/unmatch`, { method: 'POST' }),
    createBankTransfer: (data: any) => fetcher('/banking/transfer', { method: 'POST', body: JSON.stringify(data) }),

    // Reconciliations
    getReconciliations: (bankAccountId?: string) =>
        fetcher(`/banking/reconciliations${bankAccountId ? `?bankAccountId=${bankAccountId}` : ''}`),
    getReconciliationById: (id: string) => fetcher(`/banking/reconciliations/${id}`),
    createReconciliation: (data: any) => fetcher('/banking/reconciliations', { method: 'POST', body: JSON.stringify(data) }),
    closeReconciliation: (id: string) => fetcher(`/banking/reconciliations/${id}/close`, { method: 'POST' }),
    updateBookBalance: (id: string, bookBalance: number) =>
        fetcher(`/banking/reconciliations/${id}/book-balance`, { method: 'PATCH', body: JSON.stringify({ bookBalance }) }),

    // Accounting Periods
    getAccountingPeriods: () => fetcher('/banking/periods'),
    getCurrentAccountingPeriod: () => fetcher('/banking/periods/current'),
    getAccountingPeriodById: (id: string) => fetcher(`/banking/periods/${id}`),
    getPeriodChecklist: (id: string) => fetcher(`/banking/periods/${id}/checklist`),
    closeAccountingPeriod: (id: string) => fetcher(`/banking/periods/${id}/close`, { method: 'POST' }),
    reopenAccountingPeriod: (id: string) => fetcher(`/banking/periods/${id}/reopen`, { method: 'POST' }),

    // Advanced Reports
    getCashFlowByBank: (filters?: any) => {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return fetcher(`/banking/reports/cash-flow-by-bank${q ? `?${q}` : ''}`);
    },
    getMonthlyComparison: (year?: number) => fetcher(`/banking/reports/monthly-comparison?year=${year || new Date().getFullYear()}`),
    getChannelComparison: (filters?: any) => {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return fetcher(`/banking/reports/channel-comparison${q ? `?${q}` : ''}`);
    },

    // Notifications
    getMyNotifications: () => fetcher('/notifications'),
    getUnreadCount: () => fetcher('/notifications/unread-count'),
    markNotificationAsRead: (id: string) => fetcher(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllNotificationsAsRead: () => fetcher('/notifications/read-all', { method: 'POST' }),
    
    // Audit Logs
    getAuditLogs: (filters: any = {}) => {
        const q = new URLSearchParams(filters).toString();
        return fetcher(`/audit/logs${q ? `?${q}` : ''}`);
    },
    getAuditSummary: () => fetcher('/audit/summary'),

    // Categories
    getCategories: () => fetcher('/categories'),
    getCategoriesFlat: () => fetcher('/categories/flat'),
    getCategoryById: (id: string) => fetcher(`/categories/${id}`),
    createCategory: (data: any) => fetcher('/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id: string, data: any) => fetcher(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteCategory: (id: string) => fetcher(`/categories/${id}`, { method: 'DELETE' }),

    // Auth Sessions
    getSessions: () => fetcher('/auth/sessions'),
    logoutSession: (id: string) => fetcher(`/auth/logout/${id}`, { method: 'POST' }),

    // Generic REST methods
    get: (endpoint: string) => fetcher(endpoint),
    post: (endpoint: string, body?: any) => fetcher(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint: string, body?: any) => fetcher(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    put: (endpoint: string, body?: any) => fetcher(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint: string) => fetcher(endpoint, { method: 'DELETE' }),
};

