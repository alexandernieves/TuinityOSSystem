'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Building2, 
  User, 
  Loader2, 
  CreditCard, 
  History, 
  FileText, 
  Info,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { cn } from '@/lib/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { Pagination } from '@/components/ui/pagination';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.id as string;
  const initialTab = searchParams.get('tab') || 'general';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [balanceData, setBalanceData] = useState<any>(null);

  // Paginación por tab
  const [comercialPage, setComercialPage] = useState(1);
  const [cxcPage, setCxcPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const ROWS_PER_PAGE = 8;

  // Modal Registrar Cobro
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'efectivo', reference: '', notes: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientData, transactionsData, salesData, balData] = await Promise.all([
          api.getClientById(clientId),
          api.getClientTransactions(clientId),
          api.getSales({ clientId }),
          api.getClientBalance(clientId)
        ]);
        setClient(clientData);
        setTransactions(transactionsData);
        setHistory(salesData);
        setBalanceData(balData);
      } catch (error) {
        toast.error('Error al cargar datos del cliente');
        router.push('/clientes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      reference: formData.get('reference') as string,
      name: formData.get('name') as string,
      documentId: formData.get('documentId') as string,
      type: formData.get('type') as string,
      contactName: formData.get('contactName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      country: formData.get('country') as string,
      city: formData.get('city') as string,
      paymentTerms: parseInt(formData.get('paymentTerms') as string) || 0,
      creditLimit: parseFloat(formData.get('creditLimit') as string) || 0,
      notes: formData.get('notes') as string,
      status: formData.get('status') as string,
    };

    try {
      await api.updateClient(clientId, data);
      toast.success('Cliente actualizado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(false);
    setIsSaving(true);
    try {
      await api.deleteClient(clientId);
      toast.success('Cliente eliminado');
      router.push('/clientes');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar cliente');
      setIsSaving(false);
    }
  };

  const handleRegisterPayment = async () => {
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setIsRegisteringPayment(true);
    try {
      await api.createPayment({
        type: 'inbound',
        entityType: 'client',
        entityId: clientId,
        amount,
        reference: paymentForm.reference,
        notes: paymentForm.notes || `Cobro registrado manualmente`,
      });
      toast.success(`Cobro de ${formatCurrency(amount)} registrado correctamente`);
      setIsPaymentOpen(false);
      setPaymentForm({ amount: '', method: 'efectivo', reference: '', notes: '' });
      // Refrescar todos los datos relevantes
      const [transactionsData, salesData, balData] = await Promise.all([
        api.getClientTransactions(clientId),
        api.getSales({ clientId }),
        api.getClientBalance(clientId)
      ]);
      setTransactions(transactionsData);
      setHistory(salesData);
      setBalanceData(balData);
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar cobro');
    } finally {
      setIsRegisteringPayment(false);
    }
  };

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelClass = "block text-[13px] font-semibold text-[#1a1a1a] mb-1.5";
  const buttonPrimaryClass = "flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#253D6B] text-white font-semibold text-[13px] shadow-sm hover:bg-[#1e3156] transition-all disabled:opacity-50";

  if (isLoading) return <SkeletonDashboard />;
  if (!client) return null;

  const overdueAmount = balanceData ? (
    Number(balanceData.aging.days30) + 
    Number(balanceData.aging.days60) + 
    Number(balanceData.aging.days90) + 
    Number(balanceData.aging.days90Plus)
  ) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
               <span className={cn(
                 "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                 client.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
               )}>
                 {client.status === 'active' ? 'Activo' : 'Inactivo'}
               </span>
            </div>
            <p className="text-sm text-gray-500">
              Cód: {client.reference} | {client.type === 'b2b' ? 'B2B' : 'B2C'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={Number(balanceData?.balance || 0) > 0 || isSaving}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
           >
             <Trash2 className="h-5 w-5" />
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#141414] p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Pendiente</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(balanceData?.balance || 0)}</h3>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141414] p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Vencido</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className={cn("text-xl font-bold", overdueAmount > 0 ? "text-red-600" : "text-gray-900 dark:text-white")}>
              {formatCurrency(overdueAmount)}
            </h3>
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", overdueAmount > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141414] p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Crédito Disponible</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(Math.max(0, Number(client.creditLimit || 0) - Number(balanceData?.balance || 0)))}
            </h3>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-50/80 dark:bg-[#0f0f0f] rounded-xl border border-gray-200/60 dark:border-[#222] w-fit overflow-x-auto shadow-sm mb-6">
        {[
          { id: 'general', icon: Info, label: 'General' },
          { id: 'comercial', icon: History, label: 'Historial Comercial' },
          { id: 'cxc', icon: CreditCard, label: 'Cuentas por Cobrar' },
          { id: 'ledger', icon: FileText, label: 'Estado de Cuenta' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-lg relative whitespace-nowrap",
              activeTab === tab.id 
                ? "text-brand-700 bg-white dark:bg-[#1a1a1a] shadow-sm dark:text-brand-400 border border-gray-200/50 dark:border-[#333]" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-[#1a1a1a]/50 border border-transparent"
            )}
          >
            <tab.icon className={cn("h-4 w-4 transition-colors", activeTab === tab.id ? "text-brand-600 dark:text-brand-400" : "text-gray-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6 space-y-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className={labelClass}>Código / Referencia</label>
                    <input type="text" name="reference" defaultValue={client.reference} readOnly className={cn(inputClass, "bg-gray-50")} />
                 </div>
                 <div>
                    <label className={labelClass}>Estado</label>
                    <select name="status" defaultValue={client.status} className={inputClass}>
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                 </div>
                 <div className="md:col-span-2">
                    <label className={labelClass}>{client.type === 'b2b' ? 'Razón Social' : 'Nombre Completo'}</label>
                    <input type="text" name="name" defaultValue={client.name} required className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Documento (RUC/NIT/ID)</label>
                    <input type="text" name="documentId" defaultValue={client.documentId} className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Nombre del Contacto</label>
                    <input type="text" name="contactName" defaultValue={client.contactName} className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Correo Electrónico</label>
                    <input type="email" name="email" defaultValue={client.email} className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Teléfono</label>
                    <input type="text" name="phone" defaultValue={client.phone} className={inputClass} />
                 </div>
                 <div className="md:col-span-2">
                    <label className={labelClass}>Dirección</label>
                    <textarea name="address" defaultValue={client.address} rows={2} className={cn(inputClass, "h-20 py-2 resize-none")} />
                 </div>
                 <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#222] md:col-span-2 grid grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Días de Crédito</label>
                        <input type="number" name="paymentTerms" defaultValue={client.paymentTerms || 0} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Límite de Crédito ($)</label>
                        <input type="number" name="creditLimit" step="0.01" defaultValue={client.creditLimit || 0} className={inputClass} />
                    </div>
                 </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className={buttonPrimaryClass} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Actualizar Información
              </button>
            </div>
          </form>
        )}

        {activeTab === 'comercial' && (() => {
          const totalPages = Math.ceil(history.length / ROWS_PER_PAGE);
          const paginated = history.slice((comercialPage - 1) * ROWS_PER_PAGE, comercialPage * ROWS_PER_PAGE);
          return (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#222] bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Documento</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                    {paginated.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay registros comerciales.</td></tr>
                    ) : (
                      paginated.map((doc: any) => (
                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{doc.documentType}: {doc.orderNumber}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              doc.status === 'facturado' || doc.status === 'pagado' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            )}>
                              {doc.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(doc.total)}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {history.length > ROWS_PER_PAGE && (
                <Pagination
                  currentPage={comercialPage}
                  totalPages={totalPages}
                  totalItems={history.length}
                  rowsPerPage={ROWS_PER_PAGE}
                  onPageChange={setComercialPage}
                  onRowsPerPageChange={() => {}}
                  itemName="registros"
                />
              )}
            </div>
          );
        })()}

        {activeTab === 'cxc' && (() => {
          const pendingInvoices = history.filter(d => d.documentType === 'factura' && d.status !== 'pagado');
          const totalPages = Math.ceil(pendingInvoices.length / ROWS_PER_PAGE);
          const paginated = pendingInvoices.slice((cxcPage - 1) * ROWS_PER_PAGE, cxcPage * ROWS_PER_PAGE);
          return (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 dark:border-[#222] flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Facturas Pendientes</h3>
                  <Button
                    size="sm"
                    onClick={() => setIsPaymentOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm border-0"
                  >
                    <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                    Registrar Cobro
                  </Button>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#222]">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Factura</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Vencimiento</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Días Mora</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                    {pendingInvoices.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay facturas pendientes.</td></tr>
                    ) : (
                      paginated.map((inv: any) => {
                        const daysLate = Math.floor((Date.now() - new Date(inv.dueDate || inv.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <tr key={inv.id}>
                            <td className="px-6 py-4 text-sm font-medium">{inv.orderNumber}</td>
                            <td className="px-6 py-4 text-sm">{new Date(inv.dueDate || inv.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <span className={cn("text-xs font-bold", daysLate > 0 ? "text-red-600" : "text-emerald-600")}>
                                {daysLate > 0 ? `${daysLate} días` : 'Al día'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold">{formatCurrency(inv.total)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {pendingInvoices.length > ROWS_PER_PAGE && (
                <Pagination
                  currentPage={cxcPage}
                  totalPages={totalPages}
                  totalItems={pendingInvoices.length}
                  rowsPerPage={ROWS_PER_PAGE}
                  onPageChange={setCxcPage}
                  onRowsPerPageChange={() => {}}
                  itemName="facturas"
                />
              )}
            </div>
          );
        })()}

        {activeTab === 'ledger' && (() => {
          const totalPages = Math.ceil(transactions.length / ROWS_PER_PAGE);
          const paginated = transactions.slice((ledgerPage - 1) * ROWS_PER_PAGE, ledgerPage * ROWS_PER_PAGE);
          return (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Detalle</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Debito</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Credito</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No hay movimientos contables.</td></tr>
                    ) : (
                      paginated.map((t: any) => (
                        <tr key={t.id} className="text-[13px]">
                          <td className="px-6 py-4">{new Date(t.occurredAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-medium">{t.notes}</td>
                          <td className="px-6 py-4 text-right text-red-600">
                            {t.entryType.includes('CHARGE') ? formatCurrency(t.amount) : ''}
                          </td>
                          <td className="px-6 py-4 text-right text-emerald-600">
                            {t.entryType.includes('PAYMENT') || t.entryType.includes('APPLICATION') ? formatCurrency(t.amount) : ''}
                          </td>
                          <td className="px-6 py-4 text-right font-bold">{formatCurrency(t.balanceAfter)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {transactions.length > ROWS_PER_PAGE && (
                <Pagination
                  currentPage={ledgerPage}
                  totalPages={totalPages}
                  totalItems={transactions.length}
                  rowsPerPage={ROWS_PER_PAGE}
                  onPageChange={setLedgerPage}
                  onRowsPerPageChange={() => {}}
                  itemName="movimientos"
                />
              )}
            </div>
          );
        })()}
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogTitle>Eliminar Cliente</DialogTitle>
          <DialogDescription>¿Estás seguro de que deseas eliminar este cliente?</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 text-white" onClick={handleDelete}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL REGISTRAR COBRO */}
      <Dialog open={isPaymentOpen} onOpenChange={(open) => !isRegisteringPayment && setIsPaymentOpen(open)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-brand-600" />
              Registrar Cobro
            </DialogTitle>
            <DialogDescription>
              Registra un pago recibido de <strong>{client?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Monto a Cobrar *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Método de Pago</label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm(p => ({ ...p, method: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Referencia / N° Comprobante</label>
              <input
                type="text"
                placeholder="Ej: TRF-00123"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm(p => ({ ...p, reference: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notas (opcional)</label>
              <textarea
                rows={2}
                placeholder="Observaciones adicionales..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={isRegisteringPayment} onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
            <button
              type="button"
              onClick={handleRegisterPayment}
              disabled={isRegisteringPayment || !paymentForm.amount}
              style={{ backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 600, fontSize: '14px' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isRegisteringPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              {isRegisteringPayment ? 'Registrando...' : 'Confirmar Cobro'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
