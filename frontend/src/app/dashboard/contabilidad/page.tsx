'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    ListTree,
    BookOpen,
    FileSpreadsheet,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    PieChart,
    Building2,
    RefreshCw,
    Plus,
    ChevronRight
} from 'lucide-react';
import {
    Card,
    CardBody,
    Button,
    ButtonGroup,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Divider,
    Tab,
    Tabs
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function AccountingDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [pAndL, setPAndL] = useState<any>(null);
    const [balanceSheet, setBalanceSheet] = useState<any>(null);

    useEffect(() => {
        fetchReports();
    }, [reportDate]);

    const fetchReports = async () => {
        const session = loadSession();
        if (!session) return;

        try {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
            const endOfDay = new Date().toISOString();

            const [plData, bsData] = await Promise.all([
                api(`/accounting/reports/p-and-l?start=${startOfYear}&end=${endOfDay}`, { accessToken: session.accessToken }),
                api(`/accounting/reports/balance-sheet?date=${endOfDay}`, { accessToken: session.accessToken })
            ]);

            setPAndL(plData);
            setBalanceSheet(bsData);
        } catch (error) {
            console.error(error);
            // Don't toast error if COA just isn't init yet
        } finally {
            setLoading(false);
        }
    };

    const handleInitCOA = async () => {
        const session = loadSession();
        if (!session) return;

        try {
            await api('/accounting/init-coa', {
                method: 'POST',
                accessToken: session.accessToken
            });
            toast.success('Plan de cuentas inicializado correctamente');
            fetchReports();
        } catch (error: any) {
            toast.error(error.message || 'Error al inicializar');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 px-8 py-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-blue-600" />
                            Contabilidad Integrada
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Finanzas y Estados Financieros en Tiempo Real
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="flat"
                            color="primary"
                            startContent={<ListTree className="w-4 h-4" />}
                            onClick={() => router.push('/dashboard/contabilidad/plan-cuentas')}
                        >
                            Plan de Cuentas
                        </Button>
                        <Button
                            variant="flat"
                            color="secondary"
                            startContent={<BookOpen className="w-4 h-4" />}
                            onClick={() => router.push('/dashboard/contabilidad/asientos')}
                        >
                            Libro Diario
                        </Button>
                        <Button
                            color="primary"
                            startContent={<Plus className="w-4 h-4" />}
                            onClick={() => router.push('/dashboard/contabilidad/asientos/nuevo')}
                        >
                            Nuevo Asiento
                        </Button>
                    </div>
                </div>

                {!pAndL && (
                    <Card className="border-none shadow-sm bg-blue-50">
                        <CardBody className="p-8 text-center space-y-4">
                            <Clock className="w-12 h-12 text-blue-400 mx-auto" />
                            <h3 className="font-bold text-blue-900 text-lg">Módulo no Configurado</h3>
                            <p className="text-blue-700 max-w-md mx-auto">
                                Parece que aún no has configurado tu plan de cuentas. Pulsa el botón para inicializar la estructura contable base para Panamá.
                            </p>
                            <Button color="primary" onClick={handleInitCOA}>
                                Comenzar Configuración Contable
                            </Button>
                        </CardBody>
                    </Card>
                )}

                {pAndL && (
                    <>
                        {/* Summary KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="border-none shadow-sm">
                                <CardBody className="p-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Ingresos YTD</p>
                                    <p className="text-2xl font-black text-slate-900">${pAndL?.totalRevenue?.toLocaleString()}</p>
                                    <div className="mt-2 text-emerald-600 flex items-center gap-1 text-[10px] font-bold">
                                        <ArrowUpRight className="w-3 h-3" />
                                        <span>INGRESO OPERATIVO</span>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card className="border-none shadow-sm">
                                <CardBody className="p-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Egresos YTD</p>
                                    <p className="text-2xl font-black text-slate-900">${pAndL?.totalExpense?.toLocaleString()}</p>
                                    <div className="mt-2 text-red-600 flex items-center gap-1 text-[10px] font-bold">
                                        <ArrowDownLeft className="w-3 h-3" />
                                        <span>COSTOS Y GASTOS</span>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card className="border-none shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                                <CardBody className="p-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilidad Neta</p>
                                    <p className="text-2xl font-black">${pAndL?.netIncome?.toLocaleString()}</p>
                                    <div className="mt-2 text-blue-300 flex items-center gap-1 text-[10px] font-bold">
                                        <PieChart className="w-3 h-3" />
                                        <span>RENTABILIDAD YTD</span>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card className="border-none shadow-sm">
                                <CardBody className="p-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Margen Neto</p>
                                    <p className="text-2xl font-black text-slate-900">
                                        {pAndL?.totalRevenue > 0 ? ((pAndL.netIncome / pAndL.totalRevenue) * 100).toFixed(1) : 0}%
                                    </p>
                                    <div className="mt-2 text-slate-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter">
                                        Sobres las ventas
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Main Reports */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Profit and Loss Table */}
                            <Card className="border-none shadow-sm">
                                <CardBody className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2">
                                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                            Estado de Resultados (P&L)
                                        </h3>
                                        <Chip size="sm" variant="flat" color="success" className="font-bold">AÑO ACTUAL</Chip>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase mb-3">INGRESOS</p>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    {pAndL?.revenue.map((acc: any) => (
                                                        <tr key={acc.code} className="border-b border-slate-50">
                                                            <td className="py-2 text-slate-500 font-medium">{acc.code}</td>
                                                            <td className="py-2 font-bold text-slate-700">{acc.name}</td>
                                                            <td className="py-2 text-right font-black">${acc.balance.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-slate-50">
                                                        <td colSpan={2} className="py-3 px-2 font-black text-slate-900 uppercase">Total Ingresos</td>
                                                        <td className="py-3 px-2 text-right font-black text-emerald-600 text-lg">${pAndL?.totalRevenue.toLocaleString()}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-red-600 uppercase mb-3">EGRESOS</p>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    {pAndL?.expense.map((acc: any) => (
                                                        <tr key={acc.code} className="border-b border-slate-50">
                                                            <td className="py-2 text-slate-500 font-medium">{acc.code}</td>
                                                            <td className="py-2 font-bold text-slate-700">{acc.name}</td>
                                                            <td className="py-2 text-right font-black">${acc.balance.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-slate-50">
                                                        <td colSpan={2} className="py-3 px-2 font-black text-slate-900 uppercase">Total Egresos</td>
                                                        <td className="py-3 px-2 text-right font-black text-red-600 text-lg">${pAndL?.totalExpense.toLocaleString()}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Balance Sheet Summary */}
                            <Card className="border-none shadow-sm bg-white">
                                <CardBody className="p-6">
                                    <h3 className="font-black text-slate-900 uppercase text-sm mb-6 flex items-center gap-2">
                                        <LayoutDashboard className="w-5 h-5 text-blue-600" />
                                        Balance General (Resumen)
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">ACTIVOS TOTALES</p>
                                                <p className="text-xl font-black text-blue-600">
                                                    ${balanceSheet?.assets.reduce((sum: number, a: any) => sum + a.balance, 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <div className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">PASIVOS TOTALES</p>
                                                <p className="text-xl font-black text-red-600">
                                                    ${balanceSheet?.liabilities.reduce((sum: number, a: any) => sum + a.balance, 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <div className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">PATRIMONIO</p>
                                                <p className="text-xl font-black text-emerald-600">
                                                    ${balanceSheet?.equity.reduce((sum: number, a: any) => sum + a.balance, 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                        </div>

                                        <Divider className="my-4" />

                                        <div className="text-center p-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ecuación Contable (A = P + PT)</p>
                                            <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-600">
                                                <span className="text-blue-600">
                                                    ${balanceSheet?.assets.reduce((sum: number, a: any) => sum + a.balance, 0).toLocaleString()}
                                                </span>
                                                <span>=</span>
                                                <span className="text-slate-900">
                                                    ${(
                                                        balanceSheet?.liabilities.reduce((sum: number, a: any) => sum + a.balance, 0) +
                                                        balanceSheet?.equity.reduce((sum: number, a: any) => sum + a.balance, 0)
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
