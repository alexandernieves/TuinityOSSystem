# DOCUMENTO 011 — CONTABILIDAD, DEBIDA DILIGENCIA DIGITAL Y GASTOS DE IMPORTACIÓN

## Origen y Contexto

Este documento recopila nueva información proporcionada por Jackie (Jakeira Chavez, contabilidad) y la contadora de Evolution Zona Libre en marzo de 2026. El material incluye:

1. **Solicitud formal de la contadora** — documento escrito con 7 requerimientos específicos para el sistema
2. **Formularios reales de debida diligencia** — los formularios oficiales de Evolution para Persona Natural y Persona Jurídica, con sus respectivos archivos adjuntos obligatorios
3. **Capturas del sistema de archivos adjuntos** — la interfaz actual donde se suben los documentos de DD
4. **Excel de gastos de contenedor** — el documento que Jackie llena manualmente cada vez que llega un contenedor, detallando todos los gastos de internación que componen el CIF

**Prerequisitos:** Leer Documentos 01 a 010, especialmente Doc 07 (Contabilidad), Doc 03 (Compras e Importación) y Doc 06 (Clientes). Este documento COMPLEMENTA y PROFUNDIZA lo ya especificado.

**Participantes que proporcionaron la información:**
- **Jakeira Chavez (Jackie)** — Responsable directa de contabilidad, CxC, CxP en Evolution
- **Contadora de Evolution** — Profesional contable externa que maneja la contabilidad formal

**Estado del módulo de contabilidad:** Es el módulo menos profundizado del sistema. El Doc 07 tiene una base conceptual sólida (plan de cuentas, asientos automáticos, conciliación), pero falta el feedback detallado sobre flujos operativos diarios. Este documento empieza a llenar ese vacío. Hay una reunión programada con Jackie para profundizar aún más — es probable que surjan requerimientos adicionales de esa sesión.

**Principio arquitectónico fundamental:** El módulo de contabilidad NO es un lugar donde se ingresa información manualmente. Es el RESULTADO automático de las operaciones que ocurren en los demás módulos. Cada factura, cada recepción de mercancía, cada cobro, cada pago, cada ajuste de inventario, cada transferencia — todo genera asientos contables automáticos. Lo que Jackie y la contadora hacen es: registrar cobros y pagos (confirmar que el dinero se movió), conciliar con los bancos, y revisar que todo cuadre. Todo lo demás lo hace el sistema.

---

# PARTE 1: SOLICITUDES DE LA CONTADORA

## 1.1 CONTROL DE CUENTAS POR PAGAR A PROVEEDORES (CxP)

### Dónde vive en EvolutionOS
Esta funcionalidad cruza Compras y Contabilidad. La orden de compra y la recepción de mercancía se gestionan en Compras. El pago se registra en Contabilidad. La vista consolidada donde se cruzan los tres es accesible desde ambos módulos.

### Problema actual
La contadora describió su proceso actual: exporta a Excel el listado de compras recibidas desde Dynamo, luego manualmente cruza con el estado de cuenta bancario del mes anterior para identificar qué pagos se han hecho, y con eso arma un estado de cuenta de proveedores identificando facturas pendientes de pago. Este proceso solo se puede hacer al cierre de mes, lo que significa que durante el mes nadie sabe exactamente cuánto se le debe a cada proveedor.

### Qué solicitó la contadora
Tres cosas específicas: aplicar pagos directamente a la OC, vincular OC + mercancía recibida + pago en una sola vista, y detectar automáticamente diferencias entre los tres montos.

### Cómo debe funcionar en EvolutionOS

**Flujo completo paso a paso:**

**Paso 1 — Compras crea la OC:** Celly crea la orden de compra con productos, cantidades y costos FOB. Monto total ejemplo: $10,000. En ese momento, el sistema genera automáticamente una cuenta por pagar al proveedor por $10,000. Jackie ya puede ver en CxP que se le debe $10,000 a ese proveedor, sin esperar a que llegue la mercancía ni al cierre de mes.

**Paso 2 — Compras registra la recepción:** Cuando llega la mercancía, Celly registra lo que realmente llegó. Si llegaron $9,500 de los $10,000 (porque faltaron productos, llegaron dañados, o el proveedor envió menos), el sistema detecta la diferencia automáticamente. Aparece una alerta: "Diferencia en recepción: OC por $10,000, recibido $9,500. Diferencia: $500." Celly decide: ¿el proveedor va a enviar lo que falta después (se mantiene la OC abierta parcialmente) o no va a llegar nunca (se cierra la OC con ajuste)?

**Paso 3 — Contabilidad registra el pago:** Jackie va al módulo de CxP, selecciona al proveedor, y ve todas sus facturas/OC pendientes de pago. Para registrar un pago, Jackie ingresa: banco desde donde se pagó, monto pagado, fecha del pago, referencia bancaria (número de transferencia), y selecciona a qué OC o factura aplica el pago. También adjunta el comprobante de pago (PDF o imagen de la transferencia bancaria). El sistema genera automáticamente el asiento contable: Débito CxP Proveedores, Crédito Banco.

