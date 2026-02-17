
import React from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Tabs,
    Tab,
    Chip,
    Image,
    Input,
    Divider
} from "@heroui/react";
import {
    Barcode,
    Box,
    Scale,
    Ruler,
    Globe,
    Tag,
    Info,
    History,
    FileText,
    Layers,
    DollarSign
} from 'lucide-react';

interface ProductDetailProps {
    isOpen: boolean;
    onClose: () => void;
    product: any; // Using any for flexibility with new fields, ideally proper type
}

export const ProductDetailModal: React.FC<ProductDetailProps> = ({ isOpen, onClose, product }) => {
    if (!product) return null;

    // Calculate inventory totals
    const totalStock = product.inventory?.reduce((acc: number, inv: any) => acc + inv.quantity, 0) || 0;
    const reservedStock = product.inventory?.reduce((acc: number, inv: any) => acc + inv.reserved, 0) || 0;
    const availableStock = totalStock - reservedStock;
    const incomingStock = 0; // Placeholder for now

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="5xl"
            scrollBehavior="inside"
            backdrop="blur"
            classNames={{
                base: "bg-slate-900 text-slate-200 border border-slate-700", // Dark theme like Dynamo
                header: "border-b border-slate-700",
                footer: "border-t border-slate-700",
                closeButton: "hover:bg-slate-800 active:bg-slate-700 text-slate-400"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 bg-slate-900">
                            <div className="flex justify-between items-center pr-8">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold uppercase tracking-tight text-white">{product.description}</h2>
                                    <Chip size="sm" color={totalStock > 0 ? "success" : "danger"} variant="flat">
                                        {totalStock > 0 ? "ACTIVO" : "SIN STOCK"}
                                    </Chip>
                                </div>
                                <div className="text-xs font-mono text-slate-400">
                                    REF: {product.internalReference || product.id.substring(0, 13).toUpperCase()}
                                </div>
                            </div>
                        </ModalHeader>
                        <ModalBody className="bg-slate-950 p-6">
                            <Tabs aria-label="Product Details" color="primary" variant="underlined" classNames={{
                                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-700",
                                cursor: "w-full bg-blue-500",
                                tab: "max-w-fit px-0 h-12",
                                tabContent: "group-data-[selected=true]:text-blue-500 text-slate-400 font-medium"
                            }}>
                                <Tab
                                    key="general"
                                    title={
                                        <div className="flex items-center space-x-2">
                                            <Info className="w-4 h-4" />
                                            <span>Generales</span>
                                        </div>
                                    }
                                >
                                    <div className="grid grid-cols-12 gap-6 mt-4">
                                        {/* Left Column: Identifiers & Basics */}
                                        <div className="col-span-4 space-y-4">
                                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Identificación</h3>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Grupo</label>
                                                        <div className="text-sm font-medium text-slate-200">{product.category?.name || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Marca</label>
                                                        <div className="text-sm font-medium text-slate-200">{product.brand?.name || 'N/A'}</div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">País Origen</label>
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                                                        <Globe className="w-3 h-3 text-slate-500" />
                                                        {product.paisOrigen || 'No registrado'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Composición</label>
                                                    <div className="text-sm font-medium text-slate-200">{product.composition || '-'}</div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Referencias</h3>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                                        <span className="text-xs text-slate-400">Ref. Showroom</span>
                                                        <span className="text-xs font-mono text-white">{product.showroomCode || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                                        <span className="text-xs text-slate-400">Arancel</span>
                                                        <span className="text-xs font-mono text-white">{product.codigoArancelario || '-'}</span>
                                                    </div>
                                                    <div className="pt-1">
                                                        <span className="text-xs text-slate-400 block mb-1">Código de Barra</span>
                                                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded">
                                                            <Barcode className="w-4 h-4 text-black" />
                                                            <span className="text-xs font-mono text-black font-bold tracking-widest">
                                                                {product.barcodes?.[0]?.barcode || 'SIN CODIGO'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle Column: Logistics */}
                                        <div className="col-span-4 space-y-4">
                                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 h-full">
                                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Logística</h3>

                                                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                                    <div>
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Unidad/Medida</label>
                                                        <div className="text-sm font-bold text-slate-200">{product.unitsPerBox > 1 ? 'CAJA' : 'UNIDAD'}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Factor</label>
                                                        <div className="text-sm font-bold text-slate-200">1</div>
                                                    </div>

                                                    <div className="p-2 bg-slate-800 rounded-lg">
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Cant. x Bulto</label>
                                                        <div className="text-lg font-black text-white">{product.unitsPerBox || 1}</div>
                                                    </div>
                                                    <div className="p-2 bg-slate-800 rounded-lg">
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Cant. x Paleta</label>
                                                        <div className="text-lg font-black text-white">{product.boxesPerPallet || '-'}</div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Metros Cúbicos</label>
                                                        <div className="text-sm font-mono text-slate-300">{parseFloat(product.volume || '0').toFixed(5)}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Pies Cúbicos</label>
                                                        <div className="text-sm font-mono text-slate-300">
                                                            {product.volumeCubicFeet
                                                                ? parseFloat(product.volumeCubicFeet).toFixed(5)
                                                                : (parseFloat(product.volume || '0') * 35.3147).toFixed(5)
                                                            }
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Kilos x Bulto</label>
                                                        <div className="text-sm font-mono text-slate-300">{parseFloat(product.weight || '0').toFixed(3)}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Stock Mínimo</label>
                                                        <div className="text-sm font-mono text-amber-500 font-bold">{product.minStock || 0}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Stock & Prices */}
                                        <div className="col-span-4 space-y-4">
                                            {/* Inventory Card - Styled like Dynamo */}
                                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Existencia y Disponibilidad</h3>
                                                <div className="grid grid-cols-4 gap-1 text-center bg-slate-900 rounded-lg p-2 border border-slate-700">
                                                    <div>
                                                        <div className="text-[9px] uppercase text-slate-500 font-bold mb-1">Existencia</div>
                                                        <div className="text-lg font-black text-blue-400">{totalStock}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] uppercase text-slate-500 font-bold mb-1">Por Llegar</div>
                                                        <div className="text-lg font-black text-slate-400">{incomingStock}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] uppercase text-slate-500 font-bold mb-1">Separadas</div>
                                                        <div className="text-lg font-black text-amber-500">{reservedStock}</div>
                                                    </div>
                                                    <div className="bg-emerald-900/30 rounded">
                                                        <div className="text-[9px] uppercase text-emerald-500 font-bold mb-1">Disponible</div>
                                                        <div className="text-lg font-black text-emerald-400">{availableStock}</div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 space-y-2">
                                                    <div className="text-xs text-slate-400 uppercase font-bold text-center">Desglose por Bodega</div>
                                                    {product.inventory?.map((inv: any) => (
                                                        <div key={inv.branchId} className="flex justify-between items-center text-xs bg-slate-900/50 p-2 rounded border border-slate-800">
                                                            <span className="text-slate-300">{inv.branchId === 'main' ? 'BODEGA CENTRAL' : 'TIENDA B2C'}</span>
                                                            <span className="font-mono text-white">{inv.quantity} unid.</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Prices Card */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Lista de Precios</h3>
                                                <div className="space-y-1">
                                                    {[
                                                        { level: 'A', price: product.price_a, label: 'Mayorista Premium' },
                                                        { level: 'B', price: product.price_b, label: 'Mayorista Estándar' },
                                                        { level: 'C', price: product.price_c, label: 'Tienda / Detal' },
                                                        { level: 'D', price: product.price_d, label: 'Distribuidor' },
                                                        { level: 'E', price: product.price_e, label: 'Liquidación' }
                                                    ].map((p) => (
                                                        <div key={p.level} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors border-b border-slate-100 last:border-0">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                                                                    {p.level}
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 uppercase font-medium">{p.label}</span>
                                                            </div>
                                                            <div className="font-mono font-bold text-slate-900 text-sm">
                                                                ${parseFloat(p.price || '0').toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-end">
                                                    <span className="text-xs text-slate-400 font-medium">Costo Promedio</span>
                                                    <span className="font-mono text-xs text-slate-300 blur-sm hover:blur-0 transition-all cursor-help relative group">
                                                        ${parseFloat(product.weightedAvgCost || '0').toFixed(2)}
                                                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded whitespace-nowrap">
                                                            Confidencial
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Section - If exists */}
                                    {product.mainImageUrl && (
                                        <div className="mt-6 flex justify-center">
                                            <div className="relative w-48 h-48 bg-white p-2 rounded-xl shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500">
                                                <Image
                                                    src={product.mainImageUrl}
                                                    alt={product.description}
                                                    className="w-full h-full object-contain"
                                                />
                                                <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm rotate-12">
                                                    {product.category?.name}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Tab>

                                <Tab
                                    key="history"
                                    title={
                                        <div className="flex items-center space-x-2">
                                            <History className="w-4 h-4" />
                                            <span>Movimiento Histórico</span>
                                        </div>
                                    }
                                >
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        Funcionalidad de historial detallado en desarrollo (Fase 5)
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter className="bg-slate-900 flex justify-between">
                            <div className="flex gap-2">
                                <Button size="sm" variant="flat" color="warning" startContent={<FileText className="w-4 h-4" />}>
                                    Imprimir Ficha
                                </Button>
                                <Button size="sm" variant="flat" color="primary" startContent={<Layers className="w-4 h-4" />}>
                                    Ver Paletización
                                </Button>
                            </div>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cerrar (Esc)
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};
