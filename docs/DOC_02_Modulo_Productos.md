# DOCUMENTO 02 — MÓDULO: PRODUCTOS

## Contexto
Este documento especifica el módulo de Productos para la nueva plataforma de Evolution Zona Libre. Es el primer módulo a construir porque es la base de todo — sin productos no hay compras, sin compras no hay inventario, sin inventario no hay ventas.

**Prerequisito:** Leer el Documento 01 (Introducción Completa) antes de este documento.

---

## 1. QUÉ REEMPLAZA ESTE MÓDULO EN DYNAMO

En Dynamo, la información de productos está dividida en DOS submódulos separados dentro de Inventario:

| Submódulo Dynamo | Qué hace | Tabs que tiene |
|------------------|----------|----------------|
| Consulta de Producto | Solo ver. No se puede editar nada | 3 tabs: Generales, Movimiento Histórico, Lista de Productos |
| Administración de Productos | Crear, editar, eliminar productos | 2 tabs: Generales (editable), Ver Lista |

En la nueva plataforma, **ambos se fusionan en un solo módulo: PRODUCTOS.** Un solo lugar donde puedes ver, buscar, crear, editar, y analizar productos. No tiene sentido tener una pantalla para "solo ver" y otra para "editar" — eso es redundancia innecesaria.

---

## 2. LO QUE DYNAMO HACE HOY — ANÁLISIS CAMPO POR CAMPO

### 2.1 Ficha de producto en Dynamo (Administración de Productos → Tab Generales)

Explorado con el producto WHISKY BLACK & WHITE 24X375ML 40%VOL (Ref: 0000050196166).

**Sección GENERALES (columna izquierda):**

| Campo | Tipo en Dynamo | Valor ejemplo | Editable | Notas de la exploración |
|-------|---------------|---------------|----------|------------------------|
| Referencia | Texto | 0000050196166 | Sí | Formato INCONSISTENTE en el catálogo. Algunos son código de barras largo (0000050196166, 0003800138591), otros formato interno (01-09967, 01040750). No hay regla |
| Descripción | Texto largo | WHISKY BLACK & WHITE 24X375ML 40%VOL | Sí | CAMPO MÁS IMPORTANTE. Es el identificador real de trabajo. Incluye: tipo de licor, marca, variante, presentación (QtyxML), graduación alcohólica |
| Grupo | Texto/Dropdown | WHISKY | Sí | Categoría principal. Valores encontrados: WHISKY, RON, VODKA, SNACKS, TEQUILA, CERVEZA, VINO, LICOR, GINEBRA, MEZCAL, BRANDY, COCKTEL |
| Sub-Grupo | Texto/Dropdown | WHISKY | Sí | Subcategoría. A veces idéntico al grupo (WHISKY/WHISKY, RON/RON). A veces diferente (SNACKS/PAPITAS) |
| Marca | Dropdown + [+] | BLACK & WHITE | Sí | CONTAMINADO SISTÉMICAMENTE. JP CHENET aparece como marca de Pringles, Captain Morgan, Glenlivet, Crown Royal, Ciroc. BLACK & WHITE aparece como marca de Ron McCormick. Casi todos dicen JP CHENET sin importar la marca real |
| País Origen | Dropdown + [+] | PAIS ORIGEN (Renombrar) | Sí | PLACEHOLDER nunca configurado. Valor literal: "PAIS ORIGEN (Renombrar)" |
| Composición | Dropdown + [+] | COMPOSICION (Renombrar) | Sí | PLACEHOLDER nunca configurado. Valor literal: "COMPOSICION (Renombrar)" |
| Proveedor | Dropdown + [+] | GLOBAL BRANDS, S.A. | Sí | SOLO visible en Administración, NO en Consulta. Proveedores conocidos: GLOBAL BRANDS S.A., TRIPLE DOUBLE TRADING LLC, JP CHENET, ADYCORP |
| Referencia Showroom | Texto | 764009031846 | Sí | Código del proveedor. Aparece resaltado en recuadro rojo |
| Código de Barra | Texto + [+] | 10764009031560 | Sí | Soporta múltiples códigos con botón +. Es atributo SECUNDARIO, no identificador principal |
| Arancel | Texto + [+] | 2208309000 | Sí | Código arancelario. OBLIGATORIO para Zona Libre. Botón + sugiere que puede tener múltiples |
| Unidad/Medida | Dropdown | CJA | Sí | Normalmente CJA (caja). Tiene "Factor" al lado = 1 |
| Factor | Número | 1 | Sí | Factor de conversión. Siempre 1 en lo que hemos visto |
| Cantidad x Bulto | Número | 24 | Sí | Cuántas cajas por bulto |
| Cantidad x Paleta | Número | 60 | Sí | Cuántas cajas por paleta |
| Largo | Número (cm) | 8.00 | Sí | Dimensión. Se ingresa con Ancho y Alto, luego click "Ok" recalcula M³ y Ft³ |
| Ancho | Número (cm) | 11.00 | Sí | — |
| Alto | Número (cm) | 15.00 | Sí | — |
| Metros Cúbicos | Calculado | 0.02163 | Auto | = L × A × H / 1,000,000 |
| Pies Cúbicos | Calculado | 0.76388 | Auto | = M³ × 35.3147 |
| Kilos x Bulto | Número | 17.300 | Sí | Peso para cálculo de flete |
| Cantidad Mínima | Número | 20.00 | Sí | Umbral para alerta de stock bajo |

