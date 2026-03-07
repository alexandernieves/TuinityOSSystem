# Plan de Implementación: Contabilidad y Finanzas (CXC / CXP)

Este módulo se encargará de gestionar el dinero que deben los clientes (Cuentas por Cobrar - CXC) y el dinero que se debe a los proveedores (Cuentas por Pagar - CXP), así como el registro de pagos o abonos.

## Lógica Principal

1. **CXC (Cuentas por Cobrar)**: Cuando una `Venta B2B` a crédito pasa a estado "Facturada", el total de esa factura se sumará automáticamente al `currentBalance` del *Cliente*.
2. **CXP (Cuentas por Pagar)**: Cuando una `Orden de Compra` a crédito se recibe y procesa, el total se sumará al `currentBalance` del *Proveedor*.
3. **Pagos (Payments)**: Crearemos un nuevo esquema centralizado para registrar los abonos/pagos. Cuando se registre un pago de un cliente, su balance disminuirá. Cuando paguemos a un proveedor, su balance disminuirá.

---

## 🏗️ Backend (Cambios Propuestos)

### 1. Nuevo Esquema y Módulo: `Payments`
- **[NEW] Módulo `Payments`**: Esquema `Payment`, Servicio y Controlador.
- **Esquema `Payment`**:
  - `type`: `inbound` (ingreso/cobro) o `outbound` (egreso/pago).
  - `entityType`: `client` o `supplier`.
  - `entityId`: ID del Cliente o Proveedor.
  - `referenceDocument`: ID de la Factura (Venta) o la Orden de Compra (opcional si es abono general).
  - `amount`: Monto pagado.
  - `paymentMethod`: Efectivo, transferencia, cheque, etc.
  - `date`: Fecha del pago.

### 2. Actualización de Servicios Existentes
- **[MODIFY] `clients.service.ts`**: Asegurar el uso de `updateBalance(id, amount)` al facturar o registrar pagos.
- **[MODIFY] `suppliers.service.ts`**: Crear/asegurar el método `updateBalance(id, amount)` para las compras a crédito.
- **[MODIFY] `sales.service.ts`**: Al cambiar estado a "Facturada" en B2B (y si el método de pago indica crédito), se llamará al `clientsService.updateBalance(clientId, total)`.
- **[MODIFY] `purchase-orders.service.ts`**: Al recibir mercancía completa/facturarla, sumar saldo a `suppliersService.updateBalance(supplierId, total)`.

---

## 🎨 Frontend (Nuevas Interfaces)

### 1. Cuentas por Cobrar (CXC - Clientes)
- **[NEW] Pantalla `/clientes/cxc`**: Un dashboard/lista mostrando solo a los clientes que tienen `currentBalance > 0`.
  - Acción rápida: "Registrar Cobro" (Abono).
- **[NEW] Pantalla `/clientes/cxc/nuevo-cobro`**: Formulario para seleccionar el cliente, listar sus facturas pendientes (opcional) y registrar el ingreso (efectivo/transferencia).

### 2. Cuentas por Pagar (CXP - Proveedores)
- **[NEW] Pantalla `/proveedores/cxp`**: Dashboard/lista de proveedores a los que la empresa de Zona Libre les debe dinero (`currentBalance > 0`).
  - Acción rápida: "Registrar Pago".
- **[NEW] Pantalla `/proveedores/cxp/nuevo-pago`**: Formulario para registrar egresos hacia proveedores.

### 3. API Service
- **[MODIFY] `api.ts`**: Añadir llamadas `getPayments`, `createPayment`, enfocadas en el nuevo controlador.

---

## Plan de Verificación

### Pruebas Automatizadas / Manuales
1. Crear una venta B2B a un cliente con crédito -> Verificar que su saldo (`currentBalance`) suba por el total de la venta.
2. Registrar un cobro a ese cliente mediante el nuevo flujo CXC -> Verificar que el saldo (`currentBalance`) baje según el monto abonado.
3. Crear una orden de compra a proveedor -> Al recibirla, verificar que la deuda CXP con el proveedor aumente.
4. Registrar un pago a proveedor -> Verificar que la deuda disminuya.
