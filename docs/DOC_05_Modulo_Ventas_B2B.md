# DOCUMENTO 05 — MÓDULO: VENTAS B2B

## Contexto
Este documento especifica el módulo de Ventas B2B para la nueva plataforma de Evolution Zona Libre. Es el corazón del negocio — donde Evolution genera sus $8.7M anuales de ingresos con un margen promedio de 16.45%. Todo lo que se construyó en Docs 02-04 (Catálogo, Compras, Inventario) existe para alimentar este módulo.

**Prerequisito:** Leer Documentos 01, 02, 03 y 04 antes de este documento.

---

## 1. QUÉ REEMPLAZA ESTE MÓDULO EN DYNAMO

En Dynamo, la funcionalidad de ventas B2B está dispersa entre DOS módulos separados: Punto de Venta (12 submódulos) y Ventas (11 submódulos). La mayoría son la misma tabla con un filtro diferente. Este documento los consolida en un solo módulo robusto.

### Desde el módulo Punto de Venta (clasificados como B2B):

| Submódulo Dynamo | Qué hace | Estado | Destino |
|------------------|----------|--------|---------|
| Gestión de Ventas | Interfaz principal B2B (crear pedido, cotización, buscar) | Funciona | → Ventas B2B |
| Consulta de Facturas | Lista de facturas B2B con Costo, Utilidad, % Util visibles | Funciona (datos expuestos) | → Ventas B2B |
| Consulta de Utilidad por Factura | Resumen ejecutivo: ventas, costos, utilidad por período | Funciona (datos expuestos) | → Reportes |
| Consulta de Artículos Vendidos | Resumen por producto con existencia negativa permitida | Funciona (datos expuestos) | → Reportes |
| Detalle de Artículos Vendidos | Líneas individuales con Proveedor, %Desc, Autorizado por | Funciona (datos expuestos) | → Reportes |
| Consulta de Devoluciones | Log de devoluciones/reembolsos | Funciona (vacío hoy) | → Ventas B2B |
| Análisis de Ventas | Dashboard ejecutivo con drill-down año/mes/día/factura | Funciona | → Reportes |
| Reportes POS (8 reportes) | 8 reportes predefinidos de ventas | Funciona | → Reportes |

### Desde el módulo Ventas:

| Submódulo Dynamo | Qué hace | Estado | Destino |
|------------------|----------|--------|---------|
| Administración de Cotizaciones | Crear/editar cotizaciones con líneas de producto | Funciona | → Ventas B2B |
| Aprobación de Cotizaciones | Cola de aprobación con margen y crédito visible | Abandonado (último uso: mayo 2019) | → Ventas B2B |
| Administración de Pedidos | Crear/editar pedidos (desde cotización o directo) | Funciona | → Ventas B2B |
| Aprobación de Pedidos | Cola de aprobación de pedidos | Funciona | → Ventas B2B |
| Lista de Empaque | Generar packing list con bultos, peso, cubicaje | Funciona | → Ventas B2B |
| Generar Factura | Crear factura desde pedido aprobado + FE | Funciona | → Ventas B2B |
| Consulta de Pedidos Reservados | Pipeline: pedidos aprobados pendientes de facturar | Funciona | → Ventas B2B |
| Consulta de Ventas x Vendedor | Rendimiento por vendedor con comisiones | Funciona (datos expuestos) | → Ventas B2B / Reportes |
| DMC - Movimiento Comercial | Módulo de tráfico (nunca terminado) | ROTO — no implementado | → Tráfico (Doc 07) |
| Reportes de Ventas | Lista de reportes predefinidos | VACÍO — cero reportes configurados | → Reportes |
| Procesos Especiales (4 sub) | Desaprobar, Reversar, FE, Docs Emitidos | Funciona | → Botones contextuales |

**Total en Dynamo:** 23 pantallas separadas entre 2 módulos diferentes

**En la nueva plataforma:** Un solo módulo **VENTAS B2B** con un pipeline visual unificado. Los reportes van al módulo de Reportes. El DMC va al módulo de Tráfico. Los procesos especiales se convierten en botones dentro de cada vista.

---

## 2. LO QUE DYNAMO HACE HOY — ANÁLISIS COMPLETO

### 2.1 El Pipeline de Ventas B2B

Dynamo tiene un pipeline de 6 etapas secuenciales. Cada etapa es un submódulo separado con su propia pantalla. El pipeline es:

```
COTIZACIÓN → APROB. COTIZACIÓN → PEDIDO → APROB. PEDIDO → LISTA EMPAQUE → FACTURA
     ↓              ↓                ↓            ↓              ↓             ↓
  Vendedor      Javier/Estelia    Vendedor    Javier/Estelia    Bodega      Vendedor
                                                                              ↓
                                                                    FACTURA ELECTRÓNICA
                                                                         (DGI)
                                                                              ↓
                                                                    TRÁFICO (DMC, BL)
```

**Hallazgo importante:** En la práctica, la etapa de Aprobación de Cotizaciones está ABANDONADA desde mayo 2019 (7 años). Solo hay 5 cotizaciones históricas registradas. Esto sugiere que el flujo real actual es: Cotización → Pedido → Aprobación Pedido → Empaque → Factura (5 pasos, una sola aprobación). PENDIENTE confirmar con Javier si quiere reactivar la doble aprobación o mantener aprobación única.

### 2.2 Gestión de Ventas — La Interfaz Principal

**Para qué sirve:** Es la pantalla principal del vendedor. Desde aquí se accede a todo el flujo de ventas.

**Panel de botones (lado derecho):**

| Botón | Acción |
|-------|--------|
| Crear Pedido | Nuevo pedido directo |
| Buscar Pedido | Buscar pedido existente |
| Imprimir Pedido | Generar PDF del pedido |
| Crear Cotización | Nueva cotización |
| Buscar Cotización | Buscar cotización existente |
| Imprimir Cotización | Generar PDF de cotización |
| Consultar Factura | Ver factura generada |
| Consulta de Producto | Ver ficha/disponibilidad |
| Consulta de Cliente | Ver ficha del cliente |
| Calculadora | Calculadora integrada |

**Nota:** El footer muestra "I.T.B.M.S 7%" (impuesto de venta de Panamá) pero las facturas B2B reales tienen 0% porque son ventas de zona libre. Este campo es residual del módulo B2C y NO aplica a B2B.

### 2.3 Administración de Cotizaciones

**Para qué sirve:** El vendedor crea una propuesta de venta con productos, cantidades y precios. Es el primer paso del pipeline.

**Header — campos del encabezado:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Cliente (código) | Dropdown/búsqueda | Código del cliente (ej: CL-07, CL-509) |
| Nombre | Auto | Se llena al seleccionar cliente |
| Dirección | Auto | Del registro del cliente |
| Teléfono / Fax / Cel. / Email | Auto | Datos de contacto |
| **Saldo** | Auto (numérico) | **Saldo pendiente del cliente** — verificación de crédito integrada |
| **Límite de CR.** | Auto (numérico) | **Límite de crédito asignado** |
| Condición de Pago | Dropdown | CREDITO + campo de días (30, 60, 90) |
| **Vendedor** | Dropdown | ARNOLD, MARGARITA, etc. |
| **Precio** | Dropdown | **NIVEL DE PRECIO (A-E)** — el vendedor VE y SELECCIONA el nivel |
| Cotización No. | Auto | Número secuencial |
| Fecha | Auto/editable | Fecha de creación |
| Pedido No. | Auto | Se llena cuando se convierte a pedido |
| Status | Badge | PENDIENTE (naranja), APROBADA, RECHAZADA |

