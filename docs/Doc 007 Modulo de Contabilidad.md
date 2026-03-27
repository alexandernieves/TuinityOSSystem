# DOCUMENTO 07 — MÓDULO: CONTABILIDAD

## Contexto
Este documento especifica el módulo de Contabilidad para la nueva plataforma de Evolution Zona Libre. La contabilidad es el módulo más abandonado de Dynamo — tiene estructura profesional pero cero datos operativos. Jackie (contabilidad) lleva todo fuera del sistema, probablemente en Excel. Esto significa que la nueva plataforma tiene una oportunidad enorme: construir contabilidad automática que se alimente directamente de las operaciones, eliminando la doble captura y generando estados financieros en tiempo real.

**Prerequisito:** Leer Documentos 01 a 06 antes de este documento.

---

## 1. QUÉ REEMPLAZA ESTE MÓDULO EN DYNAMO

En Dynamo, el módulo "Contabilidad" tiene **11 submódulos** principales (5 con submenús expandibles), totalizando **22+ pantallas**. La estructura es profesional y cubre el ciclo contable completo — plan de cuentas, asientos, estados financieros, conciliación bancaria, cierres mensuales y anuales, 12 reportes predefinidos. Sin embargo, **ninguno contiene datos operativos reales**. El módulo está completamente en desuso.

| # | Submódulo Dynamo | Qué debería hacer | Estado real | Destino nueva plataforma |
|---|------------------|-------------------|-------------|--------------------------|
| 1 | Transacciones del Mayor | Registrar asientos contables (journal entries) | Funciona, sin uso | → Contabilidad (automático) |
| 2 | Catálogo de Cuentas | Plan de cuentas maestro (chart of accounts) | Configurado, sin movimientos | → Configuración Contable |
| 3 | Consulta de Estados Financieros | P&L + Balance General mensual/anual | Vacío — período atrasado Oct 2025 | → Dashboard Financiero |
| 4 | Re-Imprimir Cheque | Reimprimir cheques emitidos | Sin cheques registrados | → Tesorería |
| 5 | Consulta de Cuentas | Libro auxiliar por cuenta contable | Sin movimientos | → Contabilidad |
| 6 | Procesos Especiales > | 4 sub: Actualización, Cierre Período, Asientos Fin de Año, Cierre Año | Todos sin datos/sin ejecutar | → Contabilidad (automatizado) |
| 7 | Administración de Archivos > | Catálogos auxiliares | ❌ NO FUNCIONA — Obsoleto | → Configuración |
| 8 | Reportes de Contabilidad > | 12 reportes predefinidos | Generarían PDFs vacíos | → Reportes Financieros |
| 9 | Herramientas > | Control de número de cheques | 12 bancos configurados, 0 cheques | → Tesorería |
| 10 | Conciliación Bancaria > | 3 sub: Conciliación, Imprimir, Saldo de Bancos | Nunca conciliado — todo $0.00 | → Conciliación Bancaria |
| 11 | Consulta de Transacciones | Libro diario contable con filtros | Vacío | → Contabilidad |

**Total en Dynamo:** 11 submódulos + 4 procesos especiales + 12 reportes + 3 conciliación + 1 herramienta = **~31 pantallas**

**En la nueva plataforma:** Un módulo integrado de **CONTABILIDAD** con contabilidad automática, dashboard financiero en tiempo real, conciliación bancaria simplificada, y reportes dinámicos. La diferencia fundamental: **los asientos se generan automáticamente desde ventas, compras, cobros e inventario — nunca más captura manual**.

---

## 2. LO QUE DYNAMO TIENE HOY — ANÁLISIS COMPLETO

### 2.1 Transacciones del Mayor (General Ledger)

**Propósito:** Registrar asientos contables manuales — el corazón de la contabilidad de partida doble. Es donde Jackie debería registrar ajustes, reclasificaciones, y movimientos que no provienen automáticamente de otros módulos.

**Header del formulario:**

| Campo | Tipo | Valor default | Descripción |
|-------|------|--------------|-------------|
| Documento | Texto | (vacío) | Número del comprobante/asiento |
| Fecha | Fecha | (vacío) | Fecha del asiento |
| Tipo | Dropdown | Comprobante | Tipo de documento contable |

**Toolbar:** Nuevo (ícono amarillo), Editar (lápiz), Eliminar (papelera), Imprimir, Copiar — operaciones CRUD estándar.

**Botón especial:** ⚙️ Rango de Cuenta (esquina superior derecha) — para filtrar por rango de cuentas contables.

**Tabla de líneas del asiento:**

| Columna | Descripción |
|---------|-------------|
| Cuenta | Código de la cuenta contable (del plan de cuentas) |
| Nombre | Nombre de la cuenta (auto-fill al ingresar código) |
| Débito | Monto al debe |
| Crédito | Monto al haber |
| Detalle | Descripción/concepto de la línea |

**Footer:**
- Shortcuts de teclado: [F3] Eliminar Líneas | [F5] Buscar Cuenta | [Esc] Guardar
- TOTALES: $ 0.00 (Débito) | $ 0.00 (Crédito) — deben cuadrar (D=C) para poder guardar
- Detalle: Campo de texto libre para descripción general del asiento
- # Pagaré: Campo numérico para vincular con un pagaré específico
- Botones: Guardar | Cancelar

**Hallazgos:**
- Contabilidad de **partida doble** estándar — débito debe igualar crédito
- El campo "# Pagaré" revela que Evolution maneja pagarés como instrumento de crédito — dato nuevo
- El tipo "Comprobante" en dropdown implica que puede haber otros tipos (Diario, Egreso, Ingreso, etc.)
- Tabla completamente vacía — no hay asientos cargados

---

### 2.2 Catálogo de Cuentas (Chart of Accounts)

**Propósito:** Plan de cuentas maestro — el catálogo de todas las cuentas contables de la empresa. Es la estructura sobre la cual se registran todos los movimientos financieros.

**Estructura de codificación:** `XXXX-YYY` donde XXXX = cuenta principal, YYY = sub-cuenta (000 = cuenta padre). Las filas en amarillo son cuentas padre (headers), las blancas son sub-cuentas.

**Cuentas visibles (sección de Activos):**

| Código | Nombre | Nivel | Tipo |
|--------|--------|-------|------|
| **1001-000** | **CAJA** | Padre | Activo Corriente |
| 1001-001 | CAJA MENUDA | Sub-cuenta | Caja chica / petty cash |
| 1001-002 | CAJA DE VENTAS 1 | Sub-cuenta | Caja registradora (¿B2C planta baja?) |
| 1001-003 | CAJA DE VENTAS 2 | Sub-cuenta | Segunda caja |
| 1001-004 | CAJA DE VENTAS 3 | Sub-cuenta | Tercera caja |
| **1002-000** | **BANCO** | Padre | Activo Corriente |
| 1002-001 | BANESCO | Sub-cuenta | Banco venezolano en Panamá |
| 1002-002 | BANISTMO | Sub-cuenta | Banco panameño (ex HSBC Panamá) |
| 1002-003 | CREDICORP BANK | Sub-cuenta | Banco panameño |
| 1002-004 | MULTIBANK | Sub-cuenta | Banco panameño |
| 1002-006 | BANCO GENERAL | Sub-cuenta | El banco más grande de Panamá |
| 1002-007 | BAC PANAMA | Sub-cuenta | BAC Credomatic Panamá |
| **1003-000** | **PLAZO FIJO** | Padre | Activo Corriente |
| 1003-004 | PLAZO FIJO NOMBRE DE BANC | Sub-cuenta | Nombre truncado/incompleto |
| **1101-000** | **CUENTAS POR COBRAR** | Padre | Activo Corriente |
| 1101-001 | CTAS. X COBRAR CLIENTES | Sub-cuenta | CxC de clientes comerciales |
| 1101-002 | ALDEPOSITOS | Sub-cuenta | Probablemente "A DEPÓSITOS" (anticipos) |

