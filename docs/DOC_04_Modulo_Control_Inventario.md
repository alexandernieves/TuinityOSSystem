# DOCUMENTO 04 — MÓDULO: CONTROL DE INVENTARIO

## Contexto
Este documento especifica el módulo de Control de Inventario para la nueva plataforma de Evolution Zona Libre. Es el tercer módulo a construir. Sin inventario confiable, no se puede vender — es así de simple.

**Prerequisito:** Leer Documentos 01, 02 y 03 antes de este documento.

---

## 1. QUÉ REEMPLAZA ESTE MÓDULO EN DYNAMO

En Dynamo, los submódulos restantes de Inventario (los que NO son Productos ni Compras) son:

| Submódulo Dynamo | Qué hace | Estado | Explorado |
|------------------|----------|--------|-----------|
| Ajustes de Inventario | Sumar/restar stock manualmente | Funciona (sin aprobación) | ✅ |
| Transferencia de Mercancía | Mover mercancía entre bodegas | ROTO — nunca terminado | ✅ |
| Administración de Archivos > (8 sub) | Catálogos maestros (marcas, grupos, países, etc.) | Funciona pero datos sucios | ✅ |
| Reportes de Inventario > (11 reportes) | Reportes predefinidos con filtro de fecha | Funciona | ✅ |
| Herramientas > (10 sub) | Utilidades varias (etiquetas, importación, cambio precios) | Parcialmente funcional | ✅ |
| Inventario Físico > | Captura de conteo físico por zonas | Funciona pero último uso: 2015 | ✅ |
| Consulta Bajo Existencia Mínima | Lista de productos bajo stock mínimo | Funciona (es un filtro) | ✅ |

**Total en Dynamo:** 7 submódulos + 8 catálogos + 11 reportes + 10 herramientas = **36 pantallas separadas**

**En la nueva plataforma:** Un solo módulo **INVENTARIO** con vistas filtradas. Las herramientas se absorben como botones dentro de los módulos existentes. Los catálogos maestros van a Configuración. Los reportes van al módulo de Reportes.

---

## 2. LO QUE DYNAMO HACE HOY — ANÁLISIS COMPLETO

### 2.1 Ajustes de Inventario

**Para qué sirve:** Cuando la cantidad real en bodega no coincide con lo que dice el sistema, se hace un ajuste. Ejemplos: se rompieron 3 botellas (ajuste negativo), encontraron 5 cajas que no estaban registradas (ajuste positivo).

**Header del documento:**

| Campo | Tipo | Valor ejemplo | Notas |
|-------|------|---------------|-------|
| No. de Ajuste | Texto (auto) | AJ-00726 | Formato AJ-XXXXX, auto-generado |
| Fecha | Fecha | 24/02/2026 | — |
| Bodega | Dropdown | 01 | Bodega donde se hace el ajuste |
| Tipo | Dropdown | Positivo | Opciones: Positivo (sumar) o Negativo (restar) |
| Status | Texto | Pendiente (rojo) | Proceso de 2 pasos: se crea Pendiente y luego se Actualiza |

**Tabla de líneas:**

| Columna | Notas |
|---------|-------|
| Referencia | Producto a ajustar |
| Descripción | Auto-completado |
| Cantidad | Cantidad a sumar o restar |
| Costo | Costo del producto (visible para TODOS — problema) |
| Total | = Cantidad × Costo |
| Detalle | Campo de texto libre para el motivo |

**Atajos:** F3 Eliminar líneas, F5 Buscar referencia, F6 Copiar el Detalle a todas las Referencias, Esc Guardar

**Proceso de 2 pasos:**
1. Crear ajuste → Status: "Pendiente"
2. Click "Actualizar" → Status: cambia y el inventario se modifica

**Modal de búsqueda de ajustes:**
- Buscar por: "Caracteres Iniciales del Ajuste"
- Tabla: # Ajuste, Fecha, BOD, Observación, Actualizado
- Botón: "Ver Ajustes No Actualizados" — para ver pendientes

**PROBLEMA GRAVE:** No hay aprobación de supervisor. Cualquiera puede crear un ajuste y actualizarlo. El campo "Detalle" es texto libre — no hay motivos predefinidos. Y el costo es visible para todos.