**PROBLEMA CRÍTICO — Precio nivel visible:** El dropdown "Precio" permite al vendedor VER y SELECCIONAR manualmente el nivel de precio (A, B, C, D, E). En la nueva plataforma, el nivel de precio se asigna AUTOMÁTICAMENTE basado en la configuración del cliente. El vendedor NO debe poder cambiar el nivel.

**Tabla de líneas de producto:**

| Columna | Notas |
|---------|-------|
| Codigo | Referencia del producto |
| Descripción | Autocompletado al buscar |
| Cantidad | Cantidad de cajas a cotizar |
| Precio | Precio unitario según nivel seleccionado |
| Total | = Cantidad × Precio |

**Panel de detalle del producto (al seleccionar un producto):**

| Campo | Notas |
|-------|-------|
| Existencia | Stock actual en bodega |
| Por Llegar | Mercancía en tránsito |
| Separado | Ya comprometido en otros pedidos |
| Disponible | = Existencia + Por Llegar - Separado |
| C. x Bulto | Cantidad de unidades por caja |
| U/M | Unidad de medida (CJA) |
| U/P | Unidades por paleta |

**Campos logísticos del footer:**

| Campo | Notas |
|-------|-------|
| Cubicaje | Metros/pies cúbicos por producto |
| Cubicaje Total | Suma de cubicajes de todas las líneas |
| Peso Total | Peso total del embarque |
| Weight | Peso en formato alternativo |

**Botones especiales:**
- **Instrucciones** — Notas especiales para el pedido (texto libre)
- **Gastos** — Cargos adicionales por cotización (ej: flete, embalaje especial)
- **F8 = Ver Precios** — Permite ver precios (PENDIENTE: ¿ve todos los niveles o solo el aplicable?)

**Toolbar:**
- **"Solicitar Aprobación"** — El vendedor crea la cotización y luego solicita aprobación

**Footer financiero:**
```
SUB-TOTAL  +  GASTOS  =  TOTAL
```

### 2.4 Aprobación de Cotizaciones — ABANDONADO

**Para qué sirve:** El aprobador (Javier/Estelia) revisa cotizaciones pendientes y las aprueba o rechaza.

**Estado actual:** Última actividad registrada: mayo 2019 (7 años dormido). Solo 5 cotizaciones históricas en el sistema.

**Dos pestañas:**
1. **Aprobación** — Cola de cotizaciones pendientes
2. **Cotizaciones Aprobadas** — Historial

**Columnas de la cola de aprobación:**

| Columna | Notas |
|---------|-------|
| No.Cotización | Número secuencial |
| Fecha | Fecha de creación |
| Días | Antigüedad (días desde creación) |
| Vendedor | Quién la creó |
| Cliente | Código del cliente |
| Nombre | Nombre del cliente |
| Total | Monto total |
| % Utilidad | **Margen de ganancia — CORRECTO que el aprobador lo vea** |
| Saldo | Saldo pendiente del cliente |
| Límite Cr. | Límite de crédito |
| Excede | Si el pedido excede el crédito disponible |
| LCr. Disponible | Crédito disponible después de esta cotización |
| LCr. Excede | Monto que excede el límite |

**Detalle de la cotización (al hacer click):**

| Columna | Notas |
|---------|-------|
| Referencia | Código del producto |
| Existencia | Stock actual |
| Disponible | Stock disponible |
| Cantidad | Cantidad cotizada |
| Precio A | Precio del nivel A (referencia) |
| Precio | Precio real aplicado |
| Costo | **Costo del producto — CORRECTO que el aprobador lo vea** |
| % Utilidad | **Margen por línea — CORRECTO para tomar decisión** |
| Descripción | Nombre del producto |

**Datos históricos encontrados (mayo 2019):**

| Cotización | Aprobador | Cliente | Total |
|------------|-----------|---------|-------|
| 000001 | JAVIER LANGE | GUILLERMO SOSA VELEZ | $31,030 |
| 000002 | JAVIER LANGE | FRANCISCO QUINTERO | $11,800 |
| 000003 | ASTELVIA WATTS | MERCANSA | $171 |
| 000004 | JAVIER LANGE | LEONILDE SANCHEZ PEÑA | $15,002 |
| 000005 | JAVIER LANGE | FLOCK-COMERCIO DE BEBIDAS | $60,025 |

**Nota:** La columna "% Utilidad" muestra códigos garbled (G.EA, EG.OL, UC.MC, G.MI, E.UE) — posible cifrado o corrupción de datos, similar al "Rata %" en movimiento histórico.

**Botones del aprobador:** Ver Factura, Utilidad x Producto, Imprimir Reporte, Ventas x Cliente, Estado Cuentas, **Bajo Precio** (posible reporte de ventas debajo del umbral de comisión), Comparativo, **Aprobar**, **Rechazar**

### 2.5 Administración de Pedidos

**Para qué sirve:** Cuando el cliente acepta la cotización, se convierte en pedido. O se puede crear un pedido directamente sin cotización previa.

**Estructura:** Idéntica a Cotizaciones pero con botones adicionales en la toolbar:

| Botón | Acción | Notas |
|-------|--------|-------|
| Foto | Ver imágenes de productos | Para referencia visual |
| Picking List | Generar lista de empaque | Dispara la siguiente etapa |
| Solicitud Compras | Si no hay stock, solicitar al proveedor | Link directo a Compras |
| Recepción Mercancía | Registrar entrada de mercancía | Link directo a Inventario |

**PROBLEMA:** El dropdown "Precio" muestra el nivel seleccionado (ej: "C"). El vendedor puede ver y cambiar el nivel de precio. En la nueva plataforma esto debe ser automático basado en el cliente.

**Hallazgo de los Pedidos Reservados (pipeline activo real al 24/02/2026):**

| Pedido | Cotización | Fecha | Días | Cliente | F.Pago | Vendedor | Despacho | Sub-Total | Gastos | Total |
|--------|-----------|-------|------|---------|--------|----------|----------|-----------|--------|-------|
| 006483 | — | 22/01/2026 | 33 | MARIA DEL MAR PEREZ SV | CREDITO | JAVIER LANGE | — | $670 | $0 | $670 |
| 006501 | 004302 | 30/01/2026 | 25 | SULTAN WHOLESALE | CREDITO | MARGARITA | SALIDA | $182,557 | $0 | $182,557 |
| 006507 | — | 04/02/2026 | 20 | MEDIMEX, S.A. | CREDITO | JAVIER LANGE | — | $12,780 | $0 | $12,780 |
| 006544 | 004337 | 19/02/2026 | 5 | INVERSIONES DISCARIBBEAN SAS | CONTADO | MARGARITA | SALIDA | $1,300 | $50 | $1,350 |
| 006550 | 004342 | 19/02/2026 | 5 | GIACOMO PAOLO LECCESE TURCONI | CONTADO | MARGARITA | SALIDA | $7,978.50 | $165 | $8,143.50 |
| 006552 | — | 20/02/2026 | 4 | MARIA DEL MAR PEREZ SV | CREDITO | JAVIER LANGE | — | $7,500 | $0 | $7,500 |
| 006554 | — | 23/02/2026 | 1 | MARIA DEL MAR PEREZ SV | CREDITO | JAVIER LANGE | — | $5,870 | $0 | $5,870 |
| 006560 | 004350 | 24/02/2026 | 0 | PONCHO PLACE | CONTADO | MARGARITA | SALIDA | $4,082.50 | $0 | $4,082.50 |

