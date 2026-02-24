'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    DollarSign,
    Calendar,
    TrendingUp,
    TrendingDown,
    Receipt,
    Eye,
    Download
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function CashSessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        const session = loadSession();
        if (!session) {
            router.push('/login');
            return;
        }

        try {
            // Fetch all sessions (you may need to create this endpoint)
            const data: any = await api('/pos/cash-sessions?page=1&limit=50', {
                accessToken: session.accessToken
            });
            setSessions(data.items || data);

            // Calculate stats
            const totalSales = sessions.reduce((sum, s) => sum + Number(s.totalSales || 0), 0);
            const avgSession = sessions.length > 0 ? totalSales / sessions.length : 0;

            setStats({
                totalSessions: sessions.length,
                totalSales,
                avgSession
            });
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar sesiones');
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = (sessionId: string) => {
        router.push(`/dashboard/pos/sessions/${sessionId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <Receipt className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Cargando sesiones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                                <Receipt className="w-7 h-7 text-blue-600" />
                                Historial de Sesiones de Caja
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Registro de aperturas y cierres
                            </p>
                        </div>
                        <Button
                            color="primary"
                            onClick={() => router.push('/dashboard/pos')}
                        >
                            Ir al POS
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sesiones</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.totalSessions}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas Totales</p>
                                    <p className="text-2xl font-black text-slate-900">${stats.totalSales.toFixed(2)}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Promedio por Sesión</p>
                                    <p className="text-2xl font-black text-slate-900">${stats.avgSession.toFixed(2)}</p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* Sessions Table */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-0">
                        {sessions.length === 0 ? (
                            <div className="p-12 text-center">
                                <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No hay sesiones registradas</p>
                            </div>
                        ) : (
                            <Table aria-label="Cash sessions table" removeWrapper>
                                <TableHeader>
                                    <TableColumn>SESIÓN</TableColumn>
                                    <TableColumn>CAJERO</TableColumn>
                                    <TableColumn>APERTURA</TableColumn>
                                    <TableColumn>CIERRE</TableColumn>
                                    <TableColumn>VENTAS</TableColumn>
                                    <TableColumn>DIFERENCIA</TableColumn>
                                    <TableColumn>ESTADO</TableColumn>
                                    <TableColumn>ACCIONES</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session: any) => {
                                        const difference = Number(session.closingCash || 0) - Number(session.expectedCash || 0);
                                        return (
                                            <TableRow key={session.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-bold text-slate-700">#{session.id.substring(0, 8)}</div>
                                                        <div className="text-xs text-slate-400">
                                                            {new Date(session.openedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-slate-600">
                                                        {session.user?.name || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium text-slate-700">
                                                        ${Number(session.openingCash).toFixed(2)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium text-slate-700">
                                                        {session.closedAt
                                                            ? `$${Number(session.closingCash).toFixed(2)}`
                                                            : '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium text-emerald-600">
                                                        ${Number(session.totalSales || 0).toFixed(2)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {session.closedAt && (
                                                        <div className={`text-sm font-bold flex items-center gap-1 ${difference >= 0 ? 'text-emerald-600' : 'text-red-600'
                                                            }`}>
                                                            {difference >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                            ${Math.abs(difference).toFixed(2)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        color={session.closedAt ? 'success' : 'warning'}
                                                        variant="flat"
                                                        size="sm"
                                                        className="font-bold text-[10px]"
                                                    >
                                                        {session.closedAt ? 'CERRADA' : 'ABIERTA'}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        color="primary"
                                                        startContent={<Eye className="w-4 h-4" />}
                                                        onClick={() => handleViewReport(session.id)}
                                                    >
                                                        Ver Reporte
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