**Paso 4 — Detección de diferencias:** El sistema compara tres montos en todo momento:
- Lo que se pidió (monto de la OC): $10,000
- Lo que se recibió (valor de la mercancía recibida): $9,500
- Lo que se pagó: lo que Jackie registre

Si se pagó $10,000 pero solo se recibió $9,500, el sistema marca una diferencia de $500 y alerta: "Se pagó $500 más de lo recibido. ¿Es un anticipo para la próxima compra, un error, o mercancía pendiente de recibir?" Jackie clasifica la diferencia.

### Vista consolidada: Estado de cuenta de proveedores

Jackie y la contadora deben tener una pantalla donde ven TODOS los proveedores con su estado de cuenta en tiempo real:

**Vista de lista de proveedores:**

| Proveedor | OC Pendientes | Total por Pagar | Último Pago | Próximo Vencimiento |
|-----------|--------------|----------------|-------------|-------------------|
| GLOBAL BRANDS, S.A. | 2 | $45,000 | 15/02/2026 | 20/03/2026 |
| TRIPLE DOUBLE TRADING | 1 | $120,000 | 01/03/2026 | 15/04/2026 |

**Vista detalle de un proveedor (al hacer clic):**

| Fecha | Documento | Concepto | Cargo | Abono | Saldo |
|-------|-----------|----------|-------|-------|-------|
| 15/01/2026 | OC-2026-0012 | Compra 50 cajas JW Black | $10,000 | | $10,000 |
| 20/01/2026 | REC-2026-0012 | Recepción (48 de 50 cajas) | | | $10,000 |
| 05/02/2026 | PAG-2026-0034 | Pago transferencia Banesco | | $9,500 | $500 |
| | | ⚠️ Diferencia: Pagó $9,500, OC fue $10,000 | | | |

**Cada registro de pago tiene su comprobante adjunto** — Jackie lo sube al momento de registrar el pago.

### Quién ve qué

| Rol | Acceso a CxP |
|-----|-------------|
| Javier | Todo — ve todos los proveedores, montos, pagos, comprobantes |
| Astelvia | Todo — igual que Javier |
| Jackie | Todo — es quien opera el módulo |
| Celly | Solo lectura — puede ver las OC y si ya se pagaron, pero no registra pagos |
| Vendedores | Sin acceso — CxP es información financiera que no les compete |
| Ariel | Sin acceso |

---

## 1.2 REPORTE DE FACTURACIÓN MENSUAL AUTOMÁTICO

### Dónde vive
Módulo de Reportes, accesible desde Contabilidad y Ventas

### Problema actual
La contadora lleva un consecutivo mensual de facturas manualmente que usa para preparar el informe de ventas para la contadora externa. Esto debería ser completamente automático.

### Cómo debe funcionar
Un reporte que se genera con un clic o automáticamente. Incluye: listado de todas las facturas emitidas en el período seleccionado, numeradas consecutivamente, con columnas de: número de factura, fecha, cliente, país del cliente, vendedor, monto bruto, descuentos, monto neto, y estado (pagada/pendiente/parcial).

**Filtros disponibles:** Por mes, por rango de fechas, por vendedor, por cliente, por país del cliente.

**Totales del reporte:** Total facturado, total cobrado, total pendiente.

**Exportable:** PDF profesional y Excel.

**Envío automático programable:** Javier o Jackie pueden configurar que el primer día de cada mes se envíe automáticamente al correo de la contadora el reporte del mes anterior. Sin que nadie tenga que acordarse ni hacer nada.

---

## 1.3 ADJUNTOS DE COMPROBANTES EN CUENTAS POR COBRAR

### Dónde vive
Módulo de Clientes / CxC

### Problema actual
Cuando un cliente paga, Jackie tiene el comprobante (screenshot de transferencia, recibo ACH, confirmación bancaria) pero no tiene dónde guardarlo vinculado al cobro. Los comprobantes quedan sueltos en correos, WhatsApp o carpetas del computador.

### Cómo debe funcionar
Al registrar un cobro de cliente, Jackie llena los campos habituales (monto, fecha, banco, referencia) y además tiene un botón "Adjuntar comprobante" donde sube el archivo (PDF, JPG, PNG). El comprobante queda vinculado PERMANENTEMENTE a ese registro de cobro.

**¿Qué pasa si Jackie olvida adjuntar el comprobante?** El sistema muestra una advertencia visual: "Este cobro no tiene comprobante adjunto." No bloquea la operación (porque a veces el comprobante llega después), pero queda marcado como incompleto. Jackie puede adjuntarlo después.

**¿Qué pasa si un cliente disputa un cobro?** Cualquier persona con acceso al estado de cuenta del cliente puede ver cada pago y hacer clic para abrir el comprobante adjunto. Esto resuelve disputas inmediatamente: "Aquí está su comprobante de transferencia del 15 de febrero por $8,500."

**Formatos aceptados:** PDF, JPG, PNG, JPEG. Tamaño máximo recomendado: 10MB por archivo. Múltiples archivos por cobro (porque a veces un pago cubre varias facturas y hay múltiples comprobantes).

---

## 1.4 ADJUNTOS DE COMPROBANTES EN CUENTAS POR PAGAR

### Dónde vive
Módulo de Compras / CxP

