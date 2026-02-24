# CHECKLIST DE IMPLEMENTACIÓN - EVOLUTION ZONA LIBRE (Versión 3.0)

Este documento sirve como hoja de ruta maestra para la implementación del sistema "Tuinity OS" para Evolution, basado en el "Documento Maestro v3.0" de Febrero 2026.

## 🎯 Objetivo Principal: Fase 1 - Núcleo B2B
La prioridad absoluta es estabilizar la operación mayorista (B2B), que es el corazón del negocio. Hasta que Compras, Inventario y Ventas B2B no estén sólidos, no se avanza a B2C ni Contabilidad.

---

## 📦 Módulo 1: Catálogo de Productos (Fundamental)
*Sin un catálogo confiable, nada más funciona.*

- [x] **Estructura de Base de Datos**: Tabla `Product` con campos estándar.
- [x] **Datos Arancelarios y Logísticos**: Agregados campos `codigoArancelario`, `paisOrigen`, `weight`, `volume`, `unitsPerBox`.
- [x] **Identificador Principal**: Configurar la búsqueda y visualización para priorizar `description` sobre `sku`.
- [x] **Imágenes**: Implementar carga y almacenamiento de imágenes (repositorio propio, no links externos).
- [x] **Multilingüe**: Interfaz para editar descripciones en EN/ES/PT.
- [ ] **Detección de Duplicados**: Lógica al crear/editar para alertar si existe un producto con nombre similar.
- [x] **Precios Multinivel**: Lógica para manejar precios A, B, C, D, E.
    - [x] Estructura en DB (`price_a`...`price_e`).
    - [x] Endpoint para actualización masiva de precios.
- [x] **Importación Masiva**: Endpoint para cargar productos desde Excel/CSV.
- [x] **Frontend - Lista de Productos**: Página principal con búsqueda y control de acceso por roles.
- [x] **Frontend - Crear Producto**: Formulario completo con todos los campos (descripción, multilingüe, arancelarios, logísticos, precios).
- [x] **Frontend - Importar Productos**: Interfaz de importación masiva desde Excel/CSV con plantilla descargable.


## 🚢 Módulo 2: Compras e Importación (Dolor #1: Carga Manual)
*Eliminar la digitación manual de facturas de proveedores.*

- [x] **Modelo de Datos**: `PurchaseOrder`, `PurchaseOrderItem`.
- [x] **Cálculo FOB -> CIF**: Lógica en `PurchasesService` para distribuir gastos (flete, seguro, etc.) proporcionalmente.
- [x] **Recepción de Mercancía**: Endpoint `receive` que actualiza inventario.
- [x] **Costo Promedio Ponderado**: Actualización automática del costo del producto al recibir nueva mercadería.
- [x] **Histórico de Costos**: Registro de `lastFobCost` y `lastCifCost`.
- [x] **Importación Masiva de Órdenes**: Endpoint para parsear Excel/CSV de proveedores y crear la Orden de Compra automáticamente (Requerimiento Crítico de Celly).
- [ ] **Matching Inteligente**: Al importar, si el producto no existe, sugerir creación o vincular con existente.
- [ ] **Validación de Recepción**: Interfaz/Lógica para manejar recepciones parciales y cerrar órdenes (Back-end listo, falta validar en flujo completo).
- [x] **Frontend - Lista de Compras**: Gestión visual de órdenes y sus estados (Borrador, Pedido, Recibido).
- [x] **Frontend - Detalle de Compra y Recepción**: Interfaz para recibir mercancía, calcular CIF y actualizar inventario.
- [x] **Frontend - Importar Factura**: Resolución del dolor de Celly: Carga masiva de facturas de proveedores.

## 🏭 Módulo 3: Control de Inventario (La Verdad Única)
*Stock unificado y confiable para B2B y B2C.*

- [x] **Modelo de Inventario**: Tabla `Inventory` por Branch (Bodega vs Tienda).
- [x] **Movimientos**: Registro de `InventoryMovement` (IN/OUT).
- [x] **Bloqueo Disponibilidad Negativa**: Regla de negocio estricta en `SalesService` y `InventoryService`.
- [x] **Ajustes con Aprobación**: Flujo para que un ajuste de inventario (merma, robo) requiera `status: PENDING_APPROVAL`.
- [x] **Conversión de Unidades**: Lógica para mostrar Stock en "Cajas" para B2B y "Unidades" para B2C automáticamente.
- [ ] **Alertas de Stock**: Job o Trigger que notifique cuando `quantity < minStock`.
- [ ] **Valoración de Inventario**: Reporte que multiplique `Stock * Costo Promedio` (Totalizado).
- [x] **Frontend - Consulta de Stock**: Vista unificada en tiempo real con alternancia Cajas/Unidades.
- [x] **Frontend - Ajustes de Inventario**: Formulario de ingreso/egreso con selección de motivos.
- [x] **Frontend - Transferencias**: Interfaz para mover stock entre Bodega y Tienda.

