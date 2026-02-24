
'use client';

import { useState, useEffect } from 'react';
import {
    Brain,
    Sparkles,
    TrendingUp,
    AlertTriangle,
    History,
    ArrowDownToLine,
    RefreshCcw,
    ChevronRight,
    Search,
    Filter,
    Settings
} from 'lucide-react';
import {
    Card,
    CardBody,
    Tabs,
    Tab,
    Button,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Progress,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from '@heroui/react';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { toast } from 'sonner';

export default function IntelligencePage() {
    const [activeTab, setActiveTab] = useState('replenishment');
    const [loading, setLoading] = useState(true);
    const [replenishment, setReplenishment] = useState<any[]>([]);
    const [deadStock, setDeadStock] = useState<any[]>([]);
    const [forecasting, setForecasting] = useState<any>(null);
    const [priceSuggestions, setPriceSuggestions] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [queryResult, setQueryResult] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();

    const fetchData = async () => {
        setLoading(true);
        const session = loadSession();
        if (!session) return;

        try {
            const [replen, dead, forecast, prices] = await Promise.all([
                api('/intelligence/replenishment', { accessToken: session.accessToken }) as Promise<any[]>,
                api('/intelligence/dead-stock', { accessToken: session.accessToken }) as Promise<any[]>,
                api('/intelligence/forecasting', { accessToken: session.accessToken }) as Promise<any>,
                api('/intelligence/prices', { accessToken: session.accessToken }) as Promise<any[]>
            ]);

            setReplenishment(replen);
            setDeadStock(dead);
            setForecasting(forecast);
            setPriceSuggestions(prices);

            // Optionally fetch settings if needed for the modal
        } catch (e) {
            toast.error('Error al cargar datos inteligentes');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPrice = async (productId: string, prices: any) => {
        const session = loadSession();
        if (!session) return;

        try {
            await api('/intelligence/apply-price', {
                method: 'POST',
                accessToken: session.accessToken,
                body: JSON.stringify({ productId, prices })
            });
            toast.success('Precios actualizados exitosamente');
            fetchData(); // Refresh to see updated margins
        } catch (e) {
            toast.error('Error al actualizar precios');
        }
    };

    const handleQuery = async () => {
        if (!query.trim()) return;
        const session = loadSession();
        if (!session) return;

        const loadingToast = toast.info('Procesando consulta inteligente...', { duration: 0 });
        try {
            const result = await api(`/intelligence/query?q=${encodeURIComponent(query)}`, {
                accessToken: session.accessToken
            }) as any;

            setQueryResult(result);
            if (result.type === 'REPLENISHMENT') setActiveTab('replenishment');
            if (result.type === 'DEAD_STOCK') setActiveTab('dead');
            if (result.type === 'PRICE_OPTIMIZATION') setActiveTab('prices');

            toast.success('Análisis completado');
        } catch (e) {
            toast.error('No pude procesar la consulta');
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalDeadValue = deadStock.reduce((sum, item) => sum + (item.lockedValue || 0), 0);
    const criticalReplenishCount = replenishment.filter(r => r.status === 'CRITICAL').length;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header con gradiente Premium */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-xl text-white">
                                    <Brain className="w-8 h-8" />
                                </div>
                                Tuinity Intelligence
                                <Chip variant="flat" color="secondary" size="sm" className="font-bold">BETA AI</Chip>
                            </h1>
                            <p className="text-sm font-medium text-slate-500 max-w-2xl">
                                Análisis predictivo y optimización de inventario basada en patrones de venta reales
                                para maximizar el flujo de caja y minimizar el stock estancado.
                            </p>
                        </div>
                        <div className="flex flex-col gap-4 w-full md:w-auto">
                            <Input
                                placeholder="Pregunta a Tuinity (ej: ¿Qué whiskys no se venden?)"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                                startContent={<Search className="w-4 h-4 text-slate-400" />}
                                className="w-full md:w-80"
                                variant="bordered"
                                color="primary"
                            />
                            <div className="flex flex-row gap-2">
                                <Button
                                    variant="flat"
                                    isIconOnly
                                    className="bg-slate-100 text-slate-600"
                                    onClick={onSettingsOpen}
                                >
                                    <Settings className="w-5 h-5" />
                                </Button>
                                <Button
                                    color="primary"
                                    variant="flat"
                                    startContent={<RefreshCcw className="w-4 h-4" />}
                                    onClick={fetchData}
                                >
                                    Actualizar Análisis
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                {/* AI Result Banner */}
                {queryResult && (
                    <Card className="border-none shadow-lg bg-indigo-900 text-white overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <CardBody className="p-0 flex flex-row">
                            <div className="bg-indigo-600 p-8 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-indigo-200 animate-pulse" />
                            </div>
                            <div className="p-8 flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-xl font-black uppercase tracking-tighter text-indigo-100">{queryResult.title}</h4>
                                    <Button size="sm" variant="light" color="danger" isIconOnly onClick={() => setQueryResult(null)}>
                                        <RefreshCcw className="w-4 h-4 rotate-45" />
                                    </Button>
                                </div>
                                <p className="text-lg font-medium">{queryResult.message}</p>
                                <div className="pt-2 flex gap-3">
                                    <Chip variant="flat" className="bg-white/10 text-white border-none font-bold uppercase text-[10px]">
                                        Modo: {queryResult.type}
                                    </Chip>
                                    <span className="text-indigo-300 text-xs font-bold italic animate-pulse">Contexto cargado en tabla inferior ↓</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Stats Predictivos */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm bg-blue-600 text-white">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <Chip variant="flat" className="bg-white/20 text-white border-none text-[10px] font-bold">PRÓX. 30 DÍAS</Chip>
                            </div>
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Proyección de Ventas</p>
                            <h3 className="text-3xl font-black mt-1">
                                ${forecasting?.projectionNextMonth?.toLocaleString() || '0'}
                            </h3>
                            <p className="text-xs text-blue-200 mt-2 flex items-center gap-1 font-medium">
                                <Sparkles className="w-3 h-3" /> Basado en tendencia exponencial
                            </p>
                        </CardBody>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <Chip variant="flat" color="warning" size="sm" className="font-bold">CRÍTICO</Chip>
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Alertas de Stock</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">
                                {criticalReplenishCount} items
                            </h3>
                            <p className="text-xs text-slate-500 mt-2 font-medium">Requieren compra inmediata</p>
                        </CardBody>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <History className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Capital Estancado</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">
                                ${totalDeadValue.toLocaleString()}
                            </h3>
                            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Regla de 6 meses violada
                            </p>
                        </CardBody>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-900 text-white">
                        <CardBody className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-white/10 text-white rounded-lg">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Eficiencia de Compra</p>
                            <h3 className="text-3xl font-black mt-1">
                                92%
                            </h3>
                            <p className="text-xs text-emerald-400 mt-2 font-medium">Optimizado v2.1</p>
                        </CardBody>
                    </Card>
                </div>

                {/* Tabs de Inteligencia */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardBody className="p-0">
                        <Tabs
                            aria-label="Intelligence Options"
                            selectedKey={activeTab}
                            onSelectionChange={(key) => setActiveTab(key as string)}
                            variant="underlined"
                            classNames={{
                                tabList: "gap-8 w-full relative rounded-none border-b border-divider px-8 pt-4",
                                cursor: "w-full bg-blue-600",
                                tab: "max-w-fit px-0 h-12",
                                tabContent: "group-data-[selected=true]:text-blue-600 font-bold uppercase text-xs tracking-widest"
                            }}
                        >
                            <Tab
                                key="replenishment"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <ArrowDownToLine className="w-4 h-4" />
                                        <span>REABASTECIMIENTO</span>
                                        {criticalReplenishCount > 0 && (
                                            <Chip size="sm" color="danger" variant="solid" className="h-5 min-w-5 px-1 font-black text-[10px]">
                                                {criticalReplenishCount}
                                            </Chip>
                                        )}
                                    </div>
                                }
                            >
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Sugerencias de Reabastecimiento</h3>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="flat">Exportar PDF</Button>
                                            <Button size="sm" color="primary">Crear Orden de Compra Masiva</Button>
                                        </div>
                                    </div>

                                    <Table aria-label="Replenishment Table" removeWrapper className="border-t border-slate-100">
                                        <TableHeader>
                                            <TableColumn className="font-black">PRODUCTO</TableColumn>
                                            <TableColumn className="font-black">VELOCIDAD (ADS)</TableColumn>
                                            <TableColumn className="font-black">STOCK ACTUAL</TableColumn>
                                            <TableColumn className="font-black text-center">DÍAS A CERO</TableColumn>
                                            <TableColumn className="font-black">ESTADO</TableColumn>
                                            <TableColumn className="font-black text-right">SUGERENCIA</TableColumn>
                                        </TableHeader>
                                        <TableBody emptyContent="Todo optimizado. No hay sugerencias críticas.">
                                            {replenishment.map((item) => (
                                                <TableRow key={item.productId} className="hover:bg-slate-50 transition-colors cursor-pointer">
                                                    <TableCell>
                                                        <p className="font-bold text-slate-800">{item.description}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {item.productId.substring(0, 8)}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                            <span className="font-bold text-slate-700">{item.ads.toFixed(2)} / día</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <span className="font-black text-slate-900">{item.currentStock} und</span>
                                                            <Progress
                                                                size="sm"
                                                                value={(item.currentStock / (item.minStock * 2)) * 100}
                                                                color={item.currentStock < item.minStock ? "danger" : "warning"}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Chip
                                                            variant="flat"
                                                            color={Number(item.daysToZero) < 7 ? "danger" : "warning"}
                                                            className="font-black text-[10px]"
                                                        >
                                                            {item.daysToZero} DÍAS
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="sm"
                                                            color={item.status === 'CRITICAL' ? 'danger' : 'warning'}
                                                            variant="dot"
                                                            className="font-bold text-[10px]"
                                                        >
                                                            {item.status}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="space-y-1">
                                                            <p className="font-black text-blue-600 text-lg">+{item.suggestedQuantity}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold italic">Est. CIF: ${item.estimatedCost.toLocaleString()}</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Tab>

                            <Tab
                                key="dead"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <History className="w-4 h-4" />
                                        <span>DEAD STOCK RADAR</span>
                                        {deadStock.length > 0 && (
                                            <Chip size="sm" color="warning" variant="solid" className="h-5 min-w-5 px-1 font-black text-[10px]">
                                                {deadStock.length}
                                            </Chip>
                                        )}
                                    </div>
                                }
                            >
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Radar de Inventario Estancado</h3>
                                            <p className="text-xs text-slate-500 font-medium">Bienes con más de 90 días sin rotación (Regla de 6 meses de Javier)</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" color="danger" variant="flat">Marcar para Liquidación</Button>
                                        </div>
                                    </div>

                                    <Table aria-label="Dead Stock Table" removeWrapper>
                                        <TableHeader>
                                            <TableColumn className="font-black">PRODUCTO</TableColumn>
                                            <TableColumn className="font-black">STOCK ESTANCADO</TableColumn>
                                            <TableColumn className="font-black">CAPITAL LOCKET</TableColumn>
                                            <TableColumn className="font-black text-center">DÍAS INACTIVOS</TableColumn>
                                            <TableColumn className="font-black text-right">ACCIONES AI</TableColumn>
                                        </TableHeader>
                                        <TableBody emptyContent="Felicidades. Todo el stock está rotando eficientemente.">
                                            {deadStock.map((item) => (
                                                <TableRow key={item.productId} className="hover:bg-red-50/30 transition-colors">
                                                    <TableCell>
                                                        <p className="font-bold text-slate-800">{item.description}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase underline">Último mov: {new Date(item.lastMovement).toLocaleDateString()}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-black text-slate-900">{item.currentStock} unidades</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-black text-red-600">${item.lockedValue.toLocaleString()}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Chip
                                                            variant="solid"
                                                            className={`font-black text-[10px] text-white ${item.daysInactive > 180 ? 'bg-red-600' : 'bg-amber-600'}`}
                                                        >
                                                            {item.daysInactive} DÍAS
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="flat" color="secondary" className="font-bold text-[9px]">Sugerir Oferta B2B</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Tab>

                            <Tab
                                key="prices"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>MARGENES Y PRECIOS</span>
                                        {priceSuggestions.length > 0 && (
                                            <Chip size="sm" color="secondary" variant="solid" className="h-5 min-w-5 px-1 font-black text-[10px]">
                                                {priceSuggestions.length}
                                            </Chip>
                                        )}
                                    </div>
                                }
                            >
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Optimización Predictiva de Precios</h3>
                                            <p className="text-xs text-slate-500 font-medium">Margen objetivo: 25% (Ajustable en configuración)</p>
                                        </div>
                                        <Button size="sm" color="secondary" variant="flat">Aplicar Ajustes Masivos</Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {priceSuggestions.map((item) => (
                                            <Card key={item.productId} className="border border-slate-100 shadow-none hover:border-indigo-200 transition-all bg-slate-50/50">
                                                <CardBody className="p-6">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.description}</p>
                                                            <div className="flex gap-2">
                                                                <Chip size="sm" variant="flat" color="danger" className="font-bold text-[9px]">Margen Actual: {item.currentMargin}</Chip>
                                                                <Chip size="sm" variant="flat" color="success" className="font-bold text-[9px]">Objetivo: {item.targetMargin}</Chip>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Costo Actual (CIF)</p>
                                                            <p className="text-lg font-black text-slate-900">${item.currentCost.toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {['price_a', 'price_b', 'price_c'].map((level) => (
                                                            <div key={level} className="bg-white p-4 rounded-xl border border-slate-100 space-y-2">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{level.replace('_', ' ')}</p>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs text-slate-400 line-through font-medium">Original</span>
                                                                    <span className="text-lg font-black text-indigo-600">${item.suggestedPrices[level]}</span>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    fullWidth
                                                                    variant="flat"
                                                                    className="text-[10px] font-bold h-7"
                                                                    onClick={() => handleApplyPrice(item.productId, item.suggestedPrices)}
                                                                >
                                                                    Aplicar Sugerencia
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        ))}
                                        {priceSuggestions.length === 0 && (
                                            <div className="py-20 text-center">
                                                <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                <p className="text-slate-400 font-bold">Todos tus precios mantienen márgenes saludables.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>
            </div>

            {/* AI Settings Modal */}
            <Modal
                isOpen={isSettingsOpen}
                onClose={onSettingsClose}
                size="2xl"
                classNames={{
                    backdrop: "bg-slate-900/50 backdrop-blur-sm",
                    base: "border-none shadow-2xl bg-white rounded-3xl",
                    header: "border-b border-slate-100 p-8",
                    footer: "border-t border-slate-100 p-8",
                    body: "p-8",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Configuración de Inteligencia Tuinity</h2>
                        <p className="text-xs text-slate-500 font-medium">Personaliza los algoritmos analíticos para tu modelo de negocio</p>
                    </ModalHeader>
                    <ModalBody className="space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Reabastecimiento</h4>
                                <Input label="Días Críticos (Alarma Roja)" defaultValue="7" variant="bordered" size="sm" />
                                <Input label="Días de Advertencia" defaultValue="20" variant="bordered" size="sm" />
                                <Input label="Stock de Seguridad Universal" defaultValue="12" variant="bordered" size="sm" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Optimización de Márgenes</h4>
                                <Input label="Margen Objetivo (%)" defaultValue="25" variant="bordered" size="sm" endContent="%" />
                                <p className="text-[10px] text-slate-400 font-medium italic">Se usará para sugerir nuevos precios cuando los costos de importación suban.</p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">Dead Stock Radar</h4>
                                <Input label="Días para Estancado" defaultValue="90" variant="bordered" size="sm" />
                                <Input label="Días para Muerto Crítico" defaultValue="180" variant="bordered" size="sm" />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" color="danger" className="font-bold uppercase text-xs" onClick={onSettingsClose}>Cancelar</Button>
                        <Button color="primary" className="font-black uppercase text-xs px-8" onClick={() => {
                            toast.success('Configuración guardada exitosamente');
                            onSettingsClose();
                        }}>Guardar Cambios</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}

function LoadingView() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <div className="text-center space-y-4">
                <Brain className="w-16 h-16 text-blue-600 animate-pulse mx-auto" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Procesando Inteligencia...</h2>
                <p className="text-slate-500 font-medium">Analizando miles de transacciones y patrones logísticos</p>
            </div>
        </div>
    );
}
