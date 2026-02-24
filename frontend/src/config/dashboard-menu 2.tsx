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
    Plus,
} from 'lucide-react';

export type MenuItem = {
    label: string;
    icon: React.ReactElement;
    href?: string;
    roles?: string[];
    subItems?: MenuItem[];
};

export type MenuSection = {
    title: string;
    description: string;
    roles?: string[];
    items: MenuItem[];
};

export const subMenus: Record<string, MenuSection> = {
    pos: {
        title: 'Punto de Venta',
        description: 'Gestión de facturación y cobros',
        roles: ['OWNER', 'ADMIN', 'SALES', 'SUPERVISOR', 'ACCOUNTING'],
        items: [
            { label: 'Terminal Punto de Venta', icon: <ShoppingCart />, href: '/dashboard/pos' },
            { label: 'Consulta de Facturas', icon: <FileText />, href: '/dashboard/pos/facturas' },
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
        roles: ['OWNER', 'ADMIN', 'WAREHOUSE', 'TRAFFIC', 'PURCHASING', 'SUPERVISOR', 'ACCOUNTING'],
        items: [
            { label: 'Consulta de Stock', icon: <Search />, href: '/dashboard/inventario' },
            { label: 'Administración de Productos', icon: <Package />, href: '/dashboard/productos' },
            {
                label: 'Registro de Compras',
                icon: <ShoppingCart />,
                roles: ['OWNER', 'ADMIN', 'WAREHOUSE', 'PURCHASING', 'SUPERVISOR'],
                subItems: [
                    { label: 'Órdenes de Compra', icon: <FileText />, href: '/dashboard/compras' },
                    { label: 'Importar Factura Proveedor', icon: <Calculator />, href: '/dashboard/compras/importar' },
                    { label: 'Consulta de Costos por Entrada', icon: <BadgeDollarSign /> },
                    { label: 'Consulta de Entradas', icon: <Package /> },
                ]
            },
            { label: 'Ajustes de Inventario', icon: <Settings />, href: '/dashboard/inventario/ajustes', roles: ['OWNER', 'ADMIN', 'WAREHOUSE'] },
            { label: 'Transferencia de Mercancía', icon: <Activity />, href: '/dashboard/inventario/transferencias', roles: ['OWNER', 'ADMIN', 'WAREHOUSE'] },
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
        roles: ['OWNER', 'ADMIN', 'SALES', 'TRAFFIC', 'SUPERVISOR', 'ACCOUNTING'],
        items: [
            { label: 'Consulta de Clientes', icon: <Search />, href: '/dashboard/clientes/consulta' },
            { label: 'Administración de Clientes', icon: <Settings />, href: '/dashboard/clientes/administracion' },
            { label: 'Crear Cliente Contado', icon: <UserPlus />, href: '/dashboard/clientes/nuevo-contado' },
            { label: 'Registro de Transacciones', icon: <FileText />, href: '/dashboard/clientes/transacciones' },
            { label: 'Anular Transacciones', icon: <RotateCcw />, href: '/dashboard/clientes/anular-transacciones', roles: ['OWNER', 'ADMIN'] },
            { label: 'Análisis de Morosidad', icon: <Activity />, href: '/dashboard/clientes/morosidad', roles: ['OWNER', 'ADMIN'] },
            { label: 'Imprimir Estado de Cuentas', icon: <FileText />, href: '/dashboard/clientes/estado-cuenta' },
            {
                label: 'Administración de Archivos',
                icon: <FileText />,
                roles: ['OWNER', 'ADMIN'],
                subItems: [
                    { label: 'Registro de Áreas y Sub-Áreas', icon: <Tags />, href: '/dashboard/clientes/areas' },
                    { label: 'Registro de Vendedores', icon: <Users />, href: '/dashboard/clientes/vendedores' },
                ]
            },
            {
                label: 'Reportes de Cuentas x Cobrar',
                icon: <BarChart3 />,
                roles: ['OWNER', 'ADMIN'],
                subItems: [
                    { label: 'Reporte de Antigüedad de Saldos', icon: <Clock />, href: '/dashboard/clientes/reportes/antiguedad' },
                    { label: 'Reporte de Cobranza', icon: <BadgeDollarSign />, href: '/dashboard/clientes/reportes/cobranza' },
                    { label: 'Clientes con Saldo', icon: <Users />, href: '/dashboard/clientes/reportes/con-saldo' },
                ]
            },
            {
                label: 'Herramientas',
                icon: <Settings />,
                roles: ['OWNER', 'ADMIN'],
                subItems: [
                    { label: 'Imprimir Estado de Cuenta en Lote', icon: <FileText />, href: '/dashboard/clientes/herramientas/lote' },
                    { label: 'Cambio de Código de Cliente', icon: <Tags />, href: '/dashboard/clientes/herramientas/cambio-codigo' },
                    { label: 'Recálculo de Saldo', icon: <Calculator />, href: '/dashboard/clientes/herramientas/recalculo' },
                ]
            },
            { label: 'Consulta de Transacciones', icon: <Search />, href: '/dashboard/clientes/consulta-transacciones' },
        ]
    },
    accounting: {
        title: 'Contabilidad',
        description: 'Gestión financiera y bancaria',
        roles: ['OWNER', 'ADMIN', 'ACCOUNTING', 'SUPERVISOR'],
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
    traffic: {
        title: 'Tráfico y Logística',
        description: 'Gestión de despachos y documentos',
        roles: ['OWNER', 'ADMIN', 'TRAFFIC', 'SUPERVISOR'],
        items: [
            { label: 'Monitor de Despachos', icon: <Activity />, href: '/dashboard/trafico' },
            { label: 'Generar DMC / BL', icon: <FileText />, href: '/dashboard/trafico/documentos' },
            { label: 'Lista de Empaque', icon: <Package />, href: '/dashboard/trafico/empaque' },
            { label: 'Estadísticas de Tráfico', icon: <BarChart3 /> },
        ]
    },
    vSales: {
        title: 'Ventas B2B',
        description: 'Gestión comercial de mayoristas',
        roles: ['OWNER', 'ADMIN', 'SALES', 'TRAFFIC', 'SUPERVISOR'],
        items: [
            { label: 'Pipeline de Ventas', icon: <Briefcase />, href: '/dashboard/ventas' },
            { label: 'Control de Aprobaciones', icon: <FileCheck />, href: '/dashboard/ventas/aprobaciones' },
            { label: 'Nueva Cotización', icon: <Plus />, href: '/dashboard/ventas/nueva' },
            { label: 'Promociones Activas', icon: <Percent /> },
            { label: 'Histórico de Ofertas', icon: <FileText /> },
        ]
    },
    settings: {
        title: 'Configuración',
        description: 'Ajustes del sistema',
        roles: ['OWNER', 'ADMIN', 'SUPERVISOR'],
        items: [
            { label: 'Gestión de Sucursales', icon: <Building2 />, href: '/dashboard/configuracion/sucursales' },
            { label: 'Herramientas del Sistema', icon: <Settings /> },
            { label: 'Usuarios y Permisos', icon: <Users /> },
            { label: 'Registrar Nuevo Usuario', icon: <UserPlus /> },
            {
                label: 'Configuración Empresarial',
                icon: <Building2 />,
                subItems: [
                    { label: 'Zona Horaria e Idioma', icon: <Globe /> },
                    { label: 'Moneda e Impuestos', icon: <BadgeDollarSign /> },
                    { label: 'Formato de Facturas', icon: <FileText /> },
                    { label: 'Reglas Comerciales', icon: <FileCheck /> },
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
                    { label: 'Canales de Notificación (Email/Push)', icon: <Mail /> },
                    { label: 'Prioridad de Alertas', icon: <Clock /> },
                ]
            },
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
        roles: ['OWNER', 'ADMIN'],
        items: [
            { label: 'Pasarelas de Pago', icon: <Wallet /> },
            { label: 'Sistemas Contables', icon: <Calculator /> },
            { label: 'CRM Externos', icon: <Briefcase /> },
            { label: 'API Keys', icon: <Key /> },
            { label: 'Webhooks', icon: <Webhook /> },
        ]
    },
    warehouse: {
        title: 'Gestión de Almacén',
        description: 'Operaciones de picking, packing y bodega',
        roles: ['OWNER', 'ADMIN', 'WAREHOUSE', 'SUPERVISOR'],
        items: [
            { label: 'Monitor de Picking', icon: <Activity />, href: '/dashboard/almacen/picking' },
            { label: 'Control de Inventario', icon: <Package />, href: '/dashboard/inventario' },
            { label: 'Transferencias', icon: <RotateCcw />, href: '/dashboard/inventario/transferencias' },
            { label: 'Configuración de Bodegas', icon: <Settings /> },
        ]
    }
};


