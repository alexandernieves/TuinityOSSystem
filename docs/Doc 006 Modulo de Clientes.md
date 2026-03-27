# DOCUMENTO 06 — MÓDULO: CLIENTES Y CUENTAS POR COBRAR

## Contexto
Este documento especifica el módulo de Clientes y Cuentas por Cobrar para la nueva plataforma de Evolution Zona Libre. Es el módulo que conecta el motor de ventas (Doc 05) con la gestión financiera de la cartera — sin clientes configurados correctamente, el pipeline B2B no puede operar. Sin cuentas por cobrar funcionales, Javier no sabe cuánto le deben ni quién está moroso.

**Prerequisito:** Leer Documentos 01, 02, 03, 04 y 05 antes de este documento.

---

## 1. QUÉ REEMPLAZA ESTE MÓDULO EN DYNAMO

En Dynamo, el módulo "Clientes" tiene **11 submódulos** (3 con submenús expandibles), funcionando como un sistema híbrido de directorio de clientes + cuentas por cobrar básicas + CRM rudimentario. Es el módulo con peor calidad de datos de todo Dynamo.

| # | Submódulo Dynamo | Qué hace | Estado | Destino en nueva plataforma |
|---|------------------|----------|--------|----------------------------|
| 1 | Consulta de Clientes | Ver ficha de cliente (5 tabs: Generales, Movimiento Histórico, Consulta General, Lista, Pasaporte/ID) | Funciona (data exposure) | → Clientes + CxC |
| 2 | Administración de Clientes | Crear/editar clientes de crédito (3 tabs: Generales, Pasaporte/ID, Ver Lista) | Funciona | → Clientes |
| 3 | Crear Cliente Contado | Formulario simplificado para clientes B2C/walk-in | Funciona | → Clientes (unificado) |
| 4 | Registro de Transacciones | Registrar cobros/pagos con conciliación manual a facturas | Funciona | → CxC |
| 5 | Anular Transacciones | Anular recibos/pagos sin aprobación | Funciona (RIESGO) | → CxC (con aprobación) |
| 6 | Análisis de Morosidad | Dashboard de cartera vencida con aging analysis | ❌ CRASH — No funciona | → CxC (construir desde cero) |
| 7 | Imprimir Estado de Cuentas | Generar estado de cuenta para un solo cliente | Funciona (limitado) | → CxC |
| 8 | Administración de Archivos > | 2 sub: Registro de Áreas/Sub-Áreas + Registro de Vendedores | Funciona (datos basura) | → Configuración |
| 9 | Reportes de Cuentas x Cobrar > | 6 reportes predefinidos tipo impresión | Funciona (estáticos) | → Reportes |
| 10 | Herramientas > | 3 sub: Imprimir Estado Cuenta en Lote, Cambio Código Cliente, Recálculo Saldo | Parcial (1 crasheado) | → CxC + Configuración |
| 11 | Consulta de Transacciones | Vista consolidada de facturas y pagos del período | Funciona | → CxC |

**Total en Dynamo:** 11 submódulos + 2 catálogos + 6 reportes + 3 herramientas = **22 pantallas separadas**

**En la nueva plataforma:** Dos módulos integrados — **CLIENTES** (ficha, directorio, configuración comercial) y **CUENTAS POR COBRAR** (cartera, cobros, morosidad, estados de cuenta). Los reportes van al módulo de Reportes. Los catálogos van a Configuración. Las herramientas se absorben como botones.

---

## 2. LO QUE DYNAMO HACE HOY — ANÁLISIS COMPLETO

### 2.1 Consulta de Clientes — 5 Tabs

Cliente de ejemplo analizado: **INVERSIONES SIMEON 333, C.A.** (Código 1006)

#### Tab 1: Generales (modo solo lectura)

**Campos capturados:**

| Campo | Tipo | Valor ejemplo | Notas |
|-------|------|---------------|-------|
| Código | Texto | 1006 | Formato completamente inconsistente en el catálogo |
| Nombre | Texto | INVERSIONES SIMEON 333, C.A. | Razón social del cliente |
| Identificación/RUC | Texto | J-501904235 | Identificación fiscal |
| DV | Número | 0 | Dígito verificador del RUC panameño |
| Tipo de Cliente | Dropdown | Extranjero | Opciones: Extranjero, Consumidor Final, otros |
| Tipo de Contribuyente | Dropdown | Natural | Opciones: Natural, Jurídico |
| País | Dropdown | F | ⚠️ BASURA — debería ser Venezuela |
| Ciudad | Dropdown | F | ⚠️ BASURA — debería ser Caracas |
| Código de Ubicación | Campo azul | (vacío) | Código geográfico de Panamá |
| Provincia / Distrito / Corregimiento | Textos | (vacíos) | Campos de Panamá, no aplican a extranjeros |
| Dirección | Texto (2 líneas) | PARCELA 63 URB LAS MERCEDES, CARACAS | — |
| Email 1 | Texto | SIMEONINVERSIONES333@GMAIL.COM | — |
| Email 2 | Texto | (vacío) | — |
| Celular | Texto | (vacío) | — |
| Teléfono 1 | Texto | 433-3676 | ⚠️ Este es el teléfono de EVOLUTION, no del cliente |
| Teléfono 2 | Texto | (vacío) | — |
| Vendedor | Dropdown | JAVIER LANGE | Vendedor asignado al cliente |

**Sección "CLIENTE EXTRANJERO" (panel derecho):**

| Campo | Valor ejemplo | Notas |
|-------|---------------|-------|
| Tipo Identificación | Pasaporte | Dropdown: Pasaporte, Cedula, Numero Tributario |
| Id. Extranjero | 084220749 | Identificación en país de origen |
| País Extranjero | VENEZUELA | País real del cliente |
| Representante Legal | MANUEL SANCHEZ | Contacto legal |
| Atención a | +58 4122399996 | Contacto directo (teléfono internacional) |
| Exento ITBMS | ☐ No marcado | Irrelevante en zona libre — todo es exento |
| Status | ☑ Activo | — |
| Saldo | 63.00 | Balance pendiente de pago |
| Nota | (vacío) | Campo de texto libre |

**Hallazgos:**
- Dualidad de identificación: RUC panameño (J-501904235) + ID extranjero (084220749) — necesario por regulación de Zona Libre
- Vendedor asignado a nivel de cliente → alimenta sistema de comisiones
- Teléfono internacional (+58) → clientes son extranjeros
- NO hay campo de nivel de precio (A-E) — esto se define por PRODUCTO, no por cliente. El vendedor elige manualmente el nivel al crear cotización/pedido. Este es un problema crítico que la nueva plataforma resuelve asignando nivel de precio por CLIENTE
- NO hay campo de condiciones de pago (30/60/90 días)
- Exento ITBMS no tiene sentido en zona franca (todo es exento allí)

#### Tab 2: Movimiento Histórico (estado de cuenta corriente)

Historial de transacciones con saldo running:

| Documento | Fecha | Días/Aplica | Transacción | Débito | Crédito | Saldo |
|-----------|-------|-------------|-------------|--------|---------|-------|
| R4511 | 10/07/25 | No aplica | Recibo | | 46,932.00 | -46,932.00 |
| 3822 | 21/07/25 | | Factura | 46,995.00 | | 63.00 |
| R4805 | 06/02/26 | No aplica | Recibo | | 4,130.00 | -4,067.00 |
| 4378 | 06/02/26 | 18 Días | Factura | 4,130.00 | | 63.00 |

**Aging Analysis (buckets en la parte inferior del tab):**

| 0-30 | 31-60 | 61-90 | 91-120 | 121+ | SALDO |
|------|-------|-------|--------|------|-------|
| 63.00 | 0.00 | 0.00 | 0.00 | 0.00 | 63.00 |

**Botones de filtro:** Aplicados | Pendientes | Separados — estados de conciliación de transacciones.

