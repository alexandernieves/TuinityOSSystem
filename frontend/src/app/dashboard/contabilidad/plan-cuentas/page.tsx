'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ListTree,
    Plus,
    Search,
    ChevronDown,
    ChevronRight,
    Edit2,
    Trash2,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import {
    Card,
    CardBody,
    Button,
    Input,
    Chip,
    Divider,
    Breadcrumbs,
    BreadcrumbItem
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function ChartOfAccounts() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        const session = loadSession();
        if (!session) return;
        try {
            const data = await api('/accounting/accounts', { accessToken: session.accessToken });
            setAccounts(data as any[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.code.includes(searchQuery)
    );

    const typeColors: any = {
        ASSET: 'primary',
        LIABILITY: 'danger',
        EQUITY: 'success',
        REVENUE: 'warning',
        EXPENSE: 'secondary'
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header Sticky */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <Breadcrumbs color="primary" variant="light" size="sm">
                            <BreadcrumbItem onClick={() => router.push('/dashboard/contabilidad')}>Contabilidad</BreadcrumbItem>
                            <BreadcrumbItem>Plan de Cuentas</BreadcrumbItem>
                        </Breadcrumbs>
                        <h1 className="text-2xl font-black text-slate-900 uppercase mt-2 flex items-center gap-3">
                            <ListTree className="w-7 h-7 text-blue-600" />
                            Nomenclatura Contable
                        </h1>
                    </div>
                    <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                    >
                        Agregar Cuenta
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

                {/* Search Bar */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-4">
                        <Input
                            placeholder="Buscar por nombre o código de cuenta..."
                            startContent={<Search className="w-4 h-4 text-slate-400" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </CardBody>
                </Card>

                {/* Accounts List */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Nombre de Cuenta</th>
                                        <th className="px-6 py-4">Tipo</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAccounts.map((acc) => (
                                        <tr key={acc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                    {acc.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-slate-900 ${acc.level === 1 ? 'text-base uppercase underline underline-offset-4 decoration-blue-200' : 'text-sm'}`}
                                                        style={{ paddingLeft: `${(acc.level - 1) * 20}px` }}>
                                                        {acc.name}
                                                    </span>
                                                    {acc.isControlAccount && (
                                                        <Chip size="sm" variant="flat" color="warning" className="text-[8px] h-5">CONTROL</Chip>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={typeColors[acc.type]}
                                                    className="font-black text-[10px] uppercase"
                                                >
                                                    {acc.type}
                                                </Chip>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" isIconOnly variant="light"><Edit2 className="w-3 h-3" /></Button>
                                                    <Button size="sm" isIconOnly variant="light" color="danger"><Trash2 className="w-3 h-3" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