### 2.2 Transferencia de Mercancía — COMPLETAMENTE ROTO

**Para qué sirve:** Mover mercancía de una bodega a otra. El caso principal: transferir cajas de la bodega B2B a la tienda B2C.

**Header:**

| Campo | Tipo | Notas |
|-------|------|-------|
| # Transferencia | Texto (auto) | — |
| Bodega Salida | Dropdown | De dónde sale |
| Bodega Entrada | Dropdown | A dónde llega |
| Fecha | Fecha | — |
| Observación | Texto libre | — |
| Status | Texto | — |

**Sistema de doble verificación (diseñado pero no funcional):**
- Tabla SUPERIOR: fila de ingreso con botones ✓ (confirmar) y ✗ (rechazar) por línea
- Tabla INFERIOR: líneas ya confirmadas (Código, Código de Barra, Descripción, Cantidad)
- La idea: una persona ingresa, otra confirma. Buen diseño, nunca funcionó

**Contadores:** Total de Piezas Referencia, Total de Piezas, Cantidad de Referencias

**Estado actual:** Ambos dropdowns de bodega muestran "BODEGA" — la tienda B2C nunca se configuró como bodega separada. El módulo nunca se terminó.

**Lo que debería hacer (y que construimos nosotros):**
- Transferir cajas de B2B → tienda B2C
- Convertir automáticamente: 1 caja = N botellas (según "Unidades por Caja" del producto)
- Asignar costo de transferencia INFLADO (no el costo real)
- Doble verificación: quien crea ≠ quien confirma en destino
- Mantener trazabilidad completa

### 2.3 Administración de Archivos — 8 Catálogos Maestros

Son las tablas de datos que alimentan los dropdowns del sistema. En Dynamo son 8 submódulos separados. En la nueva plataforma se integran inline (botón [+] en cada dropdown) y en Configuración para gestión masiva.

#### Registro de Grupos y Subgrupos
Dos paneles lado a lado. Al seleccionar un Grupo, muestra sus Sub-Grupos.

**Grupos registrados:** LICORES, VINO, CHAMPAÑA, CERVEZA, CIGARRILLO, BEBIDAS, AGUA, ENERGIZANTE, MULTIVITAMINICO, SUPLEMENTO, SNACKS, PRODUCTOS EN GENERAL, PUBLICIDAD, BOLSAS, SALUD

**Sub-Grupos de LICORES:** JEREZ, LICOR, LICOR CREMA, PISCO

**Problemas:**
- WHISKY, RON, VODKA, TEQUILA, GINEBRA, MEZCAL, BRANDY NO aparecen como Grupos aquí, pero SÍ aparecen como Grupo en la ficha de producto. Inconsistencia entre catálogo maestro y uso real
- Categorías como CIGARRILLO, MULTIVITAMINICO, SUPLEMENTO, PUBLICIDAD, BOLSAS, SALUD sugieren que Evolution vende o ha vendido productos mucho más allá de licores
- Cada Grupo tiene campos: Nombre, Inglés, Status (Activo)

#### Registro de Marcas — GRAVÍSIMO

**SOLO 6 marcas registradas para un distribuidor con cientos de productos:**

| Nombre | Código |
|--------|--------|
| BLACK & WHITE | 035 |
| BLACK & WHITE | 039 (DUPLICADA) |
| HENNESY | 038 |
| JP CHENET | 001 |
| SECO | 036 |
| VARELA | 040 |

Esto explica por qué casi todos los productos aparecen con marca "JP CHENET" — es código 001, probablemente el default. Marcas reales que faltan: Jack Daniels, Johnnie Walker, Glenfiddich, Chivas Regal, Absolut, Grey Goose, Don Julio, Clase Azul, Captain Morgan, Bacardi, Hendricks, Ciroc, Smirnoff, Crown Royal, Monkey Shoulder, Jameson, Barefoot, Veuve Clicquot, Freixenet, etc.

#### Registro de País de Origen

