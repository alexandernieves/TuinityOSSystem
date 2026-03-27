# EVOLUTION ZONA LIBRE — Documentación Completa para Desarrollo
## Contexto, Descubrimientos de Dynamo, Especificaciones de Módulos y Guía de Construcción

**Fecha:** Febrero 2026
**Proyecto:** Replicar Dynamo POS como plataforma moderna
**Cliente:** Evolution Zona Libre — Zona Libre de Colón, Panamá
**Objetivo:** Crear un prototipo frontend funcional que replique todos los módulos de Dynamo POS con interfaz moderna estilo Shopify, sin backend complejo, pero que parezca la plataforma final.

---

## 1. EL NEGOCIO

### ¿Qué es Evolution?
Evolution es un importador y distribuidor mayorista de bebidas alcohólicas ubicado en la Zona Libre de Colón, Panamá. Vende whisky, vodka, cognac, vinos, tequila, ron, champaña, y también algunos productos no alcohólicos (bebidas energizantes, snacks tipo Pringles).

### Modelo de negocio
- **B2B (principal):** Venta por cajas/paletas/contenedores a distribuidores internacionales. Clientes de Curazao, Colombia, otros países de América Latina y el Caribe.
- **B2C (secundario):** Tienda física en planta baja que vende por botella individual al público.
- **Importación:** Compran a proveedores internacionales (Global Brands, JP Chenet, Adycorp, Triple Double Trading LLC) por contenedores.

### ¿Qué hace especial a una empresa de Zona Libre?
- La mercancía tiene tratamiento fiscal diferente (impuestos mínimos o nulos para mercancía en tránsito)
- Cada producto DEBE tener código arancelario para moverse legalmente
- Documentación regulatoria obligatoria: DMC (Declaración de Movimiento Comercial), BL (Bill of Lading)
- Términos de comercio internacional: FOB (precio en puerto origen) y CIF (costo total aterrizado en bodega)
- NO es un e-commerce ni una tienda local — es un sistema de gestión comercial de importación

### Equipo clave
| Persona | Rol | Qué hace |
|---------|-----|----------|
| Javier | Dueño / Gerente General | Decisiones finales, aprobaciones. Regla: ningún producto más de 4-6 meses en bodega |
| Estelia | Socia / Gerencia | Co-gestión del negocio |
| Jackie | Contabilidad / Gerencia | Contabilidad, reportes financieros. También sabe de tráfico |
| Margarita | Vendedora B2B | Crea cotizaciones, gestiona clientes, negocia precios. Vendedora principal |
| Arnold | Vendedor B2B | Segundo vendedor |
| Ariel | Tráfico | DMC, BL, documentación regulatoria de Zona Libre |
| María | Tráfico / Logística | Apoyo en tráfico y documentación |
| Celly | Compras y Bodega | Alimenta el sistema, registra entradas, gestiona inventario, negocia con proveedores |
| Jesús | Compras y Bodega (nuevo) | Viene de otra empresa de ZL. Aporta visión fresca |

---

## 2. EL SISTEMA ACTUAL: DYNAMO POS

### Información técnica
- **Desarrollador:** Dynamo Software Solutions (dynamoss.com, dynamoss@outlook.com, tel: 6090-3796)
- **Tipo:** Aplicación de escritorio
- **Acceso:** Conexión remota a servidor interno en 190.102.57.154:56000
- **Instancia explorada:** EVOLUTION ZL (BODEGA), usuario JAVIER (administrador)
- **Arquitectura:** DOS instancias separadas — Dynamo (B2B) y Dynamo Caja (B2C) con bases de datos INDEPENDIENTES. Este es el problema más grave.

### Problemas principales de Dynamo
1. **Crear Factura no funciona** — Módulo core del POS roto en ambos sistemas
2. **Disponibilidad negativa** — Permite comprometer mercancía que no existe
3. **DMC completamente manual** — 15-20 min por documento, duplicando datos
4. **Modificaciones post-aprobación destruyen todo** — Cualquier cambio obliga a desaprobar → eliminar → reconstruir
5. **Costos visibles para todos** — Vendedores ven costos y bajan precios, destruyendo márgenes
6. **Dos bases de datos B2B/B2C** — Inventario desincronizado
7. **Carga manual producto por producto** — Horas en ingreso de compras
8. **Herramienta de Excel rota** — El botón de importar desde Excel existe pero da error
9. **Sin estadísticas ni analítica**
10. **Servidor local = punto único de falla** — Se va la luz, toda la empresa se paraliza

### Estructura del menú principal de Dynamo
6 módulos en el sidebar izquierdo:
1. **Punto de Venta** — Facturación B2C (Crear Factura no funciona)
2. **Inventario** — El más denso: 10 submódulos
3. **Clientes** — Directorio, crédito, cobranza
4. **Contabilidad** — Pendiente validar si se usa realmente
5. **Configuración** — Solo 2 submódulos
6. **Ventas** — Pipeline B2B completo

---

## 3. EXPLORACIÓN DIRECTA DE DYNAMO — LO QUE DESCUBRIMOS

### 3.1 Módulo de Inventario (10 submódulos)

| # | Submódulo | Tiene sub-menú | Explorado |
|---|-----------|----------------|-----------|
| 1 | Consulta de Producto | No | ✓ |
| 2 | Administración de Productos | No | ✓ |
| 3 | Registro de Compras | Sí (4 opciones) | ✓ |
| 4 | Ajustes de Inventario | No | Pendiente |
| 5 | Transferencia de Mercancía | No | Pendiente |
| 6 | Administración de Archivos | Sí | Pendiente |
| 7 | Reportes de Inventario | Sí | Pendiente |
| 8 | Herramientas | Sí | Pendiente |
| 9 | Inventario Físico | Sí | Pendiente |
| 10 | Consulta Bajo Existencia Mínima | No | Pendiente |

### 3.2 Ficha de Producto (Administración de Productos)

Producto de ejemplo analizado: WHISKY JACK DANIELS N°7 BLACK MINI 120X50ML 40%V (Ref: 01-00296)

**Todos los campos de la ficha:**