**Sección ESPECIFICACIONES (columna derecha, arriba):**

| Campo | Tipo | Valor | Notas |
|-------|------|-------|-------|
| Detallada | Texto largo (3 líneas) | VACÍO | Descripción extendida. Nadie lo llena |
| Inglés | Texto largo | VACÍO | Descripción en inglés. Nadie lo llena |
| Portugués | Texto largo | VACÍO | Descripción en portugués. Nadie lo llena |

**Sección PRECIOS (columna derecha, medio):**

| Nivel | Valor ejemplo | Descripción |
|-------|--------------|-------------|
| A | $111.00 | Más caro — clientes nuevos |
| B | $106.00 | Clientes regulares |
| C | $102.00 | Clientes frecuentes |
| D | $97.00 | Alto volumen |
| E | $97.00 | VIP. NOTA: D y E idénticos en este producto |

**Sección IMAGEN (columna derecha):**
- Muestra foto del producto (cuando existe)
- Botón literal: "Buscar Imagen en Google" con ícono de Google
- No hay repositorio propio — se busca en Google cada vez

**Sección STATUS (columna derecha, abajo):**
- Checkbox "Activo" (marcado o desmarcado)
- Algunos productos inactivos tienen "INACTIVO" escrito en la descripción como parche

**Botones de acción:** Guardar, Cancelar

### 2.2 Consulta de Producto — Tab Generales (modo solo lectura)

Mismo producto pero con diferencias importantes:
- NO es editable
- NO muestra Grupo ni Sub-Grupo (aparecen vacíos — bug de visualización)
- NO muestra Proveedor
- SÍ muestra fórmula de Existencia y Disponibilidad arriba a la derecha:
  ```
  Existencia (0.00) + Por Llegar (0.00) - Separadas (0.00) = Disponible (0.00)
  ```
- SÍ muestra campo Costo: "AA.MI" (código de moneda o costo codificado, significado pendiente)
- Tiene ícono de lupa para buscar imagen en Google

### 2.3 Consulta de Producto — Tab Movimiento Histórico

Historial completo de entradas y salidas del producto. Columnas:
- Documento (OC-03373, 4074, 4143, etc.)
- Fecha (16/10/25, 20/10/25, etc.)
- Rata % (AA.OG, AA.MI, GU.OE — código pendiente de decodificar)
- Nombre (proveedor en compras, cliente en ventas)
- Bod (bodega — siempre "01")
- Entradas (cantidad que entró)
- Salidas (cantidad que salió)
- Saldo (running total acumulado)

**Botones de acción:**
- Imprimir Movimiento
- Ver Por Llegar (bandera amarilla)
- Ver Separados (bandera roja)
- Saldo por Bodega
- [Doble Click] Ver Factura o Gastos de Compras

**Ejemplo real del Black & White 24×375ml:**
```
Doc       | Fecha    | Rata  | Nombre                      | Bod | Entradas | Salidas | Saldo
3757      | 11/06/25 | GU.OE | MARIA DEL MAR PEREZ SV      | 01  |          | 1.00    | 0.00
OC-03373  | 16/10/25 | AA.OG | compra ord:                 | 01  | 220.00   |         | 220.00
4074      | 20/10/25 | AA.OG | BRAND DISTRIBUIDOR CURACAO   | 01  |          | 80.00   | 140.00
4143      | 11/11/25 | AA.OG | BRAND DISTRIBUIDOR CURACAO   | 01  |          | 120.00  | 20.00
4225      | 02/12/25 | AA.OG | BRAND DISTRIBUIDOR CURACAO   | 01  |          | 20.00   | 0.00
OC-03526  | 20/01/26 | AA.MI | compra ord:                 | 01  | 129.00   |         | 129.00
4344      | 21/01/26 | AA.MI | BRAND DISTRIBUIDOR CURACAO   | 01  |          | 129.00  | 0.00
```

### 2.4 Lista de Productos (ambos submódulos)

**En Consulta de Producto (Tab "Lista de Productos"):**
Columnas completas: Referencia, Descripción, Código Barra, Existencia, Por Llegar, Separado, Disponible, Precio A, Cantidad Mínima, Marca (hay que hacer scroll horizontal para ver Marca, Grupo, Sub-Grupo)

3 filtros rápidos abajo:
- "Ver Productos con Cantidad Mínima" (naranja)
- "Ver Productos Bajo Cantidad Mínima" (naranja)
- "Ver Productos DISPONIBLE" (naranja, esquina derecha)