**Total pipeline activo: $222,953**

**Insights del pipeline:**
- Algunos pedidos NO tienen cotización asociada (campo vacío) — se crearon directo como pedido, saltando la cotización
- El pedido más antiguo tiene 33 días — MARIA DEL MAR PEREZ SV con solo $670 (podría ser olvidado)
- SULTAN WHOLESALE es el pedido más grande ($182,557) — 25 días esperando despacho
- El campo "Despacho" muestra "SALIDA" para algunos — indica tipo de DMC
- Clientes de CONTADO y CREDITO en el mismo pipeline
- JAVIER LANGE aparece como vendedor en varios pedidos — el dueño también vende

**Botones:** Ver Pedido, Imprimir, Salir. Filtros por Vendedor, Cliente, Fecha.

### 2.6 Aprobación de Pedidos

**Para qué sirve:** El aprobador valida el pedido antes de proceder al empaque y facturación.

**Columnas de la cola:**

| Columna | Notas |
|---------|-------|
| Pedido | Número de pedido |
| Cotización | Cotización de origen (si aplica) |
| Fecha | Fecha de creación |
| Días | Antigüedad |
| Cliente | Código del cliente |
| Nombre | Nombre del cliente |
| F.Pago | Forma de pago (CREDITO/CONTADO) |
| VE | Código del vendedor |
| **Despacho** | Tipo de despacho (SALIDA, etc.) |
| Sub-Total | Monto de productos |
| **Gastos** | Cargos adicionales |
| Total | Sub-Total + Gastos |

**Botones:** Ver Pedido, Imprimir, **Aprobar**, Salir

### 2.7 Lista de Empaque (Packing List)

**Para qué sirve:** Bodega prepara la mercancía física. La lista de empaque es el documento que guía la preparación del despacho y alimenta la documentación de tráfico.

**Columnas:**

| Columna | Notas |
|---------|-------|
| Del / Al | Rango de bultos (ej: 1 al 5) |
| Bultos | Cantidad de bultos en ese rango |
| Peso Neto | Peso neto del rango |
| Cubicaje | Volumen del rango |
| Bodega | Código de bodega |
| Codigo | Referencia del producto |
| U/M | Unidad de medida |
| Cantidad | Cantidad de cajas |
| Precio | Precio unitario |
| Total | = Cantidad × Precio |

**Footer de totales:**
- Total de Bultos
- Total Peso Neto
- Cubicaje Total
- Peso (Kls) — peso total en kilogramos
- Cubicaje (P3) — cubicaje total en pies cúbicos

**Atajos:** F2 Insertar Líneas, F3 Eliminar Líneas, F5 Buscar Referencia, F7 Eliminar información de Bultos hacia abajo

**Uso por Tráfico:** Ariel toma esta lista de empaque como input para generar el DMC. Necesita que esté agrupada por código arancelario — actualmente NO lo está, y Ariel tiene que reordenar manualmente.

### 2.8 Generar Factura

**Para qué sirve:** Crear la factura formal de venta desde un pedido aprobado. Es el documento fiscal oficial.

**Campos destacados (en amarillo — críticos):**

| Campo | Valor | Notas |
|-------|-------|-------|
| **Tipo de Factura** | EXTERIOR | Confirma venta de zona libre (exportación) |
| **Forma de Pago** | EFECTIVO (dropdown) | Opciones: Efectivo, Crédito, Transferencia, etc. |
| Buscar Pedido a Facturar | — | La factura se genera DESDE un pedido aprobado |

**Botón especial:** "Datos Factura Electrónica" — abre el formulario de integración con DGI

**Tabla de líneas (misma estructura que Lista de Empaque):**

| Columna | Notas |
|---------|-------|
| Del / Al | Rango de bultos |
| Bultos | Cantidad |
| Peso Neto | — |
| Bod | Bodega |
| Codigo | Referencia |
| Descripción | Nombre del producto |
| Cantidad | Cajas |
| Precio | Precio unitario |
| Total | Línea total |

**Footer:**
```
Total de Piezas | Total de Bultos | Total Peso Neto | Cubicaje Total
SUB-TOTAL  +  GASTOS  =  TOTAL
```

**Botones:** Instrucciones, Gastos, **Datos Factura Electrónica**, Guardar, Cancelar

**Opciones de impresión:** Pre-Impreso, Hoja Blanca, Foto

### 2.9 Factura Electrónica (FE) — Integración con DGI Panamá

**Para qué sirve:** Transmitir la factura a la Dirección General de Ingresos (DGI) de Panamá en formato electrónico. Es requisito legal.

**Datos del comprobante revelados (Factura 4418, cliente PONCHO PLACE):**

| Campo | Valor | Notas |
|-------|-------|-------|
| **Tipo de Documento** | **Factura de Zona Franca** | Tipo fiscal especial para zona libre — NO es factura estándar |
| # Documento | 4418 | Número de factura |
| Fecha | 24/02/2026 | — |
| Tipo de Cliente | **Extranjero** | Clientes B2B son internacionales |
| Nombre | PONCHO PLACE | — |
| Tipo de Contribuyente | **Jurídico** | Empresa, no persona natural |

**Sección CLIENTE EXTRANJERO:**

| Campo | Valor | Notas |
|-------|-------|-------|
| Tipo Identificación | Numero Tributario | — |
| Id. Extranjero | 0614-150120-102-7 | NIT del cliente extranjero |
| País Extranjero | **COLOMBIA** | Destino de la mercancía |
| Dirección | CALLE MAX BLOCK EL SALVAR | — |
| Email | CONTABILIDAD@EVOLUTIONZL.COM | **Email de Evolution, NO del cliente** — todas las FE van a Evolution |
| Teléfono | 433-3676 | — |
| País Receptor | CO (Colombia) | Código ISO del país destino |

**Generales FE:**

| Campo | Valor |
|-------|-------|
| Sucursal | 0000 |
| Punto Facturación | 003 |

**Totales FE (desglose de Factura 4418):**

| Campo | Valor | Notas |
|-------|-------|-------|
| Total Neto | $5,839.00 | Subtotal de productos |
| Total Impuesto | (vacío) | **Zona libre = exenta de impuestos** |
| **Total Gastos** | **$30.00** | Gastos adicionales — explica diferencia entre Sub-Total y Total |
| TOTAL FACTURA | $5,869.00 | = Neto + Gastos |
| TOTAL RECIBIDO | $5,869.00 | — |
| VUELTO | (vacío) | — |

