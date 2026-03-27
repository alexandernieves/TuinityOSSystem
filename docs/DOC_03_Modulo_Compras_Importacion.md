# DOCUMENTO 03 — MÓDULO: COMPRAS E IMPORTACIÓN

## Contexto
Este documento especifica el módulo de Compras e Importación para la nueva plataforma de Evolution Zona Libre. Es el segundo módulo a construir porque sin compras no entra mercancía, y sin mercancía no hay inventario.

**Prerequisito:** Leer Documento 01 (Introducción) y Documento 02 (Productos) antes de este documento.

---

## 1. QUÉ REEMPLAZA ESTE MÓDULO EN DYNAMO

En Dynamo, las compras están dentro del módulo de Inventario como el submódulo "Registro de Compras" con 4 opciones:

| Submódulo Dynamo | Qué hace | Estado | Explorado |
|------------------|----------|--------|-----------|
| Registro de Órdenes de Compra | Crear y ver órdenes de compra. También tiene la herramienta de importación desde Excel | Funciona (Excel roto) | ✅ Completo |
| Consulta de Orden | Buscar y filtrar órdenes existentes | Funciona | ✅ (es un filtro) |
| Consulta de Costos por Entrada | Ver historial de costos FOB, %Gastos, CIF por producto y por entrada | Funciona | ✅ Completo |
| Consulta de Entradas | Ver historial de mercancía recibida | CRASHEADO — no funciona | ❌ Roto |

Adicionalmente, la herramienta de importación masiva desde Excel está dentro de Registro de Órdenes pero está ROTA (error "Excel no está instalado").

En la nueva plataforma, todo esto se consolida en un solo módulo: **COMPRAS E IMPORTACIÓN**, que además agrega funcionalidad que Dynamo nunca tuvo (importación masiva funcional, recepción parcial, cálculo automático de costo promedio ponderado) y resuelve lo que está roto (Consulta de Entradas).

---

## 2. LO QUE DYNAMO HACE HOY — ANÁLISIS COMPLETO

### 2.1 Registro de Órdenes de Compra — Pantalla principal

**Header del documento:**

| Campo | Tipo | Valor ejemplo | Notas |
|-------|------|---------------|-------|
| No. de Documento | Texto (auto) | OC-03566 | Formato: OC-XXXXX secuencial |
| No. de Factura | Texto | TD002038 | Número de factura del proveedor. Se llena cuando la orden pasa a factura |
| Fecha | Fecha | 06/02/2026 | Fecha de creación |
| Fecha Llegada | Fecha | 06/02/2026 | Fecha de arribo de mercancía |
| Proveedor + | Dropdown | TRIPLE DOUBLE TRADING LLC | Con botón + para crear nuevo proveedor inline |
| Bodega | Dropdown | BODEGA | Bodega destino de la mercancía |
| Status | Texto (rojo) | Factura | Status del documento. Cambia según el flujo: Orden → Factura → Entrada |

**Tabla de líneas de producto:**

| Columna | Tipo | Notas |
|---------|------|-------|
| Referencia | Texto | Referencia del producto. Se busca con F5 o se crea con F6 |
| Descripción | Texto | Se auto-llena al seleccionar referencia |
| #Orden | Texto | Número de orden (se llena al cargar desde orden) |
| Cantidad | Número | Cajas ordenadas |
| Costo | Número | Precio FOB unitario por caja |
| Total | Calculado | = Cantidad × Costo |

**Atajos de teclado:**
- F3: Eliminar línea
- F5: Buscar referencia existente
- F6: Crear referencia nueva (producto nuevo)
- Esc: Guardar

**Pie del documento:**

| Campo | Valor ejemplo | Notas |
|-------|---------------|-------|
| SUB-TOTAL | $214,194.00 | Suma de todos los totales de línea |
| IMPUESTOS | (vacío) | Siempre vacío en ZL — impuestos mínimos o nulos |
| GASTOS | (vacío) | Vacío aquí. Los gastos de internación se registran en otro lado (Consulta de Costos por Entrada) |
| TOTAL | $214,194.00 | = Sub-total + Impuestos + Gastos |