**En Administración de Productos (Tab "Ver Lista"):**
Lista más simple: solo 4 columnas — Referencia, Descripción, Cod. Barra, Existencia. Sin filtros rápidos.

### 2.5 Toolbar de Administración de Productos

Iconos de izquierda a derecha:
- Nuevo documento (hoja en blanco)
- Editar (lápiz)
- Eliminar (basura)
- Imprimir
- Copiar
- Pegar
- Guardar
- Navegación: Primero (|◄), Anterior (◄), Siguiente (►), Último (►|) — la flecha del último se resalta en amarillo
- Búsqueda (lupa arriba a la derecha)

---

## 3. PROBLEMAS DETECTADOS EN DYNAMO QUE LA NUEVA PLATAFORMA DEBE RESOLVER

| # | Problema | Evidencia | Solución en nueva plataforma |
|---|----------|-----------|------------------------------|
| 1 | Campo Marca contaminado sistémicamente | JP CHENET aparece como marca de Pringles, Captain Morgan, Glenlivet, Crown Royal, Ciroc. BLACK & WHITE aparece como marca de Ron McCormick | Marca como dropdown estricto con valores validados. Al crear producto, la marca debe coincidir con la marca real. Idealmente: catálogo maestro de marcas vinculado a proveedores |
| 2 | Formato de referencia inconsistente | Algunos: 0000050196166 (código de barras), otros: 01-09967 (interno), otros: 7501035010109 (código de barras MX) | Referencia auto-generada con formato consistente. Códigos de barras como campo separado |
| 3 | Placeholders nunca configurados | País Origen = "PAIS ORIGEN (Renombrar)", Composición = "COMPOSICION (Renombrar)" | Campos con valores reales. País Origen como dropdown con países. Composición definir si es útil o eliminarlo |
| 4 | Dos submódulos para lo mismo | Consulta (solo ver) vs Administración (editar). Información diferente en cada uno | UN solo módulo. Modo consulta por defecto, modo edición con permisos |
| 5 | Disponibilidad negativa en catálogo | GINEBRA HENDRICKS: Existencia 0, Separado 50, Disponible -50 | Bloqueo a nivel de sistema. Nunca permitir disponible negativo |
| 6 | Productos fantasma inflando catálogo | Gran mayoría de productos con existencia 0, separado 0, disponible 0. Sin movimiento | Status robusto: Activo / Inactivo / Descontinuado. Filtro por defecto muestra solo activos. Alerta automática de productos sin movimiento en X meses |
| 7 | "INACTIVO" escrito en descripción | Producto ref 01-00973 con descripción "INACTIVO" en vez de usar campo de status | Campo Status real con toggle. Nunca contaminar la descripción |
| 8 | Imágenes desde Google sin repositorio | Botón "Buscar Imagen en Google" — no guardan imágenes propias | Repositorio propio con upload drag & drop, galería por producto |
| 9 | Descripciones multilingües vacías | Campos Detallada, Inglés, Portugués existen pero nadie los llena | Mantener los campos pero hacerlos más accesibles. Considerar botón de traducción automática como mejora futura |
| 10 | Sin detección de duplicados | Mismo producto registrado con descripciones ligeramente diferentes | Matching inteligente: al crear producto, buscar similares y preguntar "¿Es este el mismo que...?" |
| 11 | Sin importación masiva funcional | Excel existe como botón pero está roto | Importación masiva real desde Excel/CSV con mapeo de columnas |
| 12 | Costos visibles para todos | Campo Costo aparece en Consulta de Producto visible para cualquiera | Costo SOLO visible para roles autorizados (Gerencia, Contabilidad, Compras) |

---

## 4. ESPECIFICACIÓN DEL MÓDULO PRODUCTOS EN LA NUEVA PLATAFORMA

### 4.1 Pantalla principal: Lista de Productos

Esta es la primera pantalla que ve el usuario al entrar al módulo.

**Header del módulo:**
- Título: "Productos"
- Botón principal: "+ Nuevo Producto"
- Botón secundario: "Importar desde Excel" (ícono de upload)
- Botón terciario: "Exportar" (ícono de descarga)

**Stat cards (fila de tarjetas con métricas):**
| Tarjeta | Qué muestra | Color |
|---------|-------------|-------|
| Total Productos | Cantidad de productos activos en el catálogo | Azul |
| Con Stock | Productos con disponible > 0 | Verde |
| Bajo Mínimo | Productos con disponible > 0 pero < cantidad mínima | Amarillo |
| Sin Stock | Productos con disponible = 0 | Rojo |
| Por Llegar | Productos con "Por Llegar" > 0 (mercancía en tránsito) | Azul claro |