| Campo | Tipo | Valor de ejemplo | Obligatorio | Notas |
|-------|------|------------------|-------------|-------|
| Referencia | Texto | 01-00296 | Auto | SKU interno. Formato INCONSISTENTE — algunos son códigos largos, otros 01-XXXXX |
| Descripción | Texto largo | WHISKY JACK DANIELS N°7 BLACK MINI 120X50ML 40%V | Sí | **CAMPO MÁS IMPORTANTE**. Es el identificador principal. Incluye: tipo, marca, variante, presentación (QtyxML), graduación |
| Grupo | Dropdown | WHISKY | Sí | Categoría: WHISKY, VODKA, RON, TEQUILA, VINO, CHAMPAÑA, LICOR, BEBIDA, etc. |
| Sub-Grupo | Dropdown | WHISKY | Sí | Subcategoría. A menudo idéntico al grupo |
| Marca | Dropdown + [+] | BLACK & WHITE | Sí | **ERROR DETECTADO:** Descripción dice Jack Daniels pero marca dice Black & White. Datos contaminados |
| País Origen | Dropdown + [+] | PAIS ORIGEN (Renombrar) | Sí | Valor PLACEHOLDER. Nunca fue configurado |
| Composición | Dropdown + [+] | COMPOSICION (Renombrar) | No | Mismo problema: placeholder |
| Proveedor | Dropdown + [+] | GLOBAL BRANDS, S.A. | Sí | Proveedor principal del producto |
| Referencia Showroom | Texto | 764009031846 | No | Código del proveedor |
| Código de Barra | Texto + multi [+] | 10764009031560 | No | Múltiples códigos permitidos. SECUNDARIO, no es identificador principal |
| Arancel | Texto | 2208309000 | Sí | Código arancelario. OBLIGATORIO para Zona Libre |
| Unidad/Medida | Dropdown | CJA | Sí | Normalmente CJA (caja) |
| Factor | Número | 1 | Sí | Factor de conversión |
| Cantidad x Bulto | Número | 24 | Sí | Cajas por bulto |
| Cantidad x Paleta | Número | 60 | Sí | Cajas por paleta |
| Largo/Ancho/Alto | Números (cm) | 8.00 x 11.00 x 15.00 | Sí | Dimensiones. Auto-calcula M³ y Ft³ |
| Metros Cúbicos | Calculado | 0.02163 | Auto | = L × A × H / 1,000,000 |
| Pies Cúbicos | Calculado | 0.76388 | Auto | = M³ × 35.3147 |
| Kilos x Bulto | Número | 17.300 | Sí | Peso para cálculo de flete |
| Cantidad Mínima | Número | 20.00 | No | Umbral para alerta de stock bajo |
| Detallada | Texto largo (2 líneas) | VACÍO | No | Descripción extendida. Nadie lo llena |
| Inglés | Texto largo | VACÍO | No | Descripción en inglés. Nadie lo llena |
| Portugués | Texto largo | VACÍO | No | Descripción en portugués. Nadie lo llena |
| Precio A | Moneda | $111.00 | Sí | Nivel más caro — clientes nuevos |
| Precio B | Moneda | $106.00 | Sí | Clientes regulares |
| Precio C | Moneda | $102.00 | Sí | Clientes frecuentes |
| Precio D | Moneda | $97.00 | Sí | Alto volumen |
| Precio E | Moneda | $97.00 | Sí | Más barato — VIP. NOTA: D y E son idénticos en este producto |
| Imagen | Archivo | (foto de Google) | No | Se cargan manualmente desde Google Images. No hay repositorio propio. Botón literal: "Buscar Imagen en Google" |
| Costo | Código | AA.MI | Auto | Código de moneda/costo. Significado pendiente de decodificar |
| Status | Checkbox | ✓ Activo | Sí | Activo/Inactivo. Dynamo pone "INACTIVO" en la descripción como parche |

### 3.3 Consulta de Producto (3 pestañas)

**Pestaña 1 — Generales:** Igual a la ficha de producto pero en modo consulta (no editable). Diferencia clave: muestra la fórmula de disponibilidad arriba a la derecha.

**Fórmula de disponibilidad:**
```
EXISTENCIA + POR LLEGAR − SEPARADAS = DISPONIBLE
```
Ejemplo: 0.00 + 0.00 − 0.00 = 0.00

**Pestaña 2 — Movimiento Histórico:** Historial completo de entradas/salidas del producto.

Columnas: Documento | Fecha | Rata % | Nombre | Bod | Entradas | Salidas | Saldo

Caso real analizado (Black & White 24x375ml):
```
OC-03373  | 16/10/25 | AA.OG | compra ord:             | 01 | 220.00 |        | 220.00
4074      | 20/10/25 | AA.OG | BRAND DISTRIB. CURACAO  | 01 |        |  80.00 | 140.00
4143      | 11/11/25 | AA.OG | BRAND DISTRIB. CURACAO  | 01 |        | 120.00 |  20.00
4225      | 02/12/25 | AA.OG | BRAND DISTRIB. CURACAO  | 01 |        |  20.00 |   0.00
OC-03526  | 20/01/26 | AA.MI | compra ord:             | 01 | 129.00 |        | 129.00
4344      | 21/01/26 | AA.MI | BRAND DISTRIB. CURACAO  | 01 |        | 129.00 |   0.00
```

Botones: Imprimir Movimiento, Ver Por Llegar (bandera amarilla), Ver Separados (bandera roja), Saldo por Bodega.
Abajo: "[Doble Click] Ver Factura o Gastos de Compras"

La columna "Rata %" tiene valores como AA.OG, AA.MI, GU.OE — probablemente código de moneda o costo. Pendiente decodificar.

**Pestaña 3 — Lista de Productos:** Vista tabular completa.

Columnas: Referencia | Descripción | Código Barra | Existencia | Por Llegar | Separado | Disponible | Precio A | Cantidad Mínima | Marca

Filtros rápidos abajo: "Ver Productos con Cantidad Mínima", "Ver Productos Bajo Cantidad Mínima", "Ver Productos DISPONIBLE"

**Problemas detectados en la lista:**
- Mayoría de productos con existencia 0 en todo — catálogo inflado
- Productos no alcohólicos: Papitas Pringles (sal y vinagre, ranch, BBQ, wavy), Bebida Ciclon Energy Drink
- Campo Marca contaminado: JP CHENET aparece como marca de Pringles y Captain Morgan
- Producto con descripción "INACTIVO" (ref 01-00973) — parche en vez de campo de status real
- Formato de referencia inconsistente

### 3.4 Registro de Compras (4 submódulos)

| Submódulo | Función | Explorado |
|-----------|---------|-----------|
| Registro de Ordenes de Compra | CREAR órdenes y facturas de compra | ✓ |
| Consulta de Orden de Compra | Ver órdenes existentes | No |
| Consulta de Costos por Entrada | Desglose de costos por entrada | Pendiente — CRÍTICO |
| Consulta de Entradas | Historial de entradas (reportado como crasheado) | No |

