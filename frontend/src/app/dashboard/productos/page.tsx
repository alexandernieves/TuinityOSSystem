'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus, Upload, Search, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

type Product = {
    id: string;
    description: string;
    description_es?: string;
    description_en?: string;
    description_pt?: string;
    codigoArancelario?: string;
    paisOrigen?: string;
    weight?: number;
    volume?: number;
    unitsPerBox: number;
    price_a: number;
    price_b: number;
    price_c: number;
    price_d: number;
    price_e: number;
    imageUrl?: string;
    createdAt: string;
};

export default function ProductosPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userRole, setUserRole] = useState<string>('CLIENT');

    useEffect(() => {
        fetchProducts();
        fetchUserRole();
    }, []);

    const fetchUserRole = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        try {
            const data = await api<{ role: string }>('/auth/me', {
                method: 'GET',
                accessToken: session.accessToken,
            });
            setUserRole(data.role);
        } catch (err) {
            console.error('Error fetching user role:', err);
        }
    };

    const fetchProducts = async (search?: string) => {
        const session = loadSession();
        if (!session?.accessToken) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const queryParams = search ? `?q=${encodeURIComponent(search)}` : '';
            const response = await api<{ items: Product[] }>(`/products${queryParams}`, {
                method: 'GET',
                accessToken: session.accessToken,
            });
            setProducts(response.items || []);
        } catch (err: any) {
            if (err.status === 401) router.push('/login');
            else toast.error('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchProducts(searchQuery);
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        const session = loadSession();
        if (!session?.accessToken) return;

        const toastId = toast.loading('Eliminando producto...');
        try {
            await api(`/products/${productId}`, {
                method: 'DELETE',
                accessToken: session.accessToken,
            });
            toast.success('Producto eliminado', { id: toastId });
            fetchProducts(searchQuery);
        } catch (err: any) {
            if (err.status === 401) router.push('/login');
            else toast.error('Error al eliminar producto', { id: toastId });
        }
    };

    const canSeeCosts = ['OWNER', 'ADMIN', 'WAREHOUSE'].includes(userRole);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2980B9]/10">
                            <Package className="h-6 w-6 text-[#2980B9]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-[#2C3E50]">Catálogo de Productos</h1>
                            <p className="text-sm text-[#5A6C7D]">Gestiona tu inventario con descripciones multilingües y precios multinivel</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        size="md"
                        leftIcon={<Upload className="w-4 h-4" />}
                        onClick={() => router.push('/dashboard/productos/importar')}
                    >
                        Importar Excel
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => router.push('/dashboard/productos/nuevo')}
                    >
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            {/* Search Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Buscar por descripción, marca, código arancelario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            leftIcon={<Search className="h-5 w-5" />}
                            className="flex-1"
                        />
                        <Button variant="primary" size="md" onClick={handleSearch}>
                            Buscar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Products Grid */}
            {loading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i}>
                            <div className="animate-pulse p-6">
                                <div className="mb-4 h-48 rounded-lg bg-[#F4F7F6]"></div>
                                <div className="mb-2 h-6 rounded bg-[#F4F7F6]"></div>
                                <div className="h-4 w-2/3 rounded bg-[#F4F7F6]"></div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Package className="mx-auto mb-4 h-16 w-16 text-[#B8C5D0]" />
                        <h3 className="mb-2 text-xl font-medium text-[#2C3E50]">No hay productos</h3>
                        <p className="mb-6 text-sm text-[#5A6C7D]">
                            {searchQuery ? 'No se encontraron productos con esa búsqueda' : 'Comienza agregando tu primer producto'}
                        </p>
                        <Button
                            variant="primary"
                            size="md"
                            leftIcon={<Plus className="w-4 h-4" />}
                            onClick={() => router.push('/dashboard/productos/nuevo')}
                        >
                            Crear Primer Producto
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => (
                        <Card key={product.id} hover>
                            {/* Product Image */}
                            <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-[#F4F7F6]">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.description}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <ImageIcon className="h-16 w-16 text-[#B8C5D0]" />
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <CardContent className="p-6">
                                <h3 className="mb-2 min-h-[3rem] font-medium text-[#2C3E50] line-clamp-2">
                                    {product.description}
                                </h3>

                                {product.codigoArancelario && (
                                    <p className="mb-3 text-xs text-[#5A6C7D]">
                                        Código: {product.codigoArancelario}
                                    </p>
                                )}

                                {/* Prices */}
                                <div className="mb-4 grid grid-cols-5 gap-2">
                                    {['A', 'B', 'C', 'D', 'E'].map((level, idx) => (
                                        <div key={level} className="text-center">
                                            <p className="text-[10px] font-medium text-[#5A6C7D]">{level}</p>
                                            <p className="text-sm font-semibold text-[#2C3E50]">
                                                ${product[`price_${level.toLowerCase()}` as keyof Product]}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Additional Info */}
                                <div className="mb-4 flex items-center justify-between text-xs text-[#5A6C7D]">
                                    <span>{product.unitsPerBox} unid/caja</span>
                                    {product.paisOrigen && <span>{product.paisOrigen}</span>}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        leftIcon={<Edit className="w-4 h-4" />}
                                        onClick={() => router.push(`/dashboard/productos/${product.id}`)}
                                        className="flex-1"
                                    >
                                        Editar
                                    </Button>
                                    {canSeeCosts && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(product.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