### Cómo debe funcionar
Exactamente la misma funcionalidad que en CxC pero para pagos a proveedores. Al registrar un pago a proveedor, Jackie adjunta: comprobante de transferencia bancaria, factura del proveedor que se está pagando, y cualquier otro documento de respaldo (nota de crédito, acuerdo de pago, etc.).

Todo queda vinculado al registro del pago. Cuando la contadora necesita auditar un pago a proveedor, entra al detalle y ve todos los documentos de soporte.

---

## 1.5 CONTROL DE GASTOS FIJOS — FUNCIONALIDAD NUEVA

### Dónde vive
Módulo de Contabilidad → sección "Gastos Operativos"

### Problema actual
Los gastos fijos de la empresa (alquiler, electricidad, internet, seguros, mantenimiento, servicios de limpieza, etc.) NO se registran en ningún sistema. Todo se maneja en documentos impresos. Este año comenzaron a guardar facturas con transferencias en una carpeta porque la mayoría de pagos son por ACH. La contadora señala que Gerencia no puede consultar los gastos fácilmente ni en cualquier momento.

### Qué es
Un registro de gastos operativos donde se documentan todos los pagos recurrentes de la empresa que no son compras de mercancía. Es la diferencia entre "lo que pagamos para tener mercancía" (compras e importación) y "lo que pagamos para existir como empresa" (gastos operativos).

### Cómo debe funcionar

**Registro de un gasto:**

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|------------|-------------|
| Proveedor de servicio | Dropdown (del catálogo) | SÍ | Quién recibe el pago |
| Categoría | Dropdown | SÍ | Alquiler, Electricidad, Internet, Seguros, Mantenimiento, Limpieza, Nómina, Transporte, Papelería, Otros |
| Concepto | Texto | SÍ | Descripción del gasto (ej: "Electricidad oficina marzo 2026") |
| Monto | Numérico | SÍ | Cuánto se pagó |
| Fecha de pago | Fecha | SÍ | Cuándo se realizó el pago |
| Método de pago | Dropdown | SÍ | Transferencia, ACH, Efectivo, Cheque |
| Banco | Dropdown | Si método ≠ efectivo | De qué banco salió el pago |
| Referencia bancaria | Texto | No | Número de transferencia/ACH |
| Período que cubre | Texto o rango de fechas | No | Ej: "Marzo 2026" |
| Comprobante | Upload archivo | Recomendado | Factura del servicio y/o comprobante de pago |
| Recurrente | Sí/No | No | Si es un gasto que se repite mensualmente |

**Si el gasto es marcado como "recurrente"**, el sistema genera un recordatorio mensual: "Es momento de registrar el pago de Electricidad. El mes pasado fue B/. 450. ¿Desea registrar el pago de este mes?"

**Asiento contable automático:** Cada gasto registrado genera: Débito a cuenta de gasto correspondiente (6001-Nómina, 6002-Alquiler, 6003-Electricidad, etc.), Crédito a cuenta de banco o caja.

**Dashboard de gastos operativos (visible para Gerencia):**

Javier y Astelvia ven un dashboard con: total de gastos del mes actual, comparación con el mes anterior (subió o bajó y cuánto), desglose por categoría (gráfico de dona: 40% alquiler, 20% nómina, 15% servicios...), tendencia de los últimos 12 meses (gráfico de línea). Esto les da visibilidad total sobre cuánto cuesta operar la empresa, algo que hoy literalmente no saben sin revisar papeles.

---

## 1.6 CONTROL DE CAJA CHICA — FUNCIONALIDAD NUEVA

### Dónde vive
Módulo de Contabilidad → sección "Caja Chica"

### Cómo debe funcionar

**Configuración inicial:** Se asigna un fondo a la caja chica (ej: B/. 500). Esto genera un asiento: Débito Caja Chica, Crédito Banco (se sacó dinero del banco y se puso en caja chica).

**Registro de gastos menores:** Cada gasto se registra con: fecha, concepto (útiles de oficina, taxi, comida, café, etc.), monto, y comprobante adjunto si existe (foto del recibo). El saldo disponible se actualiza automáticamente.

**Reposición:** Cuando el fondo se agota o llega a un mínimo, se solicita reposición. Javier o Astelvia aprueban. Se repone desde el banco y el ciclo empieza de nuevo.

**Vista:** Tabla simple de movimientos con saldo corriente. Exportable a PDF para rendición de cuentas.

---

## 1.7 ADMINISTRACIÓN DE PROVEEDORES DE SERVICIOS

### Dónde vive
Módulo de Compras → sección de Proveedores (ampliado)

### Cómo debe funcionar
El catálogo de proveedores se amplía para soportar DOS tipos:

**Tipo 1 — Proveedores de mercancía:** Global Brands, Triple Double, JP Chenet, Adycorp. Se vinculan a órdenes de compra y CxP de mercancía. Ya están contemplados en el sistema.

**Tipo 2 — Proveedores de servicios:** Navieras, compañía eléctrica, proveedor de internet, empresa de seguros, servicio de limpieza, etc. Se vinculan a gastos fijos y caja chica.

**Campos para ambos tipos:**

