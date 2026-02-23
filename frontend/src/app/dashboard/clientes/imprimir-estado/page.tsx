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
    Autocomplete,
    AutocompleteItem,
    Divider,
} from '@heroui/react';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Customer {
    id: string;
    name: string;
    taxId: string;
}

interface Statement {
    customer: Customer;
    openingBalance: number;
    transactions: any[];
    closingBalance: number;
}

export default function StatementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [statement, setStatement] = useState<Statement | null>(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await api<{ items: Customer[] }>('/customers?customerType=CREDIT&limit=100');
                setCustomers(response.items || []);
            } catch (error) {
                toast.error('Error al cargar clientes');
            }
        };
        fetchCustomers();
    }, []);

    const handleFetchStatement = async () => {
        if (!selectedCustomerId) {
            toast.error('Seleccione un cliente');
            return;
        }
        setLoading(true);
        try {
            const res = await api<Statement>(`/customers/${selectedCustomerId}/statement?startDate=2020-01-01`);
            setStatement(res);
        } catch (error: any) {
            toast.error(error.message || 'Error al generar estado de cuenta');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (val: number) => {
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="p-6 md:p-8 space-y-6 bg-bg-base min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Imprimir Estado de Cuentas</h1>
                    <p className="text-text-secondary mt-1 font-light">
                        Genera e imprime el estado de cuenta y movimientos de un cliente.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="light"
                        startContent={<ArrowLeft size={18} />}
                        onPress={() => router.push('/dashboard/clientes')}
                    >
                        Volver
                    </Button>
                    {statement && (
                        <Button
                            color="primary"
                            className="bg-brand-primary"
                            startContent={<Printer size={18} />}
                            onPress={handlePrint}
                        >
                            Imprimir / PDF
                        </Button>
                    )}
                </div>
            </div>

            <Card className="border border-border-subtle bg-surface shadow-sm print:hidden" radius="lg">
                <CardBody className="p-4 flex flex-col md:flex-row gap-4 items-end">
                    <Autocomplete
                        label="Seleccione un Cliente"
                        placeholder="Buscar por nombre..."
                        variant="bordered"
                        labelPlacement="outside"
                        selectedKey={selectedCustomerId}
                        onSelectionChange={(k) => setSelectedCustomerId(k as string)}
                        className="flex-1"
                    >
                        {customers.map((c) => (
                            <AutocompleteItem key={c.id} value={c.id}>
                                {c.name} - {c.taxId || 'S/N'}
                            </AutocompleteItem>
                        ))}
                    </Autocomplete>
                    <Button
                        color="primary"
                        onPress={handleFetchStatement}
                        isLoading={loading}
                        className="bg-brand-accent text-brand-primary font-semibold"
                    >
                        Generar Estado
                    </Button>
                </CardBody>
            </Card>

            {statement && (
                <div className="bg-white p-8 md:p-12 shadow-md rounded-xl space-y-8 border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ESTADO DE CUENTA</h1>
                            <p className="text-sm text-gray-500 font-medium tracking-widest mt-1 uppercase">Tuinity OS System</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-sm font-semibold text-gray-700">Fecha de Emisión</p>
                            <p className="text-gray-600 font-mono text-sm">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <Divider className="bg-gray-200" />

                    <div className="flex justify-between items-start bg-gray-50 p-6 rounded-lg border border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cliente</p>
                            <h2 className="text-xl font-bold text-gray-900">{statement.customer.name}</h2>
                            <p className="text-gray-600 font-mono text-sm mt-1">RIF/NIT: {statement.customer.taxId || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Saldo Actual</p>
                            <p className="text-3xl font-black text-brand-primary">{formatCurrency(statement.closingBalance)}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                                Al {new Date().toLocaleDateString('es-VE')}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="text-gray-400" size={20} /> Historial de Movimientos
                        </h3>
                        <Table
                            removeWrapper
                            aria-label="Movimientos"
                            classNames={{
                                th: "bg-gray-100 text-gray-600 font-bold uppercase tracking-wider border-y border-gray-200",
                                td: "py-4 text-gray-800 border-b border-gray-100 font-medium text-sm",
                                base: "shadow-none"
                            }}
                        >
                            <TableHeader>
                                <TableColumn>FECHA</TableColumn>
                                <TableColumn>TIPO DE DOC.</TableColumn>
                                <TableColumn>Nº REFERENCIA</TableColumn>
                                <TableColumn>DESCRIPCIÓN</TableColumn>
                                <TableColumn align="right">CARGOS (+)</TableColumn>
                                <TableColumn align="right">ABONOS (-)</TableColumn>
                                <TableColumn align="right">SALDO</TableColumn>
                            </TableHeader>
                            <TableBody emptyContent="No hay movimientos registrados en el período.">
                                {statement.transactions.map((tx, idx) => {
                                    const isCargo = ['INVOICE', 'DEBIT_NOTE'].includes(tx.type);
                                    const isAbono = ['PAYMENT', 'CREDIT_NOTE', 'ADJUSTMENT'].includes(tx.type);
                                    // Basic running balance logic for display purposes only since backend just gives transactions
                                    // But backend actually computes it? The requirement asks to just show interactions.
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell className="font-mono">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>{tx.type}</TableCell>
                                            <TableCell className="font-mono">{tx.transactionNumber || tx.id.slice(0, 8)}</TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={tx.description}>{tx.description || '-'}</TableCell>
                                            <TableCell className="text-right font-mono text-brand-secondary">
                                                {isCargo ? formatCurrency(parseFloat(tx.amount)) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-success">
                                                {isAbono ? formatCurrency(parseFloat(tx.amount)) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-bold font-mono">
                                                -
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end pt-8">
                        <div className="w-64 border-t border-gray-300 pt-2 text-center">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Firma Autorizada</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: #fff;
          }
          .bg-surface { background: #fff !important; }
          .bg-bg-base { background: #fff !important; }
          .bg-gray-50 { background: #f9fafb !important; -webkit-print-color-adjust: exact; }
          .bg-gray-100 { background: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .text-brand-primary { color: #020817 !important; -webkit-print-color-adjust: exact; }
          .text-success { color: #16a34a !important; -webkit-print-color-adjust: exact; }
          
          #printable-area, #printable-area * {
            visibility: visible;
          }
          
          /* Just make the statement container the only visible thing */
          .bg-white.p-8, .bg-white.p-8 * {
            visibility: visible;
          }
          
          .bg-white.p-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>
        </div>
    );
}