**Hallazgos:**
- Patrón: Recibo (pago) genera crédito → Factura genera débito → saldo residual
- Saldo de $63 desde julio 2025 sin reconciliar (diferencia menor que nadie cobró)
- "18 Días" en factura 4378 → probablemente días de crédito o días en que se pagó (pendiente confirmar)
- Aging muestra todo en bucket 0-30 = saldo corriente, sin morosidad real
- Los botones Aplicados/Pendientes/Separados permiten ver estados de conciliación

#### Tab 3: Consulta General (CRM básico + DATA EXPOSURE)

**Sección superior izquierda — Resumen del mes:**

| Concepto | Valor |
|----------|-------|
| Saldo Inicial del Mes | 63.00 |
| Débitos del Mes | 4,130.00 |
| Créditos del Mes | 4,130.00 |
| Saldo al 24/02/2026 | 63.00 |

**Sección superior derecha — Datos de crédito:**

| Concepto | Valor | Problema |
|----------|-------|----------|
| Límite de Crédito | **0.00** | ⚠️ NO CONFIGURADO — pero el cliente tiene saldo y factura normalmente |
| Fecha Última Factura | 06/02/2026 | — |
| Fecha Último Pago | 06/02/2026 | — |

**Sección media — Métricas por período:**

| Periodo | MES (Febrero) | AÑO (2026) | TOTAL (lifetime) |
|---------|---------------|------------|-------------------|
| Ventas | 4,030.00 | 4,030.00 | 50,925.00 |
| **Costos** | **3,655.49** | **3,655.49** | **45,248.59** |
| **Ganancia** | **374.51** | **374.51** | **5,676.41** |
| Pagos | 4,130.00 | 4,130.00 | — |

**Sección inferior:** Período de Venta personalizable (Desde/Hasta + Aceptar) + Botón "Ver Detalle por Producto"

**Hallazgos CRÍTICOS:**
- ⚠️ **DATA EXPOSURE:** Costos y Ganancia visibles para CUALQUIERA que entre a Consulta de Clientes. Un vendedor puede ver que el margen lifetime del cliente SIMEON 333 es 11.1%, y puede ver los costos exactos ($45,248.59 en costos sobre $50,925 en ventas)
- Febrero 2026: $4,030 ventas con $374 ganancia = **9.3% margen** (BAJO el threshold de comisión del 10% — el vendedor no comisiona sobre esta venta)
- Límite de Crédito en 0.00 pero el cliente tiene saldo y facturación activa → el campo existe pero el control NO funciona. Nunca se implementó enforcement
- "Ver Detalle por Producto" → drill-down por producto (no explorado)

#### Tab 4: Lista (directorio completo)

Tabla de todos los clientes con columnas: Código, Nombre, Identificación, Teléfono, Saldo, E-Mail, Celular.

**Clientes visibles con datos relevantes:**

| Código | Nombre | Identificación | Saldo | Observación |
|--------|--------|---------------|-------|-------------|
| 1006 | INVERSIONES SIMEON 333, C.A. | J-501904235 | 63.00 | Venezuela — cliente activo |
| 1201 | INVERSIONES DOÑA VICENTA | — | 20.00 | Saldo menor |
| 9999 | IC CARGO WORLDWIDE INC | — | 0.00 | ¿Transportista registrado como cliente? |
| A777 | ERNESTO SABALA | — | 0.00 | Código alfanumérico |
| AD01 | ALDEPOSITOS ZONA LIBRE | 467404-1-433769 | 0.00 | Empresa local |
| ARG23 | ARGOS COMMERCE INC | 84-2324521 | 0.00 | — |
| BR01 | BRANDS TRADING, S.A. | 155641338-2-2016 | 0.00 | — |
| BS01 | BLACK SAND CORP | 891573-1-512865 | 0.00 | — |
| C-098 | CARLOS MORENO | — | 0.00 | Sin datos |
| C-099 | APFIA | — | 0.00 | Sin datos |
| C0000073 | DEEPAK MIRPURI | — | 0.00 | Código largo |
| C2023-01 | DIVERMEX | — | 0.00 | Código con año |
| CL-411 | BRANDERSON JOSUE ARCIA CURBELO | 19.753.540 | 0.00 | — |
| CL-820 | DINORA S A S | — | **22,248.02** | ⚠️ Mayor saldo pendiente del catálogo |
| CL-001 | JAVIER LANGE | 3-701-831 | 0.00 | El DUEÑO registrado como cliente |

**Hallazgos:**
- ⚠️ **Códigos completamente inconsistentes:** 1006, 1201, 9999, A777, AD01, ARG23, BR01, BS01, C-098, C0000073, C2023-01, CL-411, CL-001. No hay convención alguna
- ⚠️ **Teléfono 433-3676 repetido en muchos clientes** = teléfono de Evolution usado como default cuando no se tenía el del cliente real
- ⚠️ **Clientes con datos completamente vacíos** — sin teléfono, sin email, sin identificación
- **DINORA S A S (CL-820): $22,248.02** es el mayor balance pendiente visible en todo el catálogo
- **JAVIER LANGE (CL-001):** el dueño está registrado como cliente — consumo personal o cortesías
- Muchos emails apuntan a CONTABILIDAD@EVOLUTIONZL.C... → email genérico de Evolution, no del cliente real

#### Tab 5: Pasaporte/ID

Visor de imagen para adjuntar copia de pasaporte del cliente extranjero. Tiene un marco de visualización con botón para cargar imagen.

**Estado:** Vacío, sin documento cargado. Concepto útil (KYC/compliance de zona libre) pero no utilizado en la práctica.

---

### 2.2 Administración de Clientes (formulario editable)

**3 tabs:** Generales | Pasaporte/ID | Ver Lista

**Tab Generales (formulario editable):**
Mismos campos que Consulta > Generales pero en modo edición. Diferencias clave:
- Todos los campos son editables
- Botones "Seleccionar País" y "Código de Ubicación" (ayudas de búsqueda)
- **Límite de CR.:** campo editable con formato de miles
- Status: ☑ Activo
- Saldo: campo de solo lectura (calculado, no editable)
- **Toolbar:** Nuevo, Editar, Eliminar, Imprimir, Copiar, Buscar, Navegación (◁ ▷)
- Botones: Guardar | Cancelar

**Hallazgos:**
- NO hay campo de nivel de precio (A-E) — CONFIRMADO que niveles se definen por producto, no por cliente
- NO hay campo de condiciones de pago (días de crédito 30/60/90)
- NO hay campo para asignar área/sub-área al cliente desde este formulario
- Vendedor default: JAVIER LANGE — se asigna desde aquí
- Formulario idéntico para edición y creación (el modo cambia con la toolbar)

---

### 2.3 Crear Cliente Contado — Formulario simplificado para B2C

**Propósito:** Creación rápida de clientes para la tienda B2C (planta baja) o ventas de contado. Formulario simplificado sin campos de crédito.

**Campos:**

| Campo | Tipo | Valor default | Notas |
|-------|------|--------------|-------|
| Código | Auto-generado | **Z0000080** | Prefijo "Z" + 7 dígitos secuenciales. DIFERENTE a clientes crédito |
| Tipo de Cliente | Dropdown | **Consumidor Final** | En crédito era "Extranjero". Aquí es cliente local |
| Tipo de Contribuyente | Dropdown | **Natural** | Persona natural por defecto |
| Nombre / Razón Social | Texto | (vacío) | Un solo campo |
| Identificación / RUC | Texto + DV | (vacío) + DV: 0 | RUC panameño con dígito verificador |
| País | Dropdown | **PANAMA** | Default Panamá (crédito default vacío o extranjero) |
| Ciudad | Dropdown | **CHIRIQUI** | ⚠️ Cargado con provincias, no ciudades reales |
| Código de Ubicación | Botón especial | **3-1-6** | Sistema geográfico de Panamá (Provincia-Distrito-Corregimiento) |
| Provincia | Auto (azul) | **COLON** | Se llena desde Código de Ubicación |
| Distrito | Auto (azul) | **COLON** | Se llena desde Código de Ubicación |
| Corregimiento | Auto (azul) | **CRISTOBAL** | Se llena desde Código de Ubicación |
| Dirección | Texto (2 líneas) | Placeholder: "Urbanización, Calle, Casa/Edificio #Local" | — |
| Email 1 / Email 2 | Texto | (vacío) | — |
| Celular / Teléfono 1 / Teléfono 2 | Texto | (vacío) | — |
| Vendedor | Dropdown | **JAVIER LANGE** | Default al dueño |
| Exento ITBMS | Checkbox | ☐ Exento de Impuesto | Relevante para B2C (ITBMS 7%) |