También tiene:
- Área de imagen (vacía — probablemente para adjuntar factura escaneada del proveedor)
- Campo de Comentarios (texto libre)
- Botones: Guardar, Cancelar
- Ícono de Excel en toolbar (ROTO — "Excel no está instalado")
- Botón "Actualizar"

### 2.2 Modal de creación de documento nuevo

Al crear nuevo documento, aparece modal con 3 opciones:

| Opción | Ícono | Para qué sirve |
|--------|-------|----------------|
| Orden | Amarillo (resaltado) | Crear orden de compra nueva desde cero |
| Factura | Azul | Crear factura de compra directa SIN orden previa. Para cuando la mercancía llega sin orden formal |
| Factura — Cargar Registro de la Orden | Azul | Convertir una orden existente en factura. Este es el flujo normal: la orden se hizo, la mercancía llegó, ahora se recibe |

**Flujo normal confirmado de 2 pasos:**
```
PASO 1: Crear Orden de Compra (OC-XXXXX)
    → Status: "Orden"
    → Mercancía queda como "Por Llegar" en inventario

PASO 2: Crear Factura cargando desde Orden existente
    → Status cambia a: "Factura"
    → Mercancía pasa de "Por Llegar" a "Existencia" en inventario
```

### 2.3 Herramienta de importación desde Excel (ROTA)

Dynamo intentó implementar importación masiva. La pantalla existe pero no funciona.

**Lo que muestra:**
- Botón "Buscar archivo Excel" (arriba izquierda)
- Dropdown "Desde un Documento" con 7 opciones: Orden de Compra, Ajuste, Transferencia, Cotización, Pedido, Factura, Recuperar Pedido
- Tabla con solo 3 columnas: #, Referencia, Cantidad
- Botón "Importar" (verde)
- Botón "Cancelar"
- Botón "Abrir Plantilla" (ícono Excel — abriría template con formato esperado)
- Filtros: OK (bandera verde), Error (bandera roja), Todos
- Contadores abajo: "Total de Registro", "OK", "Error"

**Limitaciones (aunque funcionara):**
- Solo importa 3 campos: referencia y cantidad. No precio, no descripción, no nada más
- La referencia tiene que existir previamente en el catálogo
- No hay mapeo de columnas — formato rígido

### 2.4 Consulta de Costos por Entrada — DESCUBRIMIENTO CRÍTICO

Esta pantalla resuelve el misterio del cálculo FOB → CIF.

**Header (datos del producto seleccionado):**

| Campo | Descripción |
|-------|-------------|
| Referencia | Referencia del producto |
| Descripción | Descripción completa |
| Empaque | Presentación/empaque |
| Ultimo Costo | Último costo registrado (CIF) |
| Existencia | Stock actual |

**Tabla de historial de costos por entrada:**

| Columna | Descripción | Importancia |
|---------|-------------|-------------|
| Documento | Número de documento interno | Trazabilidad |
| Orden | Número de orden de compra asociada | Vincular con OC |
| Factura | Número de factura del proveedor | Trazabilidad |
| Fecha | Fecha de la entrada | Cronología |
| Cantidad | Cantidad recibida en esa entrada | Para cálculo ponderado |
| **Costo FOB** | Precio FOB unitario de esa entrada | **Precio del proveedor** |
| **%Gastos** | Porcentaje de gastos de internación | **Flete + seguro + handling como % sobre FOB** |
| **Costo CIF** | Costo CIF calculado | **= FOB × (1 + %Gastos/100)** |
| Proveedor | Nombre del proveedor | Referencia |
| Status | Estado del documento | Orden / Factura / Entrada |

**Fórmula confirmada:**
```
Costo CIF = Costo FOB × (1 + %Gastos / 100)

Ejemplo: Si FOB = $73.00 y %Gastos = 15%
CIF = $73.00 × (1 + 0.15) = $73.00 × 1.15 = $83.95
```

**Filtros de status abajo:**
- Orden (azul)
- Factura (azul)
- Entrada (azul)
- Todos (azul)