**Al crear documento nuevo, aparece diálogo con 3 opciones:**
1. **Orden** (resaltada en amarillo) — Orden de compra al proveedor
2. **Factura** — Factura de compra (mercancía recibida)
3. **Factura — Cargar Registro de la Orden** — Convierte orden existente en factura (sin re-teclear)

**Campos del encabezado de la orden:**
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| No. de Documento | Auto | OC-03566 |
| No. de Factura | Texto | TD002038 (factura del proveedor) |
| Fecha | Fecha | 06/02/2026 |
| Fecha Llegada | Fecha | 06/02/2026 |
| Proveedor | Dropdown + [+] | TRIPLE DOUBLE TRADING LLC |
| Bodega | Dropdown | BODEGA |
| Status | Auto | Orden (amarillo) → Factura (rojo) |

**Columnas de líneas:**
Referencia | Descripción | #Orden | Cantidad | Costo | Total

**Atajos de teclado:** F3 Eliminar Líneas, F5 Buscar Referencia, F6 Crear Referencia, Esc Guardar

**Totales:** SUB-TOTAL, IMPUESTOS (vacío — Zona Libre), GASTOS (vacío — pendiente averiguar dónde se registra el flete/seguro), TOTAL

**Ícono de Excel en barra de herramientas:** EXISTE pero está ROTO. Da error "Excel no está instalado".

**Orden de compra real analizada (OC-03566):**
- Proveedor: TRIPLE DOUBLE TRADING LLC
- Factura proveedor: TD002038
- Total: $214,194.00
- 11 líneas de producto:

| Producto | Qty | Costo | Total |
|----------|-----|-------|-------|
| WHISKY JOHNNIE W. RED NR 12X750ML 40%VOL | 100 | $73.00 | $7,300 |
| WHISKY JOHNNIE W. BLACK 12YRS 24X375ML 40%V | 50 | $195.00 | $9,750 |
| WHISKY JOHNNIE WALKER GREEN 6X1000ML | 50 | $175.00 | $8,750 |
| WHISKY GLENFIDDICH 12AÑO CRCH 12X750ML 40% | 25 | $255.00 | $6,375 |
| WHISKY MONKEY SHOULDER 6X700ML 40%VOL | 30 | $88.00 | $2,640 |
| WHISKY JAMESON 1X4500ML 40%VOL W/CRADLE G | 3 | $50.00 | $150 |
| TEQUILA 1800 COCONUT R NK 12X750ML 35%V | 47 | $115.00 | $5,405 |
| TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V | 23 | $528.00 | $12,144 |
| TEQUILA CLASE AZUL REPOSADO GB 6X750ML 40% | 7 | $840.00 | $5,880 |
| WHISKY GLENFIDDICH 15YRS 12X750ML 40%VOL | 25 | $411.00 | $10,275 |

---

## 4. MÓDULOS PENDIENTES DE EXPLORAR EN DYNAMO

Estos módulos NO se han visto aún en Dynamo. Necesitan ser explorados en futuras sesiones:

### Dentro de Inventario:
- Consulta de Costos por Entrada — **CRÍTICO:** Podría revelar dónde se registran gastos de internación para CIF
- Ajustes de Inventario
- Transferencia de Mercancía — Importante para ver el flujo B2B→B2C con costo inflado
- Administración de Archivos
- Reportes de Inventario
- Herramientas
- Inventario Físico

### Módulos completos:
- **Ventas** — EL MÁS CRÍTICO. Pipeline cotización→factura, aprobaciones, lista de empaque
- **Clientes** — Ficha, niveles de precio, crédito, cobranza, 11 submódulos
- **Punto de Venta** — Interfaz B2C, verificar error de "terminal no registrada"
- **Contabilidad** — Determinar si es el sistema contable principal
- **Configuración** — Bodegas, herramientas, usuarios

---

## 5. FLUJO LÓGICO DE CONSTRUCCIÓN

El orden natural del negocio (si Evolution abriera desde cero):

```
CATÁLOGO DE PRODUCTOS → COMPRAS E IMPORTACIÓN → CONTROL DE INVENTARIO → VENTAS B2B → TRÁFICO Y DOCUMENTACIÓN
```

Cada módulo alimenta al siguiente:
- Sin productos no puedes comprar
- Sin compras no hay inventario
- Sin inventario no puedes vender
- Sin ventas no hay documentos de tráfico

---

## 6. ESPECIFICACIÓN DE MÓDULOS PARA CONSTRUIR

### PRINCIPIO FUNDAMENTAL
Replicar el flujo de trabajo de Dynamo con tecnología moderna. Primero la copia funcional, después las mejoras. La interfaz debe ser estilo Shopify: limpia, simple, fácil de navegar.

### REGLA DE CONSOLIDACIÓN
Los 60+ submódulos de Dynamo se consolidan en módulos limpios. Lo que hoy son submódulos separados para cada variación de reporte se convierte en filtros dentro de una misma vista.

---

### MÓDULO 1: CATÁLOGO DE PRODUCTOS

**Reemplaza en Dynamo:** Consulta de Producto + Administración de Productos (2 submódulos → 1)

#### Pantalla 1A: Lista de Productos
- Tabla con columnas: Referencia, Descripción, Marca, Existencia, Por Llegar, Separado, Disponible, Precio A, Status
- Barra de búsqueda principal (busca por descripción, marca, referencia)
- Filtros: Grupo, Marca, Proveedor, Status
- Filtros rápidos tipo badge: Con stock (verde), Bajo mínimo (amarillo), Sin stock (rojo), Inactivos (gris)
- Botón "+ Nuevo Producto"
- Botón "Importar desde Excel"
- Click en producto → abre ficha detalle
- Paginación
- Exportar a Excel

#### Pantalla 1B: Ficha de Producto (crear/editar)
Dos columnas:

**Columna izquierda — Datos Generales:**
- Referencia (auto-generada, formato consistente)
- Descripción (campo más importante, sin límite de caracteres)
- Grupo (dropdown)
- Sub-Grupo (dropdown, filtrado por grupo)
- Marca (dropdown + crear nueva)
- País Origen (dropdown + crear)
- Composición (dropdown + crear)
- Proveedor (dropdown + crear)
- Referencia Showroom (texto)
- Código de Barra (texto, múltiples con botón +)
- Arancel (texto, OBLIGATORIO)
- Unidad/Medida (dropdown) + Factor (número)
- Qty × Bulto, Qty × Paleta
- Dimensiones (L × A × H en cm) → auto-calcula M³ y Ft³
- Kilos × Bulto
- Cantidad Mínima

