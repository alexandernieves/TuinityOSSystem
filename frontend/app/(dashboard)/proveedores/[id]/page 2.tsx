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
  Search,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
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

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const supplierId = params.id as string;
  const initialTab = searchParams.get('tab') || 'general';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplier, setSupplier] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [balanceData, setBalanceData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supplierData, ledgerData, ordersData, balData] = await Promise.all([
          api.getSupplierById(supplierId),
          api.getSupplierLedger(supplierId),
          api.getPurchaseOrders({ supplierId }),
          api.getSupplierBalance(supplierId)
        ]);
        setSupplier(supplierData);
        setLedger(ledgerData);
        setOrders(ordersData);
        setBalanceData(balData);
      } catch (error) {
        toast.error('Error al cargar datos del proveedor');
        router.push('/proveedores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supplierId, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      legalName: formData.get('legalName') as string,
      tradeName: formData.get('tradeName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      country: formData.get('country') as string,
      paymentTerms: parseInt(formData.get('paymentTerms') as string) || 0,
      type: formData.get('type') as string,
      isActive: formData.get('isActive') === 'true',
    };

    try {
      await api.updateSupplier(supplierId, data);
      toast.success('Proveedor actualizado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar proveedor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(false);
    setIsSaving(true);
    try {
      await api.deleteSupplier(supplierId);
      toast.success('Proveedor eliminado');
      router.push('/proveedores');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar proveedor');
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelClass = "block text-[13px] font-semibold text-[#1a1a1a] mb-1.5";
  const buttonPrimaryClass = "flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#253D6B] text-white font-semibold text-[13px] shadow-sm hover:bg-[#1e3156] transition-all disabled:opacity-50";

  if (isLoading) return <SkeletonDashboard />;
  if (!supplier) return null;

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
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{supplier.legalName}</h1>
               <span className={cn(
                 "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                 supplier.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
               )}>
                 {supplier.isActive ? 'Activo' : 'Inactivo'}
               </span>
            </div>
            <p className="text-sm text-gray-500">
              Cód: {supplier.code} | {supplier.type}
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
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo por Pagar</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(balanceData?.balance || 0)}</h3>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141414] p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Vencido</p>
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
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Órdenes Pendientes</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {orders.filter(o => o.status !== 'RECEIVED' && o.status !== 'CANCELLED').length}
            </h3>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-[#2a2a2a]">
        {[
          { id: 'general', icon: Info, label: 'General' },
          { id: 'purchase-orders', icon: History, label: 'Órdenes de Compra' },
          { id: 'cxp', icon: CreditCard, label: 'CxP' },
          { id: 'ledger', icon: FileText, label: 'Estado de Cuenta' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative",
              activeTab === tab.id 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <tab.icon className="h-4 w-4" />
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
                    <label className={labelClass}>Código</label>
                    <input type="text" defaultValue={supplier.code} readOnly className={cn(inputClass, "bg-gray-50")} />
                 </div>
                 <div>
                    <label className={labelClass}>Estado</label>
                    <select name="isActive" defaultValue={String(supplier.isActive)} className={inputClass}>
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                 </div>
                 <div className="md:col-span-2">
                    <label className={labelClass}>Razón Social / Nombre Comercial</label>
                    <input type="text" name="legalName" defaultValue={supplier.legalName} required className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Documento Fiscal (Tax ID)</label>
                    <input type="text" name="taxId" defaultValue={supplier.taxId} className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Persona de Contacto</label>
                    <input type="text" name="contact" defaultValue={supplier.contacts?.[0]?.name} className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Correo Electrónico</label>
                    <input type="email" name="email" defaultValue={supplier.email} className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Teléfono</label>
                    <input type="text" name="phone" defaultValue={supplier.phone} className={inputClass} />
                 </div>
                 <div className="md:col-span-2">
                    <label className={labelClass}>Dirección</label>
                    <textarea name="address" defaultValue={supplier.address} rows={2} className={cn(inputClass, "h-20 py-2 resize-none")} />
                 </div>
                 <div>
                    <label className={labelClass}>País</label>
                    <input type="text" name="country" defaultValue={supplier.country} className={inputClass} />
                 </div>
                  <div>
                    <label className={labelClass}>Términos de Pago (Días)</label>
                    <input type="number" name="paymentTerms" defaultValue={supplier.paymentTerms || 30} className={inputClass} />
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

        {activeTab === 'purchase-orders' && (
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden animate-in fade-in duration-300">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#222] bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Número</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                {orders.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay órdenes de compra.</td></tr>
                ) : (
                  orders.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase">{doc.number}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(doc.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          doc.status === 'RECEIVED' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
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
        )}

        {activeTab === 'cxp' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Obligaciones Pendientes</h3>
                <Link href="/proveedores/cxp/nuevo-pago" className="text-xs font-bold text-blue-600 hover:underline">Registrar Pago</Link>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#222]">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Documento / OC</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha OC</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Días Mora</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                  {orders.filter(o => o.status === 'RECEIVED').length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay obligaciones pendientes.</td></tr>
                  ) : (
                    orders.filter(o => o.status === 'RECEIVED').map((po: any) => {
                      // Simple logic: we owe the full PO ifRECEIVED (simplified for now as the backend entries handle the actual balance)
                      // In a real scenario we should query specific unpaid receipts.
                      const daysOld = Math.floor((Date.now() - new Date(po.orderDate).getTime()) / (1000 * 60 * 60 * 24));
                      const terms = supplier.paymentTerms || 30;
                      const lateDays = daysOld - terms;
                      
                      return (
                        <tr key={po.id}>
                          <td className="px-6 py-4 text-sm font-medium">{po.number}</td>
                          <td className="px-6 py-4 text-sm">{new Date(po.orderDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={cn("text-xs font-bold", lateDays > 0 ? "text-red-600" : "text-emerald-600")}>
                              {lateDays > 0 ? `${lateDays} días` : 'Al día'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold">{formatCurrency(po.total)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden animate-in fade-in duration-300">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Detalle</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Cargo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Pago</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Saldo</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {ledger.map((t: any) => (
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
                  ))}
               </tbody>
             </table>
          </div>
        )}
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogTitle>Eliminar Proveedor</DialogTitle>
          <DialogDescription>¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 text-white" onClick={handleDelete}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