**Detalle de la cuenta seleccionada (1001-004 CAJA DE VENTAS 3):**

| Campo | Valor | Descripción |
|-------|-------|-------------|
| Cuenta | 1001-004 | Código |
| Nombre | CAJA DE VENTAS 3 | Nombre descriptivo |
| Status | ☑ Activo | Cuenta activa |
| Tipo | ACTIVO CORRIENTE | Clasificación contable (Current Asset) |
| Categoría | SUB-CUENTA | Es hija de 1001-000 CAJA |
| Nace por el | DEBITO | Naturaleza — cuentas de activo nacen por débito |

**Toolbar:** Nuevo, Editar, Eliminar, Imprimir, Copiar, Rango de Cuenta, Cuenta (vista), Excel (exportar).

**Filtro:** Dropdown "Todas" — filtra por tipo (Activo, Pasivo, Capital, Ingreso, Gasto).

**Hallazgos:**

1. **La codificación sigue el estándar contable:** 1XXX = Activos (1001 Caja, 1002 Banco, 1003 Plazo Fijo, 1101 CxC). Probablemente 2XXX = Pasivos, 3XXX = Capital, 4XXX = Ingresos, 5XXX = Gastos/Costos. Estructura profesional correcta.

2. **3 cajas de ventas + caja menuda** — al menos 3 puntos de cobro o cajas registradoras. Posiblemente: Caja 1 = B2C planta baja, Caja 2 = B2B planta alta, Caja 3 = auxiliar/eventos.

3. **Plazo Fijo (1003)** — Javier tiene inversiones a plazo fijo registradas contablemente. Dato de gestión patrimonial.

4. **Falta 1002-005** — salta de Multibank (004) a Banco General (006). La cuenta 1002-005 (ALLBANK) aparece en el Control de Cheques pero no en el Catálogo de Cuentas — inconsistencia entre módulos.

5. **"ALDEPOSITOS" (1101-002)** — nombre mal formateado, probablemente "A DEPÓSITOS". Podría ser anticipos de clientes o depósitos en garantía.

6. **"PLAZO FIJO NOMBRE DE BANC" (1003-004)** — nombre truncado, nunca corregido. Patrón típico de Dynamo: placeholder que se quedó.

---

### 2.3 Consulta de Estados Financieros

**Propósito:** Visualización de los estados financieros del período — Estado de Resultado (P&L / Income Statement) y Estado de Situación (Balance General / Balance Sheet). Es el reporte financiero más importante de cualquier empresa.

**Header:**
- Año: 2025 (seleccionable con dropdown)
- **Período Actual: Octubre 2025** — el sistema contable cree que estamos en octubre 2025, no en febrero 2026
- Botones: Preliminar (vista previa), Imprimir, Excel (exportar), Checkmark verde (¿ejecutar/cerrar?)

**2 tabs principales:** ESTADO DE RESULTADO | ESTADO DE SITUACIÓN

**Columnas del Estado de Resultado:**

| Columna | Descripción |
|---------|-------------|
| ENE - DIC | Tabs mensuales (enero a diciembre) |
| [Mes] 2025 | Monto del mes seleccionado |
| Hasta [Mes] 2025 | Acumulado YTD (year to date) |
| [Mes] 2024 | Mismo mes del año anterior (comparativo) |
| Hasta [Mes] 2024 | Acumulado año anterior |
| COMPARATIVO MENSUAL | Variación mes vs mes |

**Estructura del P&L (filas visibles):**

| Sección | Sub-cuentas | Descripción contable |
|---------|-------------|---------------------|
| **INGRESOS VENTAS** | Ingresos por Ventas → Total | Revenue / ventas netas |
| **DEVOLU. Y CONCE** | Desc. y Dev. en Ventas → Total | Devoluciones y concesiones |
| **COSTO DE VENTAS** | Costos, Desc. y Dev. en Compras → Total | COGS (Cost of Goods Sold) |
| **GASTOS GENERALES** | Gastos Generales, Honorarios... | Operating expenses (OpEx) |

**Hallazgos:**

1. ⚠️ **TODO COMPLETAMENTE VACÍO** — Sin datos para ningún mes de 2025. Confirma que la contabilidad no se lleva en Dynamo. Jackie hace esto fuera del sistema.

2. **Período atrasado 4+ meses** — El sistema cree que estamos en octubre 2025. Nunca se cerraron noviembre, diciembre, enero ni febrero. Esto significa que los procesos de cierre mensual (Procesos Especiales) tampoco se ejecutan.

3. **Estructura del P&L es correcta:** Ingresos → Devoluciones → Costo de Ventas → Gastos Generales. Es un estado de resultados estándar que cualquier contador reconocería.

4. **Tiene comparativo año anterior** — buena práctica (YoY comparison), pero inútil sin datos.

5. **"DEVOLU. Y CONCE" (Devoluciones y Concesiones)** y **"DESC. Y DEV. EN COMPRAS" (Descuentos y Devoluciones en Compras)** — el sistema tiene la capacidad de registrar devoluciones tanto en ventas como en compras contablemente.

---

### 2.4 Re-Imprimir Cheque

**Propósito:** Reimprimir un cheque previamente emitido desde Dynamo. No es para crear cheques nuevos — solo reimpresión.

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Lista de Cheques | Dropdown | Selector del cheque a reimprimir |
| Cheque No. | Texto | Número del cheque |
| Fecha | Fecha | Fecha de emisión |
| Páguese a la Orden de | Texto | Beneficiario |
| B/. | Numérico | Monto en **Balboas** (moneda panameña, paridad 1:1 con USD) |

**Tabla de detalle contable:** Cuenta | Detalle | Débito | Crédito

**Campo adicional:** Comentario (texto libre)

**Botones:** Imprimir | Cancelar

**Aviso mostrado:** "No Hay Cheques para Imprimir en esta Fecha"

**Hallazgos:**
- **"B/." = Balboas** — primera aparición de moneda local en Dynamo. Todo lo demás ha sido en USD. Cheques a proveedores locales podrían ser en Balboas (paridad 1:1 con USD)
- Es RE-imprimir, no emitir — la emisión original se haría desde Transacciones del Mayor
- El detalle contable incluye Débito/Crédito — el cheque genera asiento automático (DB gasto/proveedor, CR banco)
- Sin cheques registrados hoy, pero no necesariamente abandonado — podrían emitir cheques semanalmente