**Panel derecho:** Botón "Scanear Pasaporte ó Identificación" — funcionalidad de escaneo de documento.

**Botones:** Guardar | Cancelar

**Lo que NO tiene vs. Administración de Clientes (crédito):**
- ❌ Sin campo de Límite de Crédito
- ❌ Sin sección de Cliente Extranjero (Id. Extranjero, País Extranjero, Representante Legal)
- ❌ Sin campo de Saldo
- ❌ Sin campo de Status (activo/inactivo)
- ❌ Sin campo de Nota
- ❌ Sin toolbar de navegación — es solo un formulario de creación rápida, no tiene modo edición

**Hallazgos:**
- El prefijo "Z" en el código separa clientes contado de clientes crédito — convención no documentada
- El sistema de Código de Ubicación (3-1-6 = Provincia-Distrito-Corregimiento) es específico de Panamá — para el B2C local
- El checkbox "Exento ITBMS" es relevante aquí porque ventas B2C locales SÍ podrían llevar el 7% de impuesto, a diferencia del B2B zona franca
- CHIRIQUI en el campo "Ciudad" cuando es una provincia — el dropdown de Ciudad está cargado con provincias panameñas, no con ciudades. Inconsistencia de datos
- Es un formulario de SOLO creación — para editar hay que ir a Administración de Clientes

---

### 2.4 Registro de Transacciones (módulo de cobros)

**Propósito:** Registrar pagos recibidos de clientes y aplicarlos a facturas pendientes.

**Campos del formulario:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Tipo de Transacción | Dropdown | Tipos de pago: efectivo, cheque, transferencia, etc. |
| Fecha | Fecha (dd/mm/aaaa) | Fecha del cobro |
| Documento | Texto | Número de referencia del pago |
| Cliente... | Botón de búsqueda | Abre selector de clientes |
| Vendedor | Dropdown | Default: MARGARITA MORELOS — vendedora registra cobros |
| Monto | Numérico | Monto del pago |
| Tipo de Aplicado | Dropdown | Tipo de aplicación |

**Tabla "APLICAR A:" (conciliación manual pago-a-factura):**

| Columna | Descripción |
|---------|-------------|
| Documento | Número de factura pendiente |
| Fecha | Fecha de la factura |
| Total | Total de la factura |
| Saldo | Saldo pendiente de esa factura |
| Pago | Monto a aplicar a esa factura (editable) |

**Campos adicionales:**
- En Concepto de: campo de texto libre
- Valor: 9,999,999.99 (placeholder/máximo)
- Toolbar: Pre-Impreso (genera recibo imprimible)
- Botones: Guardar | Cancelar

**Hallazgos:**
- Conciliación es 100% manual: el usuario elige a qué factura aplica cada pago
- ⚠️ **Margarita (vendedora) registra cobros además de vender** — falta segregación de funciones. Quien vende no debería ser quien registra pagos
- Sin validación visible de que el monto coincida con el saldo de la factura
- Sin campo obligatorio de forma de pago detallado (número de cheque, referencia de transferencia, banco, etc.)

---

### 2.5 Anular Transacciones — SIN CONTROLES

**Propósito:** Reversar/anular recibos o pagos previamente registrados.

**Título:** "Proceso de anulación de Transacciones"

**Campos:** Mismo layout que Registro de Transacciones — Tipo de Transacción, Fecha, Documento, Cliente, Vendedor (MARGARITA MORELOS), Monto, Tipo de Aplicado. Tabla "APLICAR A:" con Documento, Fecha, Total, Saldo, Pago. Campo "En Concepto de" (texto libre).

**Botones:** Anular N/C | Cancelar

**Hallazgos — RIESGO FINANCIERO CRÍTICO:**
- ⚠️ **SIN flujo de aprobación** — no hay campo "Autorizado por" ni paso de supervisión
- ⚠️ **SIN razón obligatoria** — "En Concepto de" es texto libre y opcional
- ⚠️ **SIN confirmación doble** — un solo click anula la transacción
- ⚠️ **SIN límites por monto** — se puede anular un recibo de $50,000 sin supervisión
- ⚠️ **SIN audit trail** — no queda registro de quién anuló ni por qué
- Cualquier usuario con acceso al módulo de Clientes puede anular cualquier transacción financiera sin ningún tipo de control

---

### 2.6 Análisis de Morosidad — ❌ NO FUNCIONA

**Estado:** CRASH — El módulo se crashea al intentar abrirlo. Completamente inoperante.

**Impacto:** Sin esta herramienta, la única forma de ver el aging de la cartera es entrando **cliente por cliente** al Tab Movimiento Histórico y leyendo los buckets de la parte inferior. Para una cartera de decenas o cientos de clientes, esto es inviable. Javier probablemente no sabe con certeza cuánto le deben en total ni quién está en mora grave.

**Lo que DEBERÍA hacer (y que construimos nosotros):** Dashboard de cartera completa con aging visual (barras por bucket 0-30, 31-60, 61-90, 91-120, 121+), alertas automáticas de morosidad, ranking de clientes por saldo vencido, y acciones directas (enviar recordatorio, bloquear crédito, escalar a gerencia).

---

### 2.7 Imprimir Estado de Cuentas — Individual

**Propósito:** Generar estado de cuenta impreso para un solo cliente.

**Diálogo simple:**
- Ver Movimiento a partir del: (dd/mm/aaaa)
- Hasta: 26/02/2026
- Botón "Cliente..." para seleccionar
- Botones: Imprimir | Cancelar

**Buscador de clientes dentro del módulo:**
- Filtros: Búsqueda por código, nombre, ID
- Área: ARGENTINA | Sub-Área: AREQUIPA ← datos mal cargados (Arequipa es de Perú, no de Argentina)
- Filtro de Status: Excluir Inactivos / Incluir Inactivos
- Botones directos: "Crear Cliente" y "Modificar Cliente" desde aquí
- Checkbox "Búsqueda Continua"

**Hallazgos:**
- Solo un cliente a la vez — no hay opción de generación masiva (para eso existe la Herramienta de Lote)
- Permite crear/modificar clientes desde el buscador (práctico pero riesgo de duplicados sin validación)
- Áreas/Sub-Áreas con datos incorrectos confirmados

---

### 2.8 Administración de Archivos — 2 Catálogos Maestros

#### 2.8a Registro de Áreas y Sub-Áreas

**Estructura:** Área (País) → Sub-Áreas (Ciudad/Región)

**Áreas (países) registrados:** BELICE, BEYLIDUZU, BRASIL, BULGARIA, CHILE, CHINA, COLOMBIA, COSTA RICA, CUBA, CURACAO, ECUADOR, EL SALVADOR, EMIRATOS ARABES UNID, ESPAÑA, ESTADOS UNIDOS... (lista extensa)

**Sub-Áreas para Belice (ejemplo):** ARGENTINA, IQUIQUE ← COMPLETAMENTE INCORRECTOS. Argentina es un país, no una ciudad de Belice. Iquique es una ciudad de Chile, no de Belice.

**Campos por Área:** Nombre, Cod_País, Status (Activo)
**Campos por Sub-Área:** Nombre, Status (Activo)