**Países registrados:** ALEMANIA, ARGENTINA, AUSTRALIA, BARBADOS, BELGICA, **CALIFORNIA** (no es un país), CHILE, COLOMBIA, CUBA, **ESCOCIA** (no es un país), ESPAÑA, ESTADOS UNIDOS, FRANCIA, GUATEMALA, HOLANDA... (lista continúa)

**Problemas:** CALIFORNIA y ESCOCIA no son países. A pesar de tener la lista, el campo en la ficha de producto muestra "PAIS ORIGEN (Renombrar)" — nadie lo usa.

#### Registro de Composición
**UN solo registro:** "COMPOSICION (Renombrar)" — código 001. Nunca configurado. Campo muerto.

#### Registro de Aranceles — BIEN MANTENIDO

| Código | Descripción |
|--------|-------------|
| 0000000000 | ARANCEL (Renombrar) — placeholder |
| 2005201000 | PAPITAS |
| 2201101000 | AGUA |
| 2202101000 | SODA |
| 2202904000 | BEBIDAS ENERGIZANTES |
| 2203000000 | CERVEZAS |
| 2204101000 | CHAMPAÑA |
| 2204300000 | VINO |
| 2208201000 | COGNAC-BRANDY-GEREZ |
| 2208309000 | WHISKY |
| 2208401000 | RON |
| 2208500000 | GINEBRA |
| 2208609000 | VODKA |
| 2208700000 | LICOR |
| 2208901100 | TEQUILA |

Este catálogo está limpio y es funcional. Importante para el módulo de Tráfico — Ariel agrupa la lista de empaque del DMC por estos códigos. Se migra directamente.

#### Registro de Código de Barra
Interfaz simple: seleccionar producto por referencia, agregar/eliminar códigos. Soporta múltiples por producto. En la nueva plataforma se integra directo en la ficha de producto.

#### Registro de Ubicación
Zonas dentro de bodega. No explorado en detalle. Va a Configuración.

#### Registro de Proveedor
Catálogo de proveedores. No explorado en detalle. Proveedores conocidos: GLOBAL BRANDS S.A., TRIPLE DOUBLE TRADING LLC, JP CHENET, ADYCORP. Se integra en Productos y Compras.

**Cómo se integra todo en la nueva plataforma:**
- Al crear/editar producto: cada dropdown tiene botón [+] para crear valor nuevo inline, sin salir del formulario
- Gestión masiva: Configuración → Catálogos Maestros → ver todos los valores, limpiar, importar, renombrar
- No son módulos ni submódulos separados — son datos de configuración

### 2.4 Reportes de Inventario — 11 Reportes Predefinidos

Cada reporte es una opción de una lista. Al seleccionar, pide rango de fechas (Desde/Hasta) con atajos Hoy/Mes/Año. Luego genera el reporte.

| # | Reporte | Código | Lo que muestra |
|---|---------|--------|----------------|
| 1 | Costo del Inventario | 112 | Valor total del inventario a costo |
| 2 | Listado de Compras | 153 | Historial de compras en período |
| 3 | Listado de Existencia | 111 | Stock actual de todos los productos |
| 4 | Listado de Órdenes de Compras Pendientes | 154 | OC no recibidas |
| 5 | Listado de Precios | 110 | Precios por producto y nivel |
| 6 | Listado de Referencias | 109 | Catálogo de productos |
| 7 | Listado de Transacciones | 157 | Movimientos de inventario |
| 8 | Reporte de Compras Total por Proveedor | 149 | Total comprado a cada proveedor |
| 9 | Reporte de Compras por Proveedor (Detalle) | 151 | Detalle línea por línea por proveedor |
| 10 | Reporte de Compras por Proveedor (Resumen) | 150 | Resumen por proveedor |
| 11 | Reporte de Compras por Proveedor y Producto | 152 | Cruce proveedor × producto |

**En la nueva plataforma:** Todo esto es UN centro de reportes con filtros dinámicos. Los 11 reportes son combinaciones de filtros (por fecha, por proveedor, por producto, agrupado por X), no pantallas separadas. Y los reportes que involucran costos/precios tienen visibilidad por rol.

### 2.5 Herramientas — 10 Utilidades Dispersas