**Botones:** Emitir Documento, Cancelar

### 2.10 Consulta de Facturas — Datos del Día

**Facturas del 24/02/2026 (datos reales):**

| Factura | Cliente | Total | Margen | Notas |
|---------|---------|-------|--------|-------|
| 4418 | PONCHO PLACE | $5,869 | 21.16% | Colombia, contado |
| 4422 | DT LICORES | $3,957 | 13.35% | Cerca del umbral de comisión (10%) |
| 4423 | MARIA DEL MAR PEREZ | $1,800 | 29.67% | Margen alto — buen negocio |

**PROBLEMA:** Las columnas Costo, Utilidad, y % Utilidad son visibles para TODOS los usuarios. Esto es el Problema #1 de Javier.

### 2.11 Consulta de Ventas por Vendedor — Sistema de Comisiones EN VIVO

**Para qué sirve:** Ver rendimiento de ventas por vendedor con cálculo automático de comisiones.

**Datos del 24/02/2026 — MARGARITA MORELOS (código 03):**

| Columna | Valor | Notas |
|---------|-------|-------|
| Venta Bruta | $11,566.00 | Total facturado hoy |
| Descuento | $0.00 | Sin descuentos aplicados |
| Venta Neta | $11,566.00 | = Bruta - Descuentos |
| **Costo** | **$9,271.57** | Costo total — VISIBLE para todos |
| **Utilidad** | **$2,294.43** | Ganancia bruta — VISIBLE |
| **%** | **19.83** | Margen porcentual — VISIBLE |
| **Venta Comisión** | **$7,017.00** | **Solo la venta que califica para comisión** |

**Revelación del sistema de comisiones:**
- Venta total del día: $11,566
- Venta que comisiona: $7,017 (60.7% del total)
- Venta que NO comisiona: $4,549 (39.3%)
- El sistema YA calcula automáticamente qué productos superan el umbral del 10% de margen
- Solo $7,017 de los $11,566 generan comisión para Margarita

**Filtros:** Rango de fechas (D desde / H hasta), Vendedor, Facturas
**Botones:** Ver Factura, Utilidad x Producto

**PROBLEMA:** Todo visible — costo, utilidad, margen porcentual. El vendedor puede calcular exactamente el costo de cada producto.

### 2.12 Consulta de Utilidad por Factura — Métricas Ejecutivas

**Dashboard financiero confirmado (24/02/2026):**

| Período | Ventas | Costos | Utilidad | Margen |
|---------|--------|--------|----------|--------|
| Hoy | $11,566 | $9,271 | $2,294 | 19.83% |
| Feb 2026 | $1,467,093 | $1,224,348 | $242,744 | 16.54% |
| YTD 2026 | $2,588,580 | $2,162,548 | $426,031 | 16.45% |

**Botones de drill-down:** Utilidad x Producto, Ventas x Cliente, Estado Cuentas, **Bajo Precio**, Comparativo

**Proyección anual:** $2.59M en 2 meses → ~$8.7M anuales, ~$1.4M utilidad bruta

### 2.13 Detalle de Artículos Vendidos — Datos de Proveedores EXPUESTOS

**Columnas que exponen datos sensibles:**

| Columna | Datos expuestos |
|---------|-----------------|
| %Desc. | Porcentaje de descuento aplicado (todos 0% hoy) |
| Autorizado por | Quién autorizó el descuento (mecanismo existe) |
| **Proveedor** | **NOMBRE COMPLETO del proveedor — visible para vendedores** |
| Costo | Costo del producto |
| Utilidad | Ganancia por línea |
| % Utilidad | Margen porcentual |

**Proveedores reales descubiertos en las ventas del día:**

| Proveedor | Productos |
|-----------|-----------|
| BRANDS COLLECTION B.V. | Johnnie Walker (Red, Black, Ruby, Gold), Jack Daniels (Honey Mini, Apple Mini) |
| GLOBAL WINE & SPIRIT, INC | Amaretto Disaronno, Vodka Finlandia |
| MOTTA INTERNACIONAL, S.A. | Tequila Maestro Dobel, Vinos Casillero del Diablo (Sauvignon, Malbec, Merlot, Carmenere), Cointreau, Vino El Enemigo |
| P.B.G, S.A. | Cointreau Mini |
| GLOBAL BRANDS, S.A. | Whisky Nelson Spirit |
| DISTRIBUTION SPIRITS COMPANY, LLC | Aguardiente Amarillo de Manzanares |
| MAYLIN TRADE, S.A. | Jagermeister |

**PROBLEMA GRAVE:** Los vendedores pueden ver exactamente qué proveedor suministra cada producto. Esto les permite manipular la cadena de suministro o filtrar información a la competencia.

### 2.14 Procesos Especiales

**Submódulos de excepción/corrección (no explorados individualmente, pero nombres reveladores):**

| Submódulo | Función | En nueva plataforma |
|-----------|---------|---------------------|
| Desaprobar Pedidos | Reversar aprobación si hay error o cambio | Botón dentro del detalle del pedido aprobado |
| Reversar Factura | Anular factura (genera nota de crédito) | Botón dentro del detalle de la factura |
| Emitir Factura Electrónica | Transmitir a DGI manualmente | Automático al generar factura |
| Documentos Emitidos | Consultar FEs transmitidas | Pestaña dentro de Facturas |

### 2.15 Reportes de Ventas — COMPLETAMENTE VACÍO

La pantalla "Reportes de Ventas" muestra una tabla con columnas Nombre y Codigo pero CERO reportes configurados. Nunca se implementaron reportes para el módulo de Ventas.

### 2.16 DMC - Movimiento Comercial — NUNCA TERMINADO

El submódulo de DMC dentro de Ventas fue iniciado pero nunca completado. Ariel (Tráfico) reportó que intentaron implementarlo pero no se terminó. Actualmente todo se hace manualmente fuera del sistema.

**Lo que Ariel necesita (confirmado por entrevista y por esta exploración):** Que el sistema pre-llene automáticamente los campos del DMC desde la factura + lista de empaque. NO integración directa con el sistema del gobierno, sino que la información que el DMC pide ya esté consolidada y lista para copiar/exportar.

---

## 3. PROBLEMAS CRÍTICOS QUE EL MÓDULO DE VENTAS DEBE RESOLVER

### 3.1 Fuga de datos — Problema #1 de Javier

**Estado actual en Dynamo:** TODO visible para TODOS:
- Consulta de Facturas → Costo, Utilidad, % Util
- Utilidad por Factura → Ventas, Costos, Utilidad por período
- Detalle de Artículos Vendidos → Proveedor, Costo, Utilidad, %
- Ventas x Vendedor → Costo, Utilidad, %, Venta Comisión
- Aprobación de Cotizaciones → Costo, % Utilidad (esto SÍ debe ser visible para el aprobador)

**Lo que Javier quiere:**
- Vendedores: CERO visibilidad de costos, proveedores, márgenes exactos
- Solo indicador binario: 🟢 Comisiona / 🔴 No comisiona (umbral 10%)
- Aprobadores: visibilidad COMPLETA (correcto — necesitan los datos para decidir)

