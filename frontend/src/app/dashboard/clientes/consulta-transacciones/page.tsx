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
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from '@heroui/react';
import { Search, ArrowLeft, Ban, CheckCircle, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Transaction {
    id: string;
    transactionNumber: string;
    type: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'ADJUSTMENT';
    description: string;
    amount: string;
    transactionDate: string;
    isVoided: boolean;
    voidReason?: string;
    customer: {
        name: string;
        taxId: string;
    };
}

export default function TransactionsHistoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Transaction[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [voiding, setVoiding] = useState(false);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '15',
                ...(search && { search }),
            });
            // Currently the backend listTransactions does not accept "search" directly by name but we can pass it if supported or just list all
            const response = await api<{ items: Transaction[], totalPages: number }>(`/customers/transactions/list?${params}`);
            setData(response.items || []);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            toast.error('Error al cargar transacciones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchTransactions, 300);
        return () => clearTimeout(t);
    }, [page, search]);

    const handleVoid = async () => {
        if (!selectedTx || !voidReason) {
            toast.error('Debe ingresar un motivo para anular');
            return;
        }
        setVoiding(true);
        try {
            await api(`/customers/transactions/${selectedTx.id}/void`, {
                method: 'POST',
                body: { reason: voidReason }
            });
            toast.success('Transacción anulada correctamente');
            onClose();
            setVoidReason('');
            fetchTransactions();
        } catch (error: any) {
            toast.error(error.message || 'Error al anular transacción');
        } finally {
            setVoiding(false);
        }
    };

    const getTxColor = (type: string) => {
        switch (type) {
            case 'PAYMENT': return 'success';
            case 'INVOICE': return 'primary';
            case 'CREDIT_NOTE': return 'warning';
            case 'DEBIT_NOTE': return 'danger';
            case 'ADJUSTMENT': return 'default';
            default: return 'default';
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 bg-bg-base min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Historial de Movimientos</h1>
                    <p className="text-text-secondary mt-1 font-light">Consulta y anulación de transacciones en Cuentas por Cobrar.</p>
                </div>
                <Button
                    variant="light"
                    startContent={<ArrowLeft size={18} />}
                    onPress={() => router.push('/dashboard/clientes')}
                >
                    Volver a Clientes
                </Button>
            </div>

            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                <CardBody className="p-4">
                    <Input
                        placeholder="Buscar por referencia..."
                        startContent={<Search size={18} className="text-text-tertiary" />}
                        value={search}
                        onValueChange={setSearch}
                        isClearable
                        classNames={{ inputWrapper: "bg-bg-base border-border-subtle group-data-[focus=true]:border-brand-primary" }}
                    />
                </CardBody>
            </Card>

            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                <CardBody className="p-0 overflow-hidden">
                    {loading && data.length === 0 ? (
                        <div className="flex justify-center items-center py-20"><Spinner size="lg" /></div>
                    ) : (
                        <>
                            <Table
                                removeWrapper
                                aria-label="Transacciones"
                                classNames={{ th: "bg-bg-base text-text-secondary", td: "py-3 border-b border-border-subtle" }}
                            >
                                <TableHeader>
                                    <TableColumn>FECHA</TableColumn>
                                    <TableColumn>CLIENTE</TableColumn>
                                    <TableColumn>TIPO</TableColumn>
                                    <TableColumn>REFERENCIA</TableColumn>
                                    <TableColumn>MONTO</TableColumn>
                                    <TableColumn>ESTADO</TableColumn>
                                    <TableColumn align="center">ACCIONES</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No se registraron transacciones.">
                                    {data.map((tx) => (
                                        <TableRow key={tx.id} className="hover:bg-bg-base/50 transition-colors">
                                            <TableCell>
                                                <span className="text-sm font-medium">{new Date(tx.transactionDate).toLocaleDateString()}</span>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm font-semibold">{tx.customer?.name}</p>
                                                <p className="text-xs text-text-tertiary">{tx.customer?.taxId}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="sm" variant="flat" color={getTxColor(tx.type) as any}>
                                                    {tx.type}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <FileText size={14} className="text-text-secondary" />
                                                    <span className="text-sm font-mono">{tx.transactionNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold text-text-primary">
                                                    ${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {tx.isVoided ? (
                                                    <Chip size="sm" variant="flat" color="danger" startContent={<Ban size={12} />}>Anulado</Chip>
                                                ) : (
                                                    <Chip size="sm" variant="flat" color="success" startContent={<CheckCircle size={12} />}>Activo</Chip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {!tx.isVoided && (
                                                    <div className="flex justify-center">
                                                        <Button
                                                            size="sm"
                                                            color="danger"
                                                            variant="flat"
                                                            onPress={() => {
                                                                setSelectedTx(tx);
                                                                setVoidReason('');
                                                                onOpen();
                                                            }}
                                                        >
                                                            Anular
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {totalPages > 1 && (
                                <div className="flex justify-center py-4 border-t border-border-subtle">
                                    <Pagination total={totalPages} page={page} onChange={setPage} color="primary" variant="light" />
                                </div>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1 text-error">Anular Transacción</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-text-secondary">
                            ¿Está seguro que desea anular la transacción <strong>{selectedTx?.transactionNumber}</strong> por <strong>${selectedTx?.amount}</strong>? Esta acción no se puede deshacer y el saldo del cliente será ajustado automáticamente.
                        </p>
                        <Textarea
                            label="Motivo de Anulación"
                            placeholder="Escriba la justificación..."
                            value={voidReason}
                            onValueChange={setVoidReason}
                            variant="bordered"
                            isRequired
                            className="mt-4"
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose} isDisabled={voiding}>
                            Cancelar
                        </Button>
                        <Button color="danger" onPress={handleVoid} isLoading={voiding}>
                            Confirmar Anulación
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