**Hallazgos:**
- Este catálogo es el mapa de destinos de exportación de Evolution — valioso para saber a qué países venden
- Los datos están gravemente contaminados — sub-áreas asignadas a áreas incorrectas
- BEYLIDUZU probablemente es Beylikdüzü (Turquía) — mal escrito
- Concepto útil → en nuevo sistema: País/Ciudad o País/Región limpio y validado con datos estándar

#### 2.8b Registro de Vendedores — ⚠️ HALLAZGO CRÍTICO

| Nombre | Comisión | Status | Código |
|--------|----------|--------|--------|
| ARNOLD | 0.00% | A (Activo) | 05 |
| ASTELVIA WATTS | 0.00% | A (Activo) | 02 |
| JAVIER LANGE | 0.00% | A (Activo) | 01 |
| LUCIA FUENTES | 0.00% | A (Activo) | 04 |
| MARGARITA MORELOS | 0.00% | A (Activo) | 03 |

**Campos por vendedor:** Nombre, Comisión (%), Status, Código

**Hallazgos:**
- ⚠️ **TODOS tienen comisión en 0.00%** — campo existe pero NUNCA fue configurado
- Sistema a medio implementar: el módulo Ventas x Vendedor (Doc 05) calcula CUÁLES ventas comisionan (>10% margen), pero el % de comisión del vendedor está en 0 → nunca se calcula cuánto cobra realmente en dinero
- 5 vendedores registrados, todos con status Activo
- **ASTELVIA WATTS (02) y LUCIA FUENTES (04):** ¿siguen activas realmente? Nunca mencionadas en la operación diaria ni en las entrevistas
- **JAVIER LANGE (01):** el dueño es vendedor código 01 — vende directamente a clientes grandes
- **MARGARITA MORELOS (03):** vendedora principal confirmada. Es la que más factura
- **ARNOLD (05):** activo, mencionado en pedidos y facturas

---

### 2.9 Reportes de Cuentas x Cobrar — 6 Reportes Estáticos

| # | Nombre | Código | Descripción probable |
|---|--------|--------|---------------------|
| 1 | Auxiliar de Cuentas por Cobrar | 084 | Reporte maestro de CxC |
| 2 | Listado de Cobros | 088 | Historial de pagos recibidos |
| 3 | Listado de Facturas Pendientes | 086 | Facturas sin pagar |
| 4 | Listado de Saldo de Clientes | 087 | Balance por cliente |
| 5 | Listado de Transacciones | 052 | Movimientos generales |
| 6 | Movimiento de Saldos | 085 | Cambios en saldos |

**Filtros del Auxiliar de CxC (ejemplo):**
- Tipo de cliente: Clientes Créditos / Clientes Contado / Todos
- Seleccionar vendedores: Sí / No
- Rango de Fecha: Desde/Hasta + shortcuts (Hoy | Mes | Año)
- Botones: Imprimir | Cancelar

**Hallazgos:**
- Todos son reportes estáticos de "generar e imprimir/PDF" — sin interactividad, sin drill-down, sin gráficos
- Filtros básicos pero faltan: por país/área, por aging bucket, por monto mínimo, por vendedor
- En la nueva plataforma → módulo de reportes dinámico con filtros combinables y exportación a Excel/PDF

---

### 2.10 Herramientas — 3 Submódulos

#### 2.10a Imprimir Estado de Cuenta en Lote

**Propósito:** Generación MASIVA de estados de cuenta — resuelve la limitación del submódulo #7 que solo procesa un cliente a la vez.

**2 tabs de navegación:** Cliente | Área — permite filtrar por cliente individual o por área geográfica (país/región).

**Filtros:**
- Rango de Fecha de Transacciones: Desde (dd/mm/aaaa) — Hasta: 26/02/2026

**Tabla de selección:**

| Columna | Descripción |
|---------|-------------|
| Cliente | Código del cliente |
| Nombre | Nombre completo |
| Saldo | Balance pendiente |
| Status | Estado del cliente |
| Dirección | Dirección registrada |
| Imprimir | Checkbox/toggle para seleccionar cuáles imprimir |

**Nota al pie:** "[F3] Eliminar Líneas" + "[Doble Clic en la columna de Imprimir para cambiar el Valor]"

**6 botones de acción (barra inferior azul):**

| Botón | Función | Análisis |
|-------|---------|----------|
| Borrar Lista | Limpiar la selección actual | Utilidad de limpieza |
| **Cuentas Malas** | Filtrar clientes con cuentas en mal estado | Revela que Dynamo tiene concepto de "bad debt" — categorización de cartera buena/mala, aunque no se sabe el criterio exacto |
| **Clientes Inactivos** | Filtrar clientes inactivos | Para limpieza o reactivación |
| **Saldo Cero** | Filtrar clientes con saldo 0 | Para excluir de envío (no tiene sentido enviar estado de cuenta a quien no debe nada) |
| Imprimir Uno | Imprimir estado del seleccionado | — |
| Imprimir Todos | Imprimir todos los de la tabla | Generación masiva real |

**Hallazgos:**
- El botón "Cuentas Malas" confirma que Dynamo tiene un concepto de clasificación de cartera, pero no sabemos cómo define "mala" (¿por días de mora? ¿por monto? ¿manual?)
- El tab "Área" permite generar estados masivos por país — útil para envío a clientes de un país específico
- La tabla se carga vacía — hay que ejecutar un filtro o cargar clientes manualmente para poblarla

#### 2.10b Cambio de Código de Cliente

**Propósito:** Reasignar el código identificador de un cliente existente. Herramienta de mantenimiento de datos.

**Modal simple con 3 campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Cliente a Cambiar | Texto + [F5] Buscar | Código actual del cliente |
| Nombre | Auto (solo lectura) | Se llena al buscar el cliente |
| Nuevo Código | Texto | El nuevo código a asignar |

**Botones:** Cambiar Código | Cancelar

**Hallazgos:**
- Confirma que los códigos de cliente son editables manualmente — explica en parte la inconsistencia masiva de códigos (1006, A777, CL-411, C0000073, Z0000080)
- Sin validación de formato ni detección de duplicados — podrías asignar un código que ya existe
- Sin audit trail — no registra quién cambió el código, cuándo, ni el código anterior
- Sin confirmación de propagación — no hay indicación de si el cambio se propaga a facturas históricas, recibos, y demás transacciones

#### 2.10c Recálculo de Saldo — ❌ CRASH

**Estado:** ERROR — El módulo no funciona.

**Error exacto:** `"El archivo 'f:\dynamoevo\datacot\sdcchis.scx' no existe."`

**Botones del error:** Cancelar | Pasar por alto | Ayuda