**Columna derecha — Info adicional:**
- Existencia y Disponibilidad (Existencia + Por Llegar - Separadas = Disponible) — SOLO LECTURA
- Descripciones multilingüe (Detallada, Inglés, Portugués)
- 5 niveles de precio (A más caro → E más barato)
- Imagen del producto (upload con drag & drop, repositorio propio)
- Costo
- Status (Activo/Inactivo toggle)

**Tabs en la ficha:**
1. General — todos los campos arriba
2. Disponibilidad — tarjetas con Existencia, Por Llegar, Separadas, Disponible + alertas
3. Movimiento Histórico — tabla con Documento, Fecha, Tipo, Cliente/Proveedor, Bodega, Entrada, Salida, Saldo
4. Precios — los 5 niveles con detalle + costo actual + cálculo de margen

**Mejoras sobre Dynamo (Fase 2):**
- Búsqueda inteligente: sugerir productos similares para detectar duplicados
- Importación masiva desde Excel/CSV
- Recalcular precios automáticamente cuando cambia el costo: precio = costo × (1 + %margen)
- Historial de cambios (quién modificó qué y cuándo)

---

### MÓDULO 2: COMPRAS E IMPORTACIÓN

**Reemplaza en Dynamo:** Registro de Compras con sus 4 submódulos → 1 módulo con 2 pantallas

#### Flujo de compras (2 pasos, replicar Dynamo):
```
PASO 1: ORDEN DE COMPRA (se negocia con proveedor, se registran productos/cantidades/costos FOB)
    ↓ Cantidades se suman a "Por Llegar" en inventario
PASO 2: RECEPCIÓN / FACTURA (mercancía llega, se carga desde la orden existente, se verifica)
    ↓ Cantidades pasan de "Por Llegar" a "Existencia"
```

#### Pantalla 2A: Lista de Órdenes de Compra
- Tabla: No. Documento, Factura Proveedor, Fecha, Proveedor, # Líneas, Total, Status
- Status: Pendiente (amarillo) / Recibida (verde)
- Filtros por status, proveedor, fecha
- Botón "+ Nueva Orden"
- Stats: Órdenes Pendientes, Recibidas Este Mes, Total

#### Pantalla 2B: Orden de Compra (crear/editar/ver)

**Encabezado:**
| Campo | Tipo | Notas |
|-------|------|-------|
| No. de Documento | Auto | Formato OC-XXXXX secuencial |
| No. de Factura | Texto | Factura del proveedor |
| Fecha | Fecha | Default: hoy |
| Fecha Llegada | Fecha | Puede ser futura |
| Proveedor | Dropdown + crear | Catálogo de proveedores |
| Bodega | Dropdown | Default: BODEGA |
| Status | Auto | ORDEN → FACTURA |

**Líneas de producto:**
| Campo | Tipo | Notas |
|-------|------|-------|
| Referencia | Búsqueda | Buscar producto existente. Si no existe, crear desde aquí |
| Descripción | Auto | Se llena al seleccionar referencia |
| Cantidad | Número | Cajas. Enteros positivos |
| Costo | Moneda | Costo unitario FOB |
| Total | Calculado | = Cantidad × Costo |

**Totales:**
- SUB-TOTAL (suma de líneas)
- IMPUESTOS (normalmente $0 en Zona Libre)
- GASTOS (flete, seguro, handling — pendiente de definir flujo exacto)
- TOTAL

**Acciones:**
- Guardar
- Convertir a Factura ▶ (solo para órdenes pendientes)
- Importar desde Excel 📂 (MEJORA CRÍTICA — Dynamo lo tiene roto)
- Cancelar

#### Flujo de conversión Orden → Factura:
1. Abrir orden pendiente
2. Click "Convertir a Factura"
3. Verificar cantidades recibidas (pueden ser parciales — MEJORA sobre Dynamo que solo permite todo o nada)
4. Registrar gastos de internación
5. Confirmar → stock pasa de "Por Llegar" a "Existencia", costo promedio ponderado se recalcula

---

### MÓDULO 3: CONTROL DE INVENTARIO

**Reemplaza en Dynamo:** Ajustes de Inventario + Transferencia de Mercancía + Inventario Físico + Consulta Bajo Existencia Mínima (4 submódulos → 1 módulo)

#### Pantalla 3A: Stock en Tiempo Real
- Tabla principal: Producto, Bodega, Existencia, Por Llegar, Separado, DISPONIBLE, Qty Mín, Estado
- Indicadores visuales: OK (verde), Bajo mínimo (amarillo ⚠), Sin stock (rojo)
- Stats: Con stock, Bajo mínimo, En tránsito, Sin stock
- Click en producto → ver movimiento histórico
- Búsqueda y filtros por grupo, bodega, proveedor

**REGLA CRÍTICA:** DISPONIBLE = Existencia + Por Llegar - Separadas. Si cualquier operación deja DISPONIBLE < 0, SE BLOQUEA. Excepción: supervisor aprueba con registro de motivo.

#### Pantalla 3B: Ajustes de Inventario
Para sumar/restar stock manualmente.

| Campo | Tipo | Notas |
|-------|------|-------|
| Producto | Búsqueda | Del catálogo |
| Tipo de Ajuste | Dropdown | SUMA (+) o RESTA (-) |
| Cantidad | Número | No puede dejar disponible negativo |
| Motivo | Dropdown | Merma / Rotura / Robo / Error de conteo / Vencimiento / Otro |
| Comentario | Texto | Detalle adicional |
| Bodega | Dropdown | Donde se aplica |

**MEJORA:** Todo ajuste requiere aprobación de supervisor (en Dynamo cualquiera puede ajustar sin aprobación).

#### Pantalla 3C: Transferencias entre Bodegas
Mover mercancía entre bodegas. Caso principal: B2B → B2C.

| Campo | Tipo | Notas |
|-------|------|-------|
| Bodega Origen | Dropdown | De dónde sale |
| Bodega Destino | Dropdown | Si es B2C, activar conversión de unidades |
| Producto | Búsqueda | Producto a transferir |
| Cantidad | Número | En cajas. Si destino B2C, auto-convertir a botellas |
| Costo Transferencia | Moneda | Solo para B2C. Es INFLADO (mayor al real) para margen interno |