| Campo | Tipo | Obligatorio |
|-------|------|------------|
| Nombre o razón social | Texto | SÍ |
| Tipo de proveedor | Dropdown: Mercancía / Servicios | SÍ |
| RUC | Texto | SÍ para proveedores locales |
| DV (Dígito Verificador) | Número | Si aplica (proveedores panameños) |
| Dirección | Texto | No |
| Teléfono | Teléfono | SÍ |
| Correo electrónico | Email | SÍ |
| Persona de contacto | Texto | No |
| País | Dropdown | SÍ |
| Notas | Texto largo | No |

Al registrar un gasto fijo, Jackie selecciona el proveedor de servicios del dropdown. Si el proveedor no existe, puede crearlo en el momento sin salir de la pantalla de gastos (botón "+ Nuevo proveedor" inline).

---

# PARTE 2: GASTOS DE CONTENEDOR — EL CÁLCULO REAL DEL CIF

## 2.1 EL PROBLEMA: JACKIE LLENA UN EXCEL POR CADA CONTENEDOR

Jackie proporcionó un Excel que es el documento que llena CADA VEZ que llega un contenedor con mercancía. Este Excel es la pieza que faltaba para entender cómo se calcula el costo CIF real en Evolution.

**El descubrimiento clave:** En Dynamo, los gastos de importación se manejan como un único porcentaje (%Gastos) sobre el FOB — un número estimado que engloba todo. En la realidad, son múltiples gastos individuales que Jackie detalla línea por línea en Excel, los calcula, y los envía a Compras para que los incorporen al costo. Este Excel debe desaparecer completamente — todo debe estar integrado en el sistema.

### Estructura del Excel actual (una hoja por contenedor)

**Encabezado:** Nombre del proveedor (ej: ULTRAPERIPHERIC LTD), fecha, referencia "GASTOS DE CONTENEDOR — ENT. 07/2025"

**Datos del contenedor:** Número(s) de contenedor (ej: CAAU7606468, FFAU6674420), tipo (ej: 1 X 40STD), contenido (ej: RON)

**Los 12 tipos de gastos de importación que Jackie registra:**

| # | Concepto | Qué es | Ejemplo |
|---|---------|--------|---------|
| 1 | **DMCE** | Declaración de Movimiento Comercial de Entrada — pago al gobierno de la ZLC para autorizar la entrada de mercancía | B/. 40.00 |
| 2 | **APA** | Autorización Previa de Arribo — trámite aduanero que se paga antes de que llegue el contenedor | B/. 37.00 |
| 3 | **FACTURA** | Referencia a la factura del proveedor de mercancía — no es un gasto adicional, es el FOB | (referencia) |
| 4 | **ACARREO** | Transporte terrestre del contenedor desde el puerto de Colón hasta la bodega de Evolution | Variable |
| 5 | **RETENCIÓN DE EQUIPO** | Cargo que cobra la naviera si el contenedor se retiene más días de los permitidos (generalmente 7 días gratuitos) | Variable |
| 6 | **REIMPRESIÓN DE ORIGINALES** | Reimpresión de documentos originales de embarque si se pierden o dañan | Variable |
| 7 | **FLETE** | Costo del transporte marítimo del contenedor desde el puerto de origen hasta Colón — suele ser el gasto más alto | Variable (miles $) |
| 8 | **MANEJO INSPECCIÓN CONTENEDOR** | Pago por la inspección física del contenedor al llegar a la ZLC | B/. 20.00 |
| 9 | **GASTO DESTINO** | Cargos en el puerto de destino (Colón) por recepción | Variable |
| 10 | **ADICIONAL POR CAMBIO DE MONEDA** | Diferencial cambiario si el pago al proveedor fue en moneda diferente a USD | Variable |
| 11 | **GASTOS PORTUARIOS** | Cargos del puerto por manejo y almacenaje del contenedor | Variable |
| 12 | **OTROS GASTOS (SELLOS)** | Sellos fiscales, timbres, gastos menores de documentación | B/. 5.00 |

**Totales que Jackie calcula:**
- TOTAL DE GASTOS: Suma de todos los gastos (ej: B/. 102.00)
- COSTO POR BULTO: Total gastos ÷ cantidad de bultos (ej: B/. 102 ÷ 2,400 = B/. 0.04)
- CANTIDAD DE BULTOS: Total de cajas en el contenedor (ej: 2,400)

**Nota:** El Excel tiene múltiples hojas — una por cada contenedor/producto (SKOL, COKE 02-2026, COGNAC FERRAND 03-2026, RON BARCELO). Cada hoja tiene la misma estructura con datos del contenedor específico.

## 2.2 CÓMO DEBE FUNCIONAR EN EVOLUTIONOS

### Flujo actual vs flujo nuevo

**Flujo actual (manual, fragmentado — 7 pasos entre 3 personas y 2 sistemas):**
1. Celly crea OC en Dynamo con precio FOB
2. Llega el contenedor
3. Celly registra recepción en Dynamo
4. Jackie abre un Excel NUEVO (copia la plantilla)
5. Jackie llena gastos línea por línea manualmente
6. Jackie calcula totales y costo por bulto
7. Jackie envía el Excel a Compras por correo para que lo incorporen al costo
8. El costo CIF real queda fuera de Dynamo o como un porcentaje estimado