### 3.2 Selección manual de nivel de precio

**Estado actual:** El vendedor abre un dropdown y selecciona manualmente el nivel A, B, C, D, o E. Esto permite:
- Darle a un cliente un nivel que no le corresponde
- Reverse-engineer el costo comparando niveles

**Solución:** Asignación automática basada en la configuración del cliente. Sin dropdown visible.

### 3.3 Pipeline abandonado / flujo inconsistente

**Estado actual:**
- La aprobación de cotizaciones lleva 7 años sin usarse
- Algunos pedidos se crean directamente sin cotización
- No hay visibilidad del estado global del pipeline

### 3.4 Modificaciones post-aprobación destructivas

**Estado actual (reportado por Ariel):** Si hay que cambiar algo después de aprobar:
1. Desaprobar pedido
2. Eliminar factura (si ya se generó)
3. Hacer los cambios
4. Re-aprobar
5. Re-facturar
6. Anular DMC (si ya se hizo)
7. Rehacer DMC desde cero

Todo el trabajo se pierde y se repite. Horas desperdiciadas.

### 3.5 Factura Electrónica como proceso manual separado

**Estado actual:** Después de generar la factura, hay que:
1. Abrir submódulo separado "Datos Factura Electrónica"
2. Llenar campos manualmente
3. Click "Emitir Documento"
4. Si falla, ir a otro submódulo "Documentos Emitidos" para verificar

Debería ser automático al generar la factura.

---

## 4. ESPECIFICACIÓN DE LA NUEVA PLATAFORMA — MÓDULO VENTAS B2B

### 4.1 Arquitectura del Módulo

```
VENTAS B2B
├── Dashboard de Ventas (vista principal)
│   ├── KPIs en tiempo real
│   ├── Pipeline visual
│   └── Acciones rápidas
├── Cotizaciones
│   ├── Lista de cotizaciones (con filtros y estados)
│   ├── Crear/Editar cotización
│   └── Detalle cotización (con acciones contextuales)
├── Pedidos
│   ├── Lista de pedidos (con filtros y estados)
│   ├── Crear pedido (desde cotización o directo)
│   └── Detalle pedido (con acciones contextuales)
├── Facturación
│   ├── Lista de facturas
│   ├── Generar factura (desde pedido aprobado)
│   ├── Detalle factura (con FE automática)
│   └── Notas de crédito / Reversiones
├── Devoluciones
│   ├── Lista de devoluciones
│   └── Crear devolución (desde factura)
└── Cola de Aprobaciones
    ├── Cotizaciones pendientes (si se reactiva)
    └── Pedidos pendientes
```

### 4.2 Dashboard de Ventas — Vista Principal del Vendedor

**Stat Cards (parte superior):**

| Card | Dato | Cálculo | Visible para |
|------|------|---------|--------------|
| Ventas del Mes | $1,467,093 | Suma de facturas del mes | Gerencia, Vendedores (solo sus propias) |
| Pipeline Activo | $222,953 | Pedidos aprobados pendientes de facturar | Todos |
| Cotizaciones Pendientes | 3 | Cotizaciones esperando aprobación | Todos |
| Margen del Mes | 16.54% | Utilidad / Ventas | **Solo Gerencia y Compras** |

**Pipeline Visual (centro):**
Barra horizontal tipo Kanban con las etapas y contadores:
```
BORRADOR (2) → COTIZADO (5) → PEDIDO (8) → APROBADO (3) → EMPACADO (1) → FACTURADO (12)
```

Click en cualquier etapa filtra la lista de abajo. Drag-and-drop NO aplica aquí — el flujo es secuencial y requiere acciones formales (aprobar, facturar, etc.).

**Lista de operaciones recientes (parte inferior):**
Tabla con las últimas cotizaciones, pedidos y facturas del vendedor. Columnas adaptadas al rol:

| Columna | Vendedor ve | Gerencia ve |
|---------|-------------|-------------|
| # Documento | ✓ | ✓ |
| Tipo | Cotización/Pedido/Factura | ✓ |
| Cliente | ✓ | ✓ |
| Fecha | ✓ | ✓ |
| Total | ✓ | ✓ |
| Estado | ✓ | ✓ |
| Vendedor | — | ✓ |
| Margen | **🟢/🔴 indicador solamente** | **% exacto** |
| Costo | ✗ NUNCA | ✓ |

### 4.3 Crear / Editar Cotización — Vista del Vendedor

**Layout de 2 columnas:**

**Columna izquierda — Datos del cliente:**

| Campo | Tipo | Comportamiento |
|-------|------|----------------|
| Cliente | Búsqueda inteligente | Autocompletado por nombre, código, o NIT. Al seleccionar, llena todo |
| Nombre | Auto | — |
| País | Auto | Del registro del cliente |
| Contacto | Auto | Teléfono, email del cliente |
| Condición de Pago | Auto | CREDITO (30/60/90 días) o CONTADO — viene del cliente |
| Crédito disponible | Auto | **Badge visual:** 🟢 "Disponible: $50,000" o 🔴 "Excede por $3,000" |
| Vendedor | Auto | El usuario logueado |

**Campo eliminado:** El dropdown "Precio" (nivel A-E) NO EXISTE en la nueva plataforma. El nivel se asigna automáticamente desde la configuración del cliente.

**Columna derecha — Metadata:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Cotización # | Auto | Secuencial |
| Fecha | Auto | Editable por gerencia |
| Vigencia | Selector | Días de validez (default: 15 días) — **NUEVO** |
| Referencia externa | Texto | PO del cliente, referencia — **NUEVO** |
| Notas internas | Texto | Solo visible internamente — **NUEVO** |
| Instrucciones de despacho | Texto | Se hereda al pedido y empaque |

**Tabla de líneas de producto:**

| Columna | Vendedor ve | Comportamiento |
|---------|-------------|----------------|
| Producto | Búsqueda inteligente | Por descripción (identificador principal de Evolution) |
| Descripción | Auto | Nombre completo del producto |
| Disponible | ✓ | Stock disponible actual |
| Cantidad | Input | Cajas a cotizar. **Bloquea si supera disponible** (con override de supervisor) |
| Precio | Input (con sugerencia) | El sistema sugiere el precio del nivel del cliente. Vendedor puede ajustar |
| **🟢/🔴** | **Indicador comisión** | En tiempo real: verde si el precio genera >10% margen, rojo si <10% |
| Último precio | Auto | Último precio vendido a ESTE cliente para ESTE producto — **EL REQUERIMIENTO #1 DE MARGARITA** |
| Total | Auto | = Cantidad × Precio |

**Funcionalidades de la tabla de líneas:**
- Reordenar líneas (drag-and-drop) — requerimiento de Margarita
- Insertar línea entre medio — requerimiento de Margarita
- Eliminar línea
- Duplicar línea
- Buscar y agregar múltiples productos a la vez

