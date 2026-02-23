'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, FileSpreadsheet, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type Category = { id: string; name: string };
type Brand = { id: string; name: string };
type Product = {
    id: string;
    description: string;
    internalReference: string;
    price_a: number;
    unitsPerBox: number;
    category?: { id: string; name: string };
    brand?: { id: string; name: string };
};

export default function CatalogoPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadInitial = async () => {
            setIsLoading(true);
            try {
                const res = await api<{ items: Product[] }>('/products?limit=500');
                setProducts(res.items);
            } catch (error: any) {
                toast.error(error.message || 'Error al cargar catálogo inicial');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitial();
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        try {
            const endpoint = searchTerm.trim()
                ? `/products?search=${encodeURIComponent(searchTerm)}&limit=500`
                : '/products?limit=500';

            const res = await api<{ items: Product[] }>(endpoint);
            setProducts(res.items);
        } catch (error: any) {
            toast.error(error.message || 'Error al buscar productos');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (products.length === 0) {
            toast.warning('No hay productos para imprimir');
            return;
        }
        window.print();
    };

    // Grouping for catalog
    const groupedByCategory = products.reduce((acc, product) => {
        const catName = product.category?.name || 'Sin Categoría';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    return (
        <div className="min-h-screen bg-bg-base">
            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .catalog-page { 
                        display: block !important;
                        color: black;
                    }
                    .catalog-category-header {
                        background-color: #f3f4f6 !important;
                        padding: 8px !important;
                        font-weight: bold;
                        border-bottom: 2px solid #ccc;
                        margin-top: 20px;
                        page-break-after: avoid;
                    }
                    .catalog-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
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
                        <div className="p-2 bg-brand-secondary/10 rounded-xl">
                            <FileSpreadsheet className="w-6 h-6 text-brand-secondary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                                Catálogo de Productos
                            </h1>
                            <p className="text-text-secondary text-sm font-light mt-1">
                                Genera un catálogo agrupado por categorías listo para imprimir o exportar a PDF (Ctrl+P / Cmd+P).
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        leftIcon={<Printer className="w-4 h-4" />}
                        disabled={products.length === 0}
                        onClick={handlePrint}
                    >
                        Imprimir Catálogo ({products.length})
                    </Button>
                </div>

                <div className="bg-bg-surface p-6 rounded-2xl border border-divider shadow-sm mb-6">
                    <form onSubmit={handleSearch} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <Input
                                label="Filtro Rápido"
                                placeholder="Buscar por descripción o código para un catálogo específico..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="secondary"
                            isLoading={isLoading}
                        >
                            Filtrar
                        </Button>
                    </form>
                </div>
            </div>

            {/* Print View / Catalog Output */}
            <div className="hidden print:block catalog-page max-w-4xl mx-auto px-4 print-only">
                <div className="text-center mb-8 pb-4 border-b-2 border-black">
                    <h1 className="text-3xl font-black uppercase tracking-widest">CATÁLOGO DE PRODUCTOS</h1>
                    <p className="text-sm mt-2 font-mono">Generado el {new Date().toLocaleDateString()}</p>
                </div>

                {Object.entries(groupedByCategory).map(([categoryName, items]) => (
                    <div key={categoryName} className="mb-6">
                        <div className="catalog-category-header text-lg uppercase tracking-wider text-black">
                            {categoryName}
                        </div>
                        <div className="flex font-bold text-xs uppercase tracking-widest py-2 border-b border-black text-gray-600">
                            <div className="w-1/6">SKU</div>
                            <div className="w-3/6">Descripción</div>
                            <div className="w-1/6 text-center">Und/Caja</div>
                            <div className="w-1/6 text-right">Precio ($)</div>
                        </div>

                        {items.map(product => (
                            <div key={product.id} className="catalog-item text-sm">
                                <div className="w-1/6 font-mono text-xs">{product.internalReference || '-'}</div>
                                <div className="w-3/6 font-medium pr-4">{product.description}</div>
                                <div className="w-1/6 text-center text-xs text-gray-600">{product.unitsPerBox || 1}</div>
                                <div className="w-1/6 text-right font-bold">${Number(product.price_a).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                ))}

                {products.length === 0 && !isLoading && (
                    <div className="text-center mt-20 text-gray-500 italic">No se encontraron productos para el catálogo.</div>
                )}
            </div>
        </div>
    );
}