---

### 2.5 Consulta de Cuentas (Libro Auxiliar)

**Propósito:** Ver el detalle de movimientos de una cuenta contable específica — el equivalente al estado de cuenta bancario pero para cualquier cuenta del plan de cuentas. Es la herramienta de auditoría por excelencia.

**Header:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Cuenta # | Texto | Código de la cuenta a consultar (ej: 1002-001) |
| Nombre | Auto (solo lectura) | Se llena al ingresar el código |
| Saldo Anterior | Auto | Saldo de arrastre del período anterior |

**Toolbar:** Nuevo, Navegación (⏮ ◁ ▷ ⏭), Imprimir, Excel, Filtro (naranja), D (Desde fecha), H (Hasta fecha), Checkmark (ejecutar), Búsqueda (lupa).

**Tabla de movimientos:**

| Columna | Descripción |
|---------|-------------|
| Documento | Número del comprobante/asiento origen |
| Fecha | Fecha del movimiento |
| Detalle | Descripción/concepto |
| Débito | Monto al debe |
| Crédito | Monto al haber |
| Saldo | Saldo running después de cada movimiento |

**Footer:** Botón "Documento" (drill-down al comprobante origen) + Saldo final.

**Hallazgos:**
- Tabla vacía — sin cuenta seleccionada y sin movimientos en el sistema
- El botón "Documento" permite trazar desde un movimiento hasta su asiento original — buena trazabilidad
- Navegación secuencial entre cuentas (⏮ ◁ ▷ ⏭) — práctico para auditoría

---

### 2.6 Procesos Especiales — 4 Submódulos (todos sin uso)

#### 2.6a Actualización de Transacciones

**Propósito:** Tomar las transacciones del período (ventas, compras, cobros registrados en otros módulos) y convertirlas en asientos contables. Es el "puente" entre la operación diaria y la contabilidad formal.

**Período mostrado:** Octubre 2025
**Aviso:** "No Hay Transacciones de este Periodo por Actualizar"
**Tabla:** Documento | Fecha | Cuenta | Nombre de la Cuenta | Débito | Crédito | Detalle
**TOTALES:** $0.00 | $0.00

**Hallazgo crítico:** Este submódulo revela la ARQUITECTURA del problema. En Dynamo, la contabilidad no es automática — requiere que alguien ejecute manualmente este proceso para que las facturas, cobros y compras se conviertan en asientos contables. Si nadie lo ejecuta (como es el caso), los estados financieros quedan vacíos aunque el sistema de ventas sí tenga datos. Es un diseño de los años 90 que separa operación de contabilidad con un proceso batch manual.

#### 2.6b Cierre del Periodo Mensual

**Modal:** "Cierre del Periodo Mensual Contable"
**Período a Cerrar:** Octubre 2025
**Botones:** Cerrar | Cancelar

**Hallazgo:** El último período abierto es octubre 2025. Nunca cerraron octubre, nunca abrieron noviembre, diciembre, enero ni febrero. **4 meses sin cierre contable** (al 26 de febrero de 2026). Confirma abandono total del módulo.

#### 2.6c Generar Asientos de Fin de Año

**Propósito:** Generar los asientos de cierre del año fiscal — depreciación, provisiones, ajustes de inventario, reclasificaciones de fin de año.

**Año:** 2025
**Botones:** Generar Asientos | Actualizar
**Tabla vacía, TOTALES:** $0.00 | $0.00

Sin datos porque no hay transacciones contables registradas en todo 2025.

#### 2.6d Cierre del Año Contable

**Modal:** "Cierre del Año Contable"
**Año Contable a cerrar:** 2025
**Botones:** Cerrar | Cancelar

**Propósito:** Cerrar el año fiscal, trasladar utilidades/pérdidas a la cuenta de capital (utilidades retenidas), y abrir el año contable nuevo. No ejecutado — 2025 permanece abierto.

---

### 2.7 Administración de Archivos — ❌ NO FUNCIONA

**Estado:** Completamente obsoleto/inoperante. Otro módulo abandonado dentro de Contabilidad. No se pudo abrir.

---

### 2.8 Reportes de Contabilidad — 12 Reportes Predefinidos

| # | Nombre | Código | Categoría | Descripción |
|---|--------|--------|-----------|-------------|
| 1 | Listado de Transacciones | 091 | Operativo | Listado de todos los asientos contables |
| 2 | Auxiliar de Cuenta | 114 | Operativo | Detalle de movimientos por cuenta |
| 3 | Balance de Prueba | 115 | Estado financiero | Sumas y saldos de todas las cuentas |
| 4 | Balance de Prueba Gastos | 116 | Estado financiero | Extracto solo de cuentas de gasto |
| 5 | Estado de Resultado | 117 | Estado financiero | P&L — pérdidas y ganancias |
| 6 | Estado de Situación | 118 | Estado financiero | Balance General |
| 7 | Análisis Estado de Resultado | 119 | Análisis | Variaciones y comparativos del P&L |
| 8 | Análisis Estado de Situación | 120 | Análisis | Variaciones del Balance |
| 9 | Análisis de Gastos | 121 | Análisis | Desglose y análisis de gastos |
| 10 | Preliminar Estado de Resultado | 122 | Pre-cierre | P&L preliminar antes de cerrar período |
| 11 | Preliminar Estado de Situación | 123 | Pre-cierre | Balance preliminar |
| 12 | Preliminar Gastos | 124 | Pre-cierre | Gastos preliminar |

**Interfaz:** Lista de reportes con búsqueda + botón Ejecutar. Cada reporte abre un diálogo de filtros (fecha, cuenta, etc.) y genera PDF/impresión.

**Hallazgos:**
- Estructura profesional bien organizada: operativos → estados financieros → análisis → preliminares. Cubre el ciclo contable completo.
- Los prefijos con guión bajo (_) en Análisis y Preliminar sugieren que fueron extensiones agregadas después.
- **Balance de Prueba (115)** es el reporte clave — verifica que débitos = créditos para todas las cuentas. Sin datos, generaría un PDF vacío.
- Todos son reportes estáticos tipo "generar e imprimir" — sin interactividad, sin drill-down, sin gráficos.

---

### 2.9 Herramientas > Control de Número de Cheques

**Propósito:** Configurar y controlar la secuencia de chequeras por cada cuenta bancaria. Cada banco tiene su propia numeración de cheques independiente.

**Tabla — Lista COMPLETA de bancos de Evolution:**