**Botón "Ver Documento"** — abre el documento completo asociado.

**Descubrimiento importante:** El %Gastos es un ÚNICO porcentaje que engloba todo (flete, seguro, handling). No es un desglose línea por línea de cada gasto. Esto simplifica la implementación pero limita la visibilidad de costos individuales.

### 2.5 Consulta de Costos por Entrada — Vista de búsqueda de productos

Al entrar al módulo, muestra una lista de productos buscables:

| Columna | Descripción |
|---------|-------------|
| Referencia | Referencia del producto (formato corto: CNREM081, GREY3L, VEU00760) |
| Descripción | Descripción completa del producto |
| Código Barra | Si tiene |
| Existencia en Bodega | Stock actual |
| Disponible | Stock disponible |
| Precio | Precio A (visible para TODOS — problema de seguridad) |
| Status | A = Activo |

**Filtros:**
- Filtro de Existencia: Excluir Cero / Incluir Cero (radio buttons)
- Filtro de Status: Excluir Inactivos / Incluir Inactivos (radio buttons)
- Checkbox "Búsqueda Continua" — busca mientras escribes

**Fórmula visible abajo a la derecha:** "Disponible = Existencia + Por Llegar - Separado"

**Productos nuevos descubiertos en esta vista:**

| Referencia | Descripción | Existencia | Disponible | Precio A |
|-----------|-------------|-----------|-----------|---------|
| ACUE2014 | VASO CUERVO SHOT-GLASS 144X1.5OZ | 4 | 4 | $0.00 |
| CNREM081 | COGNAC REMY MARTIN VSOP MINI 120X50ML 40% | 0 | 5 | $303.00 |
| DONJCE | TEQUILA DON JULIO CENIZO 12X700ML | 0 | 4 | $0.00 |
| EJG004-1 | VINO BAREFOOT PINOT NOIR 12.5% 12X750ML | 9 | 9 | $59.00 |
| EJG062 | VINO BAREFOOT PINK MOSCATO 12/750ML 12.5% | 8 | 8 | $52.00 |
| EJG064 | VINO BAREFOOT CHARDONNAY 12X750ML 13.5% | 1 | 1 | $59.00 |
| GREY3L | VODKA GREY GOOSE 2X3L 40% | 0 | 5 | $0.00 |
| GREY4.5L | VODKA GREY GROOSE 1X4.5L 40% | 0 | 5 | $0.00 |
| LBER00753 | VINO BERONIA CRIANZA 12X750ML 13.5%VOL | 10 | 10 | $83.00 |
| TEQCD | TEQUILA CASA DRANGONES AÑEJO GB 3X750ML | 0 | 3 | $0.00 |
| V-EJG051 | VINO CARLO ROSSI RED 11.5% 4X3LT | 4 | 4 | $45.00 |
| VELV54521 | RON VELVET BLANCO 12X1000ML 38%VOL | 1 | 1 | $42.00 |
| VEU00760 | CHAMPAÑA VEUVE CLICQUOT ROSE NK 6X750ML | 3 | 3 | $305.00 |

### 2.6 Consulta de Entradas — CRASHEADO

Este submódulo NO funciona en Dynamo. Arroja error al intentar entrar. Debería mostrar un historial de toda la mercancía recibida (entradas a bodega), pero nadie puede accederlo.

**Funcionalidad que debería tener (y que construimos nosotros):** Historial completo de todas las recepciones de mercancía, filtrable por fecha, proveedor, producto, bodega. Es esencialmente un log de "qué entró, cuándo, de quién, a qué costo".

---

## 3. PROBLEMAS DETECTADOS EN DYNAMO QUE LA NUEVA PLATAFORMA DEBE RESOLVER