**Barra de búsqueda:**
- Campo de búsqueda principal que busca en: descripción, marca, referencia, código de barras, arancel, proveedor
- Búsqueda en tiempo real (mientras escribes)
- Placeholder: "Buscar por descripción, marca, código de barra..."
- La descripción es prioridad — es como buscan en Evolution

**Filtros rápidos (badges clickeables):**
- Todos
- Con stock (verde)
- Bajo mínimo (amarillo)
- Sin stock (rojo)
- Por llegar (azul)
- Inactivos (gris)

**Filtros avanzados (desplegables):**
- Grupo (dropdown: WHISKY, RON, VODKA, TEQUILA, VINO, CERVEZA, GINEBRA, LICOR, MEZCAL, BRANDY, SNACKS, BEBIDA, COCKTEL...)
- Marca (dropdown con todas las marcas)
- Proveedor (dropdown) — SOLO visible para roles con permiso
- País de Origen (dropdown)

**Tabla principal:**

| Columna | Siempre visible | Notas |
|---------|----------------|-------|
| Referencia | Sí | Código interno auto-generado |
| Descripción | Sí | Columna más ancha. Es el identificador principal |
| Marca | Sí | Marca REAL del producto |
| Grupo | Sí | WHISKY, RON, VODKA, etc. |
| Existencia | Sí | Cantidad en bodega |
| Por Llegar | Sí | En tránsito |
| Separado | Sí | Comprometido para ventas |
| Disponible | Sí | = Existencia + Por Llegar - Separado. **Negrita, color-coded** |
| Precio A | Solo para roles autorizados | Precio del nivel más alto. **OCULTO para vendedores** |
| Costo | Solo Gerencia/Compras/Contabilidad | **NUNCA visible para vendedores, tráfico, ni bodega** |
| Status | Sí | Badge: Activo (verde), Inactivo (gris), Descontinuado (rojo) |

**Color coding del Disponible:**
- Verde: disponible > cantidad mínima
- Amarillo: disponible > 0 pero ≤ cantidad mínima
- Rojo: disponible = 0
- (Disponible negativo NO PUEDE EXISTIR en nueva plataforma)

**Acciones en cada fila:**
- Click en la fila → abre ficha detalle del producto
- Menú de 3 puntos (⋮): Editar, Duplicar, Desactivar/Activar, Ver movimientos

**Paginación:** 25 productos por página. Selector de cantidad: 25, 50, 100.

### 4.2 Pantalla de detalle: Ficha de Producto

Se abre al hacer click en un producto de la lista. Tiene un header fijo y tabs para diferentes secciones.

**Header de la ficha:**
- Botón "← Volver a Productos" (breadcrumb)
- Imagen del producto (thumbnail, click para ampliar)
- Descripción completa como título principal (fuente grande)
- Referencia (texto secundario, gris)
- Badge de status: Activo / Inactivo / Descontinuado
- Badge de stock: Con stock (verde) / Bajo mínimo (amarillo) / Sin stock (rojo)
- Botón "Editar" (solo roles con permiso)
- Menú ⋮: Duplicar, Desactivar, Eliminar, Historial de cambios

**4 Tabs:**

#### Tab 1: General
Toda la información del producto en layout de 2 columnas.

**Columna izquierda — Identificación:**

| Campo | Tipo | Obligatorio | Notas para la nueva plataforma |
|-------|------|------------|-------------------------------|
| Referencia | Texto (auto) | Auto-generado | Formato consistente: EVL-XXXXX secuencial. NUNCA editable por el usuario. Se genera al guardar |
| Descripción | Texto largo, sin límite | SÍ — obligatorio | Campo más importante. Sin límite de caracteres. Incluir: tipo de licor, marca, variante, presentación (QtyxML), graduación. Ejemplo: WHISKY BLACK & WHITE 24X375ML 40%VOL |
| Grupo | Dropdown | SÍ | Valores predefinidos en catálogo maestro. + Crear nuevo con aprobación |
| Sub-Grupo | Dropdown filtrado por Grupo | SÍ | Se filtra según el Grupo seleccionado. + Crear nuevo |
| Marca | Dropdown | SÍ | Catálogo maestro de marcas REALES. No confundir con proveedor. + Crear nueva |
| País de Origen | Dropdown | SÍ | Lista de países. No placeholders |
| Proveedor | Dropdown | SÍ | OCULTO para vendedores. Solo visible para Gerencia/Compras/Contabilidad. + Crear nuevo |
| Código(s) de Barra | Texto, múltiples | No | Botón + para agregar varios. Es atributo secundario, NO identificador |
| Arancel | Texto | SÍ — OBLIGATORIO (legal) | Código arancelario. Sistema no permite guardar sin arancel. Formato validado |

**Columna izquierda — Logística:**

