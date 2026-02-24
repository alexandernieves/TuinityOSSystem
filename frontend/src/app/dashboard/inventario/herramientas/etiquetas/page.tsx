'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Printer, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import Barcode from 'react-barcode';

// Usamos el hook de react-to-print si estuviera, pero podemos usar window.print
// y CSS media queries para ocultar UI

type Product = {
    id: string;
    description: string;
    internalReference: string;
    barcodes?: { barcode: string }[];
    price_a: number;
};

type LabelItem = {
    product: Product;
    quantity: number;
};

export default function EtiquetasPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [labelItems, setLabelItems] = useState<LabelItem[]>([]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) {
            toast.warning('Ingrese un código o descripción para buscar');
            return;
        }

        setIsSearching(true);
        try {
            const res = await api<{ items: Product[] }>(`/products?search=${encodeURIComponent(searchTerm)}&limit=10`);
            if (res.items.length > 0) {
                // Si encontramos productos, podemos agregar el primero directamente o mostrar una lista.
                // Para simplificar, agregamos el primero si hay coincidencia exacta o dejamos que el usuario elija.
                // Aquí en UI simple agregamos el primero devuelto.
                const product = res.items[0];
                const existing = labelItems.find(item => item.product.id === product.id);
                if (existing) {
                    setLabelItems(labelItems.map(item =>
                        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    ));
                } else {
                    setLabelItems([...labelItems, { product, quantity: 1 }]);
                }
                setSearchTerm('');
                toast.success('Producto agregado a la lista de impresión');
            } else {
                toast.info('No se encontró ningún producto con ese criterio');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al buscar el producto');
        } finally {
            setIsSearching(false);
        }
    };

    const updateQuantity = (productId: string, delta: number) => {
        setLabelItems(items => items.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (productId: string) => {
        setLabelItems(items => items.filter(item => item.product.id !== productId));
    };

    const handlePrint = () => {
        if (labelItems.length === 0) {
            toast.warning('Agregue productos para imprimir');
            return;
        }
        window.print();
    };

    // Flatten logic for printing
    const labelsToPrint = labelItems.flatMap(item => Array(item.quantity).fill(item.product));

    return (
        <div className="min-h-screen bg-bg-base">
            <style jsx global>{`
                @media print {
                    @page { margin: 0; }
                    body { background: white; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .print-container { 
                        display: flex !important;
                        flex-wrap: wrap;
                        padding: 10px;
                        gap: 10px;
                        justify-content: flex-start;
                    }
                    .label-box {
                        width: 150px;
                        height: 100px;
                        border: 1px dashed #ccc;
                        padding: 8px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="container mx-auto max-w-5xl px-4 py-8 md:px-6 no-print">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent hover:text-brand-primary"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    onClick={() => router.back()}
                >
                    Volver a Herramientas
                </Button>

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/10 rounded-xl">
                            <Printer className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                                Etiquetas de Código de Barras
                            </h1>
                            <p className="text-text-secondary text-sm font-light mt-1">
                                Busque productos y seleccione la cantidad de etiquetas a imprimir.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        leftIcon={<Printer className="w-4 h-4" />}
                        disabled={labelItems.length === 0}
                        onClick={handlePrint}
                    >
                        Imprimir {labelsToPrint.length} Etiquetas
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 border-r border-divider pr-6">
                        <form onSubmit={handleSearch} className="mb-6">
                            <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">Agregar Producto</h3>
                            <div className="flex flex-col gap-3">
                                <Input
                                    placeholder="SKU, barra o descripción..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
                                />
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    isLoading={isSearching}
                                    disabled={!searchTerm.trim() || isSearching}
                                    className="w-full"
                                >
                                    Buscar y Agregar
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-sm font-bold text-text-secondary uppercase mb-4">Lista de Impresión ({labelItems.length} productos)</h3>

                        {labelItems.length === 0 ? (
                            <div className="bg-bg-surface p-10 rounded-2xl border border-dashed border-divider text-center text-text-secondary">
                                Agregue productos a la lista usando el buscador para comenzar.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {labelItems.map(item => (
                                    <div key={item.product.id} className="bg-bg-surface p-4 rounded-xl border border-divider flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-text-primary truncate" title={item.product.description}>
                                                {item.product.description}
                                            </p>
                                            <p className="text-xs text-text-secondary font-mono mt-1">
                                                SKU: {item.product.internalReference || 'N/A'} |
                                                Barra: {item.product.barcodes?.[0]?.barcode || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center bg-bg-base border border-divider rounded-lg p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, -1)}
                                                    className="p-1 hover:bg-bg-surface rounded text-text-secondary hover:text-text-primary"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, 1)}
                                                    className="p-1 hover:bg-bg-surface rounded text-text-secondary hover:text-text-primary"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.product.id)}
                                                className="p-2 text-error/70 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Print View Container */}
            <div className="hidden print:flex print-container print-only">
                {labelsToPrint.map((prod, index) => {
                    const barcodeValue = prod.barcodes?.[0]?.barcode || prod.internalReference;
                    return (
                        <div key={`${prod.id}-${index}`} className="label-box">
                            <span className="text-[10px] font-bold leading-tight truncate w-full mb-1">{prod.description}</span>
                            {barcodeValue ? (
                                <div className="h-10 overflow-hidden w-full flex justify-center flex-1">
                                    <Barcode
                                        value={barcodeValue}
                                        width={1}
                                        height={30}
                                        fontSize={10}
                                        margin={0}
                                        displayValue={true}
                                    />
                                </div>
                            ) : (
                                <span className="text-xs text-text-secondary italic flex-1">Sin código barras</span>
                            )}
                            <span className="text-xs font-bold mt-1">${Number(prod.price_a).toFixed(2)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