**Indicador de comisión (detalle técnico):**
```
Para cada línea:
  margen_real = (precio_vendedor - costo_producto) / precio_vendedor × 100
  
  Si margen_real >= 10%:
    Mostrar 🟢 "Comisiona"
  Si margen_real < 10%:
    Mostrar 🔴 "No comisiona"
  
  El vendedor VE el indicador.
  El vendedor NO VE el margen_real ni el costo_producto.
```

**Panel lateral de producto (al seleccionar un producto):**

| Dato | Vendedor ve | Notas |
|------|-------------|-------|
| Imagen | ✓ | Del repositorio propio |
| Existencia | ✓ | Stock actual |
| Disponible | ✓ | Después de separaciones |
| Por Llegar | ✓ | En tránsito |
| Peso x bulto | ✓ | Para logística |
| Cubicaje | ✓ | Para logística |
| Unidades x caja | ✓ | Referencia |
| Costo | ✗ NUNCA | — |
| Proveedor | ✗ NUNCA | — |
| Historial de precios a este cliente | ✓ | Últimas 5 ventas |

**Footer financiero:**

```
SUB-TOTAL: $5,839.00
+ GASTOS: $30.00 (editable — con detalle: flete $20, embalaje $10)
= TOTAL: $5,869.00
```

**Gastos adicionales:** Al hacer click en "Gastos" se abre modal para agregar cargos con concepto y monto. Se heredan al pedido y factura.

**Cubicaje y peso totales (panel logístico):**

| Dato | Valor | Notas |
|------|-------|-------|
| Total Bultos | 45 | Auto-calculado de las líneas |
| Peso Total | 387.5 kg | Suma de pesos |
| Cubicaje Total | 2.35 m³ / 83.0 ft³ | Suma de cubicajes |

**Botones de acción:**
- **Guardar Borrador** — Guarda sin enviar
- **Solicitar Aprobación** — Envía a la cola de aprobación (si la doble aprobación está activa)
- **Convertir a Pedido** — Si aprobación de cotización está desactivada, pasa directo a pedido
- **Exportar PDF** — Genera cotización exportable con imágenes para el cliente — requerimiento de Margarita
- **Duplicar** — Crear nueva cotización copiando esta — **NUEVO, ahorra tiempo**

### 4.4 Crear / Editar Pedido

**Dos formas de crear:**
1. **Desde cotización aprobada** — Click "Convertir a Pedido" en la cotización. Todos los datos se heredan.
2. **Directo (sin cotización)** — Formulario idéntico a cotización pero crea pedido directamente.

**Campos adicionales respecto a cotización:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Despacho | Dropdown | SALIDA, TRASPASO — define tipo de DMC |
| Fecha estimada despacho | Date picker | Para planificación de bodega y tráfico — **NUEVO** |
| Prioridad | Dropdown | Normal, Urgente — **NUEVO** |

**Efecto en inventario:** Al aprobar un pedido, las cantidades se marcan como "Separado" en inventario. El disponible se reduce. Si el disponible quedaría negativo, el sistema BLOQUEA (con override de supervisor).

**Botones adicionales respecto a cotización:**
- **Generar Lista de Empaque** — Dispara la preparación en bodega
- **Solicitar Compra** — Si no hay stock, enlaza directo a crear OC al proveedor
- **Ver Disponibilidad Futura** — Muestra qué hay por llegar — **NUEVO**

### 4.5 Cola de Aprobaciones — Vista del Aprobador

**Para quién:** Javier, Estelia (configurables por rol)

**Layout:** Tabla con todas las cotizaciones/pedidos pendientes de aprobación.

**Columnas (el aprobador VE TODO — es correcto):**

| Columna | Notas |
|---------|-------|
| Tipo | Cotización o Pedido |
| # Documento | Link al detalle |
| Fecha | Fecha de creación |
| Antigüedad | Días esperando aprobación — **badge rojo si >3 días** |
| Vendedor | Quién creó |
| Cliente | Nombre del cliente |
| Total | Monto total |
| **% Margen** | **Margen de la operación — el aprobador NECESITA esto** |
| Saldo Cliente | Deuda actual del cliente |
| Crédito Disponible | Cuánto crédito le queda |
| **Excede** | **🔴 Si el pedido supera el crédito disponible** |

**Detalle expandible (sin cambiar de pantalla):**
Al hacer click en una fila, se expande un panel inferior con:
- Todas las líneas del pedido/cotización
- Costo, precio, margen POR LÍNEA (solo visible para el aprobador)
- Existencia y disponible por producto
- Historial de compras del cliente (últimas 10)
- **Indicador "Bajo Precio"** — si alguna línea está debajo del umbral de comisión

**Botones de acción:**
- **Aprobar** — Aprueba y notifica al vendedor
- **Rechazar** — Con campo obligatorio de motivo
- **Solicitar Modificación** — Devuelve al vendedor con comentarios — **NUEVO**
- **Aprobar con Condición** — Aprueba pero marca condiciones (ej: "solo si paga anticipo") — **NUEVO**

**Notificaciones:**
- Al vendedor cuando su cotización/pedido es aprobado o rechazado
- Al aprobador cuando hay cotizaciones/pedidos pendientes >24 horas
- A gerencia si un pedido excede el crédito del cliente

### 4.6 Lista de Empaque — Vista de Bodega

**Para quién:** Personal de bodega (Celly, operarios)

**REGLA CRÍTICA:** La lista de empaque para bodega SOLO muestra:
- Número de pedido
- Nombre/marca del cliente
- Descripción del producto
- Cantidad de cajas
- Peso y cubicaje

**NUNCA muestra:** Precios, costos, márgenes, proveedores. Nada de información comercial.

**Mejoras respecto a Dynamo:**
- **Agrupación por código arancelario** — requerimiento de Ariel para el DMC
- **Auto-cálculo de bultos** — basado en las líneas del pedido
- **Soporte para despacho parcial** — si no hay todo el stock, despachar lo que hay y dejar el resto pendiente — **NUEVO**
- **Confirmación de preparación** — Bodega marca "Preparado" y el sistema notifica a Tráfico — **NUEVO**
- **Impresión de etiquetas** — Generar etiquetas para cada bulto con número, destino, contenido — **NUEVO**

### 4.7 Facturación

**Flujo simplificado:**
1. Pedido aprobado + Lista de empaque preparada
2. Click "Generar Factura" desde el pedido
3. El sistema llena TODOS los datos automáticamente
4. Revisión rápida + Click "Emitir"
5. Factura Electrónica se transmite AUTOMÁTICAMENTE a DGI
6. Se genera el documento tipo "Factura de Zona Franca"
7. Notificación a Tráfico para generar DMC

**Campos de la factura:**

| Campo | Origen | Notas |
|-------|--------|-------|
| Tipo de Factura | Auto | "Factura de Zona Franca" (basado en config de zona libre) |
| Cliente | Del pedido | — |
| Datos fiscales cliente | Del registro del cliente | NIT, país, dirección |
| Líneas de producto | Del pedido + empaque | — |
| Subtotal / Gastos / Total | Calculados | — |
| Forma de pago | Del cliente o editable | CONTADO / CREDITO |
| Sucursal | Config | 0000 |
| Punto de Facturación | Config | 003 |