| Campo | Tipo | Obligatorio | Notas |
|-------|------|------------|-------|
| Unidad de Medida | Dropdown | SÍ | Default: CJA (caja). Otras opciones: UND (unidad), BLT (botella), PAL (paleta) |
| Factor | Número | SÍ | Default: 1 |
| Unidades por Caja | Número | SÍ | Cuántas botellas/unidades por caja. Crítico para conversión B2B↔B2C |
| Cajas por Bulto | Número | No | Para cálculos de empaque |
| Cajas por Paleta | Número | No | Para cálculos de flete y almacenamiento |
| Dimensiones (L × A × H) | 3 campos numéricos (cm) | No | Auto-calcula M³ y Ft³ al cambiar cualquier valor. No necesita botón "Ok" como Dynamo |
| Metros Cúbicos | Calculado | Auto | = L × A × H / 1,000,000. Solo lectura |
| Pies Cúbicos | Calculado | Auto | = M³ × 35.3147. Solo lectura |
| Peso por Caja (kg) | Número | No | Para cálculos de flete |
| Cantidad Mínima | Número | No | Umbral para alerta de stock bajo. Si se deja en 0, no genera alertas |

**Columna derecha — Descripciones e imagen:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Imagen principal | Upload drag & drop | Repositorio propio. Permite subir imagen directamente, no buscar en Google. Múltiples imágenes posibles |
| Descripción detallada | Texto largo | Descripción extendida para uso interno o catálogos |
| Descripción en inglés | Texto largo | Para clientes internacionales |
| Descripción en portugués | Texto largo | Para clientes de Brasil |

**Columna derecha — Precios y costo (VISIBILIDAD POR ROL):**

| Campo | Visible para | Notas |
|-------|-------------|-------|
| Costo actual | Gerencia + Compras + Contabilidad | NUNCA visible para vendedores. Es el costo promedio ponderado |
| Precio A | Gerencia + Compras + Contabilidad | Internos para gestión |
| Precio B | Gerencia + Compras + Contabilidad | Internos para gestión |
| Precio C | Gerencia + Compras + Contabilidad | Internos para gestión |
| Precio D | Gerencia + Compras + Contabilidad | Internos para gestión |
| Precio E | Gerencia + Compras + Contabilidad | Internos para gestión |
| Margen por nivel | Gerencia + Compras + Contabilidad | Calculado: (Precio - Costo) / Costo × 100. Muestra si cada nivel está arriba o abajo del 10% |

**Lo que el VENDEDOR ve en esta sección:** NADA de precios ni costos. Solo ve la información general del producto, logística, imagen y descripciones. Los precios los maneja desde el módulo de Ventas con el indicador de comisión (Regla 15 del Doc 01).

**Campo Status:**
- Toggle o dropdown: Activo / Inactivo / Descontinuado
- Activo: aparece en búsquedas, disponible para ventas y compras
- Inactivo: no aparece en búsquedas por defecto, no disponible para nuevas ventas. Puede reactivarse
- Descontinuado: igual que inactivo pero permanente. Se mantiene para historial

#### Tab 2: Disponibilidad

Vista rápida del estado de stock de este producto.

**4 stat cards grandes:**
| Tarjeta | Valor | Color | Descripción |
|---------|-------|-------|-------------|
| Existencia | Número | Azul | Lo que hay físicamente en bodega |
| Por Llegar | Número | Azul claro | En tránsito (de órdenes de compra pendientes) |
| Separado | Número | Naranja | Comprometido para ventas aprobadas |
| DISPONIBLE | Número (grande, negrita) | Verde/Amarillo/Rojo según nivel | = Existencia + Por Llegar - Separado |

**Visualización de la fórmula:**
```
EXISTENCIA (43) + POR LLEGAR (0) - SEPARADO (10) = DISPONIBLE (33)
```
Mostrar la fórmula visualmente con los números reales y colores, como hace Dynamo pero más limpio.

**Alertas contextuales:**
- Si Disponible = 0: 🔴 "Sin stock — no se puede vender"
- Si Disponible ≤ Cantidad Mínima y > 0: ⚠️ "Stock bajo — debajo del mínimo de [X] unidades"
- Si Disponible > Cantidad Mínima: ✅ "Stock OK"
- Si hay Por Llegar > 0: 📦 "Mercancía en tránsito — [X] unidades por llegar"

**Desglose por bodega (tabla):**
Si hay múltiples bodegas, mostrar existencia por bodega. Equivalente al botón "Saldo por Bodega" de Dynamo.

| Bodega | Existencia | Separado | Disponible |
|--------|-----------|----------|------------|
| BODEGA (Principal) | 43 | 10 | 33 |
| TIENDA (B2C) | 12 | 0 | 12 |
| **TOTAL** | **55** | **10** | **45** |

**Acciones rápidas desde esta tab:**
- "Ver Por Llegar" → muestra detalle de órdenes de compra pendientes con este producto
- "Ver Separados" → muestra detalle de ventas/pedidos que tienen este producto separado
- "Crear Orden de Compra" → acceso directo para reabastecer (si stock bajo)

#### Tab 3: Movimientos

Historial completo de entradas y salidas. Replica y mejora el tab "Movimiento Histórico" de Dynamo.