| # | Problema | Evidencia | Solución en nueva plataforma |
|---|----------|-----------|------------------------------|
| 1 | Importación desde Excel ROTA | Botón existe pero da error "Excel no está instalado". Aunque funcionara, solo importa referencia y cantidad — sin precio, sin descripción | Importación masiva real con mapeo flexible de columnas, preview, validación, y soporte para crear productos nuevos sobre la marcha |
| 2 | Carga manual producto por producto | Celly teclea 40 productos uno por uno cuando llega un embarque. Horas de trabajo y errores | Importación masiva como flujo principal. Manual como alternativa, no como única opción |
| 3 | Consulta de Entradas crasheado | No se puede consultar historial de mercancía recibida. Módulo completamente inoperativo | Historial de entradas funcional con filtros por fecha, proveedor, producto, bodega |
| 4 | Gastos de internación como porcentaje único | %Gastos engloba todo sin desglose. No se puede ver cuánto fue flete vs seguro vs handling | Opción de desglose: %Gastos total como opción rápida + desglose detallado como opción avanzada |
| 5 | Costos visibles en Consulta de Costos por Entrada | La columna "Precio" es visible para cualquiera que entre | Control de acceso — Consulta de Costos solo para Gerencia, Compras, Contabilidad |
| 6 | Sin costo promedio ponderado automático | Al entrar mercancía nueva a diferente precio, no recalcula automáticamente | Cálculo automático al confirmar recepción |
| 7 | Sin recepción parcial | Si el embarque llega incompleto, no hay mecanismo claro para recibir parcialmente | Flujo de recepción parcial con tracking de lo pendiente |
| 8 | Sin comparativo de impacto | Cuando cambia el costo, no se ve cómo afecta márgenes y precios | Panel de impacto: costo anterior vs nuevo, efecto en cada nivel de precio, efecto en margen |
| 9 | Formatos variables de proveedores | Cada proveedor manda facturas en formato diferente. Algunos ocultan detalles intencionalmente | Mapeo flexible de columnas al importar. Plantillas guardadas por proveedor |
| 10 | Sin vinculación factura proveedor ↔ orden | El campo "No. de Factura" existe pero la vinculación es manual | Vinculación automática: al crear factura desde orden, se hereda toda la información |

---

## 4. ESPECIFICACIÓN DEL MÓDULO COMPRAS EN LA NUEVA PLATAFORMA

### 4.1 Pantalla principal: Lista de Órdenes de Compra

**Header del módulo:**
- Título: "Compras"
- Botón principal: "+ Nueva Orden de Compra"
- Botón secundario: "Importar desde Excel" (ícono upload)

**Stat cards:**

| Tarjeta | Qué muestra | Color |
|---------|-------------|-------|
| Órdenes Activas | Órdenes creadas pendientes de recibir mercancía | Azul |
| Mercancía en Tránsito | Total de cajas/unidades con status "Por Llegar" | Naranja |
| Recibidas este mes | Órdenes completadas (facturadas) en el mes actual | Verde |
| Valor en tránsito | Valor total FOB de mercancía pendiente | Azul oscuro |

**Filtros rápidos (badges):**
- Todas
- Pendientes (status Orden — mercancía no ha llegado)
- En recepción (parcialmente recibidas)
- Completadas (toda la mercancía recibida)
- Este mes / Últimos 3 meses / Este año

**Filtros avanzados:**
- Proveedor (dropdown)
- Rango de fechas
- Bodega destino

**Tabla principal:**

| Columna | Notas |
|---------|-------|
| No. Orden | Formato: OC-XXXXX. Click → abre detalle |
| Fecha | Fecha de creación |
| Proveedor | Nombre del proveedor |
| No. Factura Proveedor | Referencia del proveedor |
| Productos | Cantidad de líneas de producto |
| Total FOB | Valor total de la orden en FOB |
| %Gastos | Porcentaje de gastos de internación |
| Total CIF | Valor total aterrizado (si ya se calculó) |
| Status | Badge: Orden (azul), Parcial (amarillo), Recibida (verde), Cancelada (rojo) |
| Fecha llegada | Fecha estimada o real de arribo |

**Acciones por fila:**
- Click → detalle de la orden
- Menú ⋮: Recibir mercancía, Editar, Duplicar, Cancelar, Imprimir

### 4.2 Pantalla: Detalle de Orden de Compra