**Flujo nuevo (integrado — todo en un solo lugar):**
1. Celly crea OC en EvolutionOS con precio FOB por producto
2. Llega el contenedor → Celly registra recepción
3. En la MISMA pantalla de recepción, aparece la sección "Gastos de Internación"
4. Jackie (o Celly) agrega los gastos del catálogo predefinido:
   - DMCE: B/. 40 → [Adjuntar comprobante]
   - APA: B/. 37 → [Adjuntar comprobante]
   - Manejo inspección: B/. 20 → [Adjuntar comprobante]
   - Sellos: B/. 5 → [Adjuntar comprobante]
5. El sistema suma automáticamente: Total gastos = B/. 102
6. El sistema calcula el costo por bulto: B/. 102 ÷ 2,400 = B/. 0.04
7. El sistema prorratea los gastos entre los productos del contenedor
8. El CIF de cada producto se actualiza automáticamente
9. El costo promedio ponderado del inventario se recalcula
10. El asiento contable se genera automáticamente

**El Excel de Jackie desaparece por completo.** Todo lo que ella hacía en Excel ahora lo hace dentro del sistema, vinculado a la OC, con comprobantes adjuntos, y con impacto automático en costos, inventario y contabilidad.

### Pantalla de gastos de internación en la recepción

Cuando Celly registra una recepción de mercancía, además de los campos de productos recibidos, aparece una sección expandible: "Gastos de Internación de este Contenedor."

**Datos del contenedor:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Número(s) de contenedor | Texto | Ej: CAAU7606468 (puede haber más de uno) |
| Tipo de contenedor | Dropdown | 1×20STD, 1×40STD, 1×40HC, etc. |
| Contenido general | Texto | Ej: "RON" o "WHISKY VARIADO" |

**Tabla de gastos:**

| Tipo de gasto (dropdown) | Monto (B/. o USD) | Comprobante | Notas |
|--------------------------|-------------------|-------------|-------|
| DMCE | 40.00 | [📎 Adjunto] | — |
| APA | 37.00 | [📎 Adjunto] | — |
| Manejo inspección | 20.00 | [📎 Adjunto] | — |
| Otros gastos (sellos) | 5.00 | | Sellos fiscales |
| [+ Agregar gasto] | | | |

**Resumen automático:**
```
Total gastos de internación: B/. 102.00
Cantidad de bultos en contenedor: 2,400
Costo por bulto: B/. 0.04
```

### Catálogo de tipos de gasto de importación

El sistema tiene un catálogo predefinido basado en el Excel real de Jackie:

1. DMCE (Declaración de Movimiento Comercial de Entrada)
2. APA (Autorización Previa de Arribo)
3. Acarreo (transporte terrestre)
4. Retención de equipo (cargo naviera por demora)
5. Reimpresión de originales
6. Flete marítimo
7. Manejo / inspección de contenedor
8. Gasto destino
9. Adicional por cambio de moneda
10. Gastos portuarios
11. Otros gastos (sellos, timbres)
12. *Campo libre para agregar un gasto personalizado*

Este catálogo es configurable en Configuración → Catálogos Maestros → Tipos de Gasto de Importación. Se pueden agregar nuevos tipos sin tocar código.

### Prorrateo de gastos entre productos

Cuando un contenedor trae múltiples productos, los gastos del contenedor se distribuyen proporcionalmente. El método más justo es por valor FOB — el producto que vale más absorbe proporcionalmente más gastos.

```
Ejemplo: Contenedor con 2 productos
Producto A: 1,000 cajas × $30 FOB = $30,000 FOB total (51.7%)
Producto B: 1,400 cajas × $20 FOB = $28,000 FOB total (48.3%)
Total FOB contenedor: $58,000

Total gastos internación: $102

Gastos asignados a Producto A: $102 × 51.7% = $52.73
Gastos asignados a Producto B: $102 × 48.3% = $49.27

CIF Producto A: $30 + ($52.73 ÷ 1,000) = $30.05 por caja
CIF Producto B: $20 + ($49.27 ÷ 1,400) = $20.04 por caja
```

**¿Qué pasa si los gastos no están completos al momento de la recepción?** A veces el flete o el acarreo llegan días después de la recepción. El sistema permite registrar la recepción con gastos parciales y completar los gastos después. El CIF se recalcula cada vez que se agrega un gasto. Los productos ya vendidos antes de que se completaran los gastos mantienen el costo que tenían al momento de la venta — el recálculo solo afecta el inventario actual.

---

# PARTE 3: DEBIDA DILIGENCIA DIGITAL — ONBOARDING DE CLIENTES

## 3.1 CONTEXTO LEGAL

La debida diligencia (DD) es un requerimiento legal del gobierno de Panamá para empresas que operan en la Zona Libre de Colón. Antes de venderle bebidas alcohólicas a un cliente, Evolution debe recopilar información sobre quién es ese cliente. Javier lo dijo en la reunión: "Es un tema legal, no es un tema de que lo decido yo. Es un tema que me puede cerrar la compañía si no tengo la debida diligencia."

