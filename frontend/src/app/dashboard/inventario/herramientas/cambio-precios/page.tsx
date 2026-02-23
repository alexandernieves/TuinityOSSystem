'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Percent, DollarSign, UploadCloud, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { api } from '@/lib/api';

type Category = { id: string; name: string };
type Brand = { id: string; name: string };
type Product = {
    id: string;
    description: string;
    price_a: number;
    price_b: number;
    price_c: number;
    price_d: number;
    price_e: number;
    category?: { id: string; name: string };
    brand?: { id: string; name: string };
};

export default function CambioPreciosPage() {
    const router = useRouter();
    const [filterType, setFilterType] = useState<'category' | 'brand'>('category');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedBrandId, setSelectedBrandId] = useState<string>('');
    const [adjustmentType, setAdjustmentType] = useState<'percentage_up' | 'percentage_down'>('percentage_up');
    const [percentage, setPercentage] = useState<number>(5);
    const [targetPriceLevels, setTargetPriceLevels] = useState<{ [key: string]: boolean }>({
        price_a: true,
        price_b: false,
        price_c: false,
        price_d: false,
        price_e: false,
    });

    const [productsToUpdate, setProductsToUpdate] = useState<Product[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    useEffect(() => {
        const loadVars = async () => {
            try {
                const cats = await api<{ items: Category[] }>('/categories?limit=500');
                const brnds = await api<{ items: Brand[] }>('/brands?limit=500');
                setCategories(cats.items || []);
                setBrands(brnds.items || []);
            } catch (e) {
                console.error("Error loading filters", e);
            }
        };
        loadVars();
    }, []);

    const handleSearch = async () => {
        if (filterType === 'category' && !selectedCategoryId) {
            toast.warning('Debe seleccionar una categoría');
            return;
        }
        if (filterType === 'brand' && !selectedBrandId) {
            toast.warning('Debe seleccionar una marca');
            return;
        }

        try {
            let query = '/products?limit=1000'; // We need all of them to update
            if (filterType === 'category') query += `&categoryId=${selectedCategoryId}`;
            if (filterType === 'brand') query += `&brandId=${selectedBrandId}`;

            const res = await api<{ items: Product[] }>(query);
            if (res.items.length === 0) {
                toast.info('No se encontraron productos para aplicar el filtro');
                setProductsToUpdate([]);
            } else {
                setProductsToUpdate(res.items);
                toast.success(`Se prepararán ${res.items.length} productos para modificación`);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al buscar productos');
        }
    };

    const handleApplyAdjustment = async () => {
        if (productsToUpdate.length === 0) return;
        if (percentage <= 0) {
            toast.warning('El porcentaje debe ser mayor a 0');
            return;
        }

        const selectedLevels = Object.entries(targetPriceLevels).filter(([_, isSelected]) => isSelected).map(([level]) => level);
        if (selectedLevels.length === 0) {
            toast.warning('Seleccione al menos un nivel de precio');
            return;
        }

        setIsProcessing(true);
        try {
            const multiplier = adjustmentType === 'percentage_up' ? (1 + percentage / 100) : (1 - percentage / 100);

            const updates = productsToUpdate.map(product => {
                const update: any = { productId: product.id };
                if (targetPriceLevels.price_a) update.price_a = Number((Number(product.price_a) * multiplier).toFixed(4));
                if (targetPriceLevels.price_b) update.price_b = Number((Number(product.price_b) * multiplier).toFixed(4));
                if (targetPriceLevels.price_c) update.price_c = Number((Number(product.price_c) * multiplier).toFixed(4));
                if (targetPriceLevels.price_d) update.price_d = Number((Number(product.price_d) * multiplier).toFixed(4));
                if (targetPriceLevels.price_e) update.price_e = Number((Number(product.price_e) * multiplier).toFixed(4));
                return update;
            });

            const res = await api<{ updated: number; errors: any[] }>('/products/bulk/prices', {
                method: 'POST',
                body: { updates }
            });

            if (res.errors.length > 0) {
                toast.warning(`Se actualizaron ${res.updated} precios, con ${res.errors.length} errores.`);
            } else {
                toast.success(`Se han actualizado exitosamente los precios de ${res.updated} productos.`);
            }

            // Clear current selection
            setProductsToUpdate([]);

        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar precios');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8 bg-bg-base min-h-screen">
            <Button
                variant="ghost"
                className="mb-6 pl-0 hover:bg-transparent hover:text-brand-primary"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => router.back()}
            >
                Volver a Herramientas
            </Button>

            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-success/10 rounded-xl">
                    <DollarSign className="w-6 h-6 text-success" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                    Cambio de Precios Masivo
                </h1>
            </div>
            <p className="text-text-secondary text-sm mb-8 font-light">
                Ajuste rápidamente los niveles de precios aplicando reglas porcentuales a un grupo de productos por Categoría o Marca.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Panel de Filtros */}
                <div className="bg-bg-surface p-6 rounded-2xl border border-divider shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-brand-secondary" />
                        1. Filtro de Productos
                    </h2>

                    <div className="flex gap-4 mb-4">
                        <Button
                            variant={filterType === 'category' ? 'primary' : 'secondary'}
                            onClick={() => setFilterType('category')}
                            className="flex-1"
                            size="sm"
                        >
                            Por Categoría
                        </Button>
                        <Button
                            variant={filterType === 'brand' ? 'primary' : 'secondary'}
                            onClick={() => setFilterType('brand')}
                            className="flex-1"
                            size="sm"
                        >
                            Por Marca
                        </Button>
                    </div>

                    {filterType === 'category' && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Categoría a Modificar</label>
                            <select
                                className="w-full bg-bg-base border border-divider rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                            >
                                <option value="">Seleccione una categoría...</option>
                                {categories.map((c: Category) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {filterType === 'brand' && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Marca a Modificar</label>
                            <select
                                className="w-full bg-bg-base border border-divider rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
                                value={selectedBrandId}
                                onChange={(e) => setSelectedBrandId(e.target.value)}
                            >
                                <option value="">Seleccione una marca...</option>
                                {brands.map((b: Brand) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={handleSearch}
                        disabled={isProcessing}
                    >
                        Buscar Productos ({productsToUpdate.length} Seleccionados)
                    </Button>
                </div>

                {/* Panel de Ajustes */}
                <div className="bg-bg-surface p-6 rounded-2xl border border-divider shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Percent className="w-5 h-5 text-brand-primary" />
                        2. Reglas de Ajuste
                    </h2>

                    <div className="flex gap-4 mb-4">
                        <Button
                            variant={adjustmentType === 'percentage_up' ? 'primary' : 'secondary'}
                            onClick={() => setAdjustmentType('percentage_up')}
                            className={`flex-1 ${adjustmentType === 'percentage_up' ? 'bg-success hover:bg-success/90' : ''}`}
                            size="sm"
                        >
                            ↑ Aumentar %
                        </Button>
                        <Button
                            variant={adjustmentType === 'percentage_down' ? 'primary' : 'secondary'}
                            onClick={() => setAdjustmentType('percentage_down')}
                            className={`flex-1 ${adjustmentType === 'percentage_down' ? 'bg-error hover:bg-error/90' : ''}`}
                            size="sm"
                        >
                            ↓ Reducir %
                        </Button>
                    </div>

                    <div className="mb-6">
                        <Input
                            label="Porcentaje (%)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={percentage}
                            onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
                            leftIcon={<Percent className="w-4 h-4 text-text-secondary" />}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-3">Niveles de Precio Afectados</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['price_a', 'price_b', 'price_c', 'price_d', 'price_e'].map((level) => (
                                <label key={level} className="flex items-center gap-2 text-sm cursor-pointer p-2 border border-divider rounded-lg hover:bg-bg-base transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={targetPriceLevels[level]}
                                        onChange={(e) => setTargetPriceLevels(prev => ({ ...prev, [level]: e.target.checked }))}
                                        className="rounded border-divider text-brand-primary focus:ring-brand-primary/20"
                                    />
                                    <span className="font-medium text-text-primary capitalize">{level.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className={`w-full ${productsToUpdate.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleApplyAdjustment}
                        isLoading={isProcessing}
                        disabled={productsToUpdate.length === 0 || isProcessing}
                        leftIcon={<UploadCloud className="w-4 h-4" />}
                    >
                        Aplicar Ajustes Masivos
                    </Button>
                    {productsToUpdate.length === 0 ? (
                        <p className="text-xs text-text-secondary text-center mt-3 flex items-center justify-center gap-1">
                            <AlertCircle className="w-3 h-3 text-warning" /> Busque y seleccione productos primero
                        </p>
                    ) : (
                        <p className="text-xs text-text-secondary text-center mt-3">
                            Se actualizarán los niveles seleccionados en {productsToUpdate.length} productos
                        </p>
                    )}
                </div>
            </div>

        </div>
    );
}
