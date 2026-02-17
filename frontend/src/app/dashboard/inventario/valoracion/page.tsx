'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, DollarSign, PieChart, Info } from 'lucide-react';
import { DonutChart, BarChart } from '@tremor/react';

type ValuationReport = {
    summary: {
        totalFob: number;
        totalCif: number;
        investmentInFreight: number;
    };
    categories: {
        name: string;
        fob: number;
        cif: number;
    }[];
};

export default function InventoryValuationPage() {
    const router = useRouter();
    const [report, setReport] = useState<ValuationReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        try {
            const data = await api<ValuationReport>('/inventory/valuation', {
                accessToken: session.accessToken
            });
            setReport(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando análisis financiero...</div>;
    if (!report) return <div className="p-8 text-center text-red-500">Error al cargar reporte</div>;

    const chartData = report.categories.map(c => ({
        name: c.name,
        'Valor FOB': c.fob,
        'Valor CIF': c.cif
    }));

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-[#2C3E50]">Valoración de Inventario</h1>
                    <p className="text-sm text-[#5A6C7D]">Análisis financiero del stock actual (FOB vs CIF)</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="bg-[#2C3E50] text-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-[#5A6C7D] text-white/60">Valor Total FOB</p>
                                <h2 className="mt-2 text-3xl font-bold">${report.summary.totalFob.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                            </div>
                            <div className="rounded-lg bg-white/10 p-3">
                                <DollarSign className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-white/40">Costo de mercancía en origen</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#27AE60] text-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-[#5A6C7D] text-white/60">Valor Total CIF</p>
                                <h2 className="mt-2 text-3xl font-bold">${report.summary.totalCif.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                            </div>
                            <div className="rounded-lg bg-white/10 p-3">
                                <PieChart className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-white/40">Includes freight, insurance & customs</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-[#5A6C7D]">Inversión Logística</p>
                                <h2 className="mt-2 text-3xl font-bold text-[#2C3E50]">${report.summary.investmentInFreight.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                            </div>
                            <div className="rounded-lg bg-[#F39C12]/10 p-3">
                                <Info className="h-6 w-6 text-[#F39C12]" />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-[#5A6C7D]">Diferencia (CIF - FOB)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="mb-6 text-lg font-bold text-[#2C3E50]">Distribución por Categoría</h3>
                        <DonutChart
                            className="h-80"
                            data={chartData}
                            category="Valor CIF"
                            index="name"
                            valueFormatter={(number) => `$${number.toLocaleString()}`}
                            colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia']}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="mb-6 text-lg font-bold text-[#2C3E50]">FOB vs CIF por Categoría</h3>
                        <BarChart
                            className="h-80"
                            data={chartData}
                            index="name"
                            categories={['Valor FOB', 'Valor CIF']}
                            colors={['slate', 'emerald']}
                            valueFormatter={(number) => `$${number.toLocaleString()}`}
                            yAxisWidth={80}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
