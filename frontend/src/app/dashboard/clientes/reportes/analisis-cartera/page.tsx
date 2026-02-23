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
import { ArrowLeft, PieChart, Users, Star, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface SegmentData {
    customer_id: string;
    name: string;
    customerType: string;
    creditLimit: string;
    currentBalance: string;
    segmento_antiguedad: string;
    nivel_riesgo: string;
}

export default function SegmentationReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SegmentData[]>([]);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const report = await api<SegmentData[]>('/customers/reports/segmentation');
                setData(report || []);
            } catch (error) {
                toast.error('Error al cargar reporte de segmentación');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    const totalBalance = data.reduce((acc, curr) => acc + parseFloat(curr.currentBalance || '0'), 0);
    const totalLimit = data.reduce((acc, curr) => acc + parseFloat(curr.creditLimit || '0'), 0);

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'BAJO_RIESGO': return 'bg-success/10 text-success';
            case 'RIESGO_MEDIO': return 'bg-warning/10 text-warning';
            case 'ALTO_RIESGO': return 'bg-error/10 text-error';
            default: return 'bg-bg-base text-text-secondary';
        }
    };

    const getRiskLabel = (risk: string) => {
        return risk.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <div className="p-6 md:p-8 space-y-6 bg-bg-base min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Análisis de Cartera y Segmentación</h1>
                    <p className="text-text-secondary mt-1 font-light">
                        Clasificación del perfil de riesgo y utilización de límite de crédito por cliente.
                    </p>
                </div>
                <Button
                    variant="light"
                    startContent={<ArrowLeft size={18} />}
                    onPress={() => router.push('/dashboard/clientes/reportes')}
                >
                    Volver a Reportes
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 min-h-[400px]">
                    <Spinner size="lg" color="primary" />
                </div>
            ) : (
                <div className="space-y-6 fade-in animate-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-border-subtle shadow-sm bg-surface" radius="lg">
                            <CardBody className="p-4 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-text-secondary mb-1">
                                    <Users size={18} className="text-brand-primary" />
                                    <span className="font-semibold text-sm">Total de Clientes Analizados</span>
                                </div>
                                <p className="text-3xl font-black text-text-primary">{data.length}</p>
                            </CardBody>
                        </Card>
                        <Card className="border border-border-subtle shadow-sm bg-surface" radius="lg">
                            <CardBody className="p-4 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-text-secondary mb-1">
                                    <Star size={18} className="text-brand-secondary" />
                                    <span className="font-semibold text-sm">Límite Otorgado Total</span>
                                </div>
                                <p className="text-3xl font-black text-brand-secondary">
                                    ${totalLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </CardBody>
                        </Card>
                        <Card className="border border-border-subtle shadow-sm bg-surface" radius="lg">
                            <CardBody className="p-4 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-text-secondary mb-1">
                                    <PieChart size={18} className="text-brand-accent" />
                                    <span className="font-semibold text-sm">Deuda Actual Total</span>
                                </div>
                                <p className="text-3xl font-black text-brand-accent">
                                    ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </CardBody>
                        </Card>
                        <Card className="border border-border-subtle shadow-sm bg-surface" radius="lg">
                            <CardBody className="p-4 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-text-secondary mb-1">
                                    <AlertTriangle size={18} className="text-warning" />
                                    <span className="font-semibold text-sm">Utilización de Crédito</span>
                                </div>
                                <p className="text-3xl font-black text-warning">
                                    {totalLimit > 0 ? ((totalBalance / totalLimit) * 100).toFixed(1) : 0}%
                                </p>
                            </CardBody>
                        </Card>
                    </div>

                    <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                        <CardBody className="p-0 overflow-hidden">
                            <Table aria-label="Tabla de segmentacion" removeWrapper classNames={{ th: "bg-bg-base h-12", td: "py-3 border-b border-border-subtle" }}>
                                <TableHeader>
                                    <TableColumn>CLIENTE / EMPRESA</TableColumn>
                                    <TableColumn>TIPO</TableColumn>
                                    <TableColumn>LÍMITE ADJUDICADO</TableColumn>
                                    <TableColumn>DEUDA ACTUAL</TableColumn>
                                    <TableColumn>COMPORTAMIENTO</TableColumn>
                                    <TableColumn>NIVEL DE RIESGO</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No hay datos suficientes para análisis.">
                                    {data.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell><span className="font-semibold text-text-primary">{item.name}</span></TableCell>
                                            <TableCell><span className="text-xs font-mono bg-bg-base px-2 py-1 rounded text-text-secondary">{item.customerType}</span></TableCell>
                                            <TableCell className="font-mono">${parseFloat(item.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="font-mono font-semibold text-brand-primary">${parseFloat(item.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell><span className="font-medium text-text-secondary">{item.segmento_antiguedad}</span></TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${getRiskColor(item.nivel_riesgo)}`}>
                                                    {getRiskLabel(item.nivel_riesgo)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
}