## 💰 Módulo 4: Ventas B2B (El Motor de Ingresos)
*Pipeline completo: Cotización -> Pedido -> Factura.*

- [x] **Modelo de Ventas**: Tabla `Sale`, `SaleItem`.
- [x] **Estados del Pipeline**: Enum `SaleStatus`: `QUOTE`, `APPROVED_QUOTE`, `PENDING` (Pedido), `APPROVED_ORDER`, `PACKING`, `COMPLETED`.
- [x] **Cotizaciones (Quotes)**:
    - [x] Endpoint para crear `Sale` con status `QUOTE`.
    - [x] Generación de PDF ligero con imágenes (Requerimiento de Margarita).
    - [x] "Último Precio Vendido": Endpoint que al seleccionar Cliente+Producto devuelva el precio de la última venta.
- [x] **Pedidos (Orders)**:
    - [x] Transición `QUOTE` -> `PENDING` (Reserva de Stock "Separado").
    - [x] Validación de Crédito del Cliente antes de aprobar.
- [x] **Motor de Precios Flexible**:
    - [x] Lógica para aplicar precio según nivel del cliente (A..E).
    - [x] Excepciones manuales (con registro de quién autorizó).
- [x] **Modificación Post-Aprobación**: Permitir editar un pedido "Aprobado" sin tener que borrarlo y hacerlo de nuevo (Implementado en `SalesService.update`).
- [x] **Frontend - Pipeline de Ventas**: Lista de cotizaciones y pedidos con estados visuales.
- [x] **Frontend - Nueva Cotización**: El lugar de trabajo de Margarita: Búsqueda, precios multinivel y guardado.
- [ ] **Frontend - Aprobación y Facturación**: Interfaz para que Ariel apruebe pedidos y se genere el PDF final.

## 🚛 Módulo 5: Tráfico y Documentación (Nuevo - Solución para Ariel)
*Automatización de DMC, BL y Listas de Empaque.*

- [x] **Modelo de Tráfico**: `Shipment`, `ShipmentItem`.
- [x] **Crear Despacho**: Agrupación de múltiples `Sales` en un `Shipment`.
- [x] **Lista de Empaque Inteligente**: Endpoint `getPackingList` que agrupa ítems por **Partida Arancelaria** (Requerimiento Crítico).
- [x] **Gestión de Documentos**: Endpoints para ingresar DMC, BL, Contenedor, Precinto.
- [x] **Generación de PDFs**:
    - [x] Formato DMC de Salida (Pre-llenado).
    - [x] Formato BL (Pre-llenado con datos del cliente).
    - [x] Certificado de Libre Venta (Generación PDF).
- [x] **Dashboard de Tráfico**: Vista para ver qué despachos están en "DRAFT", "PACKED", "DISPATCHED".

## 👥 Módulo 6: Clientes y Cobranza (CRM)
*Gestión de relaciones y crédito.*

- [x] **Director de Clientes**: Modelo `Customer`.
- [x] **Cuentas por Cobrar**: Modelo `PaymentRecord`, `PaymentMethod`.
- [x] **Registro de Pagos**: Endpoint para aplicar pagos a facturas.
- [x] **Estado de Cuenta**: Endpoint para ver saldo y antigüedad de deuda (`getAccountStatus`) y generación de PDF cronológico.
- [x] **Alertas de Morosidad**: Bloqueo automático de nuevos pedidos si el cliente tiene facturas vencidas > X días.
- [x] **Límite de Crédito**: Validación al crear Pedido.

## ⚙️ Módulo 7: Configuración y Seguridad
*Roles y Permisos (Requerimiento Crítico).*

- [x] **Autenticación**: JWT, `AuthModule`.
- [x] **Multi-Tenancy**: Soporte base para tiendas separadas (si aplica).
- [x] **Roles Granulares**:
    - [x] Definir permisos específicos: `VIEW_COSTS`, `APPROVE_QUOTE`, `ADJUST_INVENTORY`.
    - [x] Asegurar que Vendedores NO vean costos (Privacidad en ProductsService).
    - [x] Asegurar que Bodega NO vea precios (Privacidad en ProductsService).

---

## 📅 Fase 2: Completar Operación (Post-Estabilización B2B)

- [ ] **Punto de Venta B2C**: Interfaz simplificada para tienda física.
- [ ] **Contabilidad**: Integración o módulo completo (Pendiente definir si usan software externo).
- [x] **Reportes Avanzados**:
    - [x] Dashboard Gerencial (Ventas vs Costos - TOP Clientes/Productos).
    - [x] Rotación de Inventario (Productos estancados > 6 meses).
    - [x] Exportación a Excel (Reportes de Inventario por Sucursal).

---

## 🚨 Problemas Críticos a Resolver de Inmediato (Top Priority)

1.  **Disponibilidad Negativa**: Implementar validación estricta en el backend para impedirla.
2.  **Carga Manual de Compras**: Urgente desarrollar el importador de Excel para Celly.
3.  **DMC Manual**: Urgente conectar el módulo de Tráfico con una plantilla de impresión para Ariel.