**Conversión automática B2B→B2C:**
- B2B vende por CAJA. B2C vende por UNIDAD (botella)
- 1 caja de 6 botellas = 6 unidades en B2C
- Usar campo "Qty x Bulto" del producto para convertir
- El costo de transferencia NO es el costo real — es mayor

**Doble verificación:** Persona que crea la transferencia ≠ persona que confirma en destino (buena práctica de Dynamo a mantener).

---

### MÓDULO 4: VENTAS B2B (NO EXPLORADO AÚN EN DYNAMO)

Basado en entrevistas y documento maestro. Pipeline de 6 etapas:

```
1. COTIZACIÓN → 2. APROBACIÓN COTIZACIÓN → 3. PEDIDO → 4. APROBACIÓN PEDIDO → 5. LISTA DE EMPAQUE → 6. FACTURA
```

**Requerimientos clave de entrevistas:**
- Mostrar último precio vendido al seleccionar cliente + producto (Margarita)
- Motor de precios flexible: 5 niveles base + excepciones con aprobación (Margarita)
- Cotizaciones exportables con imágenes en formato ligero (Margarita)
- Líneas de cotización reordenables e insertables (Margarita)
- Lista de empaque agrupada por categoría arancelaria (Ariel)
- Mecanismo de enmienda post-aprobación sin destruir pipeline (Ariel)
- Dashboard de estado por venta
- Pipeline visual para gerencia

---

### MÓDULO 5: TRÁFICO Y DOCUMENTACIÓN (MÓDULO NUEVO — NO EXISTE EN DYNAMO)

Surge de entrevistas con Ariel. Actualmente todo es manual.

**Documentos que genera:**
| Documento | Cuándo | Qué incluye |
|-----------|--------|-------------|
| DMC de Salida | Toda venta que sale de ZL | Productos por código arancelario, cantidades, pesos, embarcador, consignatario, booking, barco |
| DMC de Entrada | Toda compra internacional | Productos, cantidades, códigos arancelarios, proveedor, datos de embarque |
| DMC de Traspaso | Movimiento entre empresas dentro de ZL | Similar a salida pero entre empresas relacionadas (Mainz/Malta/Milano) |
| Bill of Lading (BL) | Todo embarque marítimo | Booking, datos del barco, consignatario, embarcador, peso/volumen |
| Certificado de Libre Venta | Envíos a destinos que lo requieren (ej: San Andrés, Colombia) | Info para inspección del Min. de Salud |

**Requerimientos:**
1. Generación automática de DMC pre-llenado desde factura + lista de empaque
2. Lista de empaque agrupada por categoría arancelaria
3. BL pre-llenado reutilizando datos recurrentes del cliente
4. Certificado de Libre Venta cuando el destino lo requiere
5. Trabajo simultáneo en múltiples documentos
6. Preparación anticipada de DMC para embarques grandes
7. Modificación post-aprobación sin destruir todo el pipeline

---

### MÓDULO 6: PUNTO DE VENTA B2C (NO EXPLORADO AÚN)

- Caja simplificada para venta rápida (botella por botella)
- Conectada al MISMO inventario que B2B (base unificada)
- Conversión automática de unidades (caja → botella)
- Métodos de pago múltiples

---

### MÓDULO 7: CLIENTES Y COBRANZA (NO EXPLORADO AÚN)

- CRM con historial completo por cliente
- Niveles de precio por cliente (A-E)
- Gestión de crédito (límite, condiciones 30/60/90 días, documentación)
- Alertas automáticas de morosidad
- Bloqueo automático de ventas a morosos
- Dos tipos de alta: crédito (compleja) y contado (rápida)
- Anulación de transacciones SOLO con aprobación + registro

---

### MÓDULO 8: REPORTES Y ANALÍTICA

- Centro único de reportes con filtros dinámicos (en vez de 1 submódulo por reporte)
- Dashboards visuales con gráficos de tendencia
- Movimiento de producto por mes
- Comparación año contra año
- Productos estancados (regla Javier: max 4-6 meses)
- Patrones estacionales (Carnaval, fin de año)
- Ventas por vendedor (comisiones)
- Exportación Excel/PDF

---

## 7. REGLAS DE NEGOCIO GLOBALES

Estas reglas aplican a TODOS los módulos. Sin ellas, el sistema no funciona.

| # | Regla | Detalle |
|---|-------|---------|
| 1 | Una sola base de datos | B2B y B2C comparten inventario, clientes, contabilidad. Cambia la interfaz y permisos, NO los datos |
| 2 | Disponibilidad nunca negativa | Exist + Por Llegar - Separadas = Disponible. Si < 0, BLOQUEAR (excepción: supervisor) |
| 3 | Descripción = identificador primario | La búsqueda siempre es por descripción. Códigos de barra son secundarios |
| 4 | 5 niveles de precio | A (más caro) → E (más barato). Cada cliente tiene un nivel asignado |
| 5 | Costos OCULTOS para vendedores | Vendedores NUNCA ven costos, márgenes, ni proveedores |
| 6 | Ajustes con aprobación | Todo ajuste manual de inventario requiere aprobación de supervisor |
| 7 | Costo promedio ponderado | ((Qty_existente × Costo_existente) + (Qty_nueva × Costo_nuevo)) / Qty_total |
| 8 | Arancel obligatorio | Ningún producto sin código arancelario. Requisito legal de ZL |
| 9 | Transferencia B2B→B2C con costo inflado | Al transferir a tienda, costo es MAYOR al real para generar margen interno |
| 10 | Conversión automática caja ↔ botella | B2B en cajas, B2C en botellas. Automático |

---

## 8. MATRIZ DE PERMISOS POR ROL

### Visibilidad de Información
| Rol | Costos | Proveedores | Márgenes | Precios Venta | Stock |
|-----|--------|-------------|----------|---------------|-------|
| Javier/Estelia (dueños) | ✓ Todo | ✓ Todo | ✓ Todo | ✓ Todo | ✓ Todo |
| Jackie (contabilidad) | ✓ Todo | ✓ Todo | ✓ Todo | ✓ Todo | ✓ Todo |
| Celly (compras/bodega) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Vendedores (Margarita/Arnold) | ✗ NO | ✗ NO | ✗ NO | Solo nivel del cliente | ✓ Disponible |
| Bodega (operarios) | ✗ NO | ✗ NO | ✗ NO | ✗ NO | Solo desc + cantidad |
| Tráfico (Ariel/María) | ✗ NO | ✗ NO | ✗ NO | Solo para docs | ✓ Para docs |

