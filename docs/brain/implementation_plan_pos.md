# Plan de Implementación: Módulo de Punto de Venta (POS)

Este plan detalla la transformación del Punto de Venta (POS) de un prototipo estático a una herramienta operativa para ventas rápidas de mostrador (B2C), integrando el manejo de caja física y múltiples métodos de pago.

## Objetivos
- Implementar **Gestión de Caja**: Apertura, arqueo y cierre diario.
- Optimizar la interfaz para búsqueda ultra-rápida (Barcode/SKU).
- Integrar pagos múltiples (Efectivo y Tarjeta simultáneo).
- Registrar la salida inmediata de inventario al completar la venta.

## Cambios Propuestos

### Backend

#### [NEW] [cash-register.schema.ts](file:///Users/alexandernieves/Desktop/tuinity/backend/src/sales/schemas/cash-register.schema.ts)
- Esquema para sesiones de caja: `userId`, `aperturaAmount`, `cierreAmount`, `diferencia`, `estado` (abierta/cerrada).

#### [MODIFY] [sales.service.ts](file:///Users/alexandernieves/Desktop/tuinity/backend/src/sales/sales.service.ts)
- `createPOSSale`: Lógica simplificada para ventas rápidas que descuenta `existence` directamente (saltando el estado de reserva B2B).
- `handleCashFlow`: Registro de entradas y salidas de efectivo en la sesión activa.

---

### Frontend

#### [MODIFY] [ventas/pos/page.tsx](file:///Users/alexandernieves/Desktop/tuinity/frontend/app/(dashboard)/ventas/pos/page.tsx)
- Conectar el buscador al inventario real del backend.
- Implementar el modal de "Cierre de Caja" con resumen de ventas del día.
- Lógica de impresión de ticket de venta (formato térmico).

#### [MODIFY] [api.ts](file:///Users/alexandernieves/Desktop/tuinity/frontend/lib/services/api.ts)
- Endpoints: `openCashRegister`, `closeCashRegister`, `getRegisterStatus`, `processPOSSale`.

## Plan de Verificación

### Pruebas Automatizadas
- Procesar 10 ventas rápidas y verificar que el cierre de caja coincide con la sumatoria de los pagos.
- Intentar vender con caja cerrada (debe dar error 403).

### Verificación Manual
- Abrir caja con $100.
- Escanear productos y cobrar en efectivo.
- Cerrar caja y verificar el reporte de arqueo.
