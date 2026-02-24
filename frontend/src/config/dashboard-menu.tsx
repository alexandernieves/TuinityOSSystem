import React from 'react';
import {
    ShoppingCart,
    FileText,
    TrendingUp,
    BadgeDollarSign,
    CreditCard,
    RotateCcw,
    Settings,
    Receipt,
    BarChart3,
    Package,
    Tags,
    Search,
    Activity,
    Users,
    UserPlus,
    Calculator,
    Percent,
    Building2,
    Bell,
    Globe,
    Clock,
    Shield,
    FileCheck,
    Mail,
    AlertTriangle,
    LifeBuoy,
    BookOpen,
    MessageSquare,
    Ticket,
    History,
    Bot,
    Puzzle,
    Wallet,
    Briefcase,
    Key,
    Webhook,
} from 'lucide-react';

export type MenuItem = {
    label: string;
    icon: React.ReactNode;
    subItems?: MenuItem[];
};

export type MenuSection = {
    title: string;
    description: string;
    items: MenuItem[];
};

export const subMenus: Record<string, MenuSection> = {
    pos: {
        title: 'Punto de Venta',
        description: 'Gestión de facturación y cobros',
        items: [
            { label: 'Crear Factura', icon: <ShoppingCart /> },
            { label: 'Consulta de Facturas', icon: <FileText /> },
            { label: 'Consulta de Utilidad por Factura', icon: <TrendingUp /> },
            { label: 'Consulta de Cobros por Factura', icon: <BadgeDollarSign /> },
            { label: 'Consulta de Cobros por Tarjetas', icon: <CreditCard /> },
            { label: 'Consulta de Devoluciones', icon: <RotateCcw /> },
            { label: 'Gestión de Ventas', icon: <Settings /> },
            { label: 'Consulta de Cierre de Caja', icon: <Receipt /> },
            { label: 'Análisis de Ventas', icon: <BarChart3 /> },
            { label: 'Consulta de Cobros por Caja', icon: <BadgeDollarSign /> },
            { label: 'Consulta de Artículos Vendidos', icon: <Package /> },
            { label: 'Reportes de Punto de Venta', icon: <FileText /> },
            { label: 'Detalle de Artículos Vendidos', icon: <Tags /> },
        ]
    },
    inventory: {
        title: 'Inventario',
        description: 'Control de stock y productos',
        items: [
            { label: 'Consulta de Producto', icon: <Search /> },
            { label: 'Administración de Productos', icon: <Package /> },
            {
                label: 'Registro de Compras',
                icon: <ShoppingCart />,
                subItems: [
                    { label: 'Registro de Ordenes de Compra', icon: <FileText /> },
                    { label: 'Consulta de Orden de Compra', icon: <Search /> },
                    { label: 'Consulta de Costos por Entrada', icon: <BadgeDollarSign /> },
                    { label: 'Consulta de Entradas', icon: <Package /> },
                ]
            },
            { label: 'Ajustes de Inventario', icon: <Settings /> },
            { label: 'Transferencia de Mercancía', icon: <Activity /> },
            { label: 'Administración de Archivos', icon: <FileText /> },
            { label: 'Reportes de Inventario', icon: <BarChart3 /> },
            { label: 'Herramientas', icon: <Settings /> },
            { label: 'Inventario Físico', icon: <Package /> },
            { label: 'Consulta Bajo Existencia Mínima', icon: <TrendingUp /> },
        ]
    },
    customers: {
        title: 'Clientes',
        description: 'Directorio y estados de cuenta',
        items: [
            { label: 'Consulta de Clientes', icon: <Users /> },
            { label: 'Administración de Clientes', icon: <Settings /> },
            { label: 'Crear Cliente Contado', icon: <UserPlus /> },
            { label: 'Registro de Transacciones', icon: <FileText /> },
            { label: 'Anular Transacciones', icon: <RotateCcw /> },
            { label: 'Análisis de Morosidad', icon: <Activity /> },
            { label: 'Imprimir Estado de Cuentas', icon: <FileText /> },
            {
                label: 'Administración de Archivos',
                icon: <FileText />,
                subItems: [
                    { label: 'Registro de Areas y Sub-Areas', icon: <Tags /> },
                    { label: 'Registro de Vendedores', icon: <Users /> },
                ]
            },
            { label: 'Reportes de Cuentas x Cobrar', icon: <BarChart3 /> },
            {
                label: 'Herramientas',
                icon: <Settings />,
                subItems: [
                    { label: 'Imprimir Estado de Cuenta en Lote', icon: <FileText /> },
                    { label: 'Cambio de Codigo de Cliente', icon: <Tags /> },
                    { label: 'Recálculo de Saldo', icon: <Calculator /> },
                ]
            },
            { label: 'Consulta de Transacciones', icon: <Search /> },
        ]
    },
    accounting: {
        title: 'Contabilidad',
        description: 'Gestión financiera y bancaria',
        items: [
            { label: 'Transacciones del Mayor', icon: <Activity /> },
            { label: 'Catálogo de Cuentas', icon: <FileText /> },
            { label: 'Consulta de Estados Financieros', icon: <BarChart3 /> },
            { label: 'Re-Imprimir Cheque', icon: <FileText /> },
            { label: 'Consulta de Cuentas', icon: <Search /> },
            {
                label: 'Procesos Especiales',
                icon: <Settings />,
                subItems: [
                    { label: 'Actualización de Transacciones', icon: <RotateCcw /> },
                    { label: 'Cierre del Periodo', icon: <FileText /> },
                    { label: 'Generar asientos de fin de año', icon: <TrendingUp /> },
                    { label: 'Cierre del Año Contable', icon: <FileText /> },
                ]
            },
            { label: 'Reportes de Contabilidad', icon: <BarChart3 /> },
            {
                label: 'Conciliación Bancaria',
                icon: <BadgeDollarSign />,
                subItems: [
                    { label: 'Conciliación de Bancos', icon: <BadgeDollarSign /> },
                    { label: 'Imprimir Conciliación Bancaria', icon: <FileText /> },
                    { label: 'Consulta de Saldo de Bancos', icon: <Search /> },
                ]
            },
        ]
    },
    settings: {
        title: 'Configuración',
        description: 'Ajustes del sistema',
        items: [
            { label: 'Registro de Bodegas', icon: <Package /> },
            { label: 'Herramientas del Sistema', icon: <Settings /> },
            { label: 'Usuarios y Permisos', icon: <Users /> },
            {
                label: 'Configuración Empresarial',
                icon: <Building2 />,
                subItems: [
                    { label: 'Zona Horaria e Idioma', icon: <Globe /> },
                    { label: 'Moneda e Impuestos', icon: <BadgeDollarSign /> },
                    { label: 'Formato de Facturas', icon: <FileText /> },
                    { label: 'Reglas Comerciales', icon: <FileCheck /> },
                    // Pro Features
                    { label: 'Plantillas por Sucursal (Pro)', icon: <Building2 /> },
                    { label: 'Reglas Automáticas (Pro)', icon: <Settings /> },
                ]
            },
            {
                label: 'Centro de Notificaciones',
                icon: <Bell />,
                subItems: [
                    { label: 'Alertas de Stock', icon: <Package /> },
                    { label: 'Seguridad y Accesos', icon: <Shield /> },
                    { label: 'Pagos y Finanzas', icon: <CreditCard /> },
                    { label: 'Errores del Sistema', icon: <AlertTriangle /> },
                    // Enterprise Features
                    { label: 'Canales de Notificación (Email/Push)', icon: <Mail /> },
                    { label: 'Prioridad de Alertas', icon: <Clock /> },
                ]
            },
        ]
    },
    sales: {
        title: 'Ventas',
        description: 'Ofertas y promociones',
        items: [
            { label: 'Promociones Activas', icon: <Percent /> },
            { label: 'Histórico de Ofertas', icon: <FileText /> },
        ]
    },
    dashboard: {
        title: 'Resumen General',
        description: 'Vista general del negocio',
        items: []
    },
    support: {
        title: 'Ayuda / Soporte',
        description: 'Centro de asistencia y soporte técnico',
        items: [
            { label: 'Centro de Ayuda', icon: <BookOpen /> },
            { label: 'Contactar Soporte', icon: <MessageSquare /> },
            { label: 'Estado de Tickets', icon: <Ticket /> },
            { label: 'Historial de Solicitudes', icon: <History /> },
            { label: 'Asistente Inteligente (Pro)', icon: <Bot /> },
        ]
    },
    integrations: {
        title: 'Integraciones',
        description: 'Conecta con servicios externos',
        items: [
            { label: 'Pasarelas de Pago', icon: <Wallet /> },
            { label: 'Sistemas Contables', icon: <Calculator /> },
            { label: 'CRM Externos', icon: <Briefcase /> },
            { label: 'API Keys', icon: <Key /> },
            { label: 'Webhooks', icon: <Webhook /> },
        ]
    }
};