Existen DOS formularios: Persona Natural (individuo) y Persona Jurídica (empresa). La DD se llena UNA SOLA VEZ por cliente — no vence ni requiere renovación periódica. Sin embargo, hay que ser flexibles: muchas veces se vende antes de completar la DD porque el cliente está dispuesto a pagar pero todavía no ha enviado todos sus documentos.

## 3.2 EL PROBLEMA ACTUAL: BACK AND FORTH INTERMINABLE

Hoy el proceso es así:
1. Jackie o el vendedor le envía un PDF del formulario al cliente por WhatsApp
2. El cliente lo imprime (si tiene impresora)
3. El cliente lo llena a mano
4. El cliente le saca foto con el celular
5. El cliente envía las fotos por WhatsApp al vendedor
6. El vendedor reenvía a Jackie
7. Jackie revisa y detecta que falta la cédula del accionista
8. Jackie le dice al vendedor, el vendedor le dice al cliente
9. El cliente busca el documento, le saca foto, lo manda
10. Vuelta a empezar si falta algo más

Esto puede tomar SEMANAS. Y mientras tanto, los documentos están dispersos en múltiples chats de WhatsApp, correos, y carpetas. No hay un lugar centralizado donde ver qué tiene cada cliente y qué le falta.

## 3.3 LA SOLUCIÓN: LINK DE ONBOARDING DIGITAL

La misma lógica del catálogo web aplica aquí: un link que el cliente abre, llena todo, sube sus documentos, y el sistema lo recibe todo organizado.

### Flujo completo del onboarding digital

**Paso 1 — Generación del link:**
El vendedor o Jackie van al módulo de Clientes y seleccionan "Enviar formulario de Debida Diligencia." Eligen el tipo: Persona Natural o Persona Jurídica. El sistema genera un link único y seguro para ese cliente específico.

**Paso 2 — Envío al cliente:**
El link se envía por WhatsApp (copiando el link y pegándolo en la conversación) y/o por correo electrónico. El mensaje puede incluir un texto predeterminado configurable: "Estimado [nombre], para poder procesar su pedido necesitamos que complete el siguiente formulario de registro: [link]. Puede completarlo desde su celular o computadora."

**Paso 3 — El cliente llena el formulario:**
El cliente abre el link en su celular o computadora. Ve una página web limpia con el logo de Evolution y el formulario digital completo. Todos los campos están organizados por secciones (Datos Generales, Perfil Financiero, Referencias, Documentos). Los campos obligatorios están marcados. Los dropdowns tienen las opciones predefinidas. El formulario está disponible en **español e inglés** — el cliente puede cambiar el idioma con un botón en la parte superior.

**Paso 4 — El cliente sube sus documentos:**
En la sección de documentos adjuntos, cada documento requerido tiene su propio botón de "Subir archivo." El cliente toca el botón, selecciona la foto o PDF desde su celular, y el archivo se sube. Si está desde el celular, puede tomar la foto directamente con la cámara. Cada documento tiene una etiqueta clara de qué es lo que se necesita.

**Para Persona Natural:**
- Copia de cédula o pasaporte → [Subir archivo]
- Copia de documento donde conste el domicilio → [Subir archivo]

**Para Persona Jurídica:**
- Documentos constitutivos — Aviso de Operaciones → [Subir archivo]
- Documentos constitutivos — Pacto Social → [Subir archivo]
- Copia de cédula o pasaporte del representante legal → [Subir archivo]
- Copia de cédula o pasaporte del accionista → [Subir archivo]
- Certificado de acciones → [Subir archivo]
- Otro documento → [Subir archivo] (campo libre para documentos adicionales)

**Paso 5 — Envío:**
El cliente presiona "Enviar" y TODO llega al sistema vinculado al perfil del cliente. Si el cliente no terminó y cierra la página, lo que ya llenó queda guardado — cuando vuelve al link, encuentra todo lo que ya había completado y puede continuar donde se quedó.

**Paso 6 — Notificación al equipo:**
El sistema envía notificación automática a Jackie, Astelvia y Javier: "El cliente [nombre] ha completado su formulario de Debida Diligencia. [Ver formulario →]"

**Paso 7 — Revisión por Jackie:**
Jackie abre la ficha del cliente, va al tab de Debida Diligencia, y ve todo organizado: campos llenos, documentos adjuntos con preview (puede verlos sin descargar), y un checklist visual de qué está completo y qué falta. Jackie revisa cada documento y marca individualmente: ✅ Aprobado o ❌ Requiere corrección (con comentario de qué está mal).

**Paso 8 — Si falta algo:**
Si Jackie detecta que un documento está ilegible, incorrecto, o falta por completo, el sistema puede enviar un correo automático al cliente: "Estimado [nombre], para completar su registro nos falta: [lista de documentos pendientes]. Por favor ingrese al siguiente link para completar la información: [mismo link]." El cliente abre el link y ve lo que falta marcado en rojo. Sube lo que falta y listo. Sin llamadas, sin WhatsApp de ida y vuelta.

**Paso 9 — DD completa y aprobada:**
Cuando todos los documentos están aprobados, Jackie cambia el estado a "DD Completa." El cliente queda habilitado para operar sin restricciones.