**Header:**
- "← Volver a Compras"
- No. Orden: OC-03566 (grande)
- Status badge: Orden / Parcial / Recibida / Cancelada
- Fecha de creación
- Botones: "Recibir Mercancía" (verde, principal), "Editar", "Imprimir", menú ⋮

**Sección superior — Datos del documento (2 columnas):**

| Campo | Columna izquierda | Campo | Columna derecha |
|-------|------------------|-------|-----------------|
| No. de Orden | OC-03566 (auto) | Proveedor | TRIPLE DOUBLE TRADING LLC |
| No. de Factura Proveedor | TD002038 | Bodega destino | BODEGA |
| Fecha de creación | 06/02/2026 | Fecha llegada estimada | 06/02/2026 |
| Comentarios | (texto libre) | Adjuntos | Upload de factura/proforma del proveedor (imagen/PDF) |

**Tabla de líneas de producto:**

| Columna | Notas |
|---------|-------|
| # | Número de línea |
| Referencia | Código del producto |
| Descripción | Auto-completado. Columna más ancha |
| Cantidad Ordenada | Lo que se pidió |
| Cantidad Recibida | Lo que ya llegó (para recepción parcial). Empieza en 0 |
| Pendiente | = Ordenada - Recibida. Se resalta si > 0 |
| Costo FOB | Precio unitario FOB |
| Total FOB | = Cantidad × Costo FOB |

**Sección de costos (SOLO visible para Gerencia/Compras/Contabilidad):**

| Campo | Valor ejemplo | Notas |
|-------|---------------|-------|
| Sub-Total FOB | $214,194.00 | Suma de todos los totales de línea |
| %Gastos de internación | ___% | Campo editable. Porcentaje total de gastos |
| Desglose de gastos (opcional) | | Para quien quiera detallar |
| — Flete marítimo | $_____ | Opcional |
| — Seguro | $_____ | Opcional |
| — Handling/Almacenamiento | $_____ | Opcional |
| — Otros gastos | $_____ | Opcional |
| Total Gastos | $_____ | Calculado del % o de la suma del desglose |
| **TOTAL CIF** | **$_____ ** | **= FOB + Gastos. Este es el costo real aterrizado** |

**Nota sobre %Gastos:**
Dynamo usa un solo %Gastos. La nueva plataforma ofrece DOS opciones:
- **Modo rápido:** ingresar un solo %Gastos (como Dynamo). El sistema calcula CIF automáticamente
- **Modo detallado:** desglosar flete, seguro, handling por separado. El sistema suma y calcula el %Gastos equivalente

Esto respeta cómo trabajan hoy (modo rápido) pero permite más detalle cuando lo necesiten (modo detallado).

### 4.3 Flujo: Crear Nueva Orden de Compra

**Paso 1 — Datos generales:**
- Seleccionar proveedor (dropdown con búsqueda + opción crear nuevo)
- Seleccionar bodega destino
- Ingresar No. de Factura del proveedor (opcional al crear, obligatorio al recibir)
- Fecha llegada estimada (opcional)

**Paso 2 — Agregar productos:**

Dos formas de agregar productos a la orden:

**Forma A: Manual (como Dynamo pero mejorado)**
- Campo de búsqueda con autocompletado (la "lista automática" que Celly pidió conservar)
- Busca por descripción, referencia, o código de barras
- Al seleccionar producto, se agrega línea a la tabla
- Ingresar cantidad y costo FOB
- Si el producto no existe: botón "Crear producto nuevo" que abre modal rápido sin salir de la orden

**Forma B: Importación masiva desde Excel (NUEVA — lo que Dynamo no pudo hacer)**
- Click "Importar desde Excel"
- Upload de archivo (.xlsx, .csv)
- Pantalla de mapeo de columnas:
  ```
  Columna A del archivo → ¿Qué campo es? [Descripción ▾]
  Columna B del archivo → ¿Qué campo es? [Cantidad ▾]
  Columna C del archivo → ¿Qué campo es? [Costo FOB ▾]
  Columna D del archivo → ¿Qué campo es? [Referencia ▾]
  ...
  ```