**Filtros en la tabla de movimientos:**
- Rango de fechas (desde — hasta)
- Tipo de movimiento: Todos / Compras / Ventas / Ajustes / Transferencias
- Bodega: Todas / específica

**Tabla de movimientos:**

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha del movimiento |
| Tipo | Ícono + texto: 📥 Compra, 📤 Venta, 🔄 Transferencia, ✏️ Ajuste |
| Documento | Número de referencia (OC-03373, Factura 4074, etc.). Click → abre el documento |
| Tercero | Proveedor (en compras) o Cliente (en ventas). OCULTO para roles sin permiso |
| Bodega | Dónde ocurrió |
| Entrada | Cantidad que entró (verde) |
| Salida | Cantidad que salió (rojo) |
| Saldo | Running total después de este movimiento |
| Costo unitario | SOLO visible para Gerencia/Compras/Contabilidad |

**Mejoras sobre Dynamo:**
- La columna "Rata %" desaparece — se reemplaza por Costo unitario legible (solo para autorizados)
- Click en cualquier documento (OC, Factura) navega directamente a ese documento
- Filtros por tipo y fecha (Dynamo no tiene)
- Exportar a Excel
- Imprimir (mantiene funcionalidad de Dynamo)

#### Tab 4: Precios

**VISIBILIDAD:** Esta tab COMPLETA es invisible para vendedores, tráfico y bodega. Solo la ven: Gerencia, Compras, Contabilidad.

**Tabla de niveles de precio:**

| Nivel | Precio | Margen vs Costo | Indicador |
|-------|--------|----------------|-----------|
| A (Más caro) | $111.00 | 35.4% | 🟢 Comisiona |
| B | $106.00 | 29.3% | 🟢 Comisiona |
| C | $102.00 | 24.4% | 🟢 Comisiona |
| D | $97.00 | 18.3% | 🟢 Comisiona |
| E (Más barato) | $97.00 | 18.3% | 🟢 Comisiona |
| **Costo actual** | **$82.00** | — | — |
| **Precio mínimo (10% margen)** | **$90.20** | **10.0%** | Línea roja |

**Gráfico visual (mejora):**
Barra horizontal que muestra el rango de precio del producto:
```
Costo [$82] ──────── Mín 10% [$90.20] ── E [$97] ── D [$97] ── C [$102] ── B [$106] ── A [$111]
                          🔴                                    🟢
```

**Acciones:**
- "Recalcular precios" → recalcula todos los niveles basados en costo actual + porcentaje de margen por nivel
- "Historial de precios" → ver cómo han cambiado los precios en el tiempo
- "Historial de costo" → ver cómo ha cambiado el costo promedio ponderado

### 4.3 Pantalla: Crear / Editar Producto

Se abre al hacer click en "+ Nuevo Producto" o en "Editar" dentro de una ficha.

**Es la misma ficha del Tab General pero en modo edición:**
- Todos los campos son editables
- Validación en tiempo real:
  - Descripción obligatoria (resaltar en rojo si vacía)
  - Arancel obligatorio (resaltar en rojo si vacío, validar formato)
  - Grupo y Marca obligatorios
  - Al escribir descripción: **búsqueda automática de similares** → "¿Este producto ya existe? [WHISKY BLACK & WHITE 24X375ML 40%VOL — Ref: EVL-00142]" — para evitar duplicados
- Campos calculados se actualizan automáticamente (M³, Ft³)
- Imagen con drag & drop + preview
- Botones: "Guardar" (verde), "Cancelar" (gris)
- Al guardar por primera vez: genera Referencia automática (EVL-XXXXX)

**Validaciones al guardar:**
1. Descripción no vacía
2. Arancel no vacío y formato válido
3. Grupo seleccionado
4. Marca seleccionada
5. Unidad de medida seleccionada
6. Si hay imagen, que se haya subido correctamente
7. Detección de duplicados basada en descripción similar

### 4.4 Funcionalidad: Importación masiva desde Excel

**MEJORA CRÍTICA** — Dynamo lo tiene como botón roto. En la nueva plataforma es funcionalidad de primera clase.

**Flujo:**
1. Click "Importar desde Excel" en la lista de productos
2. Se abre modal con área de drag & drop para subir archivo (.xlsx, .csv)
3. El sistema lee las columnas del archivo
4. Pantalla de mapeo: el usuario asocia cada columna del archivo con un campo del producto
   - Columna A del Excel → Descripción
   - Columna B → Código de Barra
   - Columna C → Grupo
   - etc.
5. Preview de los primeros 5-10 registros para verificar
6. Detección automática de duplicados: "3 productos ya existen en el catálogo — ¿actualizar o saltar?"
7. Detección de productos nuevos: "12 productos nuevos se van a crear"
8. Confirmar → importación masiva
9. Resumen: "15 productos importados, 3 actualizados, 2 con errores (falta arancel)"