| Cuenta | Banco | Prefijo | # Último Cheque | Activo |
|--------|-------|---------|----------------|--------|
| (sin código) | EFECTIVO EN BANCO | (vacío) | (vacío) | ☑ |
| 1002-001 | BANESCO | (vacío) | (vacío) | ☑ |
| 1002-002 | BANISTMO | (vacío) | (vacío) | ☑ |
| 1002-003 | CREDICORP BANK | (vacío) | (vacío) | ☑ |
| 1002-004 | MULTIBANK | (vacío) | (vacío) | ☑ |
| 1002-005 | **ALLBANK** | (vacío) | (vacío) | ☑ |
| 1002-006 | BANCO GENERAL | (vacío) | (vacío) | ☑ |
| 1002-007 | BAC PANAMA | (vacío) | (vacío) | ☑ |
| 1002-008 | **ST GEORGE BANK** | (vacío) | (vacío) | ☑ |
| 1002-009 | **METRO BANK** | (vacío) | (vacío) | ☑ |
| 1002-010 | **BANCO MERCANTIL** | (vacío) | (vacío) | ☑ |
| 1002-011 | **BANCO OF CHINA** | (vacío) | (vacío) | ☑ |
| 1002-012 | NUEVO | (vacío) | (vacío) | ☐ Inactivo |

**Hallazgos:**

1. **12 bancos registrados, 11 activos** — cantidad impresionante para una empresa del tamaño de Evolution. Refleja la naturaleza multi-país del negocio de zona libre: necesitan bancos diversos para recibir pagos de clientes en distintas jurisdicciones y pagar a proveedores internacionales.

2. **BANCO OF CHINA (1002-011)** — confirma relación comercial con China/Asia. Consistente con importación de productos de consumo masivo.

3. **BANCO MERCANTIL (1002-010) y BANESCO (1002-001)** — ambos de origen venezolano. Tiene sentido: muchos clientes de Evolution son venezolanos.

4. **ST GEORGE BANK (1002-008)** — banco especializado en operaciones de Zona Libre de Colón. Banco nicho del sector.

5. **# Último Cheque está VACÍO para todos** — la emisión de cheques desde Dynamo no se usa. Se emiten manualmente o desde otro sistema.

6. **ALLBANK (1002-005) aparece aquí pero NO en el Catálogo de Cuentas** — inconsistencia. Los bancos 005 a 011 probablemente se agregaron en este módulo sin actualizar el plan de cuentas.

7. **"NUEVO" (1002-012)** — placeholder genérico sin configurar, inactivo. Patrón Dynamo: campos creados "por si acaso" pero nunca completados.

---

### 2.10 Conciliación Bancaria — 3 Submódulos

#### 2.10a Conciliación de Bancos

**Propósito:** Reconciliar el saldo contable (libros de Evolution) con el saldo del estado bancario (extracto del banco). Proceso mensual estándar para detectar diferencias.

**Toolbar:** Conciliación | Chk.Circulación (Cheques en Circulación) | Dep.Tránsito (Depósitos en Tránsito) | Guardar | Cerrar Conciliación

**Header:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Banco | Dropdown | Seleccionar banco a conciliar |
| Cuenta | Auto | Código contable del banco |
| Fecha | Fecha | 26/02/2026 |
| Saldo Banco | Input manual | Saldo del estado bancario (lo que dice el banco) |

**3 Tabs de filtro:**
- CHEQUES Y N/DR — Cheques emitidos y Notas de Débito
- DEPÓSITOS Y N/CR — Depósitos recibidos y Notas de Crédito
- TODAS — Todas las transacciones

**Tabla:** Ok (checkbox para marcar conciliados) | Documento | Monto | Fecha | Detalle

**Panel de conciliación (footer) — Método estándar de reconciliación:**

| Lado Libros (izquierda) | Lado Banco (derecha) |
|------------------------|---------------------|
| Saldo según Libros al [fecha] | Saldo Final Banco (input) |
| + Depósitos Ok | + Depósitos en Tránsito |
| - Cheques Ok | - Cheques en Circulación |
| = **Saldo Final Libros al 26/02/2026** | = **Saldo igual Libros al** |
| | **Diferencia** (campo ROJO — debe ser $0) |

**Botón:** ☑ Todos (seleccionar/deseleccionar todos)

**Hallazgos:**
- La estructura es **profesional y correcta** — método estándar de conciliación bancaria
- El campo "Diferencia" en ROJO es buena UX — alerta visual cuando no cuadra
- Todo vacío — sin banco seleccionado y sin datos
- Para 12 bancos, la conciliación manual sería trabajo de varios días al mes. Probablemente la hacen en Excel

#### 2.10b Imprimir Conciliación Bancaria

**Título:** Saldo de Bancos Conciliados
**Filtro:** Banco (dropdown)
**Tabla:** Cuenta | Fecha | Mes | Saldo | Cierre
**Estado:** Todo vacío — historial de conciliaciones cerradas. Sin datos porque nunca se han cerrado.

#### 2.10c Consulta de Saldo de Bancos

**Tabla — Todos los bancos con saldo:**

| Cuenta | Banco | Última Conciliación | Saldo Banco |
|--------|-------|-------------------|-------------|
| (vacío) | EFECTIVO EN BANCO | / / | **0.00** |
| 1002-001 | BANESCO | / / | **0.00** |
| 1002-002 | BANISTMO | / / | **0.00** |
| 1002-003 | CREDICORP BANK | / / | **0.00** |
| 1002-004 | MULTIBANK | / / | **0.00** |
| 1002-005 | ALLBANK | / / | **0.00** |
| 1002-006 | BANCO GENERAL | / / | **0.00** |
| 1002-007 | BAC PANAMA | / / | **0.00** |
| 1002-008 | ST GEORGE BANK | / / | **0.00** |
| 1002-009 | METRO BANK | / / | **0.00** |
| 1002-010 | BANCO MERCANTIL | / / | **0.00** |
| 1002-011 | BANCO OF CHINA | / / | **0.00** |
| 1002-012 | NUEVO | / / | **0.00** |

**Última Conciliación: "/ /" para TODOS** = fecha nula. **NUNCA se ha conciliado ningún banco desde Dynamo.** Todos los saldos en $0.00.

---

### 2.11 Consulta de Transacciones (Contabilidad)

**Propósito:** Libro diario contable — vista consolidada de todos los asientos del período. Diferente a la Consulta de Transacciones de Clientes (Doc 06) — esta es la versión contable que muestra movimientos por cuenta.

**Barra de filtros:** Búsqueda + Búsqueda Continua + D 26/02/2026 + H 26/02/2026 + Hoy + Filtro Tipo + Filtro Cuenta + Excel

**Tabla:** Documento | Fecha | Tipo | Cuenta | Nombre de la Cuenta | Débito | Crédito | Detalle | Act (¿Actualizado?)

**Panel resumen (footer):**

| Tipo | Monto |
|------|-------|
| COMPROB. (Comprobantes) | (vacío) |
| FACTURAS | (vacío) |
| NOTA DE DEBITO | (vacío) |
| NOTA DE CREDITO | (vacío) |
| CHEQUES | (vacío) |
| DEPOSITOS | (vacío) |

**Botones de vista:** Documento | Cuenta — alternar entre vista por documento o por cuenta contable.

**Estado:** Completamente vacío — sin transacciones contables registradas.

---

## 3. DIAGNÓSTICO: POR QUÉ LA CONTABILIDAD DE DYNAMO FRACASÓ

### El Problema de Arquitectura

El fracaso del módulo contable de Dynamo no es un problema de interfaz ni de funcionalidad — es un problema de **arquitectura**. En Dynamo, la contabilidad está **desconectada** de la operación:

