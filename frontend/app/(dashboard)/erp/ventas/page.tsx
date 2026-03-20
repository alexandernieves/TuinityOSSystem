
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/services/api';
import { formatCurrency } from '@/lib/mock-data/sales-orders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, FileText, Truck, ArrowRight, RefreshCw, Search } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function VentasErpPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:8002/erp/sales/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('evolution_auth_token')}`
        }
      });
      const data = await response.json();
      // Ensure we always set an array
      if (Array.isArray(data)) {
        setOrders(data);
      } else if (data && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
        if (response.ok) {
          console.warn('Unexpected data format from API:', data);
        }
      }
    } catch (error) {
      console.error('Error fetching ERP orders:', error);
      toast.error('Error al cargar órdenes ERP');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer?.legalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const handleDispatch = async (id: string) => {
    try {
        const response = await fetch(`http://localhost:8002/erp/sales/orders/${id}/dispatch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('evolution_auth_token')}`
            },
            body: JSON.stringify({ warehouseId: orders.find(o => o.id === id)?.warehouseId || 'WH-MAIN' })
        });
        if (!response.ok) throw new Error('Error en el despacho');
        toast.success('Orden despachada exitosamente (Lotes consumidos)');
        fetchOrders();
    } catch (e: any) {
        toast.error(e.message);
    }
  };

  if (loading) return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="space-y-2 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-semibold text-foreground">Ventas ERP</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestión de órdenes, facturación y despacho FEFO (Prisma Core)</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                    type="text"
                    placeholder="Buscar pedido o cliente..."
                    className="h-10 w-full pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="secondary" onClick={() => fetchOrders()} className="gap-2">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Actualizar
            </Button>
        </div>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border">
                  <th className="px-6 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Número</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Cliente</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="px-6 py-4 text-right font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Total</th>
                  <th className="px-6 py-4 text-right font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Facturado / Despachado</th>
                  <th className="px-6 py-4 text-center font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-10 w-10 opacity-20" />
                        <p>No hay órdenes disponibles. Crea una cotización desde <strong className="text-blue-600">Ventas B2B</strong> para comenzar.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const line = order.lines?.[0];
                    return (
                      <tr key={order.id} className="hover:bg-muted transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-foreground">{order.number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-foreground">{order.customer?.legalName || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={order.status === 'DISPATCHED' ? 'success' : order.status === 'APPROVED' ? 'default' : 'secondary'}
                            className="font-medium"
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono font-medium text-foreground">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                              <span className="text-[11px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                  FACT: {line?.quantityInvoiced || 0} / {line?.quantityOrdered || 0}
                              </span>
                              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                  DESP: {line?.quantityDispatched || 0} / {line?.quantityOrdered || 0}
                              </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {order.status === 'APPROVED' && (
                                  <Button 
                                      size="sm" 
                                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                      onClick={() => handleDispatch(order.id)}
                                  >
                                      <Truck size={14} className="mr-1.5" /> Despachar
                                  </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <ArrowRight size={16} />
                              </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredOrders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(val) => {
            setRowsPerPage(val);
            setCurrentPage(1);
          }}
          itemName="ventas"
        />
      )}
    </div>
  );
}
