'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    DollarSign,
    Search,
    X,
    Receipt,
    LogOut,
    User
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    Input,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Divider
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

interface CartItem {
    productId: string;
    description: string;
    price: number;
    quantity: number;
    stock: number;
}

export default function POSPage() {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [cashSession, setCashSession] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onOpenChange: onPaymentOpenChange } = useDisclosure();
    const { isOpen: isOpenSessionOpen, onOpen: onOpenSessionOpen, onOpenChange: onOpenSessionOpenChange } = useDisclosure();
    const [openingCash, setOpeningCash] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userSession = loadSession();
        if (!userSession) {
            router.push('/login');
            return;
        }
        setSession(userSession);
        checkCashSession(userSession);
        fetchProducts(userSession);
    }, []);

    const checkCashSession = async (userSession: any) => {
        try {
            const active = await api('/pos/cash-sessions/active', {
                accessToken: userSession.accessToken
            });
            setCashSession(active);
        } catch (error) {
            console.log('No active cash session');
            onOpenSessionOpen();
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (userSession: any) => {
        try {
            const data: any = await api('/products?page=1&limit=100', {
                accessToken: userSession.accessToken
            });
            setProducts(data.items || []);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar productos');
        }
    };

    const handleOpenSession = async () => {
        if (!openingCash || Number(openingCash) <= 0) {
            toast.error('Ingresa un monto de apertura válido');
            return;
        }

        try {
            const newSession = await api('/pos/cash-sessions/open', {
                method: 'POST',
                accessToken: session.accessToken,
                body: {
                    openingCash: Number(openingCash),
                    branchId: session.user?.branchId || 'default-branch-id' // Adjust as needed
                }
            });
            setCashSession(newSession);
            toast.success('Caja abierta correctamente');
            onOpenSessionOpenChange();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al abrir caja');
        }
    };

    const handleCloseSession = async () => {
        if (!cashSession) return;

        try {
            await api(`/pos/cash-sessions/${cashSession.id}/close`, {
                method: 'PATCH',
                accessToken: session.accessToken,
                body: {
                    closingCash: calculateTotal(),
                    notes: 'Cierre de caja'
                }
            });
            toast.success('Caja cerrada correctamente');
            setCashSession(null);
            setCart([]);
            onOpenSessionOpen();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al cerrar caja');
        }
    };

    const addToCart = (product: any) => {
        const existing = cart.find(item => item.productId === product.id);

        if (existing) {
            if (existing.quantity >= product.stock) {
                toast.error('Stock insuficiente');
                return;
            }
            setCart(cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            if (product.stock <= 0) {
                toast.error('Producto sin stock');
                return;
            }
            setCart([...cart, {
                productId: product.id,
                description: product.description,
                price: Number(product.priceC || product.priceB || product.priceA),
                quantity: 1,
                stock: product.stock
            }]);
        }
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.productId === productId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return item;
                if (newQty > item.stock) {
                    toast.error('Stock insuficiente');
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handlePayment = async () => {
        const total = calculateTotal();
        const paid = Number(paymentAmount);

        if (paid < total) {
            toast.error('Monto insuficiente');
            return;
        }

        try {
            // Create sale via POS
            const sale = await api('/sales', {
                method: 'POST',
                accessToken: session.accessToken,
                body: {
                    customerId: null, // B2C sale, no customer
                    branchId: cashSession.branchId,
                    items: cart.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.price
                    })),
                    paymentMethod: 'CASH',
                    paymentStatus: 'PAID',
                    notes: 'Venta POS'
                }
            });

            toast.success(`Venta completada. Cambio: $${(paid - total).toFixed(2)}`);
            setCart([]);
            setPaymentAmount('');
            onPaymentOpenChange();

            // Optionally print receipt or show receipt modal
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al procesar venta');
        }
    };

    const filteredProducts = products.filter(p =>
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <ShoppingCart className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Cargando punto de venta...</p>
                </div>
            </div>
        );
    }

    if (!cashSession) {
        return null; // Modal will show
    }

    const total = calculateTotal();

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex">
            {/* Left Panel - Products */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                            <ShoppingCart className="w-7 h-7 text-blue-600" />
                            Punto de Venta
                        </h1>
                        <Button
                            color="danger"
                            variant="flat"
                            size="sm"
                            startContent={<LogOut className="w-4 h-4" />}
                            onClick={handleCloseSession}
                        >
                            Cerrar Caja
                        </Button>
                    </div>

                    <Input
                        placeholder="Buscar producto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        startContent={<Search className="w-4 h-4 text-slate-400" />}
                        classNames={{
                            input: "text-sm",
                            inputWrapper: "bg-white shadow-sm"
                        }}
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <Card
                            key={product.id}
                            isPressable
                            onPress={() => addToCart(product)}
                            className="border-none shadow-sm hover:shadow-md transition-shadow"
                        >
                            <CardBody className="p-4">
                                <p className="font-bold text-slate-900 text-sm mb-2 line-clamp-2">
                                    {product.description}
                                </p>
                                <div className="flex justify-between items-center">
                                    <p className="text-lg font-black text-blue-600">
                                        ${Number(product.priceC || product.priceB || product.priceA).toFixed(2)}
                                    </p>
                                    <Chip size="sm" variant="flat" color={product.stock > 10 ? 'success' : 'warning'}>
                                        {product.stock} un.
                                    </Chip>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right Panel - Cart */}
            <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                        Carrito
                    </h2>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
                        {cart.length} items
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">Carrito vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <Card key={item.productId} className="border-none shadow-sm">
                                <CardBody className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-slate-900 text-sm flex-1">
                                            {item.description}
                                        </p>
                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="text-red-500 hover:text-red-700 ml-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.productId, -1)}
                                                className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="font-bold text-slate-900 w-8 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, 1)}
                                                className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="font-black text-blue-600">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-black text-slate-900 uppercase">Total</span>
                        <span className="text-2xl font-black text-blue-600">
                            ${total.toFixed(2)}
                        </span>
                    </div>
                    <Button
                        color="primary"
                        size="lg"
                        className="w-full font-black uppercase tracking-widest"
                        startContent={<CreditCard className="w-5 h-5" />}
                        onClick={onPaymentOpen}
                        isDisabled={cart.length === 0}
                    >
                        Cobrar
                    </Button>
                </div>
            </div>

            {/* Open Session Modal */}
            <Modal isOpen={isOpenSessionOpen} onOpenChange={onOpenSessionOpenChange} isDismissable={false}>
                <ModalContent>
                    <ModalHeader>Abrir Caja</ModalHeader>
                    <ModalBody>
                        <Input
                            type="number"
                            label="Monto de Apertura"
                            placeholder="0.00"
                            value={openingCash}
                            onChange={(e) => setOpeningCash(e.target.value)}
                            startContent={<DollarSign className="w-4 h-4 text-slate-400" />}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onPress={handleOpenSession}>
                            Abrir Caja
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentOpen} onOpenChange={onPaymentOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Procesar Pago</ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Total a Pagar</p>
                                        <p className="text-3xl font-black text-blue-900">${total.toFixed(2)}</p>
                                    </div>
                                    <Input
                                        type="number"
                                        label="Monto Recibido"
                                        placeholder="0.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        startContent={<DollarSign className="w-4 h-4 text-slate-400" />}
                                        autoFocus
                                    />
                                    {paymentAmount && Number(paymentAmount) >= total && (
                                        <div className="bg-emerald-50 p-4 rounded-lg">
                                            <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Cambio</p>
                                            <p className="text-2xl font-black text-emerald-900">
                                                ${(Number(paymentAmount) - total).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button color="primary" onPress={handlePayment}>
                                    Confirmar Pago
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
