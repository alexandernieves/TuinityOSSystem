# Tasks

## 1. Módulo de Proveedores (Suppliers)
- [x] Backend: Crear esquema `Supplier` en Mongoose.
- [x] Backend: Crear `SuppliersService` con CRUD básico.
- [x] Backend: Crear `SuppliersController` protegido con JWT.
- [x] Frontend: Actualizar `api.ts` con endpoints de proveedores.
- [x] Frontend: Refactorizar `app/(dashboard)/proveedores/page.tsx` para usar datos reales del API.

## 2. Módulo de Órdenes de Compra (Purchase Orders)
- [x] Backend: Crear esquema `PurchaseOrder` en Mongoose.
- [x] Backend: Crear `PurchaseOrdersService` con lógica de recepción y cálculos FOB/CIF/Gastos.
- [x] Backend: Crear `PurchaseOrdersController` profesional protegido con JWT.
- [x] Frontend: Actualizar `api.ts` con todos los endpoints de órdenes de compra.
- [x] Frontend: Refactorizar listado de Compras `app/(dashboard)/compras/page.tsx`.
- [x] Frontend: Refactorizar creación de Orden `app/(dashboard)/compras/nueva/page.tsx`.
- [x] Frontend: Refactorizar vista detalle y recepción `app/(dashboard)/compras/[id]/page.tsx`.
- [x] Frontend: Refactorizar reportes `historial-costos` y `historial-entradas`.

## 3. Lógica de Inventario y Costos
- [x] Backend: Al recibir mercancía, actualizar existencias en `Bodega`.
- [x] Backend: Al recibir mercancía, registrar movimiento de stock (integrado en `PurchaseOrdersService`).
- [x] Backend: Al recibir mercancía, recalcular Costo Promedio Ponderado (`costAvgWeighted`) del `Product`.
- [x] Frontend: Mostrar estos cambios reflejados en la vista de Productos y en los historiales.

## 4. Módulo de Ventas B2B (Sales)
- [x] Backend: Crear esquema `Sale` / `Invoice` en Mongoose.
- [x] Backend: Crear `SalesService` con lógica de reserva de stock y validación de crédito.
- [x] Backend: Crear `SalesController` protegido con JWT.
- [x] Frontend: Actualizar `api.ts` con endpoints de ventas.
- [x] Frontend: Refactorizar listado de Ventas `app/(dashboard)/ventas/page.tsx`.
- [x] Frontend: Refactorizar creación de Venta `app/(dashboard)/ventas/nueva/page.tsx`.
- [x] Frontend: Implementar flujo de aprobación, empaque y facturación.

## 5. Módulo de Punto de Venta (POS)
- [x] Backend: Lógica de apertura/cierre de caja y transacciones POS.
- [x] Backend: Integración de pagos (Efectivo, Tarjeta, Mixto).
- [x] Frontend: Refactorizar interfaz de POS `app/(dashboard)/ventas/pos/page.tsx`.
- [x] Frontend: Optimización para búsqueda rápida de productos y escaneo de códigos de barra.

## 6. Módulo de Clientes y CRM
- [x] Backend: Perfil detallado de cliente, historial de pagos y límites de crédito.
- [x] Frontend: Gestión de contactos, direcciones de envío y estado de cuenta.

## 7. Contabilidad y Finanzas
- [x] Backend: Módulo `Payments` — Esquema, Servicio y Controlador para CXC/CXP.
- [x] Backend: `SuppliersService.updateBalance` y `ClientsService.updateBalance` integrados.
- [x] Frontend: Pantalla CXC `/clientes/cxc` — listado de clientes con saldo pendiente.
- [x] Frontend: Pantalla CXP `/proveedores/cxp` — listado de proveedores con deuda pendiente.
- [x] Frontend: Formulario de cobro `/clientes/cxc/nuevo-cobro` para abonos de clientes.
- [x] Frontend: Formulario de pago `/proveedores/cxp/nuevo-pago` para pagos a proveedores.

## 8. Reportes y Dashboard Pro
- [x] Backend: Endpoint `/analytics/dashboard` para KPIs agregados de todos los módulos.
- [x] Backend: Módulo `Reports` con generación de Excel (`exceljs`) para Ventas e Inventario.
- [x] Frontend: Dashboard interactivo conectado a datos reales (KPIs, Gráficos, Actividad).
- [x] Frontend: Pantalla `/reportes` para descarga de informes dinámicos.
- [x] Frontend: Integración de filtros básicos para generación de reportes.

## 9. Próximas Integraciones y Mejoras (Pendiente)
- [x] **Contabilidad:** Integración de Recepción de Compras (OC) con el Libro Diario.
- [x] **Contabilidad:** Integración de Ajustes de Inventario (Mermas/Roturas) con el Libro Diario.
- [x] **Dashboard:** Conexión de gráficos de tendencias y KPIs (Meta Mensual, Rotación) a datos reales.
- [ ] **Reportes:** Plantillas dinámicas para Facturas (PDF/Ticket) y Reporte de Utilidad.
- [ ] **Bancos:** Módulo básico de saldos bancarios y conciliación.
- [ ] **Devoluciones:** Flujo de Notas de Crédito y reversión de stock.