### ¿Qué pasa si necesitan vender ANTES de completar la DD?

El sistema permite flexibilidad total, exactamente como lo pidió Javier:

- Se puede crear un cliente con solo el nombre (creación rápida desde cotización)
- Se puede cotizar, crear pedidos e incluso facturar sin DD completa
- PERO el sistema muestra una alerta permanente en la ficha del cliente: "⚠️ Debida Diligencia pendiente"
- Si pasan 3 meses sin completar DD, el cliente pasa automáticamente a la papelera de inactivos
- Gerencia (Javier/Astelvia) puede aprobar que un cliente se mantenga activo sin DD (excepción documentada con registro de quién lo aprobó)
- Los vendedores NO gestionan la DD — solo envían el link al cliente. Jackie revisa y aprueba.

### Funcionalidad "Imprimir y Firmar"

Algunos clientes pueden necesitar una versión impresa del formulario (por requerimientos legales o preferencia). El sistema permite descargar el formulario como PDF prellenado con los datos que el cliente ya ingresó digitalmente. El cliente lo imprime, lo firma, y lo devuelve escaneado o fotografiado. El PDF firmado se sube al sistema como un documento adjunto más.

## 3.4 FORMULARIO COMPLETO — PERSONA NATURAL

### Sección 1: Datos Generales

| Campo | Tipo | Obligatorio |
|-------|------|------------|
| Nombres | Texto | SÍ |
| Apellidos | Texto | SÍ |
| Fecha de nacimiento | Fecha | SÍ |
| ID o Pasaporte | Texto | SÍ |
| Fecha de vencimiento del ID | Fecha | SÍ |
| Nacionalidad | Dropdown (países ISO 3166) | SÍ |
| País de residencia | Dropdown | SÍ |
| Número de teléfono | Teléfono con código país | SÍ |
| País de nacimiento | Dropdown | SÍ |
| Número de celular/móvil | Teléfono con código país | SÍ |
| Correo electrónico | Email validado | SÍ |
| Dirección residencial | Texto largo | SÍ |
| Profesión | Dropdown configurable | SÍ |
| Jurisdicción donde opera | Texto | SÍ |
| Actividad principal | Texto | SÍ |

### Sección 2: Perfil Financiero

| Campo | Tipo | Obligatorio |
|-------|------|------------|
| Ingresos anuales por actividad principal | Numérico o rango | SÍ |
| Ingresos anuales por otras actividades | Numérico o rango | No |
| Forma de pago preferida | Dropdown: Transferencia, Efectivo, Cheque, ACH, Otro | SÍ |
| Procedencia de los fondos | Dropdown: Actividad comercial, Herencia, Inversiones, Otro | SÍ |
| ¿Es PEP? (Persona Expuesta Políticamente) | Sí / No | SÍ |
| ¿Tiene familiar cercano o colaborador de un PEP? | Sí / No | SÍ |

**Nota sobre PEP:** Campo regulatorio obligatorio en Panamá para prevención de lavado de dinero. Si el cliente es PEP (funcionario público, político, militar de alto rango, etc.), debe quedar registrado. No impide la venta pero debe estar documentado.

### Sección 3: Referencias Bancarias

| Campo | Tipo |
|-------|------|
| Banco | Texto |
| Nombre completo del contacto | Texto |
| Número de teléfono | Teléfono |

### Sección 4: Referencias Comerciales

| Campo | Tipo |
|-------|------|
| Nombre o razón social | Texto |
| Nombre completo del contacto | Texto |
| Número de teléfono | Teléfono |

### Sección 5: Documentos Adjuntos

| Documento requerido | Tipo archivo | Obligatorio |
|-------------------|-------------|------------|
| Copia de cédula o pasaporte | PDF/JPG/PNG | SÍ |
| Copia de documento donde conste el domicilio | PDF/JPG/PNG | SÍ |

---

## 3.5 FORMULARIO COMPLETO — PERSONA JURÍDICA

### Sección 1: Datos Generales de la Empresa

| Campo | Tipo | Obligatorio |
|-------|------|------------|
| Nombre legal | Texto | SÍ |
| Nombre comercial | Texto | No |
| Identificación tributaria (RUC/NIT/Tax ID) | Texto | SÍ |
| País de incorporación | Dropdown (países ISO 3166) | SÍ |
| Fecha de incorporación/inscripción | Fecha | SÍ |
| Dirección | Texto largo | SÍ |
| Actividad principal que desarrolla | Texto | SÍ |
| Número de teléfono | Teléfono con código país | SÍ |
| País de operación | Dropdown | SÍ |
| Página web | URL | No |
| Correo electrónico | Email validado | SÍ |

### Sección 2: Representante Legal

| Campo | Tipo | Obligatorio |
|-------|------|------------|
| Nombre | Texto | SÍ |
| Apellido | Texto | SÍ |
| Dirección | Texto largo | SÍ |
| Tipo de identificación | Dropdown: Cédula, Pasaporte, Otro | SÍ |
| Número de identificación | Texto | SÍ |
| Fecha de vencimiento del ID | Fecha | SÍ |

### Sección 3: Directivos de la Empresa

**Presidente:**

