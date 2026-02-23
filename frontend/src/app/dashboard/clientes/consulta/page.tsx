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
} from '@heroui/react';
import { Search, Plus, Eye, Edit, Trash2, UserX, UserCheck, Filter as FilterIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Brand colors from CSS variables
// We can use utility classes like text-brand-primary, bg-bg-base etc.

type CustomerType = 'CASH' | 'CREDIT';
type CreditStatus = 'NORMAL' | 'WARNING' | 'OVERDUE' | 'BLOCKED';

interface Customer {
    id: string;
    name: string;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    customerType: CustomerType;
    creditLimit: string;
    currentBalance: string;
    creditStatus: CreditStatus;
    isBlocked: boolean;
    isApproved: boolean;
    _count: {
        sales: number;
        transactions: number;
    };
}

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [customerType, setCustomerType] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(search && { search }),
                ...(customerType && { customerType }),
            });

            const response = await api<{ items: Customer[], totalPages: number }>(`/customers?${params}`);
            setCustomers(response.items || []);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [page, search, customerType]);

    // Status Badge Helpers using new design system colors
    const getStatusColor = (status: CreditStatus) => {
        switch (status) {
            case 'NORMAL': return 'success'; // Maps to brand success
            case 'WARNING': return 'warning';
            case 'OVERDUE': return 'danger';
            case 'BLOCKED': return 'default';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: CreditStatus) => {
        switch (status) {
            case 'NORMAL': return 'Normal';
            case 'WARNING': return 'Advertencia';
            case 'OVERDUE': return 'Vencido';
            case 'BLOCKED': return 'Bloqueado';
            default: return status;
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 bg-bg-base min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Directorio de Clientes</h1>
                    <p className="text-text-secondary mt-1 font-light">Consulta y gestiona tu base de datos de clientes activos.</p>
                </div>
            </div>

            {/* Filters Card */}
            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                <CardBody className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-5">
                            <Input
                                placeholder="Buscar por nombre, RIF o email..."
                                startContent={<Search size={18} className="text-text-tertiary" />}
                                value={search}
                                onValueChange={(val) => { setSearch(val); setPage(1); }}
                                classNames={{
                                    inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary"
                                }}
                                isClearable
                                onClear={() => setSearch('')}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Select
                                placeholder="Tipo de Cliente"
                                selectedKeys={customerType ? [customerType] : []}
                                startContent={<FilterIcon size={16} className="text-text-tertiary" />}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as string;
                                    setCustomerType(value || '');
                                    setPage(1);
                                }}
                                classNames={{
                                    trigger: "bg-bg-base border-border-subtle"
                                }}
                            >
                                <SelectItem key="all">Todos</SelectItem>
                                <SelectItem key="CASH">Contado</SelectItem>
                                <SelectItem key="CREDIT">Crédito</SelectItem>
                            </Select>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Main Table Card */}
            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                <CardBody className="p-0 overflow-hidden">
                    {loading && customers.length === 0 ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner size="lg" color="primary" />
                        </div>
                    ) : (
                        <>
                            <Table
                                aria-label="Tabla de Clientes"
                                removeWrapper
                                classNames={{
                                    th: "bg-bg-base text-text-secondary text-xs uppercase font-semibold tracking-wider h-12",
                                    td: "py-3 border-b border-border-subtle group-hover:bg-bg-base/50 transition-colors cursor-default",
                                    base: "min-w-full"
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>CLIENTE</TableColumn>
                                    <TableColumn>RIF/NIT</TableColumn>
                                    <TableColumn>TIPO</TableColumn>
                                    <TableColumn>LÍMITE</TableColumn>
                                    <TableColumn>SALDO</TableColumn>
                                    <TableColumn>ESTADO</TableColumn>
                                    <TableColumn>VENTAS</TableColumn>
                                    <TableColumn align="center">ACCIONES</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No se encontraron clientes.">
                                    {customers.map((customer) => (
                                        <TableRow key={customer.id} className="hover:bg-bg-base/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-text-primary text-sm">{customer.name}</p>
                                                        {customer.email && (
                                                            <p className="text-xs text-text-secondary truncate max-w-[180px]">{customer.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-text-secondary font-mono bg-bg-base px-2 py-1 rounded">
                                                    {customer.taxId || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {customer.customerType === 'CREDIT' ? (
                                                    <Chip size="sm" variant="flat" className="bg-brand-secondary/10 text-brand-secondary font-medium">Crédito</Chip>
                                                ) : (
                                                    <Chip size="sm" variant="flat" className="bg-brand-accent/10 text-brand-accent font-medium">Contado</Chip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium text-text-primary">
                                                    {customer.customerType === 'CREDIT' ? `$${parseFloat(customer.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`text-sm font-semibold ${parseFloat(customer.currentBalance) > 0 ? 'text-error' : 'text-success'
                                                        }`}
                                                >
                                                    ${parseFloat(customer.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Chip size="sm" variant="flat" color={getStatusColor(customer.creditStatus)}>
                                                        {getStatusLabel(customer.creditStatus)}
                                                    </Chip>
                                                    {customer.isBlocked && (
                                                        <Chip size="sm" variant="flat" color="danger">BLOQ</Chip>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-text-primary">{customer._count.sales}</span>
                                                    <span className="text-[10px] text-text-tertiary">Transacciones</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        className="text-text-secondary hover:text-brand-primary"
                                                        onPress={() => router.push(`/dashboard/clientes/${customer.id}`)}
                                                    >
                                                        <Eye size={18} />
                                                    </Button>
                                                </div>
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
                                        classNames={{
                                            cursor: "bg-brand-primary text-white font-bold"
                                        }}
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
