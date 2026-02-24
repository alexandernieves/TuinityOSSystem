
'use client';

import React, { useState, useEffect } from 'react';
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Info,
    Sparkles,
    Search,
    Filter,
    Trash2
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
    Pagination,
    Divider
} from '@heroui/react';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const session = loadSession();
        if (!session) return;

        try {
            const data = await api('/notifications', { accessToken: session.accessToken }) as any[];
            setNotifications(data);
        } catch (e) {
            toast.error('Error al cargar historial');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const markAsRead = async (id: string) => {
        const session = loadSession();
        if (!session) return;
        try {
            await api(`/notifications/${id}/read`, { method: 'PATCH', accessToken: session.accessToken });
            fetchData();
        } catch (e) { }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'ERROR': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'AI_INSIGHT': return <Sparkles className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Historial de Comunicación</h1>
                    <p className="text-slate-500 font-medium">Alertas del sistema, logística e inteligencia AI</p>
                </div>
                <div className="flex gap-2">
                    <Button color="primary" variant="flat" onClick={fetchData}>Sincronizar</Button>
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md">
                <CardBody className="p-0">
                    <div className="p-6 border-b border-slate-100 flex gap-4">
                        <Input
                            placeholder="Buscar en el historial..."
                            startContent={<Search className="w-4 h-4 text-slate-400" />}
                            className="max-w-xs"
                            variant="bordered"
                            size="sm"
                        />
                        <Button variant="flat" size="sm" startContent={<Filter className="w-4 h-4" />}>Filtrar</Button>
                    </div>

                    <Table aria-label="Notifications Table" removeWrapper className="min-h-[400px]">
                        <TableHeader>
                            <TableColumn className="font-black">ESTADO</TableColumn>
                            <TableColumn className="font-black">NOTIFICACIÓN</TableColumn>
                            <TableColumn className="font-black">ORIGEN</TableColumn>
                            <TableColumn className="font-black">FECHA / HORA</TableColumn>
                            <TableColumn className="font-black text-right">ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No hay notificaciones registradas." loadingState={loading ? 'loading' : 'idle'}>
                            {notifications.map((n) => (
                                <TableRow key={n.id} className={`hover:bg-slate-50/50 transition-colors ${!n.readAt ? 'bg-blue-50/20' : ''}`}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {getIcon(n.type)}
                                            {!n.readAt && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-black text-slate-800 uppercase text-xs tracking-tight">{n.title}</p>
                                            <p className="text-slate-500 text-[11px] max-w-md">{n.message}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="sm" variant="flat" color={n.type === 'AI_INSIGHT' ? 'secondary' : 'default'} className="font-bold text-[10px]">
                                            {n.type === 'AI_INSIGHT' ? 'INTELIGENCIA' : 'SISTEMA'}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                                            {format(new Date(n.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {!n.readAt && (
                                                <Button size="sm" variant="light" color="primary" isIconOnly onClick={() => markAsRead(n.id)}>
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {n.link && (
                                                <Button size="sm" variant="flat" className="font-bold text-[10px]" as="a" href={n.link}>Ver detalle</Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
}