**Factura Electrónica automática:**
- Se transmite al generar la factura (no es paso separado)
- Si falla la transmisión: se encola para reintento automático
- Se almacena el número de autorización de DGI
- Log de FEs emitidas disponible como pestaña dentro de Facturas

**Notas de Crédito / Reversiones:**
- Desde el detalle de una factura: botón "Crear Nota de Crédito"
- Requiere aprobación de gerencia
- Genera reverso en inventario (productos vuelven a "Disponible")
- Se transmite como FE (Nota de Crédito Electrónica)

### 4.8 Sistema de Comisiones

**Motor de comisiones (proceso interno, invisible para vendedores):**

```
Por cada línea de factura:
  costo_real = costo promedio ponderado del producto
  precio_venta = precio facturado
  margen = (precio_venta - costo_real) / precio_venta × 100
  
  Si margen >= 10%:
    venta_comisionable += precio_venta × cantidad
  Si margen < 10%:
    venta_no_comisionable += precio_venta × cantidad

Resumen por vendedor (período):
  Venta Total = venta_comisionable + venta_no_comisionable
  Base Comisión = venta_comisionable
  % del total que comisiona = venta_comisionable / Venta Total × 100
```

**Lo que VE el vendedor:**
- Su venta total del período
- Su "venta que comisiona" (sin saber por qué unos sí y otros no exactamente)
- Por línea en cotización: indicador 🟢/🔴 en tiempo real

**Lo que VE gerencia:**
- Todo lo anterior MÁS: costos, márgenes exactos, desglose por producto
- Reporte "Bajo Precio" — productos vendidos debajo del umbral
- Histórico de comisiones por vendedor

### 4.9 Motor de Precios

**Comportamiento del motor al crear cotización/pedido:**

```
1. Vendedor selecciona cliente
2. Sistema obtiene nivel_precio del cliente (A, B, C, D, o E)
3. Vendedor agrega producto
4. Sistema sugiere: precio_nivel[cliente.nivel] del producto
5. Vendedor puede modificar el precio (arriba o abajo)
6. Sistema calcula indicador de comisión en tiempo real
7. Si el precio está debajo del nivel E (mínimo absoluto):
   → Alerta: "Requiere aprobación especial"
   → Se marca la línea para revisión del aprobador
```

**Excepciones de precio controladas:**
- Vendedor puede poner un precio diferente al sugerido
- Si está dentro del rango A-E: se permite sin aprobación
- Si está debajo de E: requiere aprobación gerencial + motivo
- Todas las excepciones quedan registradas con: quién, cuándo, motivo, precio original vs. precio final

**Último precio vendido:**
- Al seleccionar cliente + producto, el sistema muestra automáticamente:
  - Último precio vendido a ESTE cliente
  - Fecha de la última venta
  - Cantidad de la última venta
- Esto resuelve el dolor #1 de Margarita

### 4.10 Enmiendas Post-Aprobación

**Problema actual:** Destruir → Reconstruir todo el pipeline

**Solución — Sistema de enmiendas:**

| Tipo de cambio | Clasificación | Proceso |
|----------------|---------------|---------|
| Cambio de cantidad (+/-20%) | Menor | Aprobación rápida del supervisor (1 click) |
| Agregar producto nuevo | Menor | Aprobación rápida |
| Cambiar precio de una línea | Mayor | Re-aprobación completa |
| Eliminar >30% de las líneas | Mayor | Re-aprobación completa |
| Cambiar cliente | Crítico | Cancelar y crear nuevo pedido |

**Registro de enmiendas:**
Cada enmienda queda registrada con:
- Qué se cambió (valor anterior → valor nuevo)
- Quién solicitó el cambio
- Quién aprobó
- Fecha y hora
- Motivo

**Efecto en documentos downstream:**
- Si la factura ya se generó: se crea nota de crédito + nueva factura
- Si la lista de empaque ya se generó: se actualiza automáticamente
- Si el DMC ya se generó: notificación a Tráfico para actualizar (no se destruye)

### 4.11 Exportación de Cotización para el Cliente

**Requerimiento de Margarita:** PDF ligero con imágenes de producto para enviar al cliente.

**Contenido del PDF exportable:**

| Sección | Contenido |
|---------|-----------|
| Header | Logo Evolution, datos de contacto, fecha, # cotización |
| Cliente | Nombre, país, contacto |
| Tabla de productos | Imagen thumbnail, descripción, cantidad, precio, total |
| Datos logísticos | Peso total, cubicaje total, bultos estimados |
| Condiciones | Forma de pago, vigencia, condiciones de entrega |
| Footer | Firma digital, nota legal |

**Lo que NO incluye:** Costos, márgenes, proveedores, niveles de precio internos.

### 4.12 Pre-llenado para DMC (Integración con Tráfico)

**Lo que Ariel necesita del módulo de ventas (confirmado en esta sesión):**

Al generar una factura, el sistema automáticamente prepara los datos que el DMC requiere:
- Productos agrupados por código arancelario
- Cantidades por grupo arancelario
- Pesos netos y brutos por grupo
- Cubicaje por grupo
- Datos del consignatario (del cliente)
- Datos del embarcador (de Evolution)
- Número de factura y fecha
- País destino

Estos datos NO se envían directamente al sistema del gobierno. Se consolidan en una vista/reporte dentro de la plataforma para que Ariel pueda copiar/exportar y llenar el DMC gubernamental fácilmente. Esto reduce su trabajo de 15-20 minutos por DMC a 2-3 minutos.

---

## 5. CONSOLIDACIÓN DE DYNAMO → NUEVA PLATAFORMA

### Mapa completo de submódulos:

| Dynamo (submódulo) | Nueva Plataforma (vista) | Mejora |
|--------------------|--------------------------|--------|
| Gestión de Ventas (PdV) | Dashboard de Ventas | Pipeline visual + KPIs + acciones rápidas |
| Admin. Cotizaciones | Crear/Editar Cotización | Indicador comisión, último precio, reorden líneas, exportar PDF |
| Aprob. Cotizaciones | Cola de Aprobaciones | Alerta antigüedad, aprobar con condición, solicitar modificación |
| Admin. Pedidos | Crear/Editar Pedido | Reserva automática inventario, despacho parcial, fecha estimada |
| Aprob. Pedidos | Cola de Aprobaciones (misma vista) | Unificada con aprobación de cotizaciones |
| Lista de Empaque | Lista de Empaque (Bodega) | Agrupada por arancelaria, sin datos comerciales, etiquetas |
| Generar Factura | Facturación | 1 click, FE automática, "Factura de Zona Franca" |
| Emitir FE | Automático | Integrado en facturación, no es paso separado |
| Documentos Emitidos | Pestaña en Facturas | Filtro dentro de la misma vista |
| Consulta Facturas | Lista de Facturas | Filtros dinámicos, datos por rol |
| Consulta Utilidad | Dashboard Gerencia / Reportes | Datos solo para roles autorizados |
| Artículos Vendidos | Reportes | Sin datos sensibles para vendedores |
| Detalle Artículos | Reportes | Sin proveedor para vendedores |
| Ventas x Vendedor | Pestaña en Dashboard | Vendedor solo ve sus propias métricas |
| Pedidos Reservados | Pipeline visual | Estado en tiempo real del pipeline |
| Devoluciones | Sección Devoluciones | Desde factura con aprobación |
| Análisis de Ventas | Reportes | Dashboard con gráficos interactivos |
| Reportes POS (8) | Reportes | Filtros dinámicos en vez de 8 pantallas separadas |
| Reportes Ventas | Reportes | Configurados (hoy están vacíos) |
| Desaprobar Pedidos | Botón contextual | Dentro del detalle del pedido |
| Reversar Factura | Botón contextual | Dentro del detalle de la factura |
| DMC | Módulo Tráfico (Doc 07) | Pre-llenado automático desde factura |
| Cobros Tarjetas (PdV) | → Doc 06 (B2C) | No aplica a B2B |
| Cierre de Caja (PdV) | → Doc 06 (B2C) | Dormido desde 2020 |
| Cobros por Caja (PdV) | → Doc 06 (B2C) | No aplica a B2B |

