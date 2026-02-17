'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Package,
    Search,
    TrendingUp,
    AlertTriangle,
    ArrowRightLeft,
    Building2,
    History,
    Download,
    PlusCircle,
    MoreVertical,
    Warehouse,
    ClipboardCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProductDetailModal } from '@/components/inventory/ProductDetailModal';



type BranchStock = {
    branchName: string;
    quantity: number;
};

type GlobalProductStock = {
    id: string;
    description: string;
    brandName: string;
    totalQuantity: number;
    minStock: number;
    branches: BranchStock[];
};

// Intarfaces for Modal
type Branch = { id: string; name: string };
type Product = { id: string; description: string; unitsPerBox?: number };

function NewMovementModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');

    // Form State
    const [branchId, setBranchId] = useState('');
    const [productId, setProductId] = useState('');
    const [type, setType] = useState('IN');
    const [quantity, setQuantity] = useState(1);
    const [unitType, setUnitType] = useState<'UNIT' | 'BOX'>('UNIT');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            // Reset form
            setProductId('');
            setBranchId('');
            setType('IN');
            setQuantity(1);
            setUnitType('UNIT');
            setReason('');
            setSearch('');
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;
        try {
            const branchesData = await api<Branch[]>('/branches', { accessToken: session.accessToken });
            setBranches(branchesData);
            if (branchesData.length > 0) setBranchId(branchesData[0].id);
        } catch (e) {
            console.error(e);
        }
    };

    const searchProducts = async (q: string) => {
        if (q.length < 3) return;
        const session = loadSession();
        if (!session?.accessToken) return;
        try {
            const res = await api<{ items: Product[] }>(`/products?q=${encodeURIComponent(q)}`, { accessToken: session.accessToken });
            setProducts(res.items || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async () => {
        if (!branchId || !productId || quantity <= 0 || !reason) {
            toast.error('Complete todos los campos obligatorios');
            return;
        }

        const session = loadSession();
        if (!session?.accessToken) return;

        setLoading(true);
        try {
            await api('/inventory/movements', {
                method: 'POST',
                accessToken: session.accessToken,
                body: {
                    branchId,
                    productId,
                    type,
                    quantity, // Sending raw quantity, backend handles conversion if unitType is BOX
                    unitType,
                    reason
                }
            });
            toast.success('Movimiento registrado exitosamente');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Error al registrar movimiento');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedProduct = products.find(p => p.id === productId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="mb-4 text-lg font-bold text-[#2C3E50]">Registrar Movimiento</h3>

                <div className="space-y-4">
                    {/* Branch */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-[#5A6C7D]">Sucursal</label>
                        <select
                            className="w-full rounded-lg border border-[#E1E8ED] p-2 text-sm"
                            value={branchId}
                            onChange={e => setBranchId(e.target.value)}
                        >
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                    {/* Product Search */}
                    <div className="relative">
                        <label className="mb-1 block text-xs font-medium text-[#5A6C7D]">Producto</label>
                        {selectedProduct ? (
                            <div className="flex items-center justify-between rounded-lg border border-[#2980B9] bg-[#2980B9]/10 p-2">
                                <span className="text-sm font-medium text-[#2980B9]">{selectedProduct.description}</span>
                                <button onClick={() => setProductId('')} className="text-xs text-[#5A6C7D] hover:text-[#C0392B]">Cambiar</button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Input
                                    placeholder="Buscar producto..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); searchProducts(e.target.value); }}
                                />
                                {products.length > 0 && search.length >= 3 && (
                                    <div className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[#E1E8ED] bg-white shadow-lg">
                                        {products.map(p => (
                                            <div
                                                key={p.id}
                                                className="cursor-pointer p-2 hover:bg-[#F4F7F6]"
                                                onClick={() => { setProductId(p.id); setSearch(''); setProducts([]); }}
                                            >
                                                <p className="text-sm font-medium text-[#2C3E50]">{p.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Type & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#5A6C7D]">Tipo Movimiento</label>
                            <select
                                className="w-full rounded-lg border border-[#E1E8ED] p-2 text-sm"
                                value={type}
                                onChange={e => setType(e.target.value)}
                            >
                                <option value="IN">Entrada (+)</option>
                                <option value="OUT">Salida (-)</option>
                                <option value="ADJUSTMENT">Ajuste (Put)</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-[#5A6C7D]">Unidad de Medida</label>
                            <div className="flex rounded-lg border border-[#E1E8ED] p-1">
                                <button
                                    onClick={() => setUnitType('UNIT')}
                                    className={clsx("flex-1 rounded py-1 text-xs font-medium transition-colors", unitType === 'UNIT' ? "bg-[#2980B9] text-white" : "text-[#5A6C7D] hover:bg-[#F4F7F6]")}
                                >
                                    Unidad
                                </button>
                                <button
                                    onClick={() => setUnitType('BOX')}
                                    className={clsx("flex-1 rounded py-1 text-xs font-medium transition-colors", unitType === 'BOX' ? "bg-[#2980B9] text-white" : "text-[#5A6C7D] hover:bg-[#F4F7F6]")}
                                >
                                    Caja {selectedProduct?.unitsPerBox ? `(x${selectedProduct.unitsPerBox})` : ''}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-[#5A6C7D]">Cantidad ({unitType === 'BOX' ? 'Cajas' : 'Unidades'})</label>
                        <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                        />
                        {unitType === 'BOX' && selectedProduct?.unitsPerBox && (
                            <p className="mt-1 text-xs text-[#27AE60]">
                                Total a procesar: <strong>{quantity * selectedProduct.unitsPerBox} unidades</strong>
                            </p>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-[#5A6C7D]">Motivo / Referencia</label>
                        <Input
                            placeholder="Ej: Ajuste de inventario mensual..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit} isLoading={loading} className="flex-1">Confirmar</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function GlobalInventoryPage() {
    const router = useRouter();
    const [inventory, setInventory] = useState<GlobalProductStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Detail Modal State
    const [selectedProductDetail, setSelectedProductDetail] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        fetchGlobalInventory();
    }, []);

    const fetchGlobalInventory = async () => {
        // ... existing logic ...
        const session = loadSession();
        if (!session?.accessToken) return;

        setLoading(true);
        try {
            const data = await api<GlobalProductStock[]>('/inventory', {
                method: 'GET',
                accessToken: session.accessToken,
            });
            setInventory(data);
        } catch (err) {
            toast.error('Error al cargar inventario global');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (productId: string) => {
        const session = loadSession();
        if (!session?.accessToken) return;

        try {
            // Fetch full product details
            const product = await api<any>(`/products/${productId}`, {
                accessToken: session.accessToken
            });
            setSelectedProductDetail(product);
            setIsDetailModalOpen(true);
        } catch (e) {
            toast.error('Error al cargar detalles del producto');
        }
    };

    const filteredInventory = inventory.filter(p =>
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brandName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalUnits = inventory.reduce((acc, p) => acc + p.totalQuantity, 0);
    const criticalStock = inventory.filter(p => p.totalQuantity <= (p.minStock || 10)).length;

    return (
        <div className="space-y-6">
            <NewMovementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchGlobalInventory}
            />

            <ProductDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                product={selectedProductDetail}
            />

            <div id="monitor-global">
                {/* ... existing header ... */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#2980B9]" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#5A6C7D]">Monitor de Stock Unificado</h2>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* ... existing cards ... */}
                <Card hover>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A6C7D]">Total Unidades</p>
                                <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">
                                    {totalUnits.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2980B9]/10">
                                <Package className="h-6 w-6 text-[#2980B9]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A6C7D]">Productos Activos</p>
                                <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">{inventory.length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2D8A4E]/10">
                                <TrendingUp className="h-6 w-6 text-[#2D8A4E]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A6C7D]">Stock Crítico</p>
                                <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">{criticalStock}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#C0392B]/10">
                                <AlertTriangle className="h-6 w-6 text-[#C0392B]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A6C7D]">Sucursales</p>
                                <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">3</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1A2B3C]/10">
                                <Building2 className="h-6 w-6 text-[#1A2B3C]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                {/* Table Header */}
                <div className="flex flex-col gap-4 border-b border-[#E1E8ED] p-6 md:flex-row md:items-center md:justify-between">
                    <Input
                        placeholder="Buscar por producto o marca..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search className="h-5 w-5" />}
                        className="md:w-96"
                    />

                    <div className="flex gap-3">
                        <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<PlusCircle className="w-4 h-4" />}
                            onClick={() => setIsModalOpen(true)}
                        >
                            Registrar Movimiento
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<ClipboardCheck className="w-4 h-4" />}
                            onClick={() => router.push('/dashboard/inventario/conteo')}
                        >
                            Inventario Físico
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                            Exportar
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<History className="w-4 h-4" />}>
                            Historial
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<TrendingUp className="w-4 h-4" />}
                            onClick={() => router.push('/dashboard/inventario/valoracion')}
                        >
                            Valoración
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F4F7F6]">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Producto</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Marca</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Distribución</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-[#2C3E50]">Stock Global</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-[#2C3E50]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E1E8ED]">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="h-12 animate-pulse rounded-lg bg-[#F4F7F6]"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-[#5A6C7D]">
                                        No se encontraron productos
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-[#F4F7F6] cursor-pointer group"
                                        onClick={() => handleRowClick(item.id)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-transparent group-hover:bg-blue-500 transition-colors" />
                                                <div>
                                                    <p className="font-medium text-[#2C3E50] group-hover:text-blue-600 transition-colors">{item.description}</p>
                                                    <p className="text-xs text-[#5A6C7D]">ID: {item.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="info">{item.brandName}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {item.branches.map((b, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-1.5 rounded-md border border-[#E1E8ED] bg-white px-2 py-1"
                                                    >
                                                        <span className="text-xs font-medium text-[#5A6C7D]">{b.branchName}</span>
                                                        <span className={clsx(
                                                            "text-xs font-semibold",
                                                            b.quantity < 5 ? "text-[#C0392B]" : "text-[#2980B9]"
                                                        )}>
                                                            {b.quantity}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={clsx(
                                                    "text-lg font-semibold",
                                                    item.totalQuantity < 20 ? "text-[#C0392B]" : "text-[#2C3E50]"
                                                )}>
                                                    {item.totalQuantity.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-[#5A6C7D]">unidades</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="rounded-lg p-2 text-[#5A6C7D] transition-colors hover:bg-[#E1E8ED] hover:text-[#2C3E50]">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card >
        </div >
    );
}