### Permisos Operativos
| Acción | Quién puede | Requiere aprobación |
|--------|-------------|---------------------|
| Crear/editar producto | Compras | No |
| Crear orden de compra | Compras | No |
| Recibir mercancía | Compras / Bodega | No |
| Ajustar inventario | Bodega | Sí — Supervisor |
| Transferir mercancía | Bodega | Confirmación en destino |
| Crear cotización | Vendedores | No |
| Aprobar cotización | Supervisor / Gerencia | — |
| Crear pedido | Vendedores | No |
| Aprobar pedido | Supervisor / Gerencia | — |
| Generar factura | Vendedor / Administración | Pedido aprobado |
| Modificar post-aprobación (menor) | Vendedor / Tráfico | Aprobación rápida |
| Modificar post-aprobación (mayor) | Vendedor | Re-aprobación completa |
| Anular transacción | Administración | Sí — Gerencia |
| Cambiar costos | Compras (Celly) | No, pero queda registro |
| Cambiar precios | Compras / Gerencia | Gerencia para excepciones |
| Ver reportes financieros | Gerencia + Contabilidad | — |

---

## 9. PREGUNTAS PENDIENTES SIN RESOLVER

| # | Pregunta | Impacto | Dónde buscar |
|---|----------|---------|--------------|
| 1 | ¿Dynamo es el sistema contable principal o tienen software externo? | Define si construimos contabilidad completa | Preguntar a Jackie |
| 2 | ¿Dónde se registran gastos de internación para calcular CIF? | Define flujo de costeo | Explorar Consulta de Costos por Entrada |
| 3 | ¿Qué significa "Rata %" (AA.OG, AA.MI, GU.OE)? | Entender el costeo por lote | Preguntar a Celly |
| 4 | ¿Por qué niveles D y E son idénticos? | Define si realmente usan 5 niveles | Preguntar a Javier |
| 5 | ¿Cuántos productos activos vs. fantasma? | Define limpieza pre-migración | Filtrar en Dynamo |
| 6 | ¿Venden regularmente productos no alcohólicos? | Define categorías del catálogo | Preguntar a Javier |
| 7 | ¿Fórmula exacta de distribución de gastos FOB→CIF? | Implementar costeo correcto | Preguntar a Celly/Jackie |
| 8 | ¿Mainz, Malta, Milano son subsidiarias, relacionadas, o clientes? | Define traspasos DMC | Preguntar a Javier |
| 9 | ¿Flujos de aprobación reales (quién aprueba qué)? | Define permisos del sistema | Preguntar a Javier |
| 10 | ¿Cuántas bodegas tienen configuradas? | Define módulo de inventario | Explorar Configuración |

---

## 10. INSTRUCCIONES PARA CLAUDE CODE

### Qué construir
Un prototipo frontend funcional completo que replique TODOS los módulos de Dynamo POS con interfaz moderna. Sin backend complejo — datos mockeados en el frontend, pero que parezca la plataforma final.

### Stack recomendado
- React + Tailwind CSS
- Datos mockeados en archivos JSON o constantes
- Sin backend real — todo en el frontend
- Responsive pero optimizado para desktop (así trabajan en Evolution)

### Estilo visual
- **Referencia:** Shopify Admin — limpio, minimalista, profesional
- Sidebar con navegación entre módulos
- Tarjetas de estadísticas (stat cards) en cada módulo
- Tablas con búsqueda, filtros, y paginación
- Badges de color para estados
- Formularios con dropdowns, búsqueda, y validación visual
- Paleta: azules profesionales, grises neutros, verde para éxito, amarillo para advertencia, rojo para error

### Módulos a construir (en orden de prioridad)
1. **Catálogo de Productos** — Lista + Ficha detalle con 4 tabs
2. **Compras e Importación** — Lista de órdenes + Detalle de orden + Crear nueva
3. **Control de Inventario** — Stock en tiempo real + Ajustes + Transferencias
4. **Ventas B2B** — Pipeline cotización→factura (basado en documento maestro, no explorado en Dynamo aún)
5. **Clientes y Cobranza** — Lista + Ficha con niveles de precio y crédito
6. **Tráfico y Documentación** — Lista de documentos + Generador de DMC
7. **Punto de Venta B2C** — Caja simplificada
8. **Reportes y Analítica** — Dashboards con gráficos
9. **Configuración** — Usuarios, roles, permisos, bodegas

### Datos de prueba incluidos
Usar los datos REALES que se extrajeron de Dynamo:
- Proveedores: GLOBAL BRANDS S.A., TRIPLE DOUBLE TRADING LLC, JP CHENET, ADYCORP
- Productos: Los 10 productos documentados con todos sus campos
- Orden de compra: OC-03566 con sus 11 líneas reales
- Movimientos: El historial del Black & White 24x375ml
- Agregar datos ficticios adicionales para que la plataforma se vea poblada

### Lo que NO debe tener (para no complicar)
- No backend real, no base de datos, no autenticación real
- No lógica de negocio compleja (cálculos de CIF, costo promedio, etc.)
- No integraciones externas
- Los formularios deben verse funcionales pero no necesitan guardar realmente
- Los botones de acción (aprobar, convertir, etc.) pueden mostrar un toast/notificación

### Lo que SÍ debe tener
- TODAS las pantallas de TODOS los módulos navegables
- Datos que se vean reales (los de Dynamo)
- Filtros y búsqueda funcionales sobre los datos mockeados
- Tabs, modales, y flujos visuales completos
- Que un usuario de Evolution lo vea y diga "esto es lo que necesitamos"

---

## 11. CRONOLOGÍA DE LA CONVERSACIÓN DE ANÁLISIS

Esta sección documenta exactamente cómo se fue descubriendo la información, en orden cronológico, para contexto completo.

### Fase 1: Contexto inicial
- Tuinity (el usuario) compartió el documento maestro v3.0 (Tuinity_Analysis_ZL_1.docx) con el diagnóstico completo del negocio, entrevistas a 4 empleados, 19 problemas priorizados, y requerimientos por módulo.
- Se estableció que el objetivo es crear una copia moderna de Dynamo como punto de partida, y después personalizar con agentes de IA y automatizaciones.
- Se discutió la estrategia de recolección de información: sesiones guiadas grabadas con cada empleado, no grabaciones pasivas.