- **Plantillas por proveedor:** guardar el mapeo para cada proveedor. La próxima vez que importes desde TRIPLE DOUBLE, el sistema ya sabe qué columna es qué
- Preview de las primeras 10 líneas para verificar
- Detección automática: "5 productos coinciden con el catálogo, 2 no se encontraron"
- Para productos no encontrados: opción de crearlos en el acto o saltar
- Confirmar → todas las líneas se agregan a la orden de golpe

**Paso 3 — Guardar:**
- Validar que hay al menos 1 línea de producto
- Validar que todas las líneas tienen cantidad > 0
- Guardar → genera No. de Orden (OC-XXXXX)
- Status: "Orden"
- Productos se marcan como "Por Llegar" en inventario

### 4.4 Flujo: Recibir Mercancía (Orden → Factura/Entrada)

Este flujo se activa cuando la mercancía llega físicamente a bodega.

**Desde el detalle de una orden → botón "Recibir Mercancía"**

**Paso 1 — Verificar datos:**
- Confirmar No. de Factura del proveedor (obligatorio ahora)
- Confirmar fecha de llegada real
- Confirmar bodega destino

**Paso 2 — Confirmar cantidades recibidas:**

La tabla muestra todas las líneas de la orden. Para cada una:

| Producto | Ordenado | Recibido ahora | Pendiente |
|----------|----------|---------------|-----------|
| WHISKY JOHNNIE W. RED NR 12X750ML | 100 | [100] | 0 |
| WHISKY JOHNNIE W. BLACK 12YRS 24X375ML | 50 | [50] | 0 |
| TEQUILA DON JULIO 1942 GB COR 6X750ML | 23 | [20] | 3 |

- Por defecto, "Recibido ahora" = Ordenado (recepción completa)
- Si la cantidad es menor → es recepción parcial. El sistema calcula "Pendiente" automáticamente
- Si hay pendiente, la orden queda en status "Parcial" y se puede recibir el resto después

**Paso 3 — Registrar gastos de internación:**

| Campo | Modo rápido | Modo detallado |
|-------|-------------|----------------|
| %Gastos | [15]% | — |
| Flete marítimo | — | $5,000 |
| Seguro | — | $1,200 |
| Handling | — | $800 |
| Otros | — | $500 |
| **Total gastos** | **$32,129.10** | **$7,500** |
| **%Gastos equivalente** | **15%** | **3.5%** |

El sistema calcula automáticamente el Costo CIF por producto:
```
Ejemplo: WHISKY JOHNNIE W. RED NR 12X750ML
FOB: $73.00 × (1 + 15/100) = CIF: $83.95
```

**Paso 4 — Panel de impacto (NUEVO — no existe en Dynamo):**

Antes de confirmar, el sistema muestra cómo este ingreso afecta los costos:

| Producto | Costo anterior | Costo nuevo (CIF) | Costo prom. ponderado | Cambio |
|----------|---------------|-------------------|----------------------|--------|
| JW RED 12X750ML | $80.00 | $83.95 | $82.50 | ↑ +3.1% |
| JW BLACK 24X375ML | $190.00 | $224.25 | $201.12 | ↑ +5.9% |

Y el efecto en márgenes:
```
JW RED 12X750ML:
  Costo anterior: $80.00 → Precio A: $111.00 → Margen: 38.8%
  Costo nuevo:    $82.50 → Precio A: $111.00 → Margen: 34.5% ↓
  ¿Recalcular precios automáticamente? [Sí] [No, mantener precios actuales]
```

**Paso 5 — Confirmar recepción:**
- Click "Confirmar Recepción"
- El sistema:
  1. Mueve cantidades de "Por Llegar" a "Existencia" en inventario
  2. Recalcula costo promedio ponderado para cada producto
  3. Registra la entrada en el historial de movimientos
  4. Actualiza status de la orden: "Recibida" (o "Parcial" si hay pendiente)
  5. Genera registro en el historial de entradas (la Consulta de Entradas que Dynamo no puede mostrar)