**Análisis técnico:**
- La ruta `f:\dynamoevo\datacot\sdcchis.scx` revela que Dynamo está construido en **Visual FoxPro** (extensión .scx = formulario de Visual FoxPro). Esta tecnología fue **descontinuada por Microsoft en 2007** — hace casi 20 años
- El archivo `sdcchis.scx` probablemente es "Saldo de Cuentas Histórico" o similar — un formulario que ya no existe en el disco del servidor
- Este es el **segundo módulo crasheado** dentro de Clientes (junto con Análisis de Morosidad, submódulo #6)
- Ambos módulos crasheados son de la misma área: gestión de cartera. Evolution está operando su cartera de cuentas por cobrar sin herramientas de aging ni de recálculo

---

### 2.11 Consulta de Transacciones — Vista Consolidada

**Propósito:** Vista consolidada de todas las transacciones financieras (facturas emitidas y pagos recibidos) para un período seleccionado. Es el "libro diario" de cuentas por cobrar.

**Barra de filtros (header):**
- Campo de búsqueda con dropdown + lupa
- ☑ Búsqueda Continua (busca mientras escribes)
- **D** 26/02/2026 (Desde) — **H** 26/02/2026 (Hasta) — rango de fechas
- Shortcut: **Hoy 26/02/2026** (botón naranja con checkmark verde)
- Filtro **Tipo** (naranja) — filtrar por tipo de transacción (Factura, Pago, NC, ND, etc.)
- Filtro **Cliente** (naranja) — filtrar por cliente específico
- Botón **Excel** (esquina superior derecha, ícono XLS) — exportar a Excel (este SÍ funciona, a diferencia del de Inventario que estaba roto)

**2 botones de vista (footer izquierdo):** Documento | Cliente — alternar entre vista por documento individual o agrupada por cliente.

**Tabla de transacciones del día (26/02/2026 — datos reales):**

| Documento | Fecha | Tipo | Cliente | Nombre | Monto | Nota | Vendedor |
|-----------|-------|------|---------|--------|-------|------|----------|
| 4418 | 26/02/2026 | Factura | CL-032 | IMPORTACIONES SERVIMAS | 5,539.00 | memo | 03 |
| 4429 | 26/02/2026 | Factura | CL-032 | IMPORTACIONES SERVIMAS | 4,082.50 | memo | 03 |
| 4430 | 26/02/2026 | Factura | CL-1260 | G&S CONSTRUCTION N.V | 8,830.00 | memo | 03 |
| 4431 | 26/02/2026 | Factura | CL-1280 | JAWAD INTERNACIONAL CORP | 16,825.00 | memo | 03 |
| R4837 | 26/02/2026 | Pago | CL-780 | JOSE ANDRADE | 9,871.00 | memo | 03 |

**Panel de resumen (footer):**

| Concepto | Cantidad | Monto |
|----------|----------|-------|
| FACTURAS | 4 | $35,276.50 |
| RECIBOS | 1 | $9,871.00 |
| NOTA DE DEBITO | — | (vacío) |
| NOTA DE CREDITO | — | (vacío) |
| CHEQUES | — | (vacío) |
| CHEQ. DEVUELTOS | — | (vacío) |

**Hallazgos:**

**Clientes nuevos descubiertos:**
- **IMPORTACIONES SERVIMAS (CL-032):** 2 facturas el mismo día totalizando $9,621.50. Cliente activo y recurrente
- **G&S CONSTRUCTION N.V (CL-1260):** $8,830. El sufijo "N.V" indica empresa holandesa o de Curazao (Naamloze Vennootschap — equivalente a S.A. en jurisdicciones holandesas)
- **JAWAD INTERNACIONAL CORP (CL-1280):** $16,825. La factura más grande del día
- **JOSE ANDRADE (CL-780):** Registró pago de $9,871

**Vendedor "03" = MARGARITA MORELOS en TODAS las transacciones del día:** Confirma que Margarita es la vendedora más activa. También registra el recibo R4837 (cobro) — refuerza el hallazgo de que la vendedora registra cobros, un problema de segregación de funciones.

**Tipos de transacción soportados por Dynamo:** Factura, Pago, Nota de Débito, Nota de Crédito, Cheques, Cheques Devueltos. Los últimos 4 están vacíos hoy pero el sistema los soporta como tipos.

**Volumen del día:** $35,276.50 facturado + $9,871 cobrado. Proyectando al mes (~20 días hábiles) = ~$705K. Es un día por debajo del promedio mensual reportado de $1.47M (algunos días facturan significativamente más).

**Campo "Nota" muestra "memo" para todos** — probablemente un tipo de documento predefinido, no texto libre.

---

## 3. PROBLEMAS DETECTADOS QUE LA NUEVA PLATAFORMA DEBE RESOLVER

### 🔴 Críticos — Data Exposure y Controles Financieros

| # | Problema | Evidencia | Impacto | Solución |
|---|----------|-----------|---------|----------|
| 1 | **Costos y Ganancia visibles para todos** | Tab "Consulta General" muestra costos ($45,248.59) y ganancia ($5,676.41) del cliente para CUALQUIER usuario | Vendedores reverse-engineer márgenes por cliente y ajustan precios en consecuencia | Solo Gerencia/Compras/Contabilidad ven métricas financieras. Vendedores ven historial de ventas sin costos |
| 2 | **Anular transacciones sin aprobación** | Un click anula un recibo de cualquier monto. Sin autorización, sin razón obligatoria, sin audit trail | Riesgo de fraude financiero. Cualquiera puede borrar evidencia de cobros | Aprobación obligatoria de Gerencia + razón predefinida + audit trail completo |
| 3 | **Límite de crédito no enforced** | SIMEON 333 tiene límite en $0 pero factura normalmente. El campo existe decorativamente | Evolution extiende crédito sin control. No pueden bloquear clientes morosos automáticamente | Sistema bloquea cotización/pedido si excede crédito. Override solo con aprobación gerencial |
| 4 | **Análisis de Morosidad crasheado** | Módulo se crashea al abrirlo. No funciona | Javier no sabe cuánto le deben en total ni la antigüedad de la deuda | Dashboard de cartera completo con aging visual, alertas automáticas, acciones directas |
| 5 | **Recálculo de Saldo crasheado** | Error: archivo .scx no existe (Visual FoxPro descontinuado) | Si los saldos se descuadran, no hay forma de recalcular | Recálculo automático en tiempo real + botón admin de auditoría |

### 🔴 Calidad de Datos — Catálogo Corrupto

| # | Problema | Evidencia | Solución |
|---|----------|-----------|----------|
| 6 | **Códigos de cliente sin convención** | 1006, A777, AD01, C-098, C0000073, C2023-01, CL-411, Z0000080 — cada código tiene formato diferente | Código auto-generado: CLI-0001 secuencial. Inmutable. Sin edición manual |
| 7 | **País/Ciudad con basura** | País: "F", Ciudad: "F" para un cliente de Venezuela | Dropdowns validados con datos estándar (ISO 3166 para países) |
| 8 | **Teléfono de Evolution como default** | 433-3676 repetido en múltiples clientes — es el teléfono de la oficina, no del cliente | Campo obligatorio validado. Alertar si se detecta número de la empresa |
| 9 | **Áreas/Sub-áreas incorrectas** | Arequipa (Perú) como sub-área de Argentina. Argentina como sub-área de Belice | Catálogo limpio de países/regiones con datos validados |
| 10 | **Emails de Evolution en clientes** | Múltiples clientes con contabilidad@evolutionzl.com | Campo de email con validación. Alertar si dominio es @evolutionzl.com |
| 11 | **Clientes fantasma** | Registros sin datos — sin teléfono, sin email, sin identificación, saldo 0, sin actividad | Limpieza en migración. Status automático "Inactivo" si sin movimiento en 12+ meses |

### 🟡 Funcionalidad Limitada

| # | Problema | Evidencia | Solución |
|---|----------|-----------|----------|
| 12 | **Sin nivel de precio por cliente** | Niveles A-E se definen por producto. Vendedor elige manualmente → expone los niveles | Nivel de precio asignado al CLIENTE por Gerencia. Sistema lo aplica automáticamente. Vendedor no ve ni elige nivel |
| 13 | **Sin condiciones de pago** | No hay campo de días de crédito (30/60/90) | Campo obligatorio para clientes crédito: 30, 60, 90 días. Alimenta cálculo de morosidad |
| 14 | **Estado de cuenta solo individual** | Submódulo #7 procesa un cliente a la vez | Generación masiva con filtros + envío por email automático |
| 15 | **Reportes estáticos** | 6 reportes tipo "imprimir". Sin interactividad, sin drill-down, sin gráficos | Centro de reportes dinámico con filtros combinables |
| 16 | **Sin scoring de cliente** | No hay calificación crediticia basada en historial de pago | Scoring automático: puntualidad de pago, volumen, frecuencia, antigüedad |
| 17 | **Vendedora registra cobros** | Margarita aparece como vendedora Y como quien registra el pago R4837 | Segregación de funciones: solo Contabilidad/Administración registra cobros |
| 18 | **Formularios separados por tipo** | Crear Cliente Contado y Administración de Clientes son submódulos distintos | Un solo formulario con selector Crédito/Contado que muestra/oculta campos relevantes |
| 19 | **Comisiones sin configurar** | 5 vendedores con 0.00% de comisión. Campo existe pero nunca se llenó | Configuración real de % comisión por vendedor + cálculo automático de liquidación |

---

## 4. ESPECIFICACIÓN DEL MÓDULO EN LA NUEVA PLATAFORMA

### 4.1 Arquitectura — Dos Módulos Integrados

```
CLIENTES (Directorio + CRM)
├── Dashboard de Clientes (pantalla principal)
│   ├── Stat cards (Total activos, Nuevos este mes, Con saldo, Morosos)
│   ├── Búsqueda inteligente + filtros
│   ├── Tabla de clientes paginada
│   └── Click → Ficha del cliente
│
├── Ficha del Cliente (detalle)
│   ├── Tab General: datos del cliente, contacto, vendedor asignado
│   ├── Tab Comercial: nivel de precio, condiciones de pago, límite crédito
│   ├── Tab Historial: compras, facturas, pagos — SIN costos para vendedores
│   ├── Tab Documentos: pasaporte/ID, contratos, notas
│   └── Tab CxC: estado de cuenta, aging, alertas (solo roles autorizados)
│
├── Crear / Editar Cliente (formulario unificado)
│   ├── Selector: Crédito / Contado (muestra/oculta campos)
│   ├── Código auto-generado (CLI-XXXX)
│   ├── Validación en tiempo real
│   └── Detección de duplicados
│
└── Importar Clientes desde Excel (modal)

CUENTAS POR COBRAR
├── Dashboard de Cartera (pantalla principal)
│   ├── Stat cards (Total CxC, Corriente, Vencido 30+, Vencido 60+, Vencido 90+)
│   ├── Gráfico de aging visual (barras por bucket)
│   ├── Ranking de clientes por saldo vencido
│   └── Alertas de morosidad activas
│
├── Registrar Cobro (formulario)
│   ├── Seleccionar cliente → ver facturas pendientes
│   ├── Aplicar pago a facturas (manual o automático por antigüedad)
│   ├── Forma de pago detallada (transferencia, cheque, efectivo + referencia)
│   └── Solo Contabilidad/Administración — NO vendedores
│
├── Consulta de Transacciones (libro diario)
│   ├── Filtros por fecha, tipo, cliente, vendedor
│   ├── Resumen: facturas, recibos, NC, ND, cheques
│   └── Exportar a Excel
│
├── Estados de Cuenta (individual y masivo)
│   ├── Generar individual o por filtro (país, saldo, aging)
│   ├── Envío por email automático
│   └── Exportar PDF
│
└── Anulaciones (con aprobación)
    ├── Solicitar anulación → motivo obligatorio
    ├── Gerencia aprueba o rechaza
    └── Audit trail completo
```

### 4.2 Ficha del Cliente — Formulario Unificado

**Selector principal:** Tipo de Cliente → Crédito | Contado

Al seleccionar "Contado", se ocultan los campos de crédito (límite, condiciones de pago, representante legal). Al seleccionar "Crédito", aparecen todos los campos. Un solo formulario para ambos tipos — no dos submódulos separados.

**Código auto-generado:** CLI-0001, CLI-0002... formato consistente, inmutable, secuencial. Nunca editable por el usuario. Se genera al guardar por primera vez.

**Campos del formulario — Sección Identificación:**

| Campo | Tipo | Obligatorio | Visible para | Notas |
|-------|------|------------|-------------|-------|
| Código | Auto | — | Todos | CLI-XXXX inmutable |
| Nombre / Razón Social | Texto | SÍ | Todos | Campo principal de identificación |
| Tipo de Cliente | Dropdown | SÍ | Todos | Crédito / Contado |
| Tipo de Contribuyente | Dropdown | SÍ | Todos | Natural / Jurídico |
| Identificación / RUC | Texto | SÍ para Crédito | Todos | Con validación de formato |
| DV (Dígito Verificador) | Número | Si aplica | Todos | Auto-calculable para RUC panameño |
| País | Dropdown validado | SÍ | Todos | ISO 3166, datos limpios |
| Ciudad / Región | Dropdown filtrado por País | SÍ | Todos | Se filtra según país seleccionado |
| Dirección | Texto (2 líneas) | No | Todos | — |
| Ubicación Panamá | Código especial | Solo si País=Panamá | Todos | Provincia/Distrito/Corregimiento |

**Campos — Sección Contacto:**

| Campo | Tipo | Obligatorio | Notas |
|-------|------|------------|-------|
| Email principal | Email validado | SÍ para Crédito | Alertar si dominio = @evolutionzl.com |
| Email secundario | Email | No | — |
| Celular | Teléfono | SÍ para Crédito | Formato internacional (+XX) |
| Teléfono 1 / Teléfono 2 | Teléfono | No | Alertar si = 433-3676 (teléfono Evolution) |
| Representante Legal | Texto | Solo Crédito | Contacto legal — OCULTO si Contado |
| Atención a | Texto | No | Contacto operativo |

**Campos — Sección Comercial (SOLO para clientes Crédito):**

| Campo | Tipo | Obligatorio | Visible para | Notas |
|-------|------|------------|-------------|-------|
| **Nivel de Precio** | Dropdown (A-E) | SÍ | Solo Gerencia/Compras | NUEVO — no existía en Dynamo. Gerencia asigna nivel. Sistema lo aplica automáticamente al crear cotización |
| **Condiciones de Pago** | Dropdown | SÍ | Todos autorizados | NUEVO — 30, 60, 90 días. Alimenta cálculo de morosidad |
| **Límite de Crédito** | Numérico | SÍ | Solo Gerencia/Contabilidad | Con enforcement REAL — bloquea operaciones si se excede |
| Vendedor Asignado | Dropdown | SÍ | Todos | Alimenta comisiones. Dropdown de vendedores activos |
| Exento ITBMS | Checkbox | No | Todos | Solo relevante para B2C local |

**Campos — Sección Datos Extranjero (SOLO si País ≠ Panamá):**

| Campo | Tipo | Obligatorio | Notas |
|-------|------|------------|-------|
| Tipo Identificación | Dropdown | SÍ | Pasaporte, Cedula, Numero Tributario |
| ID Extranjero | Texto | SÍ | Identificación en país de origen |
| País Extranjero | Auto | — | Se llena desde el campo País principal |

**Campos — Status y Notas:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Status | Dropdown | Activo / Inactivo / Bloqueado / Suspendido |
| Notas internas | Texto largo | Solo visible internamente |

**Detección de duplicados:** Al escribir nombre o identificación, el sistema busca similares y pregunta "¿Es este el mismo cliente que [INVERSIONES SIMEON 333 — CLI-0042]?" antes de crear uno nuevo.

### 4.3 Dashboard de Cartera — Lo que el Análisis de Morosidad Debió Ser

**Stat Cards (parte superior):**

| Card | Dato | Color | Visible para |
|------|------|-------|-------------|
| Total CxC | Suma de todos los saldos pendientes | Azul | Gerencia, Contabilidad |
| Corriente (0-30 días) | Saldo dentro de términos | Verde | Gerencia, Contabilidad |
| Vencido 31-60 | Saldo en primer nivel de mora | Amarillo | Gerencia, Contabilidad |
| Vencido 61-90 | Segundo nivel de mora | Naranja | Gerencia, Contabilidad |
| Vencido 90+ | Mora grave | Rojo | Gerencia, Contabilidad |
| Cobros del Mes | Total cobrado en el mes | Verde | Gerencia, Contabilidad |

**Gráfico de Aging Visual (centro):**
Gráfico de barras horizontales o stacked bar mostrando la distribución de la cartera por bucket de antigüedad. Visual inmediato de la salud de la cartera. Lo que Dynamo nunca pudo mostrar porque el módulo está crasheado.

**Ranking de Clientes por Saldo (tabla principal):**

| Columna | Descripción |
|---------|-------------|
| Cliente | Código + nombre |
| Saldo Total | Balance pendiente total |
| Corriente | Dentro de términos |
| 31-60 | Primer nivel mora |
| 61-90 | Segundo nivel |
| 90+ | Mora grave |
| Última Factura | Fecha |
| Último Pago | Fecha |
| Días desde último pago | Calculado — alerta si > condiciones de pago |
| Alerta | Ícono: ✅ al día, ⚠️ próximo a vencer, 🔴 vencido |

**Acciones directas desde la tabla:**
- Click en cliente → abre ficha del cliente, tab CxC
- Botón "Enviar Estado de Cuenta" → genera y envía por email
- Botón "Bloquear Crédito" → suspende nuevas operaciones (requiere aprobación)
- Botón "Registrar Cobro" → abre formulario de cobro pre-llenado con el cliente

### 4.4 Registrar Cobro — Con Segregación de Funciones

**Quién puede:** SOLO Contabilidad (Jackie) y Administración (Estelia, Javier). Vendedores NO registran cobros — esto resuelve el problema de Margarita registrando pagos y vendiendo al mismo tiempo.

**Formulario:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Cliente | Búsqueda inteligente | Al seleccionar, muestra saldo y facturas pendientes |
| Fecha de cobro | Date picker | Default: hoy |
| Monto total | Numérico | Monto recibido |
| Forma de pago | Dropdown obligatorio | Transferencia, Cheque, Efectivo, Tarjeta |
| Referencia | Texto obligatorio | Número de transferencia, número de cheque, etc. |
| Banco | Dropdown | Si aplica (transferencia/cheque) |
| Observaciones | Texto | Notas adicionales |

**Tabla de aplicación (conciliación):**

| Columna | Descripción |
|---------|-------------|
| Factura | Número de factura pendiente |
| Fecha | Fecha de emisión |
| Vencimiento | Fecha de vencimiento calculada (fecha + días crédito) |
| Total | Monto original |
| Saldo | Lo que queda por pagar |
| Aplicar | Monto a aplicar (editable) |

**Modos de aplicación:**
- **Automático (NUEVO):** El sistema aplica el pago a las facturas más antiguas primero (FIFO). Un click
- **Manual:** El usuario elige a qué factura aplica cada porción del pago (como Dynamo, pero con mejor UX)

**Al guardar:** Se genera recibo automáticamente. Se actualiza saldo del cliente en tiempo real. Se registra en historial de movimientos.

### 4.5 Anulación de Transacciones — Con Aprobación Obligatoria

**Flujo (DIFERENTE a Dynamo donde es un click sin control):**

```
PASO 1: Usuario solicita anulación
    → Selecciona la transacción a anular
    → Selecciona motivo obligatorio (Error de registro, Duplicado, Devolución, Ajuste, Otro)
    → Escribe observación adicional si necesario
    → Status: "Pendiente de aprobación"

PASO 2: Gerencia recibe notificación
    → Ve el detalle completo de la transacción a anular
    → Ve el motivo y la observación
    → Puede aprobar o rechazar
    → Si rechaza: debe indicar razón
    → Status: "Aprobada" o "Rechazada"

PASO 3: Si aprobada → se ejecuta la anulación
    → Se reversa el efecto en el saldo del cliente
    → Se genera registro de auditoría completo
    → Queda: quién solicitó, quién aprobó, motivo, fecha, hora, monto
```

**Regla adicional:** Anulaciones de montos superiores a $5,000 requieren aprobación de JAVIER personalmente (no solo Estelia). Umbral configurable en Configuración.

### 4.6 Motor de Precios por Cliente (NUEVO — no existía en Dynamo)

**Problema que resuelve:** En Dynamo, los niveles de precio (A-E) se definen por producto y el vendedor elige manualmente el nivel al crear cada cotización. Esto expone los niveles y permite manipulación.

**Cómo funciona en la nueva plataforma:**

```
1. Gerencia asigna nivel de precio (A, B, C, D, o E) en la ficha del cliente
   → Campo "Nivel de Precio" en sección Comercial
   → Solo visible/editable para Gerencia y Compras

2. Vendedor crea cotización y selecciona cliente
   → Sistema obtiene automáticamente: nivel_precio = cliente.nivel
   → Sistema sugiere precio = producto.precio[nivel]

3. Vendedor agrega productos
   → Precio sugerido se llena automáticamente según nivel del cliente
   → Vendedor puede ajustar (arriba o abajo del sugerido)
   → Indicador de comisión se actualiza en tiempo real (🟢/🔴)

4. Vendedor NO sabe qué nivel tiene el cliente
   → No ve A, B, C, D, E
   → Solo ve el precio sugerido y el indicador de comisión
   → No puede reverse-engineer el costo
```

**Excepciones controladas:**
- Si vendedor pone precio debajo de nivel E (mínimo absoluto) → requiere aprobación gerencial con motivo
- Gerencia puede hacer override temporal por transacción específica
- Toda excepción queda registrada con audit trail

---

## 5. DATOS REALES PARA MOCK

### Clientes con saldo activo:

| Código | Nombre | País | Saldo | Vendedor | Tipo |
|--------|--------|------|-------|----------|------|
| 1006 | INVERSIONES SIMEON 333, C.A. | Venezuela | $63.00 | JAVIER LANGE | Crédito |
| 1201 | INVERSIONES DOÑA VICENTA | Desconocido | $20.00 | — | Crédito |
| CL-820 | DINORA S A S | Desconocido | $22,248.02 | — | Crédito |
| CL-032 | IMPORTACIONES SERVIMAS | Desconocido | (activo hoy) | MARGARITA (03) | Crédito |
| CL-1260 | G&S CONSTRUCTION N.V | Curazao (N.V) | (activo hoy) | MARGARITA (03) | Crédito |
| CL-1280 | JAWAD INTERNACIONAL CORP | Desconocido | (activo hoy) | MARGARITA (03) | Crédito |
| CL-780 | JOSE ANDRADE | Desconocido | (pagó hoy) | MARGARITA (03) | Crédito |

### Clientes descubiertos previamente (Doc 05):

| Código | Nombre | País | Tipo |
|--------|--------|------|------|
| CL-07 | MARIA DEL MAR PEREZ SV | El Salvador | Crédito |
| CL-509 | SULTAN WHOLESALE | Desconocido | Crédito |
| CL-077 | MEDIMEX, S.A. | Desconocido | Crédito |
| CL-896 | INVERSIONES DISCARIBBEAN SAS | Desconocido | Contado |
| CL-979 | GIACOMO PAOLO LECCESE TURCONI | Desconocido | Contado |
| CL-032 | PONCHO PLACE | Colombia | Contado |
| — | BRAND DISTRIBUIDOR CURACAO | Curazao | Recurrente |

### Vendedores confirmados:

| Código | Nombre | Comisión Config. | Status Real | Notas |
|--------|--------|-----------------|-------------|-------|
| 01 | JAVIER LANGE | 0.00% | Activo | Dueño, vende directamente a clientes grandes |
| 02 | ASTELVIA WATTS | 0.00% | Incierto | ¿Sigue activa? No mencionada en operación |
| 03 | MARGARITA MORELOS | 0.00% | Activo | Vendedora principal. Factura más que nadie |
| 04 | LUCIA FUENTES | 0.00% | Incierto | ¿Sigue activa? No mencionada en operación |
| 05 | ARNOLD | 0.00% | Activo | Segundo vendedor. Aparece en pedidos |

### Métricas del cliente ejemplo (SIMEON 333):

| Métrica | Valor |
|---------|-------|
| Lifetime ventas | $50,925.00 |
| Lifetime costos | $45,248.59 |
| Lifetime ganancia | $5,676.41 |
| Lifetime margen | 11.1% |
| Feb 2026 ventas | $4,030.00 |
| Feb 2026 margen | 9.3% (bajo threshold comisión) |
| Última factura | 06/02/2026 |
| Último pago | 06/02/2026 |
| Saldo actual | $63.00 (corriente 0-30) |

### Transacciones del día para mock (26/02/2026):

| Tipo | Cantidad | Total |
|------|----------|-------|
| Facturas | 4 | $35,276.50 |
| Recibos/Pagos | 1 | $9,871.00 |
| Notas de Débito | 0 | $0 |
| Notas de Crédito | 0 | $0 |

---

## 6. CONSOLIDACIÓN DE DYNAMO → NUEVA PLATAFORMA

| Dynamo (submódulo) | Nueva Plataforma (vista) | Mejora |
|--------------------|--------------------------|--------|
| Consulta de Clientes (5 tabs) | Ficha del Cliente (5 tabs reestructurados) | Sin data exposure. Tabs por rol |
| Administración de Clientes | Crear/Editar Cliente (unificado) | Un solo formulario Crédito/Contado |
| Crear Cliente Contado | Mismo formulario con selector | Elimina submódulo separado |
| Registro de Transacciones | Registrar Cobro | Solo Contabilidad. Conciliación auto/manual |
| Anular Transacciones | Anulaciones con Aprobación | Flujo obligatorio: solicitar → aprobar → ejecutar |
| Análisis de Morosidad (CRASH) | Dashboard de Cartera | Construido desde cero. Aging visual, alertas, acciones |
| Imprimir Estado Cuentas | Estados de Cuenta | Individual + masivo + envío email |
| Áreas/Sub-Áreas | Configuración → Catálogos | Datos limpios, validados |
| Registro de Vendedores | Configuración → Usuarios/Vendedores | Con % comisión real configurado |
| Reportes CxC (6) | Reportes → filtros dinámicos | Un centro de reportes, no 6 pantallas |
| Estado Cuenta Lote | Estados de Cuenta masivo | Con filtros + email automático |
| Cambio Código Cliente | ELIMINADO | Códigos inmutables auto-generados |
| Recálculo de Saldo (CRASH) | Automático + botón admin | Saldos en tiempo real |
| Consulta de Transacciones | Libro Diario CxC | Filtros dinámicos, resumen, exportar Excel |

---

## 7. ROLES Y VISIBILIDAD

| Dato | Vendedor | Gerencia (Javier/Estelia) | Contabilidad (Jackie) | Compras (Celly) |
|------|----------|--------------------------|----------------------|-----------------|
| Nombre/contacto cliente | ✓ | ✓ | ✓ | ✓ |
| País/dirección | ✓ | ✓ | ✓ | ✓ |
| **Nivel de precio (A-E)** | ✗ NUNCA | ✓ | ✓ | ✓ |
| **Límite de crédito** | Solo si excede | ✓ | ✓ | Solo lectura |
| **Saldo del cliente** | Solo sus clientes | ✓ Todo | ✓ Todo | ✗ |
| **Costos/ganancia por cliente** | ✗ NUNCA | ✓ | ✓ | ✓ |
| **Aging/morosidad** | ✗ | ✓ | ✓ | ✗ |
| Historial de compras | ✓ (sin costos) | ✓ (completo) | ✓ (completo) | Solo lectura |
| Registrar cobros | ✗ NUNCA | ✓ | ✓ | ✗ |
| Anular transacciones | ✗ | ✓ (aprobar) | Solicitar | ✗ |
| Crear/editar cliente | ✓ (básico) | ✓ (todo) | ✓ (todo) | ✗ |
| Cambiar nivel precio | ✗ | ✓ | ✗ | ✓ |
| Configurar límite crédito | ✗ | ✓ | ✓ | ✗ |

---

## 8. PREGUNTAS PENDIENTES PARA JAVIER

| # | Pregunta | Por qué importa |
|---|----------|-----------------|
| 1 | ¿Cómo decide el vendedor qué nivel de precio cobrar hoy? ¿Siempre es el mismo para cada cliente o varía por pedido? | Define la lógica de asignación automática de nivel por cliente |
| 2 | ¿Dónde se configuran los días de crédito (30/60/90)? ¿Es por cliente o es estándar para todos? | Define campo en ficha de cliente y cálculo de vencimiento |
| 3 | ¿ASTELVIA WATTS y LUCIA FUENTES siguen activas como vendedoras? | Limpieza de catálogo de vendedores para migración |
| 4 | ¿Por qué el % de comisión está en 0.00 para todos? ¿Se calcula fuera del sistema? ¿En Excel? | Define si hay que migrar una fórmula existente o crear una nueva |
| 5 | ¿El límite de crédito se usa activamente? ¿Quién lo configura? ¿Qué pasa cuando se excede? | Define el enforcement y flujo de aprobación |
| 6 | ¿Puede un cliente de contado convertirse en crédito? ¿Cuál es el proceso? | Define el flujo de "upgrade" de cliente |
| 7 | ¿Cómo gestionan la cartera vencida hoy sin el módulo de Morosidad funcionando? | Entender el workaround actual para diseñar la solución correcta |
| 8 | ¿"Días/Aplica" en Movimiento Histórico son días de crédito otorgados o días que tardó en pagarse? | Define interpretación correcta del campo para migración |
| 9 | ¿Qué criterio define una "Cuenta Mala" en el botón de Estado de Cuenta en Lote? | Define la lógica de clasificación de cartera |
| 10 | ¿Hay clientes que compran tanto B2B como B2C? ¿O son poblaciones separadas? | Define si necesitan ficha dual o son clientes independientes |

---

## 9. NOTAS PARA EL DESARROLLO

### Lo que se conserva de Dynamo:
- Estructura de datos del cliente (identificación dual: RUC panameño + ID extranjero)
- Concepto de aging por buckets (0-30, 31-60, 61-90, 91-120, 121+)
- Movimiento histórico tipo estado de cuenta corriente (débitos/créditos/saldo running)
- Asignación de vendedor a nivel de cliente
- Tipos de transacción: Factura, Pago/Recibo, Nota de Débito, Nota de Crédito, Cheque, Cheque Devuelto
- Concepto de Estado de Cuenta individual y masivo (lote)
- Código de Ubicación para clientes panameños (Provincia/Distrito/Corregimiento)

### Lo que se mejora radicalmente:
- Formularios separados (Contado vs Crédito) → formulario unificado con selector de tipo
- Códigos manuales inconsistentes → auto-generados e inmutables (CLI-XXXX)
- Costos/ganancia visible para todos → visibilidad estricta por rol
- Límite de crédito decorativo → enforcement real con bloqueo automático
- Nivel de precio manual por el vendedor → asignación automática por cliente
- Anulación sin control → flujo de aprobación con audit trail
- Conciliación solo manual → opción automática FIFO + manual
- Estado de cuenta solo impresión → generación + envío email masivo
- 22 pantallas separadas → 2 módulos integrados (Clientes + CxC)

### Lo que es completamente nuevo:
- Dashboard de cartera con aging visual (Morosidad crasheada → funcional)
- Nivel de precio asignado al CLIENTE (no al producto como hoy)
- Condiciones de pago configurables por cliente (30/60/90 días)
- Scoring de cliente basado en historial de pago
- Alertas automáticas de morosidad
- Segregación de funciones (vendedor ≠ cobra)
- Recálculo de saldos automático en tiempo real
- Detección de duplicados al crear cliente
- Envío de estados de cuenta por email
- Audit trail completo en todas las transacciones financieras
- Bloqueo automático de crédito por morosidad
- Configuración real de % de comisión por vendedor con cálculo de liquidación

---

## FIN DEL DOCUMENTO 06

Este documento cubre la totalidad del módulo de Clientes y Cuentas por Cobrar: desde la ficha del cliente hasta la gestión de cartera, incluyendo los cobros, las anulaciones con control, el dashboard de morosidad que Dynamo nunca pudo ofrecer, y la integración con el motor de precios por cliente que elimina la selección manual de niveles A-E.

Los siguientes documentos cubrirán:
- **Documento 07:** Módulo Tráfico y Documentación (DMC, BL, Certificados)
- **Documento 08:** Módulo Punto de Venta B2C
- **Documento 09:** Módulo Contabilidad
- **Documento 10:** Módulo Configuración y Administración
- **Documento 11:** Módulo Reportes y Analítica