```
DYNAMO (arquitectura rota):

VENTAS → Factura 4418 → $5,539 → SE QUEDA EN MÓDULO DE VENTAS
                                    ↓
                              (proceso manual)
                                    ↓
                        ALGUIEN debe ir a "Actualización de Transacciones"
                        y ejecutar manualmente el puente
                                    ↓
                              (nadie lo hace)
                                    ↓
                        CONTABILIDAD VACÍA → Estados financieros en blanco
```

Esto significa que Evolution factura $1.47M al mes, cobra, compra, ajusta inventario... y NADA de eso llega a la contabilidad. Jackie tiene que reconstruir todo fuera del sistema. Es un diseño típico de los años 90 donde la contabilidad era un sistema separado que recibía datos en batch.

### Lo que Falta vs. Sistemas Modernos

| Característica | Dynamo | QuickBooks/Xero/Shopify | EvolutionOS (objetivo) |
|---------------|--------|------------------------|----------------------|
| Asientos automáticos desde ventas | ❌ Manual batch | ✅ Automático | ✅ Automático |
| Asientos automáticos desde compras | ❌ Manual batch | ✅ Automático | ✅ Automático |
| Asientos automáticos desde cobros | ❌ Manual batch | ✅ Automático | ✅ Automático |
| Asientos automáticos desde inventario | ❌ No existe | ✅ Automático | ✅ Automático |
| Estados financieros en tiempo real | ❌ Vacíos | ✅ Tiempo real | ✅ Tiempo real |
| Conciliación bancaria con importación | ❌ 100% manual | ✅ Importa extracto | ✅ Importa extracto |
| Cierres automáticos con validación | ❌ Un click sin validación | ✅ Con checklist | ✅ Con checklist y aprobación |
| Multi-moneda (USD + Balboas) | ⚠️ Parcial | ✅ Completo | ✅ USD principal + Balboas |
| Dashboard financiero visual | ❌ No existe | ✅ Gráficos | ✅ Dashboard completo |
| Acceso móvil a P&L | ❌ Solo PC | ✅ App/Web | ✅ Web responsive |

---

## 4. ESPECIFICACIÓN DEL MÓDULO EN LA NUEVA PLATAFORMA

### 4.1 Principio Fundamental: Contabilidad Automática

**Regla de oro:** Jackie NUNCA tiene que crear un asiento contable manual para operaciones estándar. Cada acción en el sistema genera su asiento automáticamente:

| Operación | Asiento automático generado |
|-----------|----------------------------|
| Factura de venta emitida | DB Cuentas por Cobrar / CR Ingresos por Ventas + CR ITBMS por Pagar (si aplica) |
| Cobro registrado | DB Banco [específico] / CR Cuentas por Cobrar |
| Orden de compra recibida | DB Inventario / CR Cuentas por Pagar |
| Pago a proveedor | DB Cuentas por Pagar / CR Banco [específico] |
| Ajuste de inventario (positivo) | DB Inventario / CR Ajustes de Inventario |
| Ajuste de inventario (negativo) | DB Ajustes de Inventario / CR Inventario |
| Nota de crédito a cliente | DB Devoluciones y Concesiones / CR Cuentas por Cobrar |
| Costo de ventas (al facturar) | DB Costo de Ventas / CR Inventario |
| Gasto operativo | DB Gasto [categoría] / CR Banco o Caja |

**Jackie solo crea asientos manuales para:** Reclasificaciones, ajustes contables de fin de período, provisiones, depreciación (hasta que se automatice), y correcciones excepcionales.

### 4.2 Arquitectura del Módulo

```
CONTABILIDAD
├── Dashboard Financiero (pantalla principal)
│   ├── P&L resumido del mes actual vs anterior
│   ├── Flujo de caja (ingresos vs egresos)
│   ├── Saldos bancarios consolidados
│   ├── Indicadores clave (margen bruto, margen operativo, ratio de liquidez)
│   └── Alertas (período sin cerrar, conciliación pendiente, descuadre)
│
├── Libro Diario (journal entries)
│   ├── Vista de todos los asientos (automáticos + manuales)
│   ├── Filtros: fecha, tipo, cuenta, módulo origen, usuario
│   ├── Drill-down: click en asiento → ver documento origen (factura, cobro, etc.)
│   ├── Crear asiento manual (solo Jackie/Javier)
│   └── Exportar a Excel
│
├── Libro Mayor (ledger por cuenta)
│   ├── Seleccionar cuenta → ver todos los movimientos
│   ├── Saldo running con drill-down
│   ├── Filtros por fecha y tipo
│   └── Exportar
│
├── Plan de Cuentas (configuración)
│   ├── Catálogo jerárquico (Tipo → Grupo → Cuenta → Sub-cuenta)
│   ├── Crear/editar/desactivar cuentas
│   ├── Mapeo automático (qué cuenta usar para cada tipo de operación)
│   └── Importar plan de cuentas desde Excel
│
├── Estados Financieros
│   ├── Estado de Resultado (P&L) — mensual, trimestral, anual, comparativo
│   ├── Estado de Situación (Balance General)
│   ├── Estado de Flujo de Efectivo
│   ├── Todos en tiempo real (no requieren cierre para verse)
│   └── Exportar PDF/Excel + enviar por email
│
├── Conciliación Bancaria
│   ├── Seleccionar banco
│   ├── Importar extracto bancario (CSV/Excel del banco)
│   ├── Matching automático (por monto + fecha + referencia)
│   ├── Conciliar manualmente las no-matcheadas
│   ├── Cerrar conciliación del mes
│   └── Historial de conciliaciones
│
├── Cierres Contables
│   ├── Checklist pre-cierre (validaciones automáticas)
│   ├── Cierre mensual (con aprobación de Jackie → Javier)
│   ├── Asientos de cierre de año (automáticos)
│   ├── Cierre anual (con aprobación)
│   └── Historial de cierres con audit trail
│
├── Tesorería (NUEVO — no existía en Dynamo)
│   ├── Saldos bancarios en tiempo real
│   ├── Flujo de caja proyectado (facturas por cobrar vs pagos pendientes)
│   ├── Emisión de cheques / pagos
│   └── Control de chequeras
│
└── Reportes Financieros
    ├── Balance de Prueba
    ├── Auxiliar de Cuenta
    ├── Análisis de Gastos
    ├── Comparativos (mes a mes, año a año)
    ├── Todos interactivos con drill-down
    └── Exportar PDF/Excel
```

### 4.3 Dashboard Financiero — Lo que Javier Necesita Ver

**Stat Cards (parte superior):**

| Card | Dato | Color | Fuente |
|------|------|-------|--------|
| Ventas del Mes | Total facturado | Azul | Automático desde Ventas |
| Margen Bruto | (Ventas - COGS) / Ventas × 100 | Verde/Rojo | Automático |
| Gastos del Mes | Total gastos operativos | Naranja | Desde asientos de gasto |
| Utilidad Neta | Ventas - COGS - Gastos | Verde/Rojo | Calculado |
| Efectivo Disponible | Suma saldos bancarios | Azul | Desde conciliación |
| CxC Pendiente | Total por cobrar | Amarillo | Desde módulo Clientes |