### 4.5 Pantalla: Historial de Entradas (lo que Dynamo no pudo hacer)

Funcionalidad que en Dynamo está crasheada. Nosotros la construimos.

**Es un log completo de toda mercancía que ha entrado a bodega.**

**Filtros:**
- Rango de fechas
- Proveedor
- Producto específico
- Bodega
- Status: Todos / Solo confirmadas

**Tabla:**

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha de entrada |
| No. Orden | Número de OC asociada |
| No. Factura Proveedor | Referencia del proveedor |
| Proveedor | Nombre |
| Bodega | Bodega destino |
| Productos | Cantidad de líneas |
| Total FOB | Valor FOB total |
| %Gastos | Porcentaje de internación |
| Total CIF | Valor CIF total |
| Tipo | Completa / Parcial |

Click en cualquier fila → abre el detalle completo con todas las líneas de producto recibidas, costos FOB y CIF por línea.

### 4.6 Pantalla: Historial de Costos por Producto

Replica y mejora la "Consulta de Costos por Entrada" de Dynamo.

**Se accede desde:** Ficha del producto (Tab Movimientos) o desde el módulo de Compras.

**Header del producto:**
- Descripción, referencia, existencia actual, último costo CIF

**Tabla de historial:**

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha de la entrada |
| No. Orden | OC-XXXXX |
| No. Factura | Referencia del proveedor |
| Proveedor | Nombre |
| Cantidad | Cajas recibidas |
| Costo FOB | Precio FOB unitario |
| %Gastos | Porcentaje de internación |
| Costo CIF | = FOB × (1 + %Gastos/100) |
| Costo Prom. Ponderado | El promedio ponderado DESPUÉS de esta entrada |

**Gráfico de evolución de costo (NUEVO):**
Línea de tiempo mostrando cómo ha cambiado el costo CIF del producto a lo largo del tiempo. Permite identificar tendencias — ¿está subiendo? ¿bajando? ¿estable?

**VISIBILIDAD:** Esta pantalla completa es SOLO para Gerencia, Compras, y Contabilidad. Vendedores, tráfico y bodega NO la ven.

---

## 5. DATOS REALES PARA MOCK — ORDEN DE COMPRA

Usar la orden OC-03566 real como datos mockeados:

**Datos del documento:**
- No. Orden: OC-03566
- Proveedor: TRIPLE DOUBLE TRADING LLC
- No. Factura Proveedor: TD002038
- Fecha: 06/02/2026
- Bodega: BODEGA
- Status: Recibida (Factura en Dynamo)

**Líneas:**

| # | Descripción | Qty | Costo FOB | Total FOB |
|---|-------------|-----|-----------|-----------|
| 1 | WHISKY JOHNNIE W. RED NR 12X750ML 40%VOL.AL | 100 | $73.00 | $7,300 |
| 2 | WHISKY JOHNNIE W. BLACK 12YRS 24X375ML 40%V | 50 | $195.00 | $9,750 |
| 3 | WHISKY JOHNNIE WALKER GREEN 6X1000ML | 50 | $175.00 | $8,750 |
| 4 | WHISKY GLENFIDDICH 12AÑO CRCH 12X750ML 40% | 25 | $255.00 | $6,375 |
| 5 | WHISKY MONKEY SHOULDER 6X700ML 40%VOL | 30 | $88.00 | $2,640 |
| 6 | WHISKY JAMESON 1X4500ML 40%VOL W/CRADLE G | 3 | $50.00 | $150 |
| 7 | TEQUILA 1800 COCONUT R NK 12X750ML 35%V | 47 | $115.00 | $5,405 |
| 8 | TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V | 23 | $528.00 | $12,144 |
| 9 | TEQUILA CLASE AZUL REPOSADO GB 6X750ML 40% | 7 | $840.00 | $5,880 |
| 10 | WHISKY GLENFIDDICH 15YRS 12X750ML 40%VOL | 25 | $411.00 | $10,275 |
| **TOTAL** | | | | **$214,194.00** |