| Herramienta | Qué hace | Dónde va en la nueva plataforma |
|-------------|----------|--------------------------------|
| Imprimir Etiquetas | Genera etiquetas de productos | Botón en módulo Productos |
| Imprimir Catálogo de Productos | Exporta/imprime listado | Botón "Exportar" en Productos |
| Cambio de Código de Producto | Cambiar referencia | Edición normal en ficha de Productos |
| Cambio de Precios | Cambio masivo de precios | Acción masiva en Productos (seleccionar varios → cambiar) |
| Reversar Entrada de Mercancía | Deshacer una recepción | Botón "Reversar" en detalle de orden en Compras |
| Importar y Actualizar Productos | Importación masiva | "Importar desde Excel" en Productos (ya documentado) |
| Importar Precios | Importar precios desde Excel | Parte de importación masiva en Productos |
| Importar Costos | Importar costos desde Excel | Parte de recepción en Compras |
| Importar Aranceles | Importar códigos arancelarios | Configuración → Catálogos Maestros |
| Recálculo de Existencia | Recalcular stock manualmente | Automático. Opción admin en Configuración |

**10 herramientas → 0 submódulos nuevos.** Todo se absorbe como botones o acciones dentro de módulos existentes.

### 2.6 Inventario Físico — Captura de Conteo Físico

**Para qué sirve:** Contar mercancía físicamente en bodega y comparar con el sistema.

**Último uso:** Código IF: **B01-2015-0** — el último conteo fue en 2015. Once años sin inventario físico.

**Header:**

| Campo | Valor |
|-------|-------|
| ZONA | (campo de texto — para contar por zonas de bodega) |
| Hoja # | (número de hoja) |
| Fecha | (fecha del conteo) |
| Codigo IF | B01-2015-0 |
| Usuario | TRAFICO001 |
| Bodega | (campo de texto) |
| Equipo | TRAFICO001 |

**Tabla (doble — misma estructura que Transferencias):**
- Tabla superior: ingreso (Código/UPC, Código de Barra, Descripción, Cantidad) con botones ✓/✗
- Tabla inferior: líneas confirmadas

**Contadores:** Total de Piezas de la Referencia (naranja), TOTAL DE PIEZAS (verde), Cantidad de Referencias (azul)

### 2.7 Consulta Bajo Existencia Mínima

**Para qué sirve:** Mostrar productos cuyo stock disponible está por debajo de la cantidad mínima configurada.

**Columnas:**

| Columna | Descripción |
|---------|-------------|
| Referencia | Código del producto |
| Descripción | Nombre completo |
| Código Barra | — |
| Cant.Mínima | Umbral configurado (casi todos en 20) |
| Existencia | Stock actual |
| Por Llegar | En tránsito |
| Separado | Comprometido |
| Disponible | Calculado |
| **Ult.Compra** | **Fecha de última compra — DATO NUEVO** |
| **Ult.Venta** | **Fecha de última venta — DATO NUEVO** |
| Marca | — |

**Productos estancados descubiertos (regla de Javier: max 4-6 meses):**

