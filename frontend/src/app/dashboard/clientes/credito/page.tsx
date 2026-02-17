'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Tabs, Tab, Avatar, Progress, Tooltip, Pagination, Spinner, User as UserC
} from '@heroui/react';
import { CreditCard, AlertCircle, CheckCircle2, ShieldAlert, BadgeDollarSign, FileText, ArrowRight, XCircle, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// Types (simplified from previous)
interface Customer {
    id: string;
    name: string;
    email: string | null;
    currentBalance: string;
    creditLimit: string;
    customerType: 'CASH' | 'CREDIT';
    creditStatus: 'NORMAL' | 'WARNING' | 'OVERDUE' | 'BLOCKED';
    isBlocked: boolean;
    isApproved: boolean;
    _count: { sales: number };
}

export default function CreditManagementPage() {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<string>('pending');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const fetchCustomers = async () => {
        const session = loadSession();
        if (!session?.tenantSlug) {
            // Silently fail or redirect, but don't crash
            console.warn("No tenant slug found in session");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Build filters based on tab
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                customerType: 'CREDIT', // Only credit customers relevant here
            });

            if (selectedTab === 'pending') {
                // Backend doesn't support filtering by isApproved directly in listCustomers yet?? 
                // Let's check service. It supports creditStatus, isBlocked.
                // It does NOT support isApproved. We might need to filter client side or add it.
                // For now let's assume valid approved customers are what we manage here mostly?
                // Actually "Solicitudes Pendientes" implies isApproved=false.
                // I'll filter client side for MVP or ask backend to add support.
                // Let's use 'creditStatus=NORMAL' for now for approved, and maybe we need a new filter.
                // Wait, listCustomers endpoint implementation in service:
                // ...(filters?.creditStatus && ...), ...(filters?.isBlocked ...).
                // No isApproved.
                // I'll stick to 'overdue' and 'blocked' tabs which I CAN filter.
                // For 'pending', maybe I skip it or just show all credit customers.
                // Let's change tabs to: "Resumen de Riesgo", "Cuentas Vencidas", "Bloqueados".
            }

            if (selectedTab === 'overdue') {
                params.append('creditStatus', 'OVERDUE');
            } else if (selectedTab === 'blocked') {
                params.append('isBlocked', 'true');
            } else if (selectedTab === 'warning') {
                params.append('creditStatus', 'WARNING');
            }

            const response = await api<{ items: Customer[], totalPages: number }>(`/customers?${params}`);
            setCustomers(response.items || []);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos de crédito');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [selectedTab, page]);

    return (
        <div className="p-6 md:p-8 space-y-6 bg-bg-base min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Gestión de Crédito</h1>
                    <p className="text-text-secondary mt-1 font-light">Monitorea riesgos, aprobaciones y límites de crédito.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        color="primary"
                        variant="flat"
                        startContent={<FileText size={18} />}
                    >
                        Política de Crédito
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-surface border border-border-subtle shadow-sm p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-secondary text-xs uppercase font-bold">Cartera en Riesgo</p>
                            <h3 className="text-2xl font-bold text-error mt-1">$45,200</h3>
                        </div>
                        <div className="p-2 bg-error/10 text-error rounded-lg">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <Progress value={65} color="danger" className="mt-4 h-1.5" />
                    <p className="text-[10px] text-text-tertiary mt-2">65% del límite de riesgo</p>
                </Card>
                <Card className="bg-surface border border-border-subtle shadow-sm p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-secondary text-xs uppercase font-bold">Crédito Disponible</p>
                            <h3 className="text-2xl font-bold text-success mt-1">$1.2M</h3>
                        </div>
                        <div className="p-2 bg-success/10 text-success rounded-lg">
                            <BadgeDollarSign size={20} />
                        </div>
                    </div>
                    <Progress value={30} color="success" className="mt-4 h-1.5" />
                    <p className="text-[10px] text-text-tertiary mt-2">30% utilizado globalmente</p>
                </Card>
                <Card className="bg-surface border border-border-subtle shadow-sm p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-secondary text-xs uppercase font-bold">Clientes Bloqueados</p>
                            <h3 className="text-2xl font-bold text-text-primary mt-1">12</h3>
                        </div>
                        <div className="p-2 bg-text-secondary/10 text-text-secondary rounded-lg">
                            <ShieldAlert size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="border border-border-subtle bg-surface shadow-sm min-h-[500px]" radius="lg">
                <CardBody className="p-0">
                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) => setSelectedTab(key as string)}
                        aria-label="Opciones de Crédito"
                        variant="underlined"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-border-subtle px-6",
                            cursor: "w-full bg-brand-primary",
                            tab: "max-w-fit px-0 h-14",
                            tabContent: "group-data-[selected=true]:text-brand-primary text-text-secondary font-medium"
                        }}
                    >
                        <Tab
                            key="all"
                            title={
                                <div className="flex items-center gap-2">
                                    <Users size={18} />
                                    <span>Cartera Completa</span>
                                </div>
                            }
                        />
                        <Tab
                            key="warning"
                            title={
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={18} className="text-warning" />
                                    <span>En Observación</span>
                                    <Chip size="sm" variant="flat" color="warning">5</Chip>
                                </div>
                            }
                        />
                        <Tab
                            key="overdue"
                            title={
                                <div className="flex items-center gap-2">
                                    <XCircle size={18} className="text-error" />
                                    <span>Vencidos</span>
                                    <Chip size="sm" variant="flat" color="danger">3</Chip>
                                </div>
                            }
                        />
                        <Tab
                            key="blocked"
                            title={
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={18} />
                                    <span>Bloqueados</span>
                                </div>
                            }
                        />
                    </Tabs>

                    {loading ? (
                        <div className="flex justify-center items-center py-24">
                            <Spinner size="lg" color="primary" />
                        </div>
                    ) : (
                        <Table
                            aria-label="Tabla de Crédito"
                            removeWrapper
                            classNames={{
                                th: "bg-bg-base text-text-secondary text-xs uppercase font-semibold tracking-wider h-12 first:pl-6",
                                td: "py-4 border-b border-border-subtle first:pl-6",
                                base: "min-w-full"
                            }}
                        >
                            <TableHeader>
                                <TableColumn>CLIENTE</TableColumn>
                                <TableColumn>ESTADO</TableColumn>
                                <TableColumn>USO DE CRÉDITO</TableColumn>
                                <TableColumn>SALDO</TableColumn>
                                <TableColumn>LÍMITE</TableColumn>
                                <TableColumn>ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody emptyContent="No se encontraron registros.">
                                {customers.map((customer) => {
                                    const percent = (parseFloat(customer.currentBalance) / parseFloat(customer.creditLimit)) * 100;
                                    const isOverLimit = percent > 100;

                                    return (
                                        <TableRow key={customer.id} className="group hover:bg-bg-base/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-brand-primary/5 border border-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-text-primary">{customer.name}</p>
                                                        <p className="text-xs text-text-secondary">{customer.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {customer.isBlocked ? (
                                                    <Chip startContent={<ShieldAlert size={14} />} color="danger" variant="flat" size="sm">Bloqueado</Chip>
                                                ) : (
                                                    <Chip
                                                        color={customer.creditStatus === 'NORMAL' ? 'success' : customer.creditStatus === 'WARNING' ? 'warning' : 'danger'}
                                                        variant="flat"
                                                        size="sm"
                                                        className="capitalize"
                                                    >
                                                        {customer.creditStatus.toLowerCase()}
                                                    </Chip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="w-48 space-y-1">
                                                    <div className="flex justify-between text-[10px] text-text-secondary font-medium">
                                                        <span>{percent.toFixed(1)}%</span>
                                                        {isOverLimit && <span className="text-error font-bold">Excedido</span>}
                                                    </div>
                                                    <Progress
                                                        value={percent > 100 ? 100 : percent}
                                                        color={isOverLimit ? "danger" : percent > 80 ? "warning" : "primary"}
                                                        size="sm"
                                                        className="h-2"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={clsx("font-semibold", parseFloat(customer.currentBalance) > 0 ? "text-text-primary" : "text-success")}>
                                                    ${parseFloat(customer.currentBalance).toLocaleString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-text-secondary">${parseFloat(customer.creditLimit).toLocaleString()}</span>
                                                    {isOverLimit && <AlertCircle size={14} className="text-error" />}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    className="text-brand-secondary font-medium"
                                                    endContent={<ArrowRight size={16} />}
                                                    onPress={() => router.push(`/dashboard/clientes/administracion?id=${customer.id}`)}
                                                >
                                                    Gestionar
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
    );
}