Para el mock, agregar %Gastos de ~15% para calcular CIF:
- SUB-TOTAL FOB: $214,194.00
- %Gastos: 15%
- Total Gastos: $32,129.10
- TOTAL CIF: $246,323.10

---

## 6. RESUMEN DE PANTALLAS DEL MÓDULO

```
COMPRAS E IMPORTACIÓN
├── Lista de Órdenes de Compra (pantalla principal)
│   ├── Stat cards (Activas, En tránsito, Recibidas, Valor)
│   ├── Filtros + búsqueda
│   ├── Tabla paginada de órdenes
│   └── Click → Detalle de orden
│
├── Detalle de Orden de Compra
│   ├── Datos del documento (proveedor, fechas, factura)
│   ├── Tabla de líneas de producto
│   ├── Sección de costos FOB/CIF (solo roles autorizados)
│   └── Botón "Recibir Mercancía"
│
├── Crear Orden de Compra
│   ├── Seleccionar proveedor + datos generales
│   ├── Agregar productos (manual o importación Excel)
│   └── Guardar → genera OC-XXXXX
│
├── Importar desde Excel (modal)
│   ├── Upload de archivo
│   ├── Mapeo de columnas (con plantillas guardadas por proveedor)
│   ├── Preview + detección de productos faltantes
│   └── Confirmar importación
│
├── Recibir Mercancía (flujo)
│   ├── Confirmar datos
│   ├── Confirmar cantidades (soporte recepción parcial)
│   ├── Registrar gastos de internación (%Gastos o desglose)
│   ├── Panel de impacto en costos y márgenes
│   └── Confirmar → actualiza inventario + costo promedio ponderado
│
├── Historial de Entradas (NUEVO — reemplaza módulo crasheado)
│   ├── Log completo de toda mercancía recibida
│   ├── Filtros por fecha, proveedor, producto, bodega
│   └── Click → detalle de entrada
│
└── Historial de Costos por Producto
    ├── Header con datos del producto
    ├── Tabla con FOB, %Gastos, CIF por cada entrada
    ├── Gráfico de evolución de costo
    └── Solo visible para roles autorizados
```

---

## 7. NOTAS PARA EL DESARROLLO

### Lo que se conserva de Dynamo:
- El flujo de 2 pasos: Orden → Factura/Entrada
- La opción de crear factura directa sin orden previa
- El autocompletado para buscar productos (F5 → búsqueda con autocompletado)
- La estructura de la tabla de líneas (Referencia, Descripción, Cantidad, Costo, Total)
- Los campos de header (No. Documento, Proveedor, Fecha, Bodega, No. Factura)
- La fórmula CIF = FOB × (1 + %Gastos/100)
- Los atajos de teclado pueden mantenerse como shortcuts opcionales

### Lo que se mejora radicalmente:
- Importación desde Excel funcional (rota → funcional con mapeo flexible)
- Solo 3 columnas importables → todas las columnas necesarias con mapeo
- Formato rígido → mapeo flexible con plantillas por proveedor
- Sin recepción parcial → soporte completo para embarques parciales
- %Gastos como único campo → opción de desglose detallado
- Sin visibilidad de impacto → panel que muestra efecto en costos y márgenes antes de confirmar
- Costos visibles para todos → solo roles autorizados

### Lo que es completamente nuevo:
- Stat cards con métricas de compras
- Plantillas de mapeo guardadas por proveedor
- Recepción parcial con tracking de pendientes
- Panel de impacto en costos y márgenes
- Costo promedio ponderado calculado automáticamente
- Historial de Entradas funcional (crasheado en Dynamo)
- Gráfico de evolución de costos por producto
- Crear producto nuevo sobre la marcha durante importación
- Adjuntar factura/proforma del proveedor como imagen/PDF

---

## FIN DEL DOCUMENTO 03

Próximo documento: **Documento 04 — Módulo: Control de Inventario**
Cubre: Ajustes de Inventario, Transferencia de Mercancía, Inventario Físico, Consulta Bajo Existencia Mínima, conversión caja↔botella, transferencias B2B→B2C con costo inflado.
