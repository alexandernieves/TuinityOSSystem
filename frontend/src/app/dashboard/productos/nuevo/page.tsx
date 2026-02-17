'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

export default function NuevoProductoPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        description_es: '',
        description_en: '',
        description_pt: '',
        codigoArancelario: '',
        paisOrigen: '',
        weight: '',
        volume: '',
        unitsPerBox: '1',
        price_a: '0',
        price_b: '0',
        price_c: '0',
        price_d: '0',
        price_e: '0',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.description.trim()) {
            toast.error('La descripción es obligatoria');
            return;
        }

        const session = loadSession();
        if (!session?.accessToken) {
            router.push('/login');
            return;
        }

        setSaving(true);
        const toastId = toast.loading('Creando producto...');

        try {
            const payload = {
                description: formData.description.trim(),
                description_es: formData.description_es?.trim() || undefined,
                description_en: formData.description_en?.trim() || undefined,
                description_pt: formData.description_pt?.trim() || undefined,
                codigoArancelario: formData.codigoArancelario?.trim() || undefined,
                paisOrigen: formData.paisOrigen?.trim() || undefined,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                volume: formData.volume ? parseFloat(formData.volume) : undefined,
                unitsPerBox: parseInt(formData.unitsPerBox) || 1,
                price_a: parseFloat(formData.price_a) || 0,
                price_b: parseFloat(formData.price_b) || 0,
                price_c: parseFloat(formData.price_c) || 0,
                price_d: parseFloat(formData.price_d) || 0,
                price_e: parseFloat(formData.price_e) || 0,
            };

            await api('/products', {
                method: 'POST',
                accessToken: session.accessToken,
                body: payload,
            });

            toast.success('Producto creado exitosamente', { id: toastId });
            router.push('/dashboard/productos');
        } catch (err: any) {
            if (err.status === 401) router.push('/login');
            else toast.error(err.message || 'Error al crear producto', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center gap-2 text-sm text-[#5A6C7D] transition-colors hover:text-[#2C3E50]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </button>
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2980B9]/10">
                        <Package className="h-6 w-6 text-[#2980B9]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-medium text-[#2C3E50]">Nuevo Producto</h1>
                        <p className="text-sm text-[#5A6C7D]">Completa la información del producto</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Descripción Principal */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 text-lg font-medium text-[#2C3E50]">Descripción Principal *</h2>
                        <p className="mb-4 text-sm text-[#5A6C7D]">
                            Debe incluir: marca, tipo de licor, tamaño (200ml, 375ml, 700ml, 750ml), si tiene estuche, regulador, corcho, si es rellenable.
                        </p>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ej: Whisky Black & White 750ml con estuche"
                            className="min-h-[100px] w-full rounded-lg border border-[#E1E8ED] px-4 py-3 text-sm text-[#2C3E50] placeholder-[#B8C5D0] focus:border-[#2980B9] focus:outline-none focus:ring-2 focus:ring-[#2980B9]/20"
                        />
                    </CardContent>
                </Card>

                {/* Descripciones Multilingües */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 text-lg font-medium text-[#2C3E50]">Descripciones Multilingües (Opcional)</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Español</label>
                                <Input
                                    value={formData.description_es}
                                    onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                                    placeholder="Descripción en español"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">English</label>
                                <Input
                                    value={formData.description_en}
                                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                    placeholder="English description"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Português</label>
                                <Input
                                    value={formData.description_pt}
                                    onChange={(e) => setFormData({ ...formData, description_pt: e.target.value })}
                                    placeholder="Descrição em português"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Datos Arancelarios */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 text-lg font-medium text-[#2C3E50]">Datos Arancelarios (Obligatorios para Zona Libre)</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Código Arancelario</label>
                                <Input
                                    value={formData.codigoArancelario}
                                    onChange={(e) => setFormData({ ...formData, codigoArancelario: e.target.value })}
                                    placeholder="Ej: 2208.30.20"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">País de Origen</label>
                                <Input
                                    value={formData.paisOrigen}
                                    onChange={(e) => setFormData({ ...formData, paisOrigen: e.target.value })}
                                    placeholder="Ej: Escocia"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Datos Logísticos */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 text-lg font-medium text-[#2C3E50]">Datos Logísticos</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Peso (kg)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Volumen (m³)</label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    value={formData.volume}
                                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                    placeholder="0.000"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Unidades por Caja *</label>
                                <Input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.unitsPerBox}
                                    onChange={(e) => setFormData({ ...formData, unitsPerBox: e.target.value })}
                                    placeholder="6"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Precios Multinivel */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 text-lg font-medium text-[#2C3E50]">Precios Multinivel (A = más caro, E = más barato)</h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Precio A</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price_a}
                                    onChange={(e) => setFormData({ ...formData, price_a: e.target.value })}
                                    placeholder="0.00"
                                    leftIcon={<span className="text-[#5A6C7D]">$</span>}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Precio B</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price_b}
                                    onChange={(e) => setFormData({ ...formData, price_b: e.target.value })}
                                    placeholder="0.00"
                                    leftIcon={<span className="text-[#5A6C7D]">$</span>}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Precio C</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price_c}
                                    onChange={(e) => setFormData({ ...formData, price_c: e.target.value })}
                                    placeholder="0.00"
                                    leftIcon={<span className="text-[#5A6C7D]">$</span>}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Precio D</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price_d}
                                    onChange={(e) => setFormData({ ...formData, price_d: e.target.value })}
                                    placeholder="0.00"
                                    leftIcon={<span className="text-[#5A6C7D]">$</span>}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#2C3E50]">Precio E</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price_e}
                                    onChange={(e) => setFormData({ ...formData, price_e: e.target.value })}
                                    placeholder="0.00"
                                    leftIcon={<span className="text-[#5A6C7D]">$</span>}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={() => router.back()}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        leftIcon={<Save className="w-5 h-5" />}
                        isLoading={saving}
                        className="flex-1"
                    >
                        {saving ? 'Guardando...' : 'Crear Producto'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