---

## 5. CATÁLOGO DE GRUPOS Y CATEGORÍAS DESCUBIERTOS

Basado en la exploración directa de Dynamo:

| Grupo | Sub-Grupo | Productos ejemplo |
|-------|-----------|-------------------|
| WHISKY | WHISKY | Black & White, Johnnie Walker, Glenfiddich, Chivas Regal, Jack Daniels, Grants, Crown Royal, Monkey Shoulder, Jameson, Glenlivet |
| RON | RON | Captain Morgan (Parrot Bay, Black Spiced, Private Stock), Bacardi Blanco, Ron Diplomático, McCormick Gold |
| VODKA | VODKA | Ciroc (Peach, Red Berries), Finlandia, Absolut, Smirnoff, Beluga Noble |
| TEQUILA | TEQUILA | Jose Cuervo (Oro, Silver), 1800 Coconut, Don Julio 1942, Clase Azul Reposado, Corrales, Los Corrales, Cenote, Kah |
| GINEBRA | GINEBRA | Hendricks (1000ml, 700ml), Skol |
| VINO | VINO | Sperone Prosecco, Freixenet (Carta Nevada, Ice) |
| CERVEZA | CERVEZA | Carta Blanca Lata, Coronita Extra Bot |
| LICOR | LICOR | Amaretto Disaronno, Kahlúa Café, Drambuie |
| MEZCAL | MEZCAL | Señorio Joven |
| BRANDY | BRANDY | Comte Somery Napoleon |
| CHAMPAÑA | (pendiente) | (pendiente de explorar) |
| SNACKS | PAPITAS | Pringles (Sal y Vinagre, Ranch, BBQ, Wavy Sweet & Spicy, Wavy Classic Salted) |
| BEBIDA | (pendiente) | Ciclon Energy Drink |
| COCKTEL | (pendiente) | Base Margarita Mix |
| JUGO | (pendiente) | Jumex Piña |

---

## 6. DATOS REALES PARA MOCK (PRODUCTOS CON STOCK)

Estos productos tenían stock real al momento de la exploración. Usar como datos mockeados para el prototipo:

| Referencia | Descripción | Existencia | Por Llegar | Separado | Disponible | Precio A | Grupo |
|-----------|-------------|-----------|-----------|---------|-----------|---------|-------|
| 01-09967 | VINO SPERONE PROSECCO 12X750ML 11.5%V | 43 | 0 | 10 | 33 | 67.00 | VINO |
| 01040750 | RON DIPLOMATICO RVA EXCLUSIVA TUBO 6X | 46 | 0 | 10 | 36 | 125.00 | RON |
| 0316204001526 | BRANDY COMTE SOMERY NAPOLEON 12X700 | 27 | 0 | 10 | 17 | 32.00 | BRANDY |
| 05003701450 | LICOR AMARETTO DISARONNO RF 12X750ML | 100 | 0 | 100 | 0 | 157.00 | LICOR |
| 05010327223018 | WHISKY GRANTS TRIPLE WOOD C/VASO NR | 35 | 0 | 15 | 20 | 81.00 | WHISKY |
| 05010327703527 | GINEBRA HENDRICKS RF 12X1000ML 44% VOL | 28 | 0 | 20 | 8 | 258.00 | GINEBRA |
| 05010327755502 | GINEBRA HENDRICKS R 6X700ML 41.4%VOL | 0 | 0 | 50 | **-50** | 0.00 | GINEBRA |
| 080432400395 | WHISKY CHIVAS REGAL 12YRS S/C NR 12X750 | 119 | 0 | 100 | 19 | 194.00 | WHISKY |
| 080480001620 | RON BACARDI BLANCO MINI 120X50ML 40%V | 115 | 0 | 100 | 15 | 138.00 | RON |
| 082000727606 | VODKA SMIRNOFF ORIGINAL 6X1.75ML 40%VO | 30 | 0 | 5 | 25 | 85.00 | VODKA |
| 082184004364 | WHISKY JACK DANIELS APPLE R 12X1000ML | 24 | 0 | 6 | 18 | 175.00 | WHISKY |
| 085676403102 | GINEBRA SKOL 12X1000ML 40%VOL | 50 | 0 | 10 | 40 | 26.00 | GINEBRA |
| 089540122717 | LICOR KAHLUA CAFE 12X750ML 16%VOL | 65 | 0 | 50 | 15 | 77.00 | LICOR |
| 10085592460934 | RON MCCORMICK GOLD 12X1000ML 40%VOL | 131 | 0 | 20 | 111 | 38.00 | RON |
| 00080432400708 | WHISKY GLENLIVET 12YO DOUBLE OAK R GB | 9 | 0 | 0 | 9 | 496.00 | WHISKY |
| 00082000777205 | WHISKY CROWN ROYAL CORCHO 12X1000ML | 2 | 0 | 0 | 2 | 177.00 | WHISKY |
| 00082000777694 | RON CAPTAIN MORGAN PARROT BAY COCO 1 | 0 | 20 | 0 | 20 | 0.00 | RON |
| 7501035010109 | TEQUILA JOSE CUERVO SILVER R 12X750ML | 114 | 0 | 0 | 114 | (pendiente) | TEQUILA |
| 7501035010314 | COCKTEL BASE MARGARITA MIX 12X1000ML | 30 | 0 | 0 | 30 | (pendiente) | COCKTEL |
| 7501233709430 | TEQUILA LOS CORRALES SILVER (BLANCO) 12X930ML | 40 | 0 | 0 | 40 | (pendiente) | TEQUILA |
| 7503021403148 | MEZCAL SEÑORIO JOVEN 6X750ML 40% VOL | 5 | 0 | 0 | 5 | (pendiente) | MEZCAL |