| Producto | Últ. Compra | Últ. Venta | Tiempo sin movimiento |
|----------|-------------|------------|----------------------|
| VODKA ABSOLUT FIVE MINI 18X5X50ML | 19/04/**2021** | 11/05/**2021** | **¡5 años!** |
| VODKA BELUGA ALLURE 6X700ML | 15/02/**2022** | 04/02/**2025** | 3 años sin compra |
| COGNAC HENNESY V.S.O.P MINI | 05/10/**2023** | 03/10/**2023** | 2+ años |
| WHISKY CHIVAS REGAL 12YRS S/C 24X200ML | 12/06/**2025** | 25/09/**2025** | ~6 meses |
| CHAMPAÑA FREIXENET ICE CORCHO 6X750ML | 25/11/**2025** | 17/12/**2025** | ~2 meses - OK |

**Productos nuevos descubiertos en esta vista:**
- TEQUILA CASAMIGOS BLANCO 6X1000ML 40%
- VODKA BELUGA NOBLE RUSSIAN 6X1000ML
- VODKA BELUGA ALLURE 6X700ML C/EST.
- CHAMPAÑA FREIXENET ICE CORCHO 6X750ML
- CHAMPAÑA FREIXENET CARTA NEV. S/SEC
- CHAMPAÑA FREIXENET MIA CLASSIC RED SAN
- LICOR YACHTING SEX ON THE BEACH 6X700ML
- GINEBRA BEEFEATER MINI 120X50ML

---

## 3. PROBLEMAS DETECTADOS QUE LA NUEVA PLATAFORMA RESUELVE

| # | Problema | Evidencia | Solución |
|---|----------|-----------|----------|
| 1 | Ajustes sin aprobación | Cualquiera crea y actualiza un ajuste sin supervisión | Flujo obligatorio: crear → supervisor aprueba → se aplica |
| 2 | Motivos de ajuste en texto libre | Campo "Detalle" libre, sin categorización | Motivos predefinidos: merma, rotura, robo, error de conteo, vencimiento, otro |
| 3 | Costos visibles en ajustes | Columna Costo visible para todos | Solo visible para roles autorizados |
| 4 | Transferencias completamente rotas | Módulo nunca terminó de funcionar | Módulo funcional con conversión caja→botella y costo inflado |
| 5 | Tienda B2C no configurada como bodega | Ambos dropdowns muestran "BODEGA" | Configurar bodega B2B y tienda B2C como ubicaciones separadas |
| 6 | Marcas — solo 6 para cientos de productos | JP CHENET como marca de todo | Catálogo completo con marcas reales |
| 7 | Placeholders nunca configurados | "PAIS ORIGEN (Renombrar)", "COMPOSICION (Renombrar)" | Datos reales. Campos obligatorios donde corresponda |
| 8 | Inventario físico sin uso desde 2015 | Código IF: B01-2015-0 | Conteo moderno con escáner de código de barras |
| 9 | Bajo existencia mínima sin acción directa | Solo muestra la lista, no permite actuar | Desde la alerta: botón directo "Crear Orden de Compra" |
| 10 | Productos estancados sin alerta | Absolut Five Mini lleva 5 años en bodega sin moverse | Alerta automática por regla de Javier (4-6 meses) |
| 11 | 36 pantallas separadas | 11 reportes + 10 herramientas + submódulos | Consolidado en módulo único con filtros y acciones |

---

## 4. ESPECIFICACIÓN DEL MÓDULO INVENTARIO EN LA NUEVA PLATAFORMA

### 4.1 Pantalla principal: Dashboard de Inventario

**Header:**
- Título: "Inventario"
- Botón principal: "+ Nuevo Ajuste"
- Botón: "Nueva Transferencia"
- Botón: "Conteo Físico"

**Stat cards:**

| Tarjeta | Qué muestra | Color |
|---------|-------------|-------|
| Productos con Stock | Productos con disponible > 0 | Verde |
| Bajo Mínimo | Disponible > 0 pero < cantidad mínima | Amarillo |
| Sin Stock | Disponible = 0 | Rojo |
| Estancados | Sin movimiento en 4+ meses (regla de Javier) | Naranja |
| Valor del Inventario | Valor total a costo CIF (solo roles autorizados) | Azul |
| Ajustes Pendientes | Ajustes creados esperando aprobación | Rojo si > 0 |

**Vista por defecto:** Lista de todos los productos con su stock, filtrable y ordenable.

**Filtros rápidos (badges):**
- Todos
- Con stock (verde)
- Bajo mínimo (amarillo)
- Sin stock (rojo)
- Estancados 4+ meses (naranja)
- Con mercancía por llegar (azul)

**Filtros avanzados:**
- Grupo / Sub-Grupo
- Marca
- Bodega (BODEGA B2B / TIENDA B2C / Todas)
- Proveedor (solo roles autorizados)

**Tabla:**

| Columna | Visible para | Notas |
|---------|-------------|-------|
| Descripción | Todos | Columna principal |
| Grupo | Todos | WHISKY, RON, etc. |
| Existencia | Todos | Stock físico |
| Por Llegar | Todos | En tránsito |
| Separado | Todos | Comprometido |
| Disponible | Todos | Color-coded: verde/amarillo/rojo |
| Cant. Mínima | Todos | Umbral configurado |
| Últ. Compra | Todos | Fecha última compra |
| Últ. Venta | Todos | Fecha última venta |
| Costo CIF | Solo Gerencia/Compras/Contabilidad | OCULTO para vendedores/tráfico/bodega |
| Valor en Stock | Solo Gerencia/Compras/Contabilidad | = Existencia × Costo CIF |
| Alerta | Todos | Ícono: ⚠️ bajo mín, 🔴 sin stock, 🐌 estancado |

### 4.2 Ajustes de Inventario — Con aprobación obligatoria

**Flujo completo:**

```
PASO 1: Bodega crea ajuste
    → Selecciona productos afectados
    → Indica cantidad y tipo (positivo/negativo)
    → Selecciona motivo predefinido
    → Escribe observación adicional si es necesario
    → Status: "Pendiente de aprobación"

PASO 2: Supervisor recibe notificación
    → Ve el ajuste propuesto con todos los detalles
    → Puede aprobar o rechazar
    → Si rechaza: debe indicar motivo
    → Status: "Aprobado" o "Rechazado"

PASO 3: Si aprobado → inventario se actualiza automáticamente
    → Queda en el historial de movimientos del producto
    → Registro completo: quién creó, quién aprobó, motivo, fecha, hora
```

**Formulario de nuevo ajuste:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Bodega | Dropdown | Bodega donde ocurrió |
| Tipo | Selector | Positivo (sumar) / Negativo (restar) |
| Motivo | Dropdown OBLIGATORIO | Merma, Rotura, Robo, Error de conteo, Vencimiento, Devolución, Otro |
| Observación | Texto libre | Detalle adicional opcional |
| Evidencia | Upload imagen/foto | Opcional — foto de mercancía dañada, etc. |

**Tabla de productos a ajustar:**

| Columna | Notas |
|---------|-------|
| Producto | Búsqueda con autocompletado |
| Stock actual | Solo lectura — lo que dice el sistema |
| Cantidad ajuste | Lo que se suma o resta |
| Stock resultante | Calculado = actual ± ajuste |
| Costo | SOLO visible para roles autorizados |

**DIFERENCIA CLAVE vs Dynamo:** El campo "Detalle" libre se reemplaza por motivos predefinidos categorizados. Esto permite después reportar: "este mes hubo $X en merma, $Y en rotura, $Z en vencimientos". Con texto libre eso es imposible.

### 4.3 Transferencias de Mercancía — Funcional (Dynamo nunca lo logró)

**Caso principal:** Transferir mercancía de Bodega B2B a Tienda B2C.

**Formulario de nueva transferencia:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Bodega origen | Dropdown | BODEGA (B2B) |
| Bodega destino | Dropdown | TIENDA (B2C), u otra bodega |
| Observación | Texto libre | — |

**Tabla de productos a transferir:**

| Columna | Notas |
|---------|-------|
| Producto | Búsqueda con autocompletado |
| Stock en origen | Solo lectura |
| Cantidad a transferir | En cajas (unidad B2B) |
| Unidades por caja | Del producto — para conversión automática |
| Unidades resultantes en destino | Calculado: cantidad × unidades por caja |
| Costo real | OCULTO — solo Gerencia/Compras |
| Costo de transferencia | El costo INFLADO que se asigna para B2C |

**Conversión automática B2B → B2C:**
```
Ejemplo: Transferir 5 cajas de Black & White (24 botellas por caja)
- Sale de BODEGA: -5 cajas
- Entra a TIENDA: +120 botellas (5 × 24)
- Costo real: $82.00 por caja → $3.42 por botella
- Costo transferencia: $95.00 por caja → $3.96 por botella (costo INFLADO)
```

**Doble verificación (conservamos de Dynamo):**
1. Persona A crea la transferencia → Status: "Enviada"
2. Persona B en destino confirma recepción → Status: "Recibida"
3. Si hay discrepancia (enviaron 5 cajas pero llegaron 4) → se registra la diferencia

**Regla:** La persona que crea la transferencia NO puede ser la que la confirma en destino.

### 4.4 Conteo Físico — Modernizado con escáner

**El proceso actual (Dynamo):** Manual, tedioso, no se ha hecho desde 2015.

**El proceso nuevo:**

**Paso 1 — Crear sesión de conteo:**
- Seleccionar bodega
- Seleccionar zona (o toda la bodega)
- Asignar usuario responsable
- Status: "En progreso"

**Paso 2 — Conteo en campo (celular o tablet):**
- Abrir la sesión de conteo desde el dispositivo móvil
- **Escanear código de barras** con la cámara del teléfono
- El sistema identifica el producto automáticamente
- Ingresar cantidad contada
- Siguiente producto → escanear → cantidad → siguiente
- También permite búsqueda manual por descripción (por si no tiene código de barras)

**Paso 3 — Comparación automática:**
Al cerrar el conteo, el sistema genera reporte de diferencias:

| Producto | Sistema dice | Conteo real | Diferencia | Acción |
|----------|-------------|-------------|------------|--------|
| Black & White 24×375ml | 43 | 40 | -3 | Crear ajuste |
| Chivas Regal 12×750ml | 119 | 119 | 0 | ✅ OK |
| Hendricks 12×1000ml | 28 | 30 | +2 | Crear ajuste |

**Paso 4 — Generar ajustes:**
- Las diferencias se convierten automáticamente en ajustes de inventario
- Motivo predefinido: "Diferencia en conteo físico"
- Van al flujo de aprobación normal (supervisor debe aprobar)

### 4.5 Alertas Automáticas

**Alerta de stock bajo:**
- Cuando disponible ≤ cantidad mínima → notificación a Compras
- Acción directa: botón "Crear Orden de Compra" desde la alerta

**Alerta de productos estancados (regla de Javier):**
- Producto sin movimiento (ni compra ni venta) en 4+ meses → alerta amarilla
- Producto sin movimiento en 6+ meses → alerta roja
- Dashboard muestra lista de estancados con última fecha de compra y venta
- Permite tomar acción: promover, liquidar, transferir a B2C con descuento

**Alerta de disponibilidad negativa:**
- BLOQUEANTE. Si cualquier operación dejaría disponible < 0, el sistema la bloquea
- Excepción: supervisor puede aprobar con motivo registrado

---

## 5. DATOS REALES DE EXISTENCIA MÍNIMA PARA MOCK

Productos bajo existencia mínima del Dynamo real:

| Descripción | Cant.Min | Exist. | Disp. | Últ.Compra | Últ.Venta |
|-------------|---------|--------|-------|-----------|----------|
| WHISKY BLACK & WHITE 24X375ML | 20 | 0 | 0 | 16/01/26 | 21/01/26 |
| WHISKY CROWN ROYAL CORCHO 12X1000ML | 20 | 2 | 2 | 18/06/25 | 19/02/26 |
| TEQUILA CASAMIGOS BLANCO 6X1000ML | 20 | 0 | 0 | 31/07/25 | 04/08/25 |
| PAPITAS PRINGLES ORIGINAL 14X149GR | 20 | 0 | 0 | 08/10/24 | 31/12/24 |
| WHISKY JACK DANIELS N°7 BLACK NR S/C 12 | 20 | 3 | 3 | 22/12/25 | 23/02/26 |
| WHISKY CHIVAS REGAL 12YRS S/C 24X200ML | 20 | 0 | 0 | 12/06/25 | 25/09/25 |
| VODKA ABSOLUT FIVE MINI 18X5X50ML | 20 | 0 | 0 | 19/04/21 | 11/05/21 |
| VODKA FINLANDIA 12X1000ML 40% | 20 | 0 | 0 | 12/08/25 | 24/02/26 |
| VODKA BELUGA NOBLE RUSSIAN 6X1000ML | 20 | 19 | 19 | 30/08/23 | 23/02/26 |
| CHAMPAÑA FREIXENET ICE CORCHO 6X750ML | 10 | 8 | 8 | 25/11/25 | 17/12/25 |
| VODKA BELUGA ALLURE 6X700ML C/EST. | 20 | 7 | 7 | 15/02/22 | 04/02/25 |
| LICOR YACHTING SEX ON THE BEACH 6X700M | 20 | 10 | 10 | 07/01/26 | 23/02/26 |
| COGNAC HENNESY V.S.O.P MINI 120X50ML | 20 | 0 | 0 | 05/10/23 | 03/10/23 |
| CHAMPAÑA FREIXENET CARTA NEV. S/SEC 24 | 20 | 3 | 3 | 25/11/25 | 17/12/25 |
| CHAMPAÑA FREIXENET MIA CLASSIC RED SAN | 20 | 15 | 15 | 29/05/24 | 07/01/26 |

---

## 6. RESUMEN DE PANTALLAS DEL MÓDULO

```
INVENTARIO
├── Dashboard de Inventario (pantalla principal)
│   ├── Stat cards (Con stock, Bajo mín, Sin stock, Estancados, Valor, Ajustes pend.)
│   ├── Filtros rápidos + avanzados
│   ├── Tabla de productos con stock, alertas, y fechas
│   └── Acciones: + Ajuste, + Transferencia, Conteo Físico
│
├── Ajustes de Inventario
│   ├── Lista de ajustes (pendientes, aprobados, rechazados)
│   ├── Crear ajuste (motivos predefinidos + aprobación obligatoria)
│   └── Flujo: Crear → Supervisor aprueba → Se aplica
│
├── Transferencias de Mercancía
│   ├── Lista de transferencias
│   ├── Crear transferencia (con conversión caja→botella para B2C)
│   ├── Costo de transferencia inflado para B2C
│   └── Doble verificación: creador ≠ confirmador
│
├── Conteo Físico
│   ├── Crear sesión de conteo
│   ├── Conteo con escáner de código de barras (móvil)
│   ├── Comparación automática sistema vs conteo
│   └── Generación automática de ajustes por diferencias
│
└── Alertas (integradas, no pantalla separada)
    ├── Stock bajo → notificación + botón crear OC
    ├── Estancados 4-6 meses → alerta + acciones
    └── Disponibilidad negativa → BLOQUEO
```

**Lo que se absorbió de Dynamo sin crear pantallas nuevas:**
- 11 Reportes de Inventario → Módulo de Reportes con filtros dinámicos
- 10 Herramientas → Botones dentro de Productos, Compras, Configuración
- 8 Catálogos Maestros → Inline [+] en formularios + Configuración para gestión masiva
- 1 Consulta Bajo Existencia Mínima → Filtro "Bajo mínimo" en dashboard

---

## 7. NOTAS PARA EL DESARROLLO

### Lo que se conserva de Dynamo:
- Formato AJ-XXXXX para ajustes
- Proceso de 2 pasos (crear → aplicar) — pero con aprobación en el medio
- Concepto de Positivo/Negativo para tipo de ajuste
- Doble verificación en transferencias (creador ≠ confirmador)
- Conteo por zonas de bodega
- Columnas Últ.Compra y Últ.Venta (datos valiosos)
- Catálogo de aranceles (bien mantenido, migrar directo)

### Lo que se mejora radicalmente:
- Ajustes SIN aprobación → CON aprobación obligatoria de supervisor
- Motivos en texto libre → motivos predefinidos categorizados
- Transferencias rotas → funcionales con conversión caja→botella y costo inflado
- Inventario físico manual → conteo con escáner desde celular
- Bajo existencia como submódulo → filtro automático con acción directa
- Costos visibles para todos → por rol
- 36 pantallas → módulo único consolidado

### Lo que es completamente nuevo:
- Dashboard con stat cards de inventario
- Alerta automática de productos estancados (regla de Javier 4-6 meses)
- Bloqueo de disponibilidad negativa a nivel de sistema
- Conteo físico con escáner de código de barras
- Comparación automática sistema vs conteo real
- Generación de ajustes desde diferencias de conteo
- Flujo de aprobación con notificaciones
- Registro de evidencia (fotos) en ajustes
- Catálogos maestros inline (botón [+]) sin salir del formulario

---

## FIN DEL DOCUMENTO 04

Próximo documento: **Documento 05 — Módulo: Ventas B2B**
Cubre: Pipeline Cotización → Aprobación → Pedido → Aprobación → Empaque → Factura, motor de precios con indicador de comisión, último precio vendido, enmiendas post-aprobación.
Requiere: Explorar el módulo de Ventas en Dynamo (aún no explorado).