---

## 6. ROLES Y VISIBILIDAD EN EL MÓDULO DE VENTAS

### Matriz de visibilidad por pantalla:

| Pantalla | Vendedor | Aprobador (Javier/Estelia) | Compras (Celly) | Bodega | Tráfico (Ariel) |
|----------|----------|---------------------------|-----------------|--------|-----------------|
| Dashboard | Sus operaciones | Todo | Todo | No accede | No accede |
| Crear Cotización | ✓ (sin costos) | ✓ (con costos) | Solo lectura | No accede | No accede |
| Cola Aprobaciones | Solo estado de las suyas | ✓ COMPLETA | Solo lectura | No accede | No accede |
| Pedidos | ✓ (sin costos) | ✓ (con costos) | Solo lectura | Solo empaque | Solo para DMC |
| Lista Empaque | No accede | ✓ | No accede | ✓ (sin precios ni costos) | ✓ (para DMC) |
| Facturación | ✓ (generar) | ✓ (todo) | Solo lectura | No accede | ✓ (datos para DMC) |
| Comisiones | Solo sus métricas | Todo | Todo | No accede | No accede |

### Qué ve el vendedor vs. qué ve gerencia en una misma factura:

| Dato | Vendedor | Gerencia |
|------|----------|----------|
| # Factura | ✓ | ✓ |
| Cliente | ✓ | ✓ |
| Productos y cantidades | ✓ | ✓ |
| Precios de venta | ✓ | ✓ |
| Total | ✓ | ✓ |
| **Costo por producto** | ✗ NUNCA | ✓ |
| **Proveedor** | ✗ NUNCA | ✓ |
| **Margen % por línea** | 🟢/🔴 solamente | % exacto |
| **Utilidad total** | ✗ | ✓ |
| **Venta que comisiona** | Monto total | Desglose por línea |

---

## 7. DATOS REALES PARA MOCKEAR

### Clientes activos descubiertos:

| Código | Nombre | País | Tipo |
|--------|--------|------|------|
| CL-07 | MARIA DEL MAR PEREZ SV | El Salvador | CREDITO |
| CL-509 | SULTAN WHOLESALE | Desconocido | CREDITO |
| CL-077 | MEDIMEX, S.A. | Desconocido | CREDITO |
| CL-896 | INVERSIONES DISCARIBBEAN SAS | Desconocido | CONTADO |
| CL-979 | GIACOMO PAOLO LECCESE TURCONI | Desconocido | CONTADO |
| CL-032 | PONCHO PLACE | Colombia | CONTADO |
| — | DT LICORES | Desconocido | Desconocido |
| — | BRAND DISTRIBUIDOR CURACAO | Curazao | Recurrente (compra lotes completos) |
| — | GUILLERMO SOSA VELEZ | Desconocido | — |
| — | FRANCISCO QUINTERO | Desconocido | — |
| — | MERCANSA | Desconocido | — |
| — | LEONILDE SANCHEZ PEÑA | Desconocido | — |
| — | FLOCK-COMERCIO DE BEBIDAS | Desconocido | — |

### Vendedores activos:

| Código | Nombre | Notas |
|--------|--------|-------|
| 03 | MARGARITA MORELOS | Vendedora principal. Solo ella facturó hoy |
| — | ARNOLD | Segundo vendedor |
| — | JAVIER LANGE | Dueño, también vende directamente |

### Métricas reales para mockear:

| Métrica | Valor |
|---------|-------|
| Ingresos anuales (proyección) | ~$8.7M |
| Margen promedio YTD | 16.45% |
| Margen promedio mes | 16.54% |
| Pipeline activo | $222,953 |
| Facturas del día (ejemplo) | 3 facturas, $11,566 |
| % de venta que comisiona (ejemplo) | 60.7% |
| Umbral de comisión | 10% margen |

---

## 8. PREGUNTAS PENDIENTES PARA JAVIER

| # | Pregunta | Por qué importa |
|---|----------|-----------------|
| 1 | ¿Reactivar la doble aprobación (cotización + pedido) o mantener aprobación única (solo pedido)? | Abandonada desde 2019. Define el flujo |
| 2 | ¿Quiénes aprueban exactamente? ¿Solo Javier y Estelia, o también Jackie? | Define roles de aprobador |
| 3 | ¿El botón F8 "Ver Precios" en cotizaciones muestra todos los niveles o solo el del cliente? | Define si es una fuga de datos adicional |
| 4 | ¿El umbral de comisión (10%) debe ser configurable o es fijo? | Define si es parámetro de sistema o hardcoded |
| 5 | ¿Cómo se calcula la comisión exacta? ¿% de la venta comisionable? ¿Monto fijo? | No sabemos la fórmula de pago de comisión |
| 6 | ¿Qué pasa con los pedidos que llevan >30 días sin facturar (como el 006483)? | ¿Se cancelan automáticamente? ¿Alerta? |
| 7 | ¿El campo "Gastos" en las facturas siempre es flete, o puede ser otros conceptos? | Define el catálogo de gastos adicionales |
| 8 | ¿Todos los clientes B2B son extranjeros (tipo "Factura de Zona Franca") o hay nacionales? | Define tipos de factura |
| 9 | ¿Los descuentos (%Desc. con "Autorizado por") se usan actualmente? | Todos en 0% hoy — ¿mecanismo activo o muerto? |
| 10 | ¿El sistema actual calcula la comisión solo al facturar o también al cobrar? | Define trigger del cálculo |

---

## FIN DEL DOCUMENTO 05

Este documento cubre la totalidad del flujo de ventas B2B: desde la cotización inicial hasta la factura electrónica, incluyendo el sistema de comisiones, el motor de precios, las aprobaciones, la lista de empaque, y la integración con tráfico.

Los siguientes documentos cubrirán:
- **Documento 06:** Módulo Punto de Venta B2C (actualmente roto)
- **Documento 07:** Módulo Tráfico y Documentación (DMC, BL, Certificados)
- **Documento 08:** Módulo Clientes y Cobranza
- **Documento 09:** Módulo Contabilidad
- **Documento 10:** Módulo Configuración y Administración
- **Documento 11:** Módulo Reportes y Analítica