**Gráfico 1: P&L Mensual (barras)**
Ventas vs Costo de Ventas vs Gastos vs Utilidad — últimos 12 meses. Visual inmediato de tendencia.

**Gráfico 2: Flujo de Caja (línea)**
Ingresos de efectivo vs Egresos — últimos 30 días. Con proyección de los próximos 30 días basado en facturas por cobrar y pagos por hacer.

**Gráfico 3: Distribución de Gastos (donut)**
Categorías de gasto (nómina, alquiler, transporte, servicios, etc.) del mes actual.

**Tabla: Saldos Bancarios**

| Banco | Saldo Libros | Última Conciliación | Estado |
|-------|-------------|-------------------|--------|
| BANESCO | $XX,XXX | 31/01/2026 | ✅ Conciliado |
| BANCO GENERAL | $XX,XXX | 31/01/2026 | ✅ Conciliado |
| BAC PANAMA | $XX,XXX | (pendiente) | ⚠️ Pendiente |

### 4.4 Contabilidad Automática — Mapeo de Operaciones a Cuentas

**Configuración inicial (una sola vez):**

Jackie configura el mapeo de cada tipo de operación a las cuentas contables correspondientes. Después, el sistema usa este mapeo automáticamente:

| Operación | Cuenta Débito | Cuenta Crédito |
|-----------|--------------|----------------|
| Venta B2B (factura) | 1101-001 CTAS X COBRAR CLIENTES | 4001-001 INGRESOS POR VENTAS |
| Venta B2C (contado) | 1001-002 CAJA DE VENTAS | 4001-001 INGRESOS POR VENTAS |
| Cobro (transferencia) | 1002-XXX [banco específico] | 1101-001 CTAS X COBRAR CLIENTES |
| Cobro (efectivo) | 1001-001 CAJA MENUDA | 1101-001 CTAS X COBRAR CLIENTES |
| Compra (recepción) | 1201-001 INVENTARIO | 2101-001 CTAS X PAGAR PROVEEDORES |
| Pago a proveedor | 2101-001 CTAS X PAGAR PROVEEDORES | 1002-XXX [banco específico] |
| Costo de venta | 5001-001 COSTO DE VENTAS | 1201-001 INVENTARIO |
| Devolución venta | 4101-001 DEVOLU. Y CONCE | 1101-001 CTAS X COBRAR |
| Ajuste inventario (+) | 1201-001 INVENTARIO | 5101-001 AJUSTES INVENTARIO |
| Ajuste inventario (-) | 5101-001 AJUSTES INVENTARIO | 1201-001 INVENTARIO |
| Gasto nómina | 6001-001 GASTOS NOMINA | 1002-XXX [banco] |
| Gasto alquiler | 6002-001 GASTOS ALQUILER | 1002-XXX [banco] |

**El banco específico se determina automáticamente** según la forma de pago seleccionada al registrar el cobro o el pago. Si el cliente paga por transferencia a Banco General → el asiento usa automáticamente 1002-006.

### 4.5 Conciliación Bancaria Modernizada

**Flujo para cada banco, cada mes:**

```
PASO 1: Jackie descarga extracto bancario (CSV/Excel/PDF)
    → Cada banco panameño ofrece descarga digital

PASO 2: Importar al sistema
    → Sube el archivo
    → Sistema parsea las transacciones (fecha, monto, referencia, descripción)

PASO 3: Matching automático
    → Sistema compara: monto del extracto vs monto en libros
    → Match exacto por monto + fecha cercana + referencia = auto-concilia
    → Las que no matchean → quedan pendientes para revisión manual

PASO 4: Revisión manual
    → Jackie ve las no-matcheadas
    → Puede: vincular manualmente, crear asiento de ajuste, marcar como "en tránsito"

PASO 5: Cerrar conciliación
    → Diferencia debe ser $0
    → Si no es $0: el sistema muestra las partidas que causan la diferencia
    → Jackie ajusta o documenta
    → Guardar + aprobar → conciliación cerrada para ese banco/mes
```

**Mejora vs Dynamo:** En Dynamo todo es manual — ingresar cada transacción del extracto una por una y marcar Ok. Para 12 bancos es inviable. Con importación automática + matching, se reduce de días a horas.

### 4.6 Cierres Contables con Validación

**Cierre Mensual — Checklist automático:**

| # | Validación | Estado | Acción si falla |
|---|-----------|--------|----------------|
| 1 | Todas las facturas del mes contabilizadas | Auto | Muestra facturas pendientes |
| 2 | Todos los cobros del mes registrados | Auto | Muestra cobros sin asiento |
| 3 | Conciliación bancaria de todos los bancos activos | Auto | Muestra bancos sin conciliar |
| 4 | Balance de prueba cuadrado (D = C) | Auto | Muestra cuentas descuadradas |
| 5 | Inventario valorizado vs contabilidad | Auto | Muestra diferencia |
| 6 | CxC contable vs CxC operativo | Auto | Muestra diferencia |
| 7 | Revisión de asientos manuales del período | Manual (Jackie) | Checkbox de confirmación |

**Solo cuando todas las validaciones están ✅ se habilita el botón "Cerrar Período".**

**Cierre requiere aprobación:** Jackie solicita → Javier aprueba → período cerrado → no se pueden agregar/modificar asientos del período cerrado.

**Cierre Anual — Adicional:**
- Generar asientos de depreciación (si aplica)
- Cerrar cuentas de resultado (ingresos y gastos → utilidad/pérdida del ejercicio)
- Trasladar utilidad/pérdida a cuenta de capital (utilidades retenidas)
- Abrir nuevo año fiscal

---

## 5. PLAN DE CUENTAS PARA NUEVA PLATAFORMA

Basado en el plan existente de Dynamo + cuentas necesarias para la contabilidad automática:

```
1000 ACTIVOS
├── 1001 EFECTIVO Y CAJA
│   ├── 1001-001 Caja Menuda
│   ├── 1001-002 Caja de Ventas 1 (B2C)
│   ├── 1001-003 Caja de Ventas 2 (B2B)
│   └── 1001-004 Caja de Ventas 3
├── 1002 BANCOS
│   ├── 1002-001 Banesco
│   ├── 1002-002 Banistmo
│   ├── 1002-003 Credicorp Bank
│   ├── 1002-004 Multibank
│   ├── 1002-005 Allbank
│   ├── 1002-006 Banco General
│   ├── 1002-007 BAC Panamá
│   ├── 1002-008 St George Bank
│   ├── 1002-009 Metro Bank
│   ├── 1002-010 Banco Mercantil
│   └── 1002-011 Banco of China
├── 1003 INVERSIONES
│   └── 1003-001 Plazo Fijo [banco]
├── 1101 CUENTAS POR COBRAR
│   ├── 1101-001 CxC Clientes Crédito
│   ├── 1101-002 Anticipos de Clientes
│   └── 1101-003 Otras CxC
├── 1201 INVENTARIO
│   ├── 1201-001 Inventario Mercancía (Bodega B2B)
│   ├── 1201-002 Inventario Tienda (B2C)
│   └── 1201-003 Mercancía en Tránsito
└── 1301 ACTIVOS FIJOS
    ├── 1301-001 Mobiliario y Equipo
    ├── 1301-002 Equipo de Cómputo
    └── 1301-099 Depreciación Acumulada

2000 PASIVOS
├── 2101 CUENTAS POR PAGAR
│   ├── 2101-001 CxP Proveedores
│   ├── 2101-002 CxP Gastos Operativos
│   └── 2101-003 Otras CxP
├── 2201 IMPUESTOS POR PAGAR
│   ├── 2201-001 ITBMS por Pagar (7%)
│   └── 2201-002 Retenciones
└── 2301 PRÉSTAMOS Y PAGARÉS
    └── 2301-001 Pagarés por Pagar

3000 CAPITAL
├── 3001 Capital Social
├── 3002 Utilidades Retenidas
└── 3003 Utilidad/Pérdida del Ejercicio

4000 INGRESOS
├── 4001 INGRESOS POR VENTAS
│   ├── 4001-001 Ventas B2B (Zona Libre)
│   └── 4001-002 Ventas B2C (Tienda)
├── 4101 DEVOLUCIONES Y CONCESIONES
│   └── 4101-001 Desc. y Dev. en Ventas
└── 4201 OTROS INGRESOS
    └── 4201-001 Ingresos Financieros (intereses plazo fijo, etc.)

5000 COSTO DE VENTAS
├── 5001-001 Costo de Mercancía Vendida
├── 5001-002 Gastos de Importación (flete, seguro, nacionalización)
├── 5001-003 Desc. y Dev. en Compras
└── 5101-001 Ajustes de Inventario

6000 GASTOS OPERATIVOS
├── 6001 GASTOS DE PERSONAL
│   ├── 6001-001 Nómina
│   ├── 6001-002 Seguro Social Patronal
│   ├── 6001-003 Decimotercer Mes
│   └── 6001-004 Vacaciones
├── 6002 GASTOS DE OPERACIÓN
│   ├── 6002-001 Alquiler
│   ├── 6002-002 Servicios Públicos
│   ├── 6002-003 Telecomunicaciones
│   ├── 6002-004 Seguros
│   └── 6002-005 Mantenimiento
├── 6003 GASTOS PROFESIONALES
│   ├── 6003-001 Honorarios Contables
│   ├── 6003-002 Honorarios Legales
│   └── 6003-003 Servicios de Tecnología
├── 6004 GASTOS DE TRANSPORTE
│   ├── 6004-001 Fletes Nacionales
│   └── 6004-002 Fletes Internacionales
├── 6005 GASTOS FINANCIEROS
│   ├── 6005-001 Comisiones Bancarias
│   ├── 6005-002 Intereses
│   └── 6005-003 Diferencial Cambiario
└── 6099 OTROS GASTOS
    └── 6099-001 Gastos Varios
```

---

## 6. DATOS REALES PARA MOCK

### Bancos confirmados de Evolution (para configuración inicial):

| # | Banco | Código | Tipo | Probable uso |
|---|-------|--------|------|-------------|
| 1 | BANESCO | 1002-001 | Venezolano | Cobros de clientes venezolanos |
| 2 | BANISTMO | 1002-002 | Panameño | Operaciones locales |
| 3 | CREDICORP BANK | 1002-003 | Panameño | Operaciones comerciales |
| 4 | MULTIBANK | 1002-004 | Panameño | Operaciones comerciales |
| 5 | ALLBANK | 1002-005 | Panameño | Zona Libre |
| 6 | BANCO GENERAL | 1002-006 | Panameño (mayor) | Cuenta principal |
| 7 | BAC PANAMA | 1002-007 | Regional (CA) | Cobros Centroamérica |
| 8 | ST GEORGE BANK | 1002-008 | Zona Libre | Operaciones ZL |
| 9 | METRO BANK | 1002-009 | Panameño | Adicional |
| 10 | BANCO MERCANTIL | 1002-010 | Venezolano | Cobros Venezuela |
| 11 | BANCO OF CHINA | 1002-011 | Chino | Pagos a proveedores asiáticos |

### Métricas operativas para alimentar contabilidad (de documentos anteriores):

| Métrica | Valor | Fuente |
|---------|-------|--------|
| Ventas mensuales (feb 2026) | ~$1.47M proyectado | Doc 05 |
| Ventas diarias promedio | ~$11,566 | Doc 05 |
| Margen mensual promedio | 16.54% | Doc 05 |
| Mayor saldo CxC | $22,248.02 (DINORA SAS) | Doc 06 |
| Transacciones del día (26/02) | 4 facturas + 1 pago | Doc 06 |
| Total facturado hoy | $35,276.50 | Doc 06 |
| Total cobrado hoy | $9,871.00 | Doc 06 |

### Estructura del P&L de Evolution (cuentas confirmadas):

```
INGRESOS POR VENTAS
  - Ingresos por Ventas
  = TOTAL INGRESOS

DEVOLUCIONES Y CONCESIONES
  - Desc. y Dev. en Ventas
  = TOTAL DEVOLUCIONES

VENTAS NETAS = Ingresos - Devoluciones

COSTO DE VENTAS
  - Costos (COGS)
  - Desc. y Dev. en Compras
  = TOTAL COSTO DE VENTAS

UTILIDAD BRUTA = Ventas Netas - Costo de Ventas

GASTOS GENERALES
  - Gastos Generales
  - Honorarios
  - [más categorías no visibles]
  = TOTAL GASTOS

UTILIDAD OPERATIVA = Utilidad Bruta - Gastos

[No visible: Ingresos/Gastos Financieros]

UTILIDAD NETA
```

---

## 7. CONSOLIDACIÓN DYNAMO → NUEVA PLATAFORMA

| Dynamo (submódulo) | Nueva Plataforma (vista) | Cambio fundamental |
|--------------------|--------------------------|-------------------|
| Transacciones del Mayor | Libro Diario (auto + manual) | Automático desde operaciones. Manual solo para excepciones |
| Catálogo de Cuentas | Plan de Cuentas + Mapeo Automático | Agregar mapeo: "qué cuenta usar para cada operación" |
| Consulta de Estados Financieros | Dashboard Financiero + Estados | En tiempo real, no requiere cierre previo para verse |
| Re-Imprimir Cheque | Tesorería → Pagos | Integrado en flujo de pagos, no módulo separado |
| Consulta de Cuentas | Libro Mayor | Mismo concepto, con drill-down mejorado |
| Actualización de Transacciones | ELIMINADO | Ya no se necesita — los asientos se generan automáticamente |
| Cierre del Periodo | Cierres → con checklist y aprobación | Validaciones automáticas antes de cerrar |
| Generar Asientos Fin de Año | Cierres → Cierre Anual | Automatizado con validaciones |
| Cierre del Año Contable | Cierres → Cierre Anual | Con aprobación de Javier |
| Administración de Archivos | ELIMINADO (no funcionaba) | — |
| Reportes (12) | Reportes Financieros interactivos | De estáticos a dinámicos con drill-down |
| Control Número de Cheques | Tesorería → Control de Chequeras | Integrado en flujo de pagos |
| Conciliación de Bancos | Conciliación Bancaria con importación | De 100% manual a importación + matching automático |
| Imprimir Conciliación | Historial de Conciliaciones | Dentro del módulo, no pantalla separada |
| Consulta Saldo de Bancos | Dashboard → Saldos Bancarios | En dashboard principal, tiempo real |
| Consulta de Transacciones | Libro Diario con filtros | Mismo concepto, mejor UX |
| (NO EXISTÍA) | **Tesorería completa** | NUEVO: flujo de caja, proyecciones, pagos |
| (NO EXISTÍA) | **Estado de Flujo de Efectivo** | NUEVO: reporte financiero fundamental |
| (NO EXISTÍA) | **Gastos operativos categorizados** | NUEVO: registro y categorización de gastos |