### Fase 2: Estrategia de construcción
- Se definió el orden lógico de módulos construyendo Evolution "desde cero": Catálogo → Compras → Inventario → Ventas → Tráfico
- Tuinity tiene acceso directo a Dynamo con credenciales de administrador (usuario JAVIER)
- Se acordó explorar módulo por módulo en el orden lógico definido

### Fase 3: Exploración del Módulo de Inventario
Screenshots compartidos y analizados:

**Screenshot 1 — Menú principal de Inventario:**
- Sidebar con 6 módulos (Punto de Venta, Inventario, Clientes, Contabilidad, Configuración, Ventas)
- Inventario expandido con 10 submódulos
- Header confirma: EVOLUTION ZL (BODEGA), usuario JAVIER

**Screenshot 2 — Administración de Productos (ficha del producto):**
- Producto: WHISKY JACK DANIELS N°7 BLACK MINI 120X50ML 40%V
- Tab "Generales" con todos los campos visibles
- HALLAZGO CRÍTICO: Marca dice "BLACK & WHITE" pero producto es Jack Daniels
- Campos País Origen y Composición con placeholder "Renombrar"
- 5 niveles de precio visibles (A=111, B=106, C=102, D=97, E=97)
- Botón "Buscar Imagen en Google" visible

**Screenshot 3 — Administración de Productos (pestaña Lista):**
- Columnas: Referencia, Descripción, Código Barra, Existencia
- Referencias en formatos inconsistentes mezclados
- Producto con descripción "INACTIVO" como parche
- Productos con existencia 0 (Chivas, Absolut, Drambuie)
- Bebida Ciclon Energy Drink presente (no alcohólico)
- ~17 productos visibles

**Screenshots 4, 5, 6 — Consulta de Producto (3 pestañas):**
- Pestaña Generales: fórmula Existencia + Por Llegar - Separadas = Disponible. Campo Costo muestra "AA.MI"
- Pestaña Movimiento Histórico: historial completo del Black & White 24x375ml. Compras OC-03373 (220 cajas Oct 2025) y OC-03526 (129 cajas Ene 2026). Ventas a BRAND DISTRIBUIDOR CURACAO. Columna "Rata %" con valores AA.OG, AA.MI, GU.OE
- Pestaña Lista de Productos: vista completa. Mayoría en 0. Pringles y Captain Morgan con marca JP CHENET (contaminado). Filtros rápidos abajo

**Screenshot 7 — Registro de Compras (submódulos):**
- 4 opciones: Registro de Ordenes de Compra, Consulta de Orden de Compra, Consulta de Costos por Entrada, Consulta de Entradas
- Se confirmó que las imágenes se cargan manualmente de Google

**Screenshots 8, 9 — Formulario de Orden de Compra:**
- Formulario vacío con campos de encabezado y tabla de líneas
- Diálogo de 3 opciones: Orden / Factura / Factura-Cargar Registro de la Orden
- Descubrimiento del flujo de dos pasos (Orden → Factura)
- Ícono de Excel visible en toolbar

**Screenshot 10 — Orden de Compra OC-03566 (con datos reales):**
- Proveedor: TRIPLE DOUBLE TRADING LLC
- 11 líneas de productos premium (JW Red/Black/Green, Glenfiddich, Don Julio, Clase Azul)
- Total: $214,194.00
- Campos IMPUESTOS y GASTOS vacíos (pregunta crítica: ¿dónde se registra el CIF?)
- Excel da error "no está instalado" (herramienta rota)
- Tooltip incorrecto: JW Green muestra tooltip de JW Black (posible bug)

### Fase 4: Análisis post-exploración
- Se confirmó que Zona Libre tiene impuestos mínimos/nulos, los "Gastos" serían flete, seguro, handling
- No se pudo acceder a "Consulta de Costos por Entrada" porque Javier estaba usando la cuenta

### Fase 5: Documentación y consolidación
- Se creó primer documento (Tuinity_Mapeo_Dynamo_POS.docx) — documentación exploratoria
- Tuinity pidió que el documento sea más técnico y orientado al desarrollador
- Se creó segundo documento (Tuinity_Especificacion_Modulos.docx) — especificaciones de construcción con wireframes, campos, flujos, y reglas de negocio

### Fase 6: Prototipo funcional
- Tuinity preguntó si es posible crear un prototipo visual tipo Shopify
- Se creó un prototipo React (evolution_platform_prototype.jsx) con:
  - Sidebar con navegación entre módulos
  - Catálogo completo con lista, búsqueda, filtros, ficha detalle con 4 tabs
  - Compras con lista de órdenes y detalle con líneas reales de OC-03566
  - Inventario con stock en tiempo real e indicadores visuales
  - Datos reales extraídos de Dynamo
- Se definió que este prototipo servirá como referencia visual exacta para EJ (el desarrollador)
- Objetivo: EJ toma el prototipo como guía visual y lo integra a la plataforma principal que ya tiene backend

### Fase 7: Documentación para Claude Code
- Se creó este documento como "biblia" completa para que Claude Code pueda construir el prototipo completo
- Enfoque: frontend funcional sin backend complejo, pero que parezca la plataforma final

---

## 12. PRINCIPIO DE CONSOLIDACIÓN DE MÓDULOS

Dynamo tiene los módulos "muy abiertos" — hay submódulos que podrían estar en uno solo. Muchos submódulos se podrían mergear para no tener tantas pantallas separadas. Pero en Dynamo está mal optimizado.

### Regla fundamental:
**Misma lógica de negocio, menos pantallas, más filtros.** Lo que hoy son submódulos separados para cada variación de reporte se convierte en filtros dentro de una misma vista. La funcionalidad NO se pierde — se reorganiza.

### Mapa de consolidación:

| Dynamo (Actual) | Nueva Plataforma | Mejora |
|-----------------|------------------|--------|
| Consulta de Producto + Adm. de Productos (2 sub) | **Catálogo de Productos** (1 módulo) | Una sola pantalla con modo consulta y edición. Búsqueda inteligente. Detección de duplicados |
| Registro de Compras (4 sub) | **Compras e Importación** (1 módulo) | Importación masiva desde Excel. Recepción parcial. Cálculo FOB→CIF automático |
| Ajustes + Transferencias + Inv. Físico + Stock Mínimo (4 sub) | **Control de Inventario** (1 módulo) | Stock en tiempo real unificado. Bloqueo de negativos. Alertas automáticas |
| Reportes de Inventario (sub con muchas opciones) | **Reportes y Analítica** (1 módulo) | Centro único con filtros dinámicos en vez de 1 submódulo por variación |
| Adm. de Archivos + Herramientas | **Integrado en cada módulo** | Las herramientas se integran donde se necesitan |

