'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardBody,
    Tabs,
    Tab,
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
    Select,
    SelectItem,
    Spinner,
} from '@heroui/react';
import { ArrowLeft, Plus, Edit, Trash2, Map, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Area {
    id: string;
    code: string;
    name: string;
    description?: string;
    region?: string;
}

interface SubArea {
    id: string;
    code: string;
    name: string;
    description?: string;
    areaId: string;
    area?: Area;
}

export default function AreasConfigPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'areas' | 'subareas'>('areas');

    const [areas, setAreas] = useState<Area[]>([]);
    const [subAreas, setSubAreas] = useState<SubArea[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    const fetchAreas = async () => {
        try {
            setLoading(true);
            const resAreas = await api<Area[]>('/customers/areas');
            setAreas(resAreas || []);
            const resSub = await api<SubArea[]>('/customers/sub-areas');
            setSubAreas(resSub || []);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    const handleOpenModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({
                code: '',
                name: '',
                description: '',
                region: '',
                areaId: '', // solo para subareas
            });
        }
        onOpen();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const isArea = activeTab === 'areas';
            const endpoint = isArea ? '/customers/areas' : '/customers/sub-areas';
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

            await api(url, {
                method,
                body: formData,
            });

            toast.success(editingItem ? 'Actualizado correctamente' : 'Creado exitosamente');
            onClose();
            fetchAreas();
        } catch (error: any) {
            toast.error(error.message || 'Ocurrió un error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de eliminar este registro?')) return;
        try {
            const endpoint = activeTab === 'areas' ? '/customers/areas' : '/customers/sub-areas';
            await api(`${endpoint}/${id}`, { method: 'DELETE' });
            toast.success('Registro eliminado');
            fetchAreas();
        } catch (error: any) {
            toast.error('No se pudo eliminar. Verifique que no tenga dependencias.');
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 bg-bg-base min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Registro de Áreas y Sub-Áreas</h1>
                    <p className="text-text-secondary mt-1 font-light">Configura las zonas geográficas para la asignación de clientes.</p>
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
                        Nuevo Registro
                    </Button>
                </div>
            </div>

            <Card className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                <CardBody className="p-0">
                    <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={(k) => setActiveTab(k as any)}
                        className="p-4 border-b border-border-subtle"
                        classNames={{
                            tabList: "bg-bg-base w-full sm:w-auto",
                            cursor: "bg-brand-primary",
                            tab: "max-w-fit px-4"
                        }}
                    >
                        <Tab
                            key="areas"
                            title={<div className="flex items-center gap-2"><Map size={16} /> Áreas Principales</div>}
                        >
                            {loading ? (
                                <div className="flex justify-center p-10"><Spinner /></div>
                            ) : (
                                <Table aria-label="Tabla de areas" removeWrapper classNames={{ th: "bg-bg-base" }}>
                                    <TableHeader>
                                        <TableColumn>CÓDIGO</TableColumn>
                                        <TableColumn>NOMBRE</TableColumn>
                                        <TableColumn>ZONA/REGIÓN</TableColumn>
                                        <TableColumn>DESCRIPCIÓN</TableColumn>
                                        <TableColumn align="center">ACCIONES</TableColumn>
                                    </TableHeader>
                                    <TableBody emptyContent="No hay áreas configuradas.">
                                        {areas.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-bg-base/50">
                                                <TableCell><span className="font-mono text-sm">{item.code}</span></TableCell>
                                                <TableCell><span className="font-semibold">{item.name}</span></TableCell>
                                                <TableCell>{item.region || '-'}</TableCell>
                                                <TableCell className="max-w-[200px] truncate text-text-secondary">{item.description || '-'}</TableCell>
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
                        </Tab>

                        <Tab
                            key="subareas"
                            title={<div className="flex items-center gap-2"><MapPin size={16} /> Sub-Áreas</div>}
                        >
                            {loading ? (
                                <div className="flex justify-center p-10"><Spinner /></div>
                            ) : (
                                <Table aria-label="Tabla de subareas" removeWrapper classNames={{ th: "bg-bg-base" }}>
                                    <TableHeader>
                                        <TableColumn>CÓDIGO</TableColumn>
                                        <TableColumn>NOMBRE</TableColumn>
                                        <TableColumn>ÁREA PRINCIPAL</TableColumn>
                                        <TableColumn>DESCRIPCIÓN</TableColumn>
                                        <TableColumn align="center">ACCIONES</TableColumn>
                                    </TableHeader>
                                    <TableBody emptyContent="No hay sub-áreas configuradas.">
                                        {subAreas.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-bg-base/50">
                                                <TableCell><span className="font-mono text-sm">{item.code}</span></TableCell>
                                                <TableCell><span className="font-semibold">{item.name}</span></TableCell>
                                                <TableCell><span className="text-brand-primary font-medium">{item.area?.name || '-'}</span></TableCell>
                                                <TableCell className="max-w-[200px] truncate text-text-secondary">{item.description || '-'}</TableCell>
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
                        </Tab>
                    </Tabs>
                </CardBody>
            </Card>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <ModalHeader>
                            {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'areas' ? 'Área Principal' : 'Sub-Área'}
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            <Input
                                label="Código"
                                placeholder="Ej. NRT-01"
                                value={formData.code || ''}
                                onValueChange={(val) => setFormData({ ...formData, code: val })}
                                variant="bordered"
                                isRequired
                            />
                            <Input
                                label="Nombre"
                                placeholder="Nombre descriptivo"
                                value={formData.name || ''}
                                onValueChange={(val) => setFormData({ ...formData, name: val })}
                                variant="bordered"
                                isRequired
                            />

                            {activeTab === 'areas' ? (
                                <Input
                                    label="Zonificación / Región (Opcional)"
                                    placeholder="Ej. Nacional, Zona Norte, etc."
                                    value={formData.region || ''}
                                    onValueChange={(val) => setFormData({ ...formData, region: val })}
                                    variant="bordered"
                                />
                            ) : (
                                <Select
                                    label="Área Principal"
                                    placeholder="Seleccione el área padre"
                                    selectedKeys={formData.areaId ? [formData.areaId] : []}
                                    onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                                    variant="bordered"
                                    isRequired
                                >
                                    {areas.map((a) => (
                                        <SelectItem key={a.id}>{a.name}</SelectItem>
                                    ))}
                                </Select>
                            )}

                            <Input
                                label="Descripción (Opcional)"
                                placeholder="Detalles adicionales"
                                value={formData.description || ''}
                                onValueChange={(val) => setFormData({ ...formData, description: val })}
                                variant="bordered"
                            />
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
