'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { api } from '@/lib/api';

type Product = {
    id: string;
    description: string;
    internalReference: string;
};

export default function CambioCodigoPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [product, setProduct] = useState<Product | null>(null);
    const [newCode, setNewCode] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) {
            toast.warning('Ingrese un código o descripción para buscar');
            return;
        }

        setIsSearching(true);
        setProduct(null);
        try {
            const res = await api<{ items: Product[] }>(`/products?search=${encodeURIComponent(searchTerm)}&limit=1`);
            if (res.items.length > 0) {
                setProduct(res.items[0]);
                setNewCode(res.items[0].internalReference || '');
                toast.success('Producto encontrado');
            } else {
                toast.info('No se encontró ningún producto con ese criterio');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al buscar el producto');
        } finally {
            setIsSearching(false);
        }
    };

    const handleUpdateCode = async () => {
        if (!product) return;
        if (!newCode.trim()) {
            toast.warning('El nuevo código no puede estar vacío');
            return;
        }
        if (newCode === product.internalReference) {
            toast.info('El código nuevo es igual al actual');
            return;
        }

        setIsUpdating(true);
        try {
            await api(`/products/${product.id}`, {
                method: 'PATCH',
                body: { internalReference: newCode.trim() }
            });
            toast.success('Código actualizado exitosamente');
            setProduct({ ...product, internalReference: newCode.trim() });
            setSearchTerm(newCode.trim());
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar el código. Es posible que el código ya exista.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-6 bg-bg-base min-h-screen">
            <Button
                variant="ghost"
                className="mb-6 pl-0 hover:bg-transparent hover:text-brand-primary"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => router.back()}
            >
                Volver a Herramientas
            </Button>

            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-warning/10 rounded-xl">
                    <Edit className="w-6 h-6 text-warning" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                    Cambio de Código
                </h1>
            </div>
            <p className="text-text-secondary text-sm mb-8 font-light">
                Cambie el código de referencia interna (SKU) de un producto sin afectar su historial de movimientos e inventario asociado.
            </p>

            <div className="bg-bg-surface p-6 rounded-2xl border border-divider shadow-sm mb-6">
                <form onSubmit={handleSearch} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <Input
                            label="Buscar Producto"
                            placeholder="Ingrese código actual o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
                        />
                    </div>
                    <Button
                        type="submit"
                        variant="secondary"
                        isLoading={isSearching}
                        disabled={!searchTerm.trim() || isSearching}
                    >
                        Buscar
                    </Button>
                </form>
            </div>

            {product && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-surface p-6 rounded-2xl border border-divider shadow-sm"
                >
                    <div className="mb-6 pb-6 border-b border-divider">
                        <h3 className="text-xs font-bold text-text-secondary uppercase mb-2">Producto Seleccionado</h3>
                        <p className="text-lg font-medium text-text-primary">{product.description}</p>
                        <p className="text-sm text-text-secondary font-mono mt-1">ID Sistema: {product.id}</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <Input
                                label="Modificar Código (SKU)"
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value)}
                            />
                        </div>

                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleUpdateCode}
                            isLoading={isUpdating}
                            disabled={isUpdating || newCode === product.internalReference || !newCode.trim()}
                            leftIcon={<CheckCircle className="w-4 h-4" />}
                        >
                            Confirmar Cambio de Código
                        </Button>
                        <p className="text-xs text-text-secondary text-center">
                            Nota: Cualquier etiqueta impresa con el código anterior dejará de ser válida en el sistema.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