| Campo | Tipo | Obligatorio |
|-------|------|------------|
| Nombre | Texto | SÍ |
| Apellido | Texto | SÍ |
| Número de ID | Texto | SÍ |

**Tesorero:**

| Campo | Tipo | Obligatorio |
|-------|------|------------|
| Nombre | Texto | No (no todas las empresas tienen) |
| Apellido | Texto | No |
| Número de ID | Texto | No |

**Secretario:**

| Campo | Tipo | Obligatorio |
|-------|------|------------|
| Nombre | Texto | No |
| Apellido | Texto | No |
| Número de ID | Texto | No |

### Sección 4: Documentos Adjuntos

| Documento requerido | Tipo archivo | Obligatorio |
|-------------------|-------------|------------|
| Documentos constitutivos — Aviso de Operaciones | PDF/JPG/PNG | SÍ |
| Documentos constitutivos — Pacto Social | PDF/JPG/PNG | SÍ |
| Copia de cédula o pasaporte del representante legal | PDF/JPG/PNG | SÍ |
| Copia de cédula o pasaporte del accionista | PDF/JPG/PNG | SÍ |
| Certificado de acciones | PDF/JPG/PNG | SÍ |
| Otro documento | PDF/JPG/PNG | No (campo libre para adicionales) |

---

## 3.6 DÓNDE VIVE LA DD EN EL SISTEMA

La debida diligencia es un tab dentro de la ficha de cada cliente en el módulo de Clientes. Contiene:

1. **Tipo de formulario:** Persona Natural o Persona Jurídica
2. **Todos los campos del formulario correspondiente** (los detallados arriba)
3. **Sección de archivos adjuntos** con checklist visual: cada documento requerido aparece con su estado (✅ Subido y aprobado, ⚠️ Subido pero pendiente de revisión, ❌ Falta)
4. **Estado de la DD:** Pendiente / En proceso / Completa / Aprobada / Exenta (aprobada sin DD por gerencia)
5. **Historial:** Quién envió el formulario, cuándo lo llenó el cliente, quién lo revisó, quién lo aprobó

### Quién ve y gestiona la DD

| Rol | Acceso |
|-----|--------|
| Jackie (contabilidad) | Ve todo, revisa documentos, aprueba/rechaza |
| Javier | Ve todo, puede aprobar excepciones (cliente sin DD) |
| Astelvia | Ve todo, puede aprobar excepciones |
| Vendedores | Pueden generar y enviar el link al cliente. Ven el ESTADO de la DD (completa/pendiente) pero NO ven el contenido de los documentos financieros del cliente |
| Ariel | No tiene acceso a DD |

---

# PARTE 4: CORRECCIONES AL SYSTEM PROMPT Y DOCUMENTOS ANTERIORES

### CORRECCIÓN A — Gastos de importación detallados
El Doc 03 y el Doc Maestro mencionan que los gastos de importación en Dynamo son un único porcentaje (%Gastos) sobre el FOB. En la realidad, Jackie llena 12 tipos de gastos individuales por contenedor. EvolutionOS debe manejar gastos de importación DETALLADOS por línea, con comprobante adjunto por cada uno, NO como un solo porcentaje estimado. Los gastos se registran en la pantalla de recepción de mercancía y se prorratean automáticamente entre los productos del contenedor por proporción de valor FOB.

### CORRECCIÓN B — Debida diligencia: formularios reales
El Doc 009 (Feature 9) contiene una versión genérica del formulario de DD que fue inventada antes de recibir los formularios reales. Los campos en este Doc 011 son los REALES de Evolution e incluyen campos específicos de regulación panameña (PEP, jurisdicción, directivos) que no estaban en la versión genérica. Los formularios del Doc 011 prevalecen sobre los del Doc 009.

### CORRECCIÓN C — Debida diligencia: flujo de recopilación
El Doc 009 y Doc 010 mencionan la DD pero no definen CÓMO se recopila del cliente. Este Doc 011 define el flujo completo via link digital de onboarding: el vendedor genera un link, el cliente lo abre, llena el formulario, sube documentos, y todo llega al sistema automáticamente. Este flujo prevalece.

### ADICIÓN D — Módulos nuevos
Gastos Fijos y Caja Chica son funcionalidades nuevas no contempladas en documentos anteriores. Son sencillas pero valiosas porque hoy se manejan en papel.

### ADICIÓN E — Proveedores de servicios
El catálogo de proveedores debe soportar dos tipos: mercancía y servicios.

---

## FIN DEL DOCUMENTO 011

Este documento complementa los Docs 07 (Contabilidad), 03 (Compras) y 06 (Clientes) con información real proporcionada por Jackie y la contadora. Incluye: las 7 solicitudes de la contadora ubicadas correctamente en la arquitectura del sistema, el flujo completo de gastos de contenedor que reemplaza el Excel manual de Jackie, los formularios reales de debida diligencia con campos específicos de Panamá, y el flujo digital de onboarding de clientes via link.

**Pendiente:** Reunión de profundización con Jackie sobre conciliación bancaria, cierre mensual, flujo de pagos a proveedores, comisiones, y relación CxC-vendedores. Esta reunión generará adiciones a este documento o un nuevo documento.
