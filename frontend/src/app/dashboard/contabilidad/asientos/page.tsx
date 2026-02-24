'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    Plus,
    Search,
    Calendar,
    Filter,
    ArrowUpDown,
    ArrowUpRight,
    ArrowDownLeft,
    FileText,
    History
} from 'lucide-react';
import {
    Card,
    CardBody,
    Button,
    Input,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Breadcrumbs,
    BreadcrumbItem
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function JournalEntries() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<any[]>([]);

    useEffect(() => {
        // Since I don't have a list endpoint yet (I only implemented create/coa in service),
        // I'll show a "Maintenance" or empty state, but let's assume entries will come from a ledger.
        // Actually, let's create a quick list method in service if I can, or just mock for now.
        setLoading(false);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <Breadcrumbs color="primary" variant="light" size="sm">
                            <BreadcrumbItem onClick={() => router.push('/dashboard/contabilidad')}>Contabilidad</BreadcrumbItem>
                            <BreadcrumbItem>Libro Diario</BreadcrumbItem>
                        </Breadcrumbs>
                        <h1 className="text-2xl font-black text-slate-900 uppercase mt-2 flex items-center gap-3">
                            <BookOpen className="w-7 h-7 text-secondary-600" />
                            Libro Diario de Asientos
                        </h1>
                    </div>
                    <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        onClick={() => router.push('/dashboard/contabilidad/asientos/nuevo')}
                    >
                        Registrar Manual
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

                {/* Filters */}
                <div className="flex gap-4">
                    <Card className="flex-1 border-none shadow-sm">
                        <CardBody className="p-2">
                            <Input
                                placeholder="Buscar por descripción o referencia..."
                                variant="flat"
                                startContent={<Search className="w-4 h-4 text-slate-400" />}
                            />
                        </CardBody>
                    </Card>
                    <Button variant="flat" startContent={<Filter className="w-4 h-4" />}>Filtros</Button>
                    <Button variant="flat" startContent={<Calendar className="w-4 h-4" />}>Rango Fechas</Button>
                </div>

                {/* Placeholder / Empty State */}
                <Card className="border-none shadow-sm bg-slate-50 border-2 border-dashed border-slate-200">
                    <CardBody className="p-20 text-center space-y-4">
                        <History className="w-12 h-12 text-slate-300 mx-auto" />
                        <div className="space-y-1">
                            <h3 className="font-black text-slate-400 uppercase">Sin Actividad Reciente</h3>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                Los asientos generados automáticamente por ventas y compras aparecerán aquí cronológicamente.
                            </p>
                        </div>
                        <Button
                            variant="flat"
                            color="primary"
                            onClick={() => router.push('/dashboard/contabilidad/asientos/nuevo')}
                        >
                            Crear Primer Asiento
                        </Button>
                    </CardBody>
                </Card>

                {/* Structure for when data exists */}
                <Card className="border-none shadow-sm opacity-50 grayscale pointer-events-none">
                    <CardBody className="p-0">
                        <Table aria-label="Journal Ledger" removeWrapper>
                            <TableHeader>
                                <TableColumn>FECHA</TableColumn>
                                <TableColumn>ID / REF</TableColumn>
                                <TableColumn>DESCRIPCIÓN</TableColumn>
                                <TableColumn>TIPO</TableColumn>
                                <TableColumn className="text-right">MONTO TOTAL</TableColumn>
                                <TableColumn className="text-right">ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody>
                                <TableRow key="1">
                                    <TableCell>16/02/2026</TableCell>
                                    <TableCell className="font-mono text-[10px]">JE-9821</TableCell>
                                    <TableCell className="font-bold">Apertura de Caja Principal</TableCell>
                                    <TableCell><Chip size="sm" variant="dot">MANUAL</Chip></TableCell>
                                    <TableCell className="text-right font-black">$500.00</TableCell>
                                    <TableCell className="text-right"><Button size="sm" variant="light">Ver</Button></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
