'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardBody,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    Chip,
    Pagination,
    Select,
    SelectItem,
    Spinner,
    Progress
} from '@heroui/react';
import { Search, Filter, Layers, DollarSign, Users, ChevronRight, BarChart3, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// Types
type PriceLevel = 'A' | 'B' | 'C' | 'D' | 'E';
interface SegmentStats {
    priceLevel: PriceLevel;
    count: number;
    totalBalance: string;
    totalCreditLimit: string;
}

interface Customer {
    id: string;
    name: string;
    email: string | null;
    priceLevel: PriceLevel;
    currentBalance: string;
    creditLimit: string;
    _count: { sales: number };
}

// Segmentation Colors
const segmentColors: Record<PriceLevel, { bg: string, text: string, border: string, indicator: string }> = {
    'A': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', indicator: 'bg-blue-500' },
    'B': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', indicator: 'bg-emerald-500' },
    'C': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', indicator: 'bg-amber-500' },
    'D': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', indicator: 'bg-orange-500' },
    'E': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', indicator: 'bg-red-500' },
};

const segmentDescriptions: Record<PriceLevel, string> = {
    'A': 'Clientes VIP / Mayor volumen',
    'B': 'Clientes frecuentes / Buen volumen',
    'C': 'Clientes regulares / Volumen medio',
    'D': 'Clientes ocasionales / Bajo volumen',
    'E': 'Clientes nuevos / Sin historial',
};

export default function SegmentationPage() {
    const router = useRouter();
    const [stats, setStats] = useState<SegmentStats[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSegment, setSelectedSegment] = useState<PriceLevel | ''>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = async () => {
        const session = loadSession();
        if (!session?.tenantSlug) {
            console.warn("No tenant slug found in session for Segmentation");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch Stats
            const statsData = await api<SegmentStats[]>('/customers/reports/segmentation');
            setStats(statsData);

            // Fetch Customers
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '15',
                ...(selectedSegment && { priceLevel: selectedSegment }),
            });

            const customersData = await api<{ items: Customer[], totalPages: number }>(`/customers?${params}`);
            setCustomers(customersData.items || []);
            setTotalPages(customersData.totalPages || 1);

        } catch (error) {
            console.error('Error fetching segmentation data:', error);
            toast.error('Error al cargar datos de segmentación');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, selectedSegment]);

    const totalCustomers = stats.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="p-6 md:p-8 space-y-8 bg-bg-base min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Segmentación de Clientes</h1>
                    <p className="text-text-secondary mt-1 font-light">Analiza y gestiona tu cartera según niveles de precios y comportamiento.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="bordered"
                        startContent={<Filter size={18} />}
                        className="border-border-subtle bg-surface"
                    >
                        Configurar Niveles
                    </Button>
                    <Button
                        className="bg-brand-primary text-white"
                        startContent={<BarChart3 size={18} />}
                    >
                        Reporte Completo
                    </Button>
                </div>
            </div>

            {/* Segmentation Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {(['A', 'B', 'C', 'D', 'E'] as PriceLevel[]).map((level) => {
                    const stat = stats.find(s => s.priceLevel === level) || { count: 0, totalBalance: '0', totalCreditLimit: '0', priceLevel: level };
                    const percentage = totalCustomers > 0 ? (stat.count / totalCustomers) * 100 : 0;
                    const styles = segmentColors[level];

                    return (
                        <motion.div
                            key={level}
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            onClick={() => {
                                setSelectedSegment(selectedSegment === level ? '' : level);
                                setPage(1);
                            }}
                            className={clsx(
                                "cursor-pointer rounded-xl border p-4 transition-all duration-300 relative overflow-hidden",
                                styles.bg, styles.border,
                                selectedSegment === level ? "ring-2 ring-brand-primary ring-offset-2 hover:shadow-lg" : "hover:shadow-md"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={clsx("text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-sm border border-black/5", styles.text)}>
                                    {level}
                                </span>
                                <div className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/60 text-text-secondary")}>
                                    {percentage.toFixed(0)}%
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-text-primary mb-1">{stat.count}</h3>
                            <p className="text-xs text-text-secondary mb-3">{segmentDescriptions[level]}</p>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-tertiary">Saldo Total</span>
                                    <span className="font-semibold text-text-primary">${parseFloat(stat.totalBalance).toLocaleString()}</span>
                                </div>
                                <Progress
                                    value={percentage}
                                    size="sm"
                                    classNames={{
                                        indicator: styles.indicator,
                                        track: "bg-black/5"
                                    }}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Filtered List */}
            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                <CardBody className="p-0">
                    <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-bg-base/30">
                        <div className="flex items-center gap-2">
                            <Layers className="text-text-secondary w-5 h-5" />
                            <h2 className="font-semibold text-text-primary">
                                {selectedSegment ? `Clientes Nivel ${selectedSegment}` : 'Todos los Clientes'}
                            </h2>
                            {selectedSegment && (
                                <Chip size="sm" variant="flat" onClose={() => setSelectedSegment('')}>
                                    Filtrado
                                </Chip>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner size="lg" color="primary" />
                        </div>
                    ) : (
                        <>
                            <Table
                                aria-label="Segmentation table"
                                removeWrapper
                                classNames={{
                                    th: "bg-bg-base text-text-secondary text-xs uppercase font-semibold tracking-wider h-12",
                                    td: "py-3 border-b border-border-subtle group-hover:bg-bg-base/50 transition-colors cursor-default",
                                    base: "min-w-full"
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>CLIENTE</TableColumn>
                                    <TableColumn>NIVEL PRECIO</TableColumn>
                                    <TableColumn>SALDO PENDIENTE</TableColumn>
                                    <TableColumn>BALANCE / LÍMITE</TableColumn>
                                    <TableColumn>VENTAS HIST.</TableColumn>
                                    <TableColumn>ACCIONES</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No hay clientes en este segmento.">
                                    {customers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        "h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm",
                                                        segmentColors[customer.priceLevel as PriceLevel || 'A']?.bg || 'bg-gray-100',
                                                        segmentColors[customer.priceLevel as PriceLevel || 'A']?.text || 'text-gray-700'
                                                    )}>
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-text-primary text-sm">{customer.name}</p>
                                                        {customer.email && <p className="text-xs text-text-secondary">{customer.email}</p>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className={clsx(
                                                        "font-bold",
                                                        segmentColors[customer.priceLevel as PriceLevel || 'A']?.bg,
                                                        segmentColors[customer.priceLevel as PriceLevel || 'A']?.text
                                                    )}
                                                >
                                                    Nivel {customer.priceLevel || 'A'}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <span className={clsx("font-semibold text-sm", parseFloat(customer.currentBalance) > 0 ? "text-text-primary" : "text-success")}>
                                                    ${parseFloat(customer.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="w-full max-w-[140px] space-y-1">
                                                    <div className="flex justify-between text-[10px] text-text-secondary">
                                                        <span>{((parseFloat(customer.currentBalance) / (parseFloat(customer.creditLimit) || 1)) * 100).toFixed(0)}%</span>
                                                        <span>${parseFloat(customer.creditLimit).toLocaleString()}</span>
                                                    </div>
                                                    <Progress
                                                        size="sm"
                                                        value={(parseFloat(customer.currentBalance) / (parseFloat(customer.creditLimit) || 1)) * 100}
                                                        color={parseFloat(customer.currentBalance) > parseFloat(customer.creditLimit) ? "danger" : "primary"}
                                                        className="h-1.5"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-text-secondary">
                                                    <TrendingUp size={14} className="text-success" />
                                                    <span className="text-sm">{customer._count?.sales || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    isIconOnly
                                                    onPress={() => router.push(`/dashboard/clientes/administracion?id=${customer.id}`)}
                                                >
                                                    <ChevronRight size={18} className="text-text-tertiary" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {totalPages > 1 && (
                                <div className="flex justify-center py-4 border-t border-border-subtle">
                                    <Pagination
                                        total={totalPages}
                                        page={page}
                                        onChange={setPage}
                                        showControls
                                        color="primary"
                                        variant="light"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
