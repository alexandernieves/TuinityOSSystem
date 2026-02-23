'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardBody,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
} from '@heroui/react';
import { ArrowLeft, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AgingReport {
    current: string;
    days30: string;
    days60: string;
    days90: string;
    over90: string;
    total: number;
}

export default function MorosidadDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AgingReport | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const report = await api<AgingReport>('/customers/reports/aging');
                setData(report);
            } catch (error) {
                toast.error('Error al cargar reporte de morosidad');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    const formatCurrency = (val?: string | number) => {
        if (val === undefined || val === null) return '$0.00';
        return `$${parseFloat(val.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="p-6 md:p-8 space-y-6 bg-bg-base min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Análisis de Morosidad</h1>
                    <p className="text-text-secondary mt-1 font-light">
                        Monitorea el riesgo crediticio y antigüedad de saldos.
                    </p>
                </div>
                <Button
                    variant="light"
                    startContent={<ArrowLeft size={18} />}
                    onPress={() => router.push('/dashboard/clientes')}
                >
                    Volver
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 min-h-[400px]">
                    <Spinner size="lg" color="primary" />
                </div>
            ) : (
                <div className="space-y-6 fade-in animate-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-border-subtle shadow-sm bg-success/10" radius="lg">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 bg-success/20 rounded-full text-success"><DollarSign size={24} /></div>
                                <div>
                                    <p className="text-sm font-medium text-success">Saldo Corriente (0-30 días)</p>
                                    <p className="text-2xl font-bold text-success-700">{formatCurrency(data?.current)}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="border border-border-subtle shadow-sm bg-warning/10" radius="lg">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 bg-warning/20 rounded-full text-warning"><Calendar size={24} /></div>
                                <div>
                                    <p className="text-sm font-medium text-warning">Atraso 31-60 días</p>
                                    <p className="text-2xl font-bold text-warning-700">{formatCurrency(data?.days30)}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="border border-border-subtle shadow-sm bg-orange-500/10" radius="lg">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 bg-orange-500/20 rounded-full text-orange-500"><TrendingDown size={24} /></div>
                                <div>
                                    <p className="text-sm font-medium text-orange-500">Atraso 61-90 días</p>
                                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(data?.days60)}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="border border-border-subtle shadow-sm bg-error/10" radius="lg">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 bg-error/20 rounded-full text-error"><TrendingDown size={24} /></div>
                                <div>
                                    <p className="text-sm font-medium text-error">Más de 90 días</p>
                                    <p className="text-2xl font-bold text-error-700">{formatCurrency(data?.over90)}</p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                        <CardBody className="p-0 overflow-hidden">
                            <div className="p-6 border-b border-border-subtle bg-bg-base/50 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-text-primary">Resumen de Antigüedad de Cuentas por Cobrar</h3>
                                <div className="text-right">
                                    <p className="text-sm text-text-secondary">Cartera Total</p>
                                    <p className="text-xl font-bold text-text-primary">{formatCurrency(data?.total)}</p>
                                </div>
                            </div>
                            <Table aria-label="Tabla de saldos" removeWrapper classNames={{ th: "bg-surface" }}>
                                <TableHeader>
                                    <TableColumn>RANGO DE TIEMPO</TableColumn>
                                    <TableColumn>ESTATUS</TableColumn>
                                    <TableColumn align="right">MONTO TOTAL</TableColumn>
                                    <TableColumn align="right">% DE CARTERA</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell><span className="font-semibold text-text-primary">Corriente (0-30 días)</span></TableCell>
                                        <TableCell><span className="text-success font-medium">Al Día</span></TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(data?.current)}</TableCell>
                                        <TableCell className="text-right">{data?.total ? ((parseFloat(data.current) / data.total) * 100).toFixed(1) : 0}%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><span className="font-semibold text-text-primary">Atraso Leve (31-60 días)</span></TableCell>
                                        <TableCell><span className="text-warning font-medium">Precaución</span></TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(data?.days30)}</TableCell>
                                        <TableCell className="text-right">{data?.total ? ((parseFloat(data.days30) / data.total) * 100).toFixed(1) : 0}%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><span className="font-semibold text-text-primary">Atraso Medio (61-90 días)</span></TableCell>
                                        <TableCell><span className="text-orange-500 font-medium">Riesgo Moderado</span></TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(data?.days60)}</TableCell>
                                        <TableCell className="text-right">{data?.total ? ((parseFloat(data.days60) / data.total) * 100).toFixed(1) : 0}%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><span className="font-semibold text-text-primary">Atraso Crítico (+90 días)</span></TableCell>
                                        <TableCell><span className="text-error font-medium">Riesgo Alto</span></TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(data?.over90)}</TableCell>
                                        <TableCell className="text-right">{data?.total ? ((parseFloat(data.over90) / data.total) * 100).toFixed(1) : 0}%</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
}