**NOTA:** La Hendricks 700ml tiene disponible -50. Esto NO DEBE existir en la nueva plataforma. En datos mockeados poner disponible 0 y una alerta de "Sobre-comprometido".

---

## 7. PROVEEDORES CONOCIDOS (campo Proveedor)

| Proveedor | Productos que vende |
|-----------|-------------------|
| GLOBAL BRANDS, S.A. | Black & White, Jack Daniels, Finlandia, y otros |
| TRIPLE DOUBLE TRADING LLC | Johnnie Walker, Glenfiddich, Don Julio, Clase Azul, Beluga, Monkey Shoulder, Jameson, 1800 |
| JP CHENET | Freixenet, Captain Morgan, Glenlivet, Crown Royal, Ciroc, Pringles, y muchos otros |
| ADYCORP | Chivas Regal, Absolut, y otros |

---

## 8. RESUMEN DE PANTALLAS DEL MÓDULO

```
PRODUCTOS
├── Lista de Productos (pantalla principal)
│   ├── Stat cards (Total, Con Stock, Bajo Mín., Sin Stock, Por Llegar)
│   ├── Búsqueda + filtros rápidos + filtros avanzados
│   ├── Tabla paginada con datos por rol
│   ├── Click → Ficha de producto
│   └── Botones: + Nuevo, Importar Excel, Exportar
│
├── Ficha de Producto (detalle)
│   ├── Tab General: todos los campos del producto
│   ├── Tab Disponibilidad: stock en tiempo real con fórmula visual
│   ├── Tab Movimientos: historial de entradas/salidas con filtros
│   └── Tab Precios: niveles + márgenes (SOLO para roles autorizados)
│
├── Crear / Editar Producto (formulario)
│   ├── Mismos campos que Tab General en modo edición
│   ├── Validación en tiempo real
│   ├── Detección de duplicados
│   └── Upload de imagen con drag & drop
│
└── Importar desde Excel (modal)
    ├── Upload de archivo
    ├── Mapeo de columnas
    ├── Preview y detección de duplicados
    └── Confirmación e importación
```

---

## 9. NOTAS PARA EL DESARROLLO

### Lo que se conserva de Dynamo:
- Todos los campos de la ficha de producto (son necesarios para Zona Libre)
- La fórmula de disponibilidad: Existencia + Por Llegar - Separado = Disponible
- La navegación entre productos (equivalente a las flechas ◄►)
- El concepto de movimiento histórico con saldo corrido
- Los 5 niveles de precio (internamente)
- Los filtros rápidos de stock (equivalentes a los botones naranja)
- Búsqueda tipo autocompletado (lo que Celly pidió conservar)

### Lo que se mejora radicalmente:
- Un solo módulo en vez de dos submódulos separados
- Búsqueda inteligente con detección de duplicados
- Importación masiva funcional (Excel roto → funcional)
- Repositorio propio de imágenes (Google → upload directo)
- Control de acceso por rol (todos ven todo → cada quien ve lo suyo)
- Status real del producto (no escribir "INACTIVO" en la descripción)
- Referencia auto-generada con formato consistente
- Campos con valores reales (no placeholders "Renombrar")
- M³ y Ft³ se calculan automáticamente sin botón "Ok"
- Filtros por tipo en movimiento histórico
- Click en documento desde movimiento lleva directamente al documento
- Exportar a Excel

### Lo que es completamente nuevo:
- Stat cards con métricas visuales
- Alertas automáticas de stock bajo
- Indicador de margen por nivel de precio (Tab Precios)
- Historial de cambios (quién modificó qué y cuándo)
- Importación masiva con mapeo de columnas
- Botón "Crear Orden de Compra" directo desde producto con stock bajo
- Detección de duplicados al crear producto
- Visibilidad por rol implementada a nivel de campo

---

## FIN DEL DOCUMENTO 02

Próximo documento: **Documento 03 — Módulo: Compras e Importación**
Cubre: Registro de Compras (4 submódulos de Dynamo), flujo Orden → Factura, cálculo FOB → CIF, importación masiva de órdenes.