---

## 8. ROLES Y VISIBILIDAD

| Función | Jackie (Contabilidad) | Javier/Estelia (Gerencia) | Vendedores | Compras (Celly) |
|---------|----------------------|--------------------------|------------|-----------------|
| Dashboard financiero | ✓ Completo | ✓ Completo | ✗ | ✗ |
| Libro diario (ver) | ✓ | ✓ | ✗ | ✗ |
| Crear asiento manual | ✓ | ✓ (aprobar) | ✗ | ✗ |
| Plan de cuentas | ✓ Editar | ✓ Ver | ✗ | ✗ |
| Estados financieros | ✓ | ✓ | ✗ | ✗ |
| Conciliación bancaria | ✓ Ejecutar | ✓ Ver/Aprobar | ✗ | ✗ |
| Cierre mensual | ✓ Solicitar | ✓ Aprobar | ✗ | ✗ |
| Cierre anual | ✓ Preparar | ✓ Aprobar (solo Javier) | ✗ | ✗ |
| Saldos bancarios | ✓ | ✓ | ✗ | ✗ |
| Tesorería/Pagos | ✓ Ejecutar | ✓ Aprobar montos altos | ✗ | ✗ |
| Reportes financieros | ✓ | ✓ | ✗ | Solo gastos de compras |
| Registrar gastos | ✓ | ✓ | ✗ | Solo gastos de importación |

---

## 9. PREGUNTAS PENDIENTES PARA JAVIER

| # | Pregunta | Por qué importa |
|---|----------|-----------------|
| 1 | ¿Jackie lleva la contabilidad en Excel? ¿En otro sistema? ¿Qué usa? | Define el flujo de migración y las necesidades de importación |
| 2 | ¿Tienen contador externo o auditor? ¿Qué reportes les piden? | Define los reportes obligatorios de la plataforma |
| 3 | ¿Cuáles de los 11 bancos están activamente en uso? ¿Cuáles ya no? | Limpieza para migración — no migrar bancos muertos |
| 4 | ¿Emiten cheques físicos o todo es transferencia electrónica? | Define si se mantiene el módulo de cheques o se elimina |
| 5 | ¿El año fiscal de Evolution es enero-diciembre o diferente? | Define la configuración de períodos contables |
| 6 | ¿Llevan registro de gastos fijos (alquiler, servicios, nómina) actualmente? ¿Dónde? | Define si hay datos de gastos para migrar |
| 7 | ¿Los pagarés son un instrumento que usan activamente con clientes? | Define si se incluye módulo de pagarés en CxC |
| 8 | ¿ITBMS (7%) aplica a alguna venta B2B de zona libre o solo B2C? | Define reglas de impuestos en la contabilización automática |
| 9 | ¿Hacen conciliación bancaria mensual? ¿En Excel? ¿Para todos los bancos? | Define el alcance de la conciliación automática |
| 10 | ¿Qué información financiera quiere Javier ver a diario sin pedirle a Jackie? | Define el dashboard ejecutivo |

---

## 10. NOTAS PARA EL DESARROLLO

### Lo que se conserva de Dynamo:
- Plan de cuentas con codificación XXXX-YYY (migrar estructura)
- Los 11 bancos configurados (migrar como catálogo)
- Estructura del P&L (Ingresos → Devoluciones → COGS → Gastos)
- Concepto de conciliación bancaria con método estándar (Libros ± partidas = Banco ± tránsito)
- Los 3 campos de clasificación por cuenta: Tipo (Activo Corriente, etc.), Categoría (Cuenta/Sub-cuenta), Nace por el (Débito/Crédito)
- Concepto de cierre mensual y anual

### Lo que se elimina:
- "Actualización de Transacciones" — el puente manual que causó el abandono. Reemplazado por contabilidad automática
- "Administración de Archivos" — no funciona, obsoleto
- Códigos de reporte fijos (091, 114, 115...) — reportes dinámicos sin código fijo
- Control de Número de Cheques como módulo separado — se integra en Tesorería
- Impresión como acción principal — se reemplaza por exportación digital (PDF/Excel/email)

### Lo que es completamente nuevo:
- **Contabilidad automática** — cada operación genera su asiento sin intervención
- **Dashboard financiero en tiempo real** — P&L, flujo de caja, saldos bancarios
- **Importación de extractos bancarios** — para conciliación semi-automática
- **Matching automático en conciliación** — por monto + fecha + referencia
- **Checklist de pre-cierre** — validaciones automáticas antes de cerrar período
- **Aprobación de cierres** — Jackie solicita, Javier aprueba
- **Módulo de Tesorería** — flujo de caja, proyecciones, gestión de pagos
- **Estado de Flujo de Efectivo** — tercer estado financiero fundamental
- **Categorización de gastos** — para análisis de gastos operativos
- **Mapeo automático de cuentas** — configurar una vez qué cuenta usar para cada tipo de operación
- **Drill-down completo** — de P&L → cuenta → asiento → documento origen (factura/cobro/compra)
- **Multi-moneda** — USD como principal, Balboas para operaciones locales

### Prioridades de implementación:
1. **Primero:** Plan de cuentas + Mapeo automático de operaciones a cuentas
2. **Segundo:** Contabilidad automática (que ventas, compras, cobros generen asientos)
3. **Tercero:** Estados financieros en tiempo real (P&L + Balance)
4. **Cuarto:** Dashboard financiero ejecutivo
5. **Quinto:** Conciliación bancaria con importación
6. **Sexto:** Cierres con validación y aprobación
7. **Séptimo:** Tesorería (flujo de caja, proyecciones)
8. **Último:** Reportes avanzados y análisis

---

## FIN DEL DOCUMENTO 07

Este documento cubre la totalidad del módulo de Contabilidad: desde el diagnóstico del abandono total en Dynamo (31 pantallas sin datos) hasta la especificación de un sistema contable moderno con contabilidad automática, dashboard financiero en tiempo real, conciliación bancaria con importación de extractos, y cierres con validación. El principio fundamental: Jackie nunca más tiene que crear un asiento manual para operaciones estándar.

Los siguientes documentos cubrirán:
- **Documento 08:** Módulo Configuración y Administración del Sistema
- **Documento 09:** Módulo Punto de Venta B2C
- **Documento 10:** Módulo Reportes y Analítica
- **Documento 11:** Módulo Tráfico y Documentación (DMC, BL, Certificados)