**Resultado:** 10 submódulos de Inventario → 3 módulos limpios + 1 de reportes

### Principio para TODO el sistema:
El flujo de trabajo NO debe cambiar — los empleados deben poder hacer exactamente lo mismo que hacían en Dynamo. Lo que cambia es:
1. La interfaz (moderna, limpia, intuitiva)
2. La organización (menos pantallas, más filtros)
3. La confiabilidad (funcionalidades que estaban rotas ahora funcionan)
4. La seguridad (permisos por rol, costos ocultos para vendedores)

---

## 13. PROTOTIPO EXISTENTE COMO PUNTO DE PARTIDA

Ya existe un prototipo funcional en React (evolution_platform_prototype.jsx) que cubre los 3 primeros módulos. Usar como referencia visual.

### Lo que el prototipo ya tiene:
1. **Sidebar** con navegación entre Catálogo, Compras, Inventario
2. **Catálogo:** Lista con búsqueda, filtros por status (con stock/bajo mínimo/sin stock), stat cards, click en producto abre ficha con 4 tabs (General, Disponibilidad, Movimientos, Precios)
3. **Compras:** Lista de órdenes con badges de status (Pendiente/Recibida), detalle de orden con todas las líneas de OC-03566
4. **Inventario:** Stock en tiempo real con indicadores visuales, alertas
5. **Datos reales** de Dynamo mockeados (10 productos, 3 órdenes, historial de movimientos)

### Lo que falta agregar al prototipo:
- Módulo de Ventas B2B (pipeline cotización→factura)
- Módulo de Clientes y Cobranza (ficha, niveles, crédito)
- Módulo de Tráfico y Documentación (DMC, BL)
- Módulo Punto de Venta B2C (caja simplificada)
- Módulo de Reportes (dashboards)
- Módulo de Configuración (usuarios, roles, bodegas)
- Formularios de creación (nuevo producto, nueva orden, nuevo cliente)
- Flujos de aprobación visuales
- Modales de confirmación y toasts de notificación
- Más datos mockeados para que se vea poblado

### Estilo visual del prototipo:
- Paleta: azul #1B3A5C (primario), azul #2E75B6 (acento), blanco y grises neutros
- Componentes: stat cards, tablas con hover, badges de color, tabs, modales
- Tipografía: Inter/-apple-system (sans-serif limpio)
- Layout: sidebar fijo izquierdo (w-56) + área de contenido scrolleable
- Inspiración: Shopify Admin panel

---

## 14. RESUMEN DE ARCHIVOS GENERADOS EN ESTA SESIÓN

| Archivo | Tipo | Contenido |
|---------|------|-----------|
| Tuinity_Mapeo_Dynamo_POS.docx | Word | Documentación exploratoria de Dynamo, campo por campo |
| Tuinity_Especificacion_Modulos.docx | Word | Especificaciones técnicas de construcción con wireframes |
| evolution_platform_prototype.jsx | React | Prototipo funcional de 3 módulos con datos reales |
| EVOLUTION_ZL_Documentacion_Completa_Para_Claude_Code.md | Markdown | ESTE DOCUMENTO — la biblia completa para desarrollo |

---

## 15. INSTRUCCIONES ESPECÍFICAS PARA CLAUDE CODE

### Contexto que debe tener Claude Code:
1. Lee este documento COMPLETO antes de escribir código
2. El prototipo existente (evolution_platform_prototype.jsx) es el punto de partida visual
3. Cada módulo nuevo que se agregue debe seguir el mismo patrón de diseño
4. Los datos mockeados deben parecer reales — usa los nombres de proveedores, productos, y clientes de este documento
5. El objetivo es que un usuario de Evolution vea esto y diga "así es como trabajamos"

### Orden de prioridad para construir:
1. ✅ Catálogo de Productos (ya existe en prototipo)
2. ✅ Compras e Importación (ya existe en prototipo)
3. ✅ Control de Inventario (ya existe en prototipo)
4. 🔲 Ventas B2B — Pipeline completo cotización→factura
5. 🔲 Clientes y Cobranza — Lista + ficha + crédito
6. 🔲 Tráfico y Documentación — DMC, BL, certificados
7. 🔲 Punto de Venta B2C — Caja simplificada
8. 🔲 Reportes y Analítica — Dashboards con gráficos
9. 🔲 Configuración — Usuarios, roles, bodegas

### Patrones de diseño a mantener:
```
Cada módulo tiene:
├── Lista principal (tabla con búsqueda + filtros)
│   ├── Stat cards arriba (contadores relevantes)
│   ├── Barra de búsqueda + filtros tipo badge
│   ├── Tabla con columnas relevantes
│   ├── Click en fila → abre detalle
│   └── Botón "+ Nuevo [elemento]"
├── Vista de detalle
│   ├── Header con info principal + badges de status
│   ├── Tabs para diferentes secciones
│   ├── Botones de acción contextuales
│   └── Breadcrumb o botón "Volver"
└── Formularios de creación/edición
    ├── Layout de 2 columnas para formularios grandes
    ├── Dropdowns con opción [+] crear nuevo
    ├── Validación visual
    └── Botones Guardar / Cancelar
```

### Datos mockeados adicionales sugeridos:
Para que la plataforma se vea poblada, agregar:
- 30-50 productos adicionales variados (whiskies, vodkas, rones, vinos, champañas, cervezas, tequilas)
- 10-15 clientes (BRAND DISTRIBUIDOR CURACAO, FREE ZONE SPIRITS INC, CARIBBEAN IMPORTS LLC, etc.)
- 5-8 órdenes de compra adicionales
- 3-5 cotizaciones en diferentes estados (borrador, pendiente aprobación, aprobada)
- 2-3 pedidos en proceso
- Historial de movimientos para varios productos

### Lo que NO hay que inventar:
- No inventar reglas de negocio que no estén documentadas aquí
- No agregar módulos que no se hayan mencionado
- Si algo no está claro, dejarlo como placeholder con nota "PENDIENTE DE DEFINIR"
- Los módulos no explorados (Ventas, Clientes, Tráfico) se construyen con la info de entrevistas y documento maestro, marcando claramente qué es confirmado vs. supuesto
