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
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    useDisclosure,
    Switch,
    Spinner,
    Chip,
} from '@heroui/react';
import { ArrowLeft, Plus, Edit, Trash2, Users, Mail, Phone, Percent } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Salesperson {
    id: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    commissionRate: number;
    isActive: boolean;
}

export default function SalespeopleConfigPage() {
    const router = useRouter();

    const [data, setData] = useState<Salesperson[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingItem, setEditingItem] = useState<Salesperson | null>(null);
    const [formData, setFormData] = useState<Partial<Salesperson>>({});
    const [saving, setSaving] = useState(false);

    const fetchSalespeople = async () => {
        try {
            setLoading(true);
            const res = await api<Salesperson[]>('/customers/salespeople');
            setData(res || []);
        } catch (error) {
            toast.error('Error al cargar vendedores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalespeople();
    }, []);

    const handleOpenModal = (item?: Salesperson) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                ...item,
                commissionRate: item.commissionRate * 100 // Display as 0-100 percentage
            });
        } else {
            setEditingItem(null);
            setFormData({
                code: '',
                name: '',
                email: '',
                phone: '',
                commissionRate: 0,
                isActive: true,
            });
        }
        onOpen();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const endpoint = '/customers/salespeople';
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

            const payload = {
                ...formData,
                commissionRate: (formData.commissionRate || 0) / 100 // Send back as decimal 0.XX
            };

            await api(url, {
                method,
                body: payload,
            });

            toast.success(editingItem ? 'Actualizado correctamente' : 'Vendedor registrado');
            onClose();
            fetchSalespeople();
        } catch (error: any) {
            toast.error(error.message || 'Ocurrió un error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de eliminar este vendedor? Podría no eliminarse si tiene historial asignado.')) return;
        try {
            await api(`/customers/salespeople/${id}`, { method: 'DELETE' });
            toast.success('Vendedor eliminado');
            fetchSalespeople();
        } catch (error: any) {
            toast.error('No se pudo eliminar, posiblemente por dependencias existentes.');
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 bg-bg-base min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Registro de Vendedores</h1>
                    <p className="text-text-secondary mt-1 font-light">Gestión del equipo de ventas y fuerza de campo.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="light"
                        startContent={<ArrowLeft size={18} />}
                        onPress={() => router.push('/dashboard/clientes/archivos')}
                    >
                        Volver
                    </Button>
                    <Button
                        color="primary"
                        startContent={<Plus size={18} />}
                        onPress={() => handleOpenModal()}
                    >
                        Nuevo Vendedor
                    </Button>
                </div>
            </div>

            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                <CardBody className="p-0 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center p-20"><Spinner size="lg" /></div>
                    ) : (
                        <Table aria-label="Tabla de vendedores" removeWrapper classNames={{ th: "bg-bg-base h-12", td: "py-3 border-b border-border-subtle group-hover:bg-bg-base/50" }}>
                            <TableHeader>
                                <TableColumn>VENDEDOR</TableColumn>
                                <TableColumn>CONTACTO</TableColumn>
                                <TableColumn>COMISIÓN</TableColumn>
                                <TableColumn>ESTADO</TableColumn>
                                <TableColumn align="center">ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody emptyContent="No hay vendedores registrados.">
                                {data.map((item) => (
                                    <TableRow key={item.id} className="transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                                    <Users size={18} className="text-brand-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-text-primary">{item.name}</p>
                                                    <p className="font-mono text-xs text-text-tertiary">Cod: {item.code}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {item.email && <div className="text-xs flex items-center gap-1 text-text-secondary"><Mail size={12} />{item.email}</div>}
                                                {item.phone && <div className="text-xs flex items-center gap-1 text-text-secondary"><Phone size={12} />{item.phone}</div>}
                                                {(!item.email && !item.phone) && <span className="text-text-tertiary text-xs">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip variant="flat" size="sm" className="bg-success/10 text-success font-medium">
                                                {(item.commissionRate * 100).toFixed(1)}%
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {item.isActive ? (
                                                <span className="flex items-center gap-1 text-success text-sm font-medium"><div className="w-2 h-2 rounded-full bg-success"></div> Activo</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-text-tertiary text-sm font-medium"><div className="w-2 h-2 rounded-full bg-text-tertiary"></div> Inactivo</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center gap-2">
                                                <Button isIconOnly size="sm" variant="light" onPress={() => handleOpenModal(item)}>
                                                    <Edit size={16} className="text-brand-secondary" />
                                                </Button>
                                                <Button isIconOnly size="sm" variant="light" onPress={() => handleDelete(item.id)}>
                                                    <Trash2 size={16} className="text-error" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <form onSubmit={handleSave}>
                        <ModalHeader>
                            {editingItem ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            <div className="flex gap-4">
                                <Input
                                    label="Código"
                                    placeholder="Ej. V01"
                                    value={formData.code || ''}
                                    onValueChange={(val) => setFormData({ ...formData, code: val })}
                                    variant="bordered"
                                    className="flex-1"
                                    isRequired
                                />
                                <Input
                                    label="Comisión (%)"
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    value={formData.commissionRate?.toString() || ''}
                                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                                    variant="bordered"
                                    className="flex-1"
                                    endContent={<Percent size={14} className="text-text-tertiary" />}
                                />
                            </div>

                            <Input
                                label="Nombre Completo"
                                placeholder="Nombre del vendedor"
                                value={formData.name || ''}
                                onValueChange={(val) => setFormData({ ...formData, name: val })}
                                variant="bordered"
                                isRequired
                            />

                            <div className="flex gap-4">
                                <Input
                                    label="Teléfono"
                                    placeholder="+58 412..."
                                    value={formData.phone || ''}
                                    onValueChange={(val) => setFormData({ ...formData, phone: val })}
                                    variant="bordered"
                                    className="flex-1"
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="vendedor@correo.com"
                                    value={formData.email || ''}
                                    onValueChange={(val) => setFormData({ ...formData, email: val })}
                                    variant="bordered"
                                    className="flex-1"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <span className="text-sm font-medium text-text-secondary">Estado: </span>
                                <Switch
                                    isSelected={formData.isActive}
                                    onValueChange={(val) => setFormData({ ...formData, isActive: val })}
                                    color="success"
                                    size="sm"
                                >
                                    {formData.isActive ? 'Activo' : 'Inactivo'}
                                </Switch>
                            </div>

                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose} isDisabled={saving}>Cancelar</Button>
                            <Button color="primary" type="submit" isLoading={saving}>Guardar</Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </div>
    );
}
