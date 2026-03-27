# DOCUMENTO 013 — REUNIÓN CON JACKIE Y CONTADORA: CONTABILIDAD OPERATIVA, TESORERÍA Y FLUJOS DE CAJA

## Origen y Contexto

Este documento recopila toda la información de dos conversaciones presenciales realizadas en las oficinas de Evolution Zona Libre en Colón, marzo de 2026:

1. **Reunión con Jackie** (~47 minutos) — Contabilidad operativa, manejo de efectivo, bancos, gastos fijos, verificación de pagos, integración CIF
2. **Conversación con la Contadora Angie** (~12 minutos) — Requerimientos fiscales de la DGI, reportes mensuales, datos obligatorios para declaración de renta

**Participantes:**
- **Jackie (Jakeira Chavez)** — contabilidad@evolutionzl.com — Responsable directa de contabilidad operativa, CxC, CxP, pagos, gastos, flujo de caja, y puente con la contadora externa.
- **Angie (Contadora externa)** — Profesional contable que cierra el ciclo contable de Evolution. Responsable de declaraciones ante la DGI.
- **Cristofer (Cris / Tuinity)** — Desarrollador líder del proyecto EvolutionOS.

**Contexto de esta reunión:** Esta era una de las sesiones pendientes identificadas en documentos anteriores. Jackie es quien realmente opera la contabilidad día a día — acumula toda la información y se la pasa a la contadora externa (Angie), quien cierra el ciclo contable. La contadora ya había enviado sus solicitudes formales (ver Doc_011). Esta reunión llena el vacío de los flujos operativos reales de Jackie: cómo paga, cómo cobra, cómo concilia, qué herramientas usa, qué le duele.

**Prerequisitos:** Leer Documentos 01 a 012, especialmente Doc_007 (Contabilidad base), Doc_011 (Solicitudes contadora + DD + gastos importación), Doc_003 (Compras e Importación) y Doc_010 (POS B2C).

**Relación con documentos anteriores:**
- **Doc_007** tiene la estructura conceptual del módulo de contabilidad (plan de cuentas, asientos automáticos, conciliación, estados financieros). Este documento NO reemplaza el Doc_007 — lo complementa con los flujos operativos reales.
- **Doc_011** tiene las solicitudes formales de la contadora (CxP, facturación mensual, comprobantes, gastos fijos, debida diligencia). Este documento profundiza y añade contexto operativo a varias de esas solicitudes.
- **Doc_003** tiene el flujo de compras e importación. Este documento aporta la perspectiva de Jackie sobre el cálculo del CIF y los gastos de importación.

---

# PARTE 1: ESTRUCTURA BANCARIA Y MANEJO DE EFECTIVO

## 1.1 BANCOS DE EVOLUTION — CONFIRMACIÓN DEFINITIVA

### Los 6 bancos confirmados

Jackie confirmó que Evolution Zona Libre maneja **6 cuentas bancarias** activas:

| # | Banco | Uso principal | Notas de Jackie |
|---|-------|--------------|----------------|
| 1 | **Banco General** | Múltiple | El banco más grande de Panamá. Disponible para integración bancaria (QuickBooks lo soporta). |
| 2 | **Banesco** | Múltiple — uno de los más usados | Jackie lo destacó como "uno de los que más usamos". Alta actividad. |
| 3 | **BAC** | Múltiple | BAC Credomatic Panamá. Disponible para integración bancaria. |
| 4 | **Multibank** | Múltiple | Banco panameño. |
| 5 | **Credicorp** | Múltiple | Banco panameño. Probablemente NO disponible para integración bancaria (no aparece en QuickBooks Panamá). |
| 6 | **Banistmo** | Múltiple | Ex HSBC Panamá. Disponible para integración bancaria. |

**⚠️ CORRECCIÓN vs. documentos anteriores:** El Doc_007 (sección 2.2, Catálogo de Cuentas) lista las cuentas bancarias del plan de cuentas de Dynamo con 6 bancos pero incluye **Allbank** (1002-005) que aparece en Control de Cheques pero no en el catálogo. Jackie NO mencionó Allbank. Los 6 bancos activos son los listados arriba. Si Allbank existió alguna vez, ya no está activo. **Actualizar plan de cuentas en EvolutionOS con estos 6 bancos confirmados.**

### Cómo se distribuyen las operaciones entre bancos

**Pagos de clientes (ingresos):** Los clientes pagan en TODOS los 6 bancos. La razón es operativa: si el cliente tiene cuenta en Banesco, paga a la cuenta de Banesco de Evolution para que el pago se refleje de inmediato. Si tiene BAC, paga a BAC. Esto evita esperas de 1-2 días para transferencias interbancarias, lo cual es crítico cuando un cliente necesita despacho inmediato de mercancía.

**Implicación para el sistema:** Al registrar un cobro de cliente, el campo "Banco receptor" debe listar los 6 bancos. El sistema debe poder rastrear ingresos por banco para la conciliación.

**Gastos fijos (egresos):** La gran mayoría de los gastos fijos se pagan desde UN SOLO banco. No especificó cuál, pero la operación está centralizada para simplificar el control.

**Implicación para el sistema:** Aunque la mayoría sale de un banco, el sistema debe permitir seleccionar cualquier banco al registrar un pago de gasto fijo.

**Transferencias entre cuentas:** Muy poco frecuentes. Evolution no transfiere fondos entre sus propias cuentas bancarias de forma rutinaria. Cada cuenta mantiene su propio flujo y rara vez se queda sin fondos para cubrir sus obligaciones.

**Implicación para el sistema:** Incluir la funcionalidad de transferencias interbancarias propias pero no priorizarla en la interfaz. Es una operación excepcional, no diaria.

---

## 1.2 BRINK'S — SERVICIO DE TRANSPORTE Y CUSTODIA DE EFECTIVO

### Qué es Brink's

**Brink's** es la empresa internacional de transporte de valores blindado que Evolution utiliza para el manejo seguro de efectivo. En Evolution lo pronuncian coloquialmente como "BRICS", pero es la empresa Brink's. Funciona exclusivamente con **dinero en efectivo** — no aplica para transferencias ni cheques.

**Aplica a AMBOS negocios:** Jackie confirmó que tanto el efectivo de las ventas B2B (planta alta) como el del showroom/tienda B2C (planta baja) se depositan a través de Brink's. Todo el cash que entra a Evolution, sin importar la fuente, pasa por el mismo proceso de custodia.

### Cómo funciona el flujo completo

```
PASO 1: Ingresa efectivo (de ventas B2B o tienda B2C)
    │
    ▼
PASO 2: Jackie o Astelvia ingresan al SISTEMA WEB de Brink's
    │   → Registran el monto exacto que van a depositar
    │   → A partir de ese momento, el dinero queda ASEGURADO por Brink's
    │
    ▼
PASO 3: Efectivo se coloca en una BOLSA especial de Brink's
    │   → La bolsa se mete en una CAJA/COFRE
    │   → Se escanea un QR al ingresar la bolsa al cofre
    │   → Brink's monitorea remotamente que la bolsa entró
    │
    ▼
PASO 4: REFLEJO EN BANCO (1-2 días)
    │   → Aunque el dinero físico sigue en las instalaciones de Evolution,
    │     el monto ya se refleja en la cuenta bancaria de Evolution
    │   → Brink's asume la responsabilidad total del efectivo desde el paso 2
    │
    ▼
PASO 5: Brink's recoge físicamente el efectivo
    → Los camiones blindados pasan a recoger las bolsas
    → Pero esto es posterior — el dinero ya estaba asegurado y reflejado
```

### Implicaciones para EvolutionOS

**Lo que el sistema necesita saber:**
1. Cuando se registra un depósito de efectivo, hay un **período de 1-2 días** entre el depósito en Brink's y el reflejo real en la cuenta bancaria.
2. El estado del depósito puede ser: "Depositado en Brink's" → "Reflejado en banco".
3. Para efectos contables, el dinero ya es de Brink's desde que se registra en su sistema web, aunque el efectivo esté físicamente en Evolution.

**Registro en el sistema:**
- Tipo de depósito: **Efectivo vía Brink's**
- Campos: Monto, fecha de depósito en Brink's, banco destino, referencia Brink's (código/QR)
- Estado: Pendiente de reflejo → Reflejado en banco
- El sistema debe manejar este desfase temporal para que la conciliación bancaria no marque falsos errores

**Nota:** No se requiere integración directa con el sistema web de Brink's. Jackie lo registra manualmente en Brink's y luego en EvolutionOS. Es un proceso paralelo.

---

## 1.3 CAJAS MENORES — DOS CAJAS SEPARADAS

### Arquitectura: Dos cajas menores independientes

Evolution opera **DOS cajas menores completamente separadas**, una por cada negocio:

| Caja menor | Ubicación | Operada por | Propósito | Maneja gastos |
|------------|-----------|-------------|-----------|---------------|
| **Caja menor B2B** | Planta alta (operaciones) | **Astelvia Watts** (Gerencia) | Gastos operativos menores: suministros, imprevistos, pagos en efectivo | ✅ SÍ — paga gastos y rinde informe |
| **Caja menor POS/B2C** | Planta baja (tienda/showroom) | **Marelis González** (Supervisora Cajas B2C) | Cobro de ventas al detal, recepción de efectivo de clientes | ❌ NO — solo recauda, no gasta |

**Diferencia fundamental:** La caja menor B2B es un **fondo de gastos** (sale dinero para pagar cosas). La caja menor B2C es una **caja registradora** (entra dinero de ventas). Son operaciones completamente distintas aunque ambas manejen efectivo.

**Rol puente de Astelvia:** Astelvia es la figura central que conecta ambas cajas. Ella administra la caja menor B2B directamente, Y también es quien recibe el efectivo consolidado del punto de venta que Marelis le reporta. Astelvia es el puente entre B2B y B2C a nivel de efectivo y operaciones: Marelis opera el showroom en su día a día (ventas, cierre, inventario de tienda) y toda esa información sube a Astelvia, quien luego la integra con las operaciones B2B.

Jackie lo confirmó explícitamente sobre el showroom: "Ellos no tienen gasto, ellos no gastan. Venden y cierran caja y esa es la plata de ellos." Toda la gestión de gastos, pagos y operaciones contables se maneja desde la planta alta (operaciones B2B).

**Flujo del efectivo en AMBAS cajas:** Todo el efectivo que se acumula, tanto en la caja B2B como en la caja B2C, termina depositándose a través de Brink's (ver sección 1.2).

---

### 1.3.1 CAJA MENOR B2B — FONDO DE GASTOS (Planta alta)

#### Situación actual

La caja menor B2B funciona como un **fondo fijo (imprest)** operado por **Astelvia Watts** (Gerencia). Se usa para gastos menores que se pagan en efectivo: suministros, gastos imprevistos, necesidades operativas del día a día. Jackie se refirió a ella coloquialmente como "la santería" en la conversación.

**Modelo de fondo fijo (imprest):** La caja mantiene un monto fijo. Cuando Astelvia gasta, Jackie le repone exactamente lo gastado para que el fondo siempre regrese al mismo monto base. Jackie lo confirmó: "Para que quede un mismo monto." Esto significa que el sistema debe rastrear el monto base del fondo y compararlo contra el saldo actual.

#### Flujo actual de caja menor B2B

```
PASO 1: Jackie emite un CHEQUE bancario a nombre de la caja menor B2B
    │   → Monto fijo de reembolso (ejemplo: $2,000)
    │   → Afecta la cuenta de BANCO (sale dinero del banco)
    │
    ▼
PASO 2: Astelvia recibe el efectivo y opera la caja
    │   → Va pagando gastos menores en efectivo
    │   → Guarda recibos/facturas de cada gasto
    │
    ▼
PASO 3: Astelvia prepara un INFORME de gastos
    │   → Lista todos los gastos realizados con sus comprobantes
    │   → Lo imprime y se lo pasa a Jackie
    │
    ▼
PASO 4: Jackie registra los gastos MANUALMENTE
    │   → Actualmente esto se hace en papel/Excel
    │   → Jackie tiene que transcribir cada gasto para enviárselo a la contadora
    │
    ▼
PASO 5: Cuando la caja se agota, Jackie emite nuevo cheque de reembolso
    → El ciclo se repite
```

### Problema principal

Jackie tiene que **transcribir manualmente** el informe de Astelvia para pasárselo a la contadora. Esto es doble trabajo. Además, el reembolso afecta banco pero los gastos individuales no tienen registro digital vinculado.

### Cómo debe funcionar en EvolutionOS

**Módulo de Caja Menor B2B** (dentro de Contabilidad → Tesorería):

**Registro de reembolso:**
- Jackie registra el cheque emitido para caja menor B2B
- El sistema genera el asiento automático: Débito Caja Chica (1001-001), Crédito Banco
- El saldo de caja menor sube

**Registro de gastos de caja menor B2B:**
- Astelvia (o Jackie) ingresa cada gasto: fecha, concepto, monto, categoría (plan de cuentas), comprobante adjunto (foto del recibo)
- El sistema genera el asiento automático: Débito cuenta de gasto correspondiente, Crédito Caja Chica
- El saldo de caja menor baja

**Balance automático:**
- En todo momento, el sistema muestra: saldo inicial + reembolsos - gastos = saldo actual
- Cuando el saldo baja de cierto umbral, alerta a Jackie: "Caja menor B2B en $X — pendiente de reembolso"
- Javier puede consultar en tiempo real cuánto se ha gastado y en qué

**Informe automático:**
- El sistema genera el informe que antes Astelvia hacía en papel
- Jackie ya no transcribe nada — Astelvia (o Jackie) lo captura directo en el sistema
- La contadora puede consultarlo directamente

**Quién tiene acceso a la caja menor B2B:**
| Rol | Acceso Caja Menor B2B |
|-----|-------------------|
| Javier | Todo — lectura total, aprobación de reembolsos |
| Astelvia | Todo — opera la caja menor B2B, registra gastos, aprobación de reembolsos |
| Jackie | Todo — emite reembolsos (cheques), registra gastos, concilia |
| Marelis / Elisa | Sin acceso a caja B2B — ellas operan la caja del POS/B2C (ver sección 1.3.2) |
| Vendedores | Sin acceso |
| Bodega | Sin acceso |
| Tráfico | Sin acceso |

### Transición: De papel a digital

Jackie actualmente tiene los gastos fijos de enero, febrero y lo que va de marzo 2026 en **carpetas físicas**, organizadas por proveedor de servicio con la factura y el comprobante de pago juntos. **Se acordó que Jackie enviará toda esta documentación escaneada/fotografiada** para ingresarla al sistema como data inicial. La meta es que EvolutionOS esté al día desde enero 2026.

---

### 1.3.2 CAJA MENOR POS/B2C — CAJA REGISTRADORA (Planta baja)

#### Operación

La caja menor del punto de venta es operada por **Marelis González** (Supervisora Cajas B2C) y **Elisa Garay** (Asistente Cajas B2C). Su función es exclusivamente de **recaudación**: cobrar las ventas al detal que se realizan en la tienda/showroom.

**Esta caja NO paga gastos.** El flujo es únicamente de entrada: cliente compra → paga en efectivo (o tarjeta) → el dinero queda en la caja → al cierre se deposita vía Brink's. Marelis y Elisa no tienen autoridad ni necesidad de pagar nada con el efectivo de esta caja.

#### Flujo:

```
VENTA EN TIENDA
    │
    ▼
CLIENTE PAGA → Efectivo entra a la caja de Marelis
    │
    ▼
CIERRE DE CAJA → Marelis cuadra el efectivo del día
    │
    ▼
DEPÓSITO VÍA BRINK'S → Todo el efectivo se deposita
    │
    ▼
REFLEJO EN BANCO (1-2 días)
```

#### En EvolutionOS:
- El módulo POS/B2C (Doc_010) maneja esta caja
- Cierre de caja automatizado con reporte diario a Javier
- No tiene submódulo de gastos — solo ventas, cobros y cierre
- La contabilidad del showroom es separada pero consolidable con la de B2B (Doc_010, sección 2.2)

---

# PARTE 2: GASTOS FIJOS Y OPERATIVOS

## 2.1 ESTADO ACTUAL DE LOS GASTOS FIJOS

### Qué son los gastos fijos de Evolution

Todos los gastos recurrentes que no son compra de mercancía: alquiler, electricidad (ENSA), internet, combustible, planilla (nómina — incluye salario base de vendedores, la comisión es adicional y se maneja aparte), seguros, servicios de limpieza, mantenimiento, etc.

### Datos clave de la reunión

**Proveedores de gastos fijos NO están en Dynamo.** Solo los proveedores de producto (bebidas) existen en Dynamo. Todos los proveedores de servicios (ENSA, internet, seguros, etc.) se manejan completamente fuera del sistema. Esto significa que EvolutionOS necesita:
1. Un catálogo de **proveedores de servicios/gastos** separado del catálogo de proveedores de producto
2. O un campo que distinga "Proveedor de producto" vs. "Proveedor de servicio/gasto" en un catálogo unificado

**Nota:** Todos los proveedores de producto SÍ están completos en Dynamo — Jackie lo confirmó.

**Transición activa de efectivo a ACH:** Jackie está migrando progresivamente los pagos de gastos fijos del modelo de caja menor (efectivo) a pagos por ACH directos desde banco. La razón: el ACH queda registrado automáticamente en el banco, eliminando la necesidad de transcribir manualmente. Los gastos pagados por caja menor "se han ido disminuyendo" gracias a esta migración. El sistema debe soportar ambos métodos pero incentivar ACH.

**Jackie quiere comparativos mes a mes.** Javier frecuentemente pregunta cosas como "¿Subió la luz?" o "¿Cuánto gastamos en combustible este mes vs. el anterior?". El sistema debe permitir a Javier buscar y comparar gastos por sí mismo, sin pedirle el dato a Jackie.

**Los gastos fijos antes se pagaban en efectivo (vía caja menor B2B).** Ahora Jackie los está migrando a ACH por practicidad y trazabilidad.

### Cómo debe funcionar en EvolutionOS

**Registro de gastos fijos** (complementa lo especificado en Doc_011, sección 1.5):

Adicional a lo ya especificado, la reunión confirmó estos requerimientos:

1. **Búsqueda histórica por proveedor de servicio:** Javier quiere poder buscar "ENSA" y ver cuánto pagaron cada mes. El sistema debe tener filtros por proveedor, por período, por categoría.

2. **Comparativos automáticos:** Dashboard que muestre variación porcentual mes a mes por categoría de gasto. "Electricidad: enero $1,200 → febrero $1,350 (+12.5%)". Con indicadores visuales de subida/bajada.

3. **Almacenamiento de facturas digitales:** Cada gasto fijo registrado debe permitir adjuntar la factura del proveedor y el comprobante de pago. Todo queda en el sistema — ya no en carpetas físicas ni en la computadora de Jackie. Esto resuelve el problema del **USB perdido** que Jackie mencionó (perdió datos y no se pudieron recuperar).

4. **Organización por proveedor de servicio:** Jackie actualmente organiza sus carpetas físicas y digitales por **proveedor de servicio**, con la factura y el comprobante de pago juntos en cada carpeta. El sistema debe replicar este patrón: al entrar a un proveedor de servicio, ver todos sus pagos históricos con sus comprobantes adjuntos. Es la forma en que Jackie piensa y busca información.

5. **Proveedores de servicio en el catálogo:** Crear fichas de proveedor para ENSA, empresas de internet, combustible, limpieza, seguros, etc. Estos proveedores no tienen órdenes de compra ni recepciones de mercancía — solo tienen pagos recurrentes.

---

# PARTE 3: FLUJO CONTABLE DE COMPRAS — PERSPECTIVA DE JACKIE

## 3.1 QUIÉN HACE QUÉ EN EL CICLO DE COMPRA

### Distribución de responsabilidades (confirmada por Jackie)

```
COMPRAS (Celly/Jesús):
├── Se comunican con el proveedor
├── Negocian precio FOB
├── Crean la orden de compra
├── Reciben la mercancía en bodega
└── Registran lo que llegó vs. lo que se pidió

JACKIE (Contabilidad):
├── Realiza el pago al proveedor (ACH/transferencia)
├── Registra los gastos de importación que convierten FOB → CIF:
│   ├── Flete marítimo/terrestre
│   ├── Gastos portuarios
│   ├── APA (gastos de agenciamiento aduanal)
│   ├── Tareo
│   ├── Inspección
│   └── DMC (Declaración de Movimiento Comercial)
├── Concilia lo pagado con lo recibido
└── Identifica diferencias (saldos a favor o en contra con proveedores)

JAVIER (Dueño):
├── Es el comprador principal con ciertos proveedores
├── Sabe cuándo un contenedor viene CIF (todo incluido)
└── Esa información a veces no llega a Compras
```

### Dato importante: Retiro de mercancía en bodega del proveedor

Para ciertos proveedores como **Mota**, Evolution va físicamente a la bodega del proveedor a retirar la mercancía. La persona que retira debe verificar que todas las cajas estén **secas y selladas** (al ser líquidos, es fácil detectar si hay daño). Este detalle es clave para determinar responsabilidad: si la mercancía sale bien de la bodega del proveedor y se daña en el transporte a la bodega de Evolution, la responsabilidad puede ser de Evolution. Si ya venía dañada o incompleta, es del proveedor.

### Dato crítico: Contenedores CIF vs. FOB

Algunos contenedores llegan con término **CIF** — el proveedor se encarga de todo (flete, seguro, gastos). Cuando esto ocurre, Jackie NO tiene que pagar flete, gastos portuarios ni APA. Lo único que siempre paga, independientemente del término, son:
- **DMC** (gasto local panameño, obligatorio siempre)
- **Gasto de agua** (referencia a servicios portuarios locales)

**Problema actual:** Javier es quien sabe si un contenedor es CIF o FOB, porque él negocia directamente con ciertos proveedores. Compras (Celly/Jesús) a veces NO saben que el contenedor es CIF. Jackie sí lo sabe porque Javier se lo comunica. Cuando es CIF, Jackie no tiene que pagar flete, gastos portuarios, tareo ni APA. Lo único que siempre paga, sea FOB o CIF, es DMC y gasto de agua (son gastos locales panameños obligatorios).

**Solución en EvolutionOS:**
- Al crear la orden de compra, debe existir un campo: **Término de compra: FOB / CIF / Otro**
- Si es CIF: el sistema deshabilita los campos de flete, seguro, gastos portuarios, tareo y APA (o los marca como $0)
- Los gastos locales siempre obligatorios (DMC, agua) permanecen activos independientemente del término
- Todos los roles relevantes pueden ver si la OC es FOB o CIF
- Solo Javier, Astelvia y Jackie pueden modificar el término de compra

## 3.2 INTEGRACIÓN GASTOS CIF CON ORDEN DE COMPRA

### Flujo propuesto (confirmado en la reunión)

```
PASO 1: Compras crea la OC → monto FOB registrado
    │
    ▼
PASO 2: Jackie recibe notificación de OC creada
    │   → Ella sabe que eventualmente tendrá que pagar
    │
    ▼
PASO 3: Jackie registra el pago al proveedor
    │   → Banco, monto, referencia, comprobante
    │
    ▼
PASO 4: Jackie ingresa los gastos de importación
    │   → Los campos aparecen directamente en la OC o en una vista vinculada
    │   → Flete: $X | Puerto: $Y | APA: $Z | Tareo: $T | Inspección: $W | DMC: $V
    │   → El sistema calcula automáticamente el CIF total
    │
    ▼
PASO 5: Cálculo automático del CIF
    │   → CIF = FOB + Flete + Puerto + APA + Tareo + Inspección + DMC + Otros
    │   → El costo CIF por producto se recalcula automáticamente
    │   → Compras ya puede ver el costo real sin que Jackie les envíe un Excel
    │
    ▼
PASO 6: Costos actualizados en todo el sistema
    → Inventario refleja el nuevo costo promedio
    → Ventas puede ver los indicadores de margen actualizados
    → Contabilidad tiene los asientos generados
```

**Beneficio principal:** Elimina el Excel que Jackie hacía manualmente para pasarle los costos de importación a Compras. Ahora ella ingresa la data una sola vez y todo el sistema se alimenta.

## 3.3 DISCREPANCIAS EN RECEPCIÓN — MOTIVO OBLIGATORIO

### El problema actual

Cuando llega mercancía, a veces la cantidad recibida no coincide con lo pedido. Causas posibles:
1. **Error del proveedor:** No envió todo, o envió mercancía dañada
2. **Daño en tránsito:** Se rompieron botellas/cajas durante el flete
3. **Error en bodega:** Daño al descargar/almacenar la mercancía

### Problema contable

Jackie paga la OC por el monto original ($10,000). Si solo llegaron $9,500 en mercancía, hay $500 que no cuadran. Si no se documenta la razón, Jackie termina haciendo la conciliación en Excel para detectar estas diferencias manualmente.

**Caso real — Febrero 2026:** Jackie confesó que no pudo trabajar el cierre de febrero porque detectó que los costos registrados en Dynamo no cuadraban con lo que ella había pagado. Específicamente, encontró una orden de compra donde "el costo como que no estaba" — los números no matcheaban con la transferencia bancaria real. Lo dejó pendiente porque sabe que el sistema nuevo lo va a resolver. Este es un dolor real y activo.

**Problema adicional — Compras olvida reclamar:** Jackie mencionó que cuando hay faltantes o daños, Compras hace el reclamo al proveedor, pero "muchas veces compras se le va la onda" — se olvidan de dar seguimiento al reclamo o de aplicar la nota de crédito que el proveedor ofreció. Esto deja saldos sin resolver que Jackie descubre semanas después al hacer la conciliación manual.

### Cómo debe funcionar en EvolutionOS

**Al registrar recepción con diferencias, el sistema debe OBLIGAR:**

1. **Selección de responsabilidad:**
   - ☐ **Proveedor** — no envió lo acordado, envió mercancía defectuosa, o se dañó antes de la entrega
   - ☐ **Bodega** — daño durante la descarga, almacenamiento o manejo interno

2. **Evidencia obligatoria:** Foto o documento que respalde la diferencia (caja rota, factura con cantidad distinta, etc.)

3. **Impacto contable automático:**
   - Si fue **responsabilidad del proveedor** → sistema genera un **saldo a favor / nota de crédito pendiente** en el estado de cuenta del proveedor. La próxima compra refleja ese saldo. Jackie puede ver: "Proveedor X te debe $500 de la OC-2026-0015."
   - Si fue **responsabilidad de bodega** → sistema registra una **pérdida operativa**. Afecta la cuenta de gastos por merma/daño. No se le cobra al proveedor.

4. **Notificación a Jackie:** Siempre que haya una discrepancia, Jackie recibe alerta con el detalle: qué OC, qué productos, cuánto falta, quién fue responsable, y evidencia adjunta. Ella ya no tiene que descubrirlo al hacer la conciliación en Excel.

5. **Seguimiento automático de reclamos pendientes:** Si la responsabilidad es del proveedor, el sistema crea un **reclamo abierto** vinculado al proveedor. Este reclamo aparece en el estado de cuenta del proveedor como saldo a favor de Evolution y genera alertas periódicas hasta que se resuelva (nota de crédito recibida, mercancía de reemplazo, o cancelación del reclamo). Esto evita que Compras se olvide de dar seguimiento — el sistema insiste automáticamente.

6. **Vista para Jackie: Cotejo pago vs. recepción:**
   - Lo que se pidió (OC): $10,000
   - Lo que se recibió: $9,500
   - Lo que se pagó: $10,000
   - Diferencia: $500 → Responsable: Proveedor → Estado: Pendiente nota de crédito

---

# PARTE 4: VERIFICACIÓN DE PAGOS DE CLIENTES

## 4.1 EL PROBLEMA DEL COMPROBANTE QUE SE OLVIDA

### Situación actual

Cuando un cliente paga (transferencia bancaria), el vendedor (Margarita o Arnold) le envía el comprobante/captura a Jackie. El flujo actual tiene un problema serio:

1. El vendedor manda el comprobante (por correo, WhatsApp, etc.)
2. La transferencia **no se refleja de inmediato** en el banco
3. Jackie se ocupa con otras cosas
4. **Se olvida de verificar** si esa transferencia se reflejó
5. Cuando eventualmente entra al banco para otra cosa, la descubre: "Ah, la transferencia de fulano"
6. Entonces la procesa tardíamente

Esto genera retrasos en los despachos porque el pedido queda esperando confirmación de pago que Jackie no ha dado.

### Cómo debe funcionar en EvolutionOS

**Flujo de verificación de pagos con estados:**

```
PASO 1: Vendedor sube comprobante de pago del cliente
    │   → Lo adjunta directamente en el pedido/cuenta del cliente
    │   → Estado: 🟡 COMPROBANTE RECIBIDO — PENDIENTE VERIFICACIÓN
    │
    ▼
PASO 2: Jackie recibe ALERTA
    │   → Notificación: "Nuevo comprobante pendiente de verificación"
    │   → Visible en su dashboard: lista de comprobantes sin confirmar
    │
    ▼
PASO 3: Jackie verifica en el banco
    │   → Si el pago se refleja: marca como ✅ PAGO CONFIRMADO
    │   → Si NO se refleja: permanece en 🟡 PENDIENTE
    │   → La alerta persiste hasta que se resuelva
    │
    ▼
PASO 4: Pago confirmado
    │   → El sistema aplica el pago al saldo del cliente
    │   → Se genera el asiento contable automático
    │   → El pedido puede avanzar al siguiente paso (lista de empaque)
    │   → Notificación al vendedor: "Pago confirmado"
    │
    ▼
PASO 5: Si pasa más de X horas sin verificación
    → Escalamiento: notificación a Astelvia
    → Si sigue pendiente: notificación a Javier
```

**Panel de comprobantes pendientes (para Jackie):**

En el dashboard de Jackie debe haber una sección prominente:

| # | Cliente | Vendedor | Monto | Comprobante | Hace cuánto | Estado |
|---|---------|----------|-------|-------------|-------------|--------|
| 1 | CO-0015 Dist. Bogotá | Margarita | $8,500 | 📎 Captura.jpg | 2 horas | 🟡 Pendiente |
| 2 | VE-0003 Lic. Caracas | Arnold | $12,000 | 📎 Transfer.pdf | 1 día | 🟡 Pendiente |
| 3 | EC-0008 Import. Quito | Margarita | $5,200 | 📎 ACH.png | 30 min | 🟡 Pendiente |

**Regla inamovible:** El pago NO es pago hasta que se refleje en la cuenta bancaria. No importa si el cliente mandó 50 capturas — si no aparece en el banco, no se despacha.

## 4.2 PAGOS EN EFECTIVO DE CLIENTES B2B

Cuando un cliente B2B paga en efectivo (ocurre, especialmente con clientes locales o de zona libre), el flujo es:

1. **Astelvia** recibe el efectivo físicamente
2. Genera un **recibo interno** de que recibió el dinero
3. Si Astelvia no está, **Jackie** lo recibe directamente y puede aplicarlo de inmediato
4. El recibo interno funciona como comprobante para el registro en el sistema

**En el sistema:** Se habilita un método de pago "Efectivo" donde:
- Se adjunta el recibo interno como comprobante
- Astelvia (o Jackie) confirma la recepción
- El efectivo entra al flujo de Brink's (depósito con QR, reflejo en banco en 1-2 días)

---

# PARTE 5: INTEGRIDAD DE COSTOS — CONFIRMACIÓN CRÍTICA

## 5.1 LOS COSTOS DEBEN SER REALES — CONFIRMADO POR JACKIE

Jackie confirmó enfáticamente — con total claridad — que los costos en el sistema **DEBEN coincidir exactamente** con lo que dice la factura del proveedor. Esta confirmación es crítica porque valida la decisión de la protección de marca sobre precios de venta y no sobre costos.

### La explicación de Jackie:

> Si yo pagué veinte dólares por esta mercancía, en el sistema no puede decir veinticinco. Esos cinco dólares quedan volando. Cuando yo esté aplicando los pagos, va a salir que le debo al proveedor y yo voy a decir: "¿Qué pasó?". Y yo no puedo estar llamando a Compras a cada rato.

### Por qué es contablemente imposible inflar costos:

1. Jackie concilia lo que **pagó** (transferencia bancaria real) con lo que **el sistema dice que costó**
2. Si el sistema dice que costó $25 pero la transferencia fue por $20, hay $5 que no tienen respaldo documental
3. Esa diferencia aparece como deuda ficticia al proveedor (le "debemos" $5 que no existen)
4. La conciliación bancaria **nunca cuadra** si los costos están inflados
5. La contadora no puede cerrar los estados financieros con esta discrepancia

### Validación de Corrección #2 del System Prompt:

**CONFIRMADO:** La protección de marca SE APLICA SOBRE PRECIOS DE VENTA, NUNCA sobre costos. El costo real permanece intacto. Si Javier quiere ganar margen adicional, esos dólares extra van al precio de venta de forma invisible para los vendedores. Nunca al costo.

Cris lo resumió en la reunión: "Si quiero ganarle cinco dólares más, tienen que ir al precio de venta. Si van al costo, estoy contablemente disparándome en el pie."

---

# PARTE 6: CONCILIACIÓN BANCARIA E INTEGRACIÓN

## 6.1 MODELO QUICKBOOKS — REFERENCIA PARA EVOLUTIONOS

### Qué se le mostró a Jackie

Cris le mostró a Jackie la funcionalidad de **bank feed** de QuickBooks: una integración bancaria donde el sistema se conecta directamente a la cuenta del banco, importa automáticamente todas las transacciones, y el usuario solo tiene que **clasificarlas** (asignarles una cuenta contable).

### Reacción de Jackie

Muy positiva. Este tipo de funcionalidad eliminaría su trabajo actual de:
1. Entrar a 6 bancos diferentes cada lunes para ver saldos
2. Exportar o copiar manualmente las transacciones
3. Registrar cada transacción en su Excel/papel
4. Conciliar manualmente lo que registró vs. lo que dice el banco

### Disponibilidad por banco (verificada en QuickBooks Panamá)

| Banco | Disponible en QuickBooks | Probabilidad de API/integración |
|-------|-------------------------|-------------------------------|
| Banco General | ✅ Sí | Alta — API abierta confirmada |
| BAC | ✅ Sí | Alta |
| Banistmo | ✅ Sí | Alta |
| Credicorp | ❌ No encontrado | Baja — probablemente no tiene API |
| Multibank | ❓ No verificado | Investigar |
| Banesco | ❓ No verificado | Investigar |

### Decisión pendiente

Si no se puede integrar con los 6 bancos, el beneficio parcial podría no justificar la complejidad de la implementación. Se acordó **investigar** la viabilidad con todos los bancos antes de comprometerse.

### Funcionalidad mínima sin integración bancaria

Si la integración directa no es viable, el sistema debe soportar:
1. **Importación manual de extractos bancarios:** Jackie descarga el estado de cuenta del banco (CSV/Excel/PDF) y lo sube al sistema
2. **Clasificación de transacciones:** Misma interfaz que QuickBooks — lista de transacciones para clasificar
3. **Estados: Pendiente de clasificar → Clasificado → Publicado**
4. **Match:** El saldo en sistema debe coincidir con el saldo real del banco. Si no coincide, queda "pendiente de conciliar"

## 6.2 CONCILIACIÓN BANCARIA — CÓMO OPERA REALMENTE

### Qué es la conciliación según Jackie

La conciliación es verificar que lo que el sistema dice que tienes en el banco sea lo que realmente tienes. La complicación principal: **cheques emitidos pero no cobrados**. Jackie puede emitir un cheque hoy, pero el beneficiario puede cobrarlo en 5 días. En esos 5 días:
- El sistema dice que ya salió el dinero (porque registró el cheque)
- El banco dice que el dinero todavía está (porque no lo han cobrado)

Esto crea una diferencia temporal que la conciliación resuelve.

### En EvolutionOS:

**Conciliación = lo que el sistema registró vs. lo que el banco realmente muestra.**

Incluir:
- Cheques emitidos pendientes de cobro
- Depósitos en tránsito (Brink's: ya registrados pero no reflejados)
- Comisiones y cargos bancarios no registrados
- Transferencias de clientes que no se han reflejado

**Saldo contable (sistema)** ≠ **Saldo bancario (extracto)** → La diferencia debe explicarse con las partidas en tránsito.

## 6.3 GASTOS BANCARIOS

Jackie mencionó explícitamente: "A veces los bancos te cobran por respirar." Los bancos cobran:
- Comisiones por transferencias
- Mantenimiento de cuenta
- Cargos por servicios
- Fees por emisión de cheques

**En el sistema:** Categoría en el plan de cuentas: "Gastos Bancarios" o "Comisiones Bancarias". Al conciliar, si aparece un cargo del banco que no estaba registrado, Jackie lo clasifica como gasto bancario.

---

# PARTE 7: CATÁLOGO DE CUENTAS Y MÉTRICAS CONTABLES

## 7.1 CATÁLOGO DE CUENTAS

Jackie confirmó que la contadora (Angie) ya le pasó un **catálogo de cuentas completo**. Todo movimiento contable lleva un número de cuenta y está categorizado. Jackie se comprometió a compartir este catálogo para implementarlo en EvolutionOS.

**Acción pendiente:** Jackie enviará el catálogo de cuentas de la contadora para implementarlo como el plan de cuentas maestro del sistema.

**Estructura confirmada:** Cada cuenta tiene: número (codificación estándar), nombre, tipo (Activo/Pasivo/Capital/Ingreso/Gasto/Costo), categoría (cuenta padre/sub-cuenta), y naturaleza (débito/crédito).

## 7.2 MÉTRICAS Y DASHBOARD CONTABLE

Jackie y Cris confirmaron que el módulo de contabilidad debe tener su propio **dashboard de métricas**, diferente de las métricas de ventas o productos. Este dashboard es principalmente para Javier y Jackie.

### Métricas confirmadas:

**Saldos bancarios en tiempo real:**
- Los 6 bancos con su saldo actual
- Jackie actualmente entra a cada banco todos los lunes para verificar saldos
- El sistema debe mostrarlos consolidados en un solo lugar (con o sin integración bancaria)

**Ingresos vs. gastos:**
- Comparativo mensual: cuánto entró vs. cuánto salió
- Tendencias de los últimos 6-12 meses
- Desglose por categoría

**Comparativos mes a mes por categoría de gasto:**
- Electricidad: enero vs. febrero vs. marzo
- Combustible: tendencia mensual
- Cualquier gasto fijo debe poder compararse temporalmente

**Indicadores clave (KPIs):**
- Margen operativo
- Rotación de cuentas por cobrar
- Días promedio de cobro
- Total de gastos operativos

**Detalle disponible:**
- Click en cualquier métrica lleva al detalle
- "¿Subió la luz?" → Click en electricidad → Ve el histórico mes a mes

---

# PARTE 8: LIBROS CONTABLES Y ESTADOS FINANCIEROS

## 8.1 LIBROS QUE EL SISTEMA DEBE GENERAR

**Libro Diario:**
- Registro cronológico de TODAS las transacciones del día/período
- Se alimenta automáticamente de: ventas, compras, pagos, cobros, gastos fijos, ajustes
- Jackie solo registra manualmente lo que no viene de otros módulos (gastos fijos, pagos no vinculados a OC)
- **Dato de UX importante:** Cuando Cris le explicó a Jackie que el módulo de contabilidad se alimenta automáticamente de las ventas registradas en el módulo de ventas (sin ingreso manual duplicado), Jackie reaccionó con sorpresa positiva: "Esto no sabía." Esto confirma que la integración automática entre módulos es un diferencial clave vs. Dynamo donde todo estaba desconectado.

**Libro Mayor:**
- Vista por cuenta contable: todos los movimientos de una cuenta específica
- Ejemplo: ver todos los movimientos de "1002-001 Banesco" en el mes

**Plan de Cuentas:**
- Catálogo maestro editable
- Agregar, desactivar o reclasificar cuentas
- Siempre vinculado al clasificador de gastos/ingresos

**Estados Financieros (autogenerados):**
- **Estado de Resultados (P&L):** Ingresos - Costos - Gastos = Utilidad
- **Balance General:** Activos = Pasivos + Capital
- **Flujo de Efectivo:** Entradas y salidas de dinero por categoría
- Generados automáticamente porque el sistema tiene toda la data
- La contadora los verifica, no los crea desde cero

## 8.2 CIERRES CONTABLES

### Situación actual
- La contadora hace cierre **anual** solamente
- No se hacen cierres mensuales
- Jackie y Cris acordaron que lo recomendable es **cierre mensual**

### Cómo debe funcionar

**Cierre mensual automático (con verificación):**

El sistema genera un **pre-cierre** que verifica:
- ☑ Todos los cobros del período están registrados
- ☑ Todas las depreciaciones calculadas (si aplica)
- ☑ Todas las facturas del período están emitidas
- ☑ Todos los asientos contables están registrados
- ☑ Todas las conciliaciones bancarias están hechas

Si todo está en verde, el cierre se puede ejecutar. Si hay pendientes, el sistema los lista para resolverlos primero.

**Quién ejecuta el cierre:**
- La **contadora** debería hacer el cierre
- En la práctica, si el sistema genera todo automáticamente, el cierre es una verificación + aprobación
- Jackie confirmó que quiere que el cierre quede en el sistema para que sea comparativo con lo que la contadora haga por su lado

**Cierre anual:** Mismo proceso pero incluyendo asientos de fin de año, distribución de utilidades (si aplica), y preparación para la declaración.

---

# PARTE 9: BALANCE INICIAL 2026

## 9.1 PUNTO DE PARTIDA PARA EVOLUTIONOS

Jackie mencionó que la contadora se iba a sentar con Javier el mismo día de la reunión para **revisar todos los números**. De esa sesión sale el **balance inicial** que será el punto de partida para EvolutionOS.

### Qué incluye un balance inicial:
- Saldos de todas las cuentas bancarias al 1 de enero 2026
- Inventario valorizado al 1 de enero 2026
- Cuentas por cobrar de clientes pendientes
- Cuentas por pagar a proveedores pendientes
- Activos fijos (si se registran)
- Capital y utilidades retenidas

### Acción requerida:
1. Jackie envía el balance inicial que la contadora genere con Javier
2. Cris/Alex ingresan ese balance como los saldos de apertura del sistema
3. Desde ese punto, se registran las operaciones de enero, febrero y marzo 2026
4. Meta: sistema al día con datos reales de 2026 completo

---

# PARTE 10: NOTIFICACIONES — REFINAMIENTO

## 10.1 NOTIFICACIONES POR ROL — NO SATURAR

Jackie confirmó algo importante sobre las notificaciones: **no deben llegar todas a todos**. Las notificaciones deben ser relevantes para cada rol.

### Principio:
- A Jackie le llegan: aprobaciones pendientes (pedidos, crédito), comprobantes de pago nuevos, alertas de conciliación, gastos que registrar
- A Jackie NO le llegan: notificaciones de vendedores entre sí, alertas de inventario que son de bodega, actualizaciones de catálogo de productos
- A Javier le llega TODO lo relevante pero filtrado (no el ruido operativo)

### Prioridad de aprobaciones (confirmado por Javier vía Cris):
Javier indicó que para aprobaciones rutinarias (pedidos estándar, créditos dentro de límite, etc.), **Jackie y Astelvia deben tener prioridad** — ellas aprueban primero sin esperar a Javier. Solo para decisiones muy importantes o excepcionales (montos grandes, excepciones a reglas, anulaciones) la aprobación va directamente y exclusivamente a Javier. Esto confirma el modelo de cascada del Doc_008 pero añade el matiz de que para ciertas aprobaciones críticas, Javier es el ÚNICO aprobador (ni Jackie ni Astelvia reciben la notificación).

### Implementación:
El sistema de notificaciones configurado en Doc_008 debe tener **templates por rol** que definan qué eventos generan notificación para quién. La configuración debe ser ajustable por Javier sin intervención técnica.

---

# PARTE 11: CONVERSACIÓN CON LA CONTADORA (ANGIE) — REQUERIMIENTOS FISCALES DGI

## 11.1 CONTEXTO

Conversación breve (~12 minutos) inmediatamente después de la reunión con Jackie. Angie es la contadora externa de Evolution, responsable de la declaración de renta ante la **DGI (Dirección General de Ingresos)** de Panamá. Esta conversación aporta requerimientos fiscales obligatorios que el sistema DEBE cumplir para que la contabilidad sea legalmente válida.

## 11.2 RUC Y DV — DATOS FISCALES OBLIGATORIOS POR PROVEEDOR

### El requerimiento

La contadora fue categórica: cada proveedor o persona que reciba un pago de Evolution debe tener registrados su **RUC** (Registro Único de Contribuyente) y **DV** (Dígito Verificador). Sin estos datos, el sistema de la DGI **no acepta las entradas** al momento de hacer la declaración de renta anual.

### Problema actual

Hasta ahora, cuando alguien recibe un pago y no se capturó el RUC/DV, la contadora tiene que buscarlo después, uno por uno, para poder completar la declaración. Esto genera trabajo innecesario al cierre de año.

### Cómo debe funcionar en EvolutionOS

**Al crear cualquier proveedor de servicio o persona que reciba pagos:**
- **RUC:** Campo obligatorio. Es el número de identificación tributaria en Panamá.
- **DV:** Campo obligatorio. Es el dígito verificador asociado al RUC.
- El sistema NO debe pedir RUC/DV en cada transacción — se captura UNA VEZ al crear el perfil del proveedor y se vincula automáticamente a todas las transacciones futuras con ese proveedor.

**Para pagos en efectivo a personas naturales:**
- Incluso pagos menores (ejemplo: $20) requieren que la persona que cobra deje su **número de cédula** y **firma** como constancia de que recibió el dinero.
- En el sistema: al registrar un gasto en efectivo a una persona natural, campos obligatorios: cédula del beneficiario, nombre completo, monto, concepto.

**Reportes de fin de año:**
- El reporte anual para la DGI debe incluir automáticamente el RUC/DV de cada proveedor/beneficiario asociado a cada gasto.
- Si un proveedor no tiene RUC/DV registrado, el sistema debe marcar una alerta: "Proveedor sin datos fiscales — requerido para declaración DGI."
- Meta: que al cierre de año, la contadora genere el reporte y ya esté COMPLETO, sin tener que buscar datos uno por uno.

### Entidades afectadas:
- **Proveedores de producto** (bebidas) — ya tienen RUC si son empresas formales
- **Proveedores de servicio/gastos fijos** (ENSA, internet, seguros, etc.) — deben capturar RUC/DV al crearlos en el sistema
- **Personas naturales** que reciban pagos en efectivo — registrar cédula como mínimo

## 11.3 REPORTES MENSUALES PARA LA CONTADORA

### Tres tipos de movimiento

Angie explicó que mensualmente necesita recibir la información separada en **tres categorías** de movimiento, que corresponden a los tipos de operación en la Zona Libre de Colón:

| Tipo | Descripción | Ejemplo |
|------|------------|---------|
| **Entradas** | Compras/importaciones que llegan de fuera de la ZLC | Contenedor de Jack Daniel's desde EE.UU. |
| **Salidas** | Ventas que salen de la ZLC hacia clientes | Despacho a distribuidor en Colombia |
| **Traspasos** | Operaciones internas dentro de la ZLC | Compra a Mainz/Malta/Milano, o venta a empresa vecina en ZLC |

### Detalle importante sobre Traspasos

Los traspasos dentro de la ZLC se subdividen en:
- **Traspaso de compra:** Evolution compra mercancía a otro operador dentro de la Zona Libre (no es importación, es local ZLC)
- **Traspaso de venta:** Evolution vende a otro operador dentro de la Zona Libre (no es exportación, es local ZLC)

**El sistema debe separar estos traspasos** porque para la declaración ante la DGI van en categorías distintas que las entradas/salidas internacionales.

### Contenido de cada reporte mensual

**Reporte de Entradas (compras):**
- Nombre del proveedor
- Número de factura del proveedor
- Monto (valor de la compra)
- País de origen
- RUC/DV del proveedor

**Reporte de Salidas (ventas):**
- Nombre del cliente
- Número de factura interna de Evolution
- Monto (valor de la venta)
- País del cliente
- Tipo de pago: crédito o contado

**Reporte de Traspasos:**
- Separado en traspasos de compra vs. traspasos de venta
- Mismo detalle que entradas/salidas pero marcados como operación interna ZLC

### Generación automática

Actualmente Jackie prepara estos reportes manualmente y se los envía a Angie. En EvolutionOS, los tres reportes deben generarse automáticamente porque el sistema ya tiene toda la data: las compras están en el módulo de Compras, las ventas en Ventas, y los traspasos en Inventario/Ventas.

**Envío programable:** Configurar que el primer día de cada mes se generen y envíen automáticamente al correo de la contadora (complementa lo ya especificado en Doc_011, sección 1.2 — Reporte de Facturación Mensual).

## 11.4 PAÍS OBLIGATORIO EN TODA TRANSACCIÓN

La contadora fue explícita: **necesita saber el país de cada operación** porque la declaración ante la DGI requiere separar las transacciones por país (local vs. extranjero, y por país específico).

**Ya lo tenemos parcialmente:** Los clientes en EvolutionOS tienen país asignado (el código ISO del cliente: CO-0001 es Colombia, VE-0003 es Venezuela). Pero la contadora mencionó que a veces los reportes que Jackie le envía no incluyen el país. El sistema debe asegurar que el país SIEMPRE aparezca en los reportes, automáticamente, sin que nadie lo tenga que llenar manualmente en cada transacción.

**Para proveedores:** También necesita país de origen del proveedor. Un proveedor puede estar en USA, Panamá, u otro país. Campo obligatorio en el perfil del proveedor.

## 11.5 CIERRE ANUAL — CONFIRMACIÓN DE LA CONTADORA

Angie preguntó directamente: "¿Y el sistema hace el cierre de final de año?"

**Confirmado:** El sistema genera el cierre anual automáticamente porque tiene todos los números. El reporte de cierre se envía a la contadora para que ella pueda hacer la documentación ante la DGI (declaración de renta, etc.). El sistema no reemplaza a la contadora en la declaración fiscal — le entrega la data limpia para que ella haga su trabajo profesional.

## 11.6 CATÁLOGO DE CUENTAS — CONFIRMACIÓN

Angie confirmó que enviará a Cris el **catálogo de cuentas** (manual de cuentas) que usa con Evolution. Este es el mismo catálogo que Jackie mencionó en su reunión. Es el plan de cuentas maestro que se implementará en EvolutionOS.

---

# PARTE 12: DOCUMENTOS PENDIENTES DE JACKIE Y CONTADORA

## 12.1 LISTA DE ENTREGABLES ACORDADOS

Durante las reuniones, Jackie y la contadora Angie se comprometieron a enviar los siguientes documentos:

**De Jackie:**

| # | Documento | Formato | Para qué |
|---|-----------|---------|---------|
| 1 | Cuadro Excel de caja menor B2B | Excel | Entender formato de informe de gastos de Astelvia |
| 2 | Formato Excel resumen para contadora | Excel | Entender cómo Jackie le pasa la data a la contadora |
| 3 | Gastos fijos enero 2026 | Escaneado/foto (papel) | Data inicial del sistema |
| 4 | Gastos fijos febrero 2026 | Escaneado/foto (papel) | Data inicial del sistema |
| 5 | Gastos fijos marzo 2026 (parcial) | Escaneado/foto (papel) | Data inicial del sistema |
| 6 | Balance inicial 2026 (con contadora/Javier) | Por definir | Saldos de apertura del sistema |
| 7 | Facturas organizadas por proveedor de servicio (2026) | Escaneado/foto (carpetas) | Registro histórico de gastos |
| 8 | Reportes mensuales que envía a la contadora (entradas, salidas, traspasos) | Excel | Referencia para automatizar los reportes |

**De la Contadora Angie:**

| # | Documento | Formato | Para qué |
|---|-----------|---------|---------|
| 9 | Catálogo de cuentas / Manual de cuentas | Excel o documento | Plan de cuentas maestro para EvolutionOS |
| 10 | Ejemplos de reportes que necesita recibir | Documentos existentes | Referencia para formato de reportes automáticos |

**Prioridad máxima:** Ítems 9 y 6 (catálogo de cuentas y balance inicial) — sin estos no se puede configurar el módulo de contabilidad.

---

# PARTE 13: PERSONAL MENCIONADO — ACTUALIZACIÓN

## 13.1 ASTELVIA WATTS — ROL AMPLIADO CONFIRMADO

La reunión confirma que **Astelvia Watts** (Gerencia, gerencia1@evolutionzl.com) tiene un rol operativo más amplio del que se había documentado previamente. Además de sus funciones de gerencia y aprobación delegada, Astelvia:

- **Administra la caja menor B2B** en la planta alta — maneja el fondo fijo, paga gastos menores, prepara informes de gastos para Jackie
- **Recibe pagos en efectivo de clientes B2B** — genera recibos internos de efectivo recibido
- **Es el puente entre B2B y B2C** — Marelis le reporta todo lo operativo del showroom (ventas, cierre, inventario) y Astelvia consolida esa información con las operaciones B2B

Este rol puente es crítico para la arquitectura de EvolutionOS: Astelvia necesita acceso tanto a funcionalidades B2B como a la vista consolidada del POS/B2C. No es solo una aprobadora — es una operadora activa de efectivo y el punto de convergencia entre los dos negocios.

## 13.2 MARELIS GONZÁLEZ — ROL OPERATIVO CONFIRMADO

La reunión confirma que **Marelis González** (Supervisora Cajas B2C, showroom@evolutionzl.com) opera el **punto de venta B2C** en el día a día. Su responsabilidad abarca la mayoría de las operaciones del showroom:

- **Ventas:** Opera el POS, atiende clientes, procesa cobros
- **Cierre de caja:** Cuadra el efectivo del día, reporta
- **Inventario de tienda:** Se asegura de que el inventario B2C esté en orden
- **Compras de tienda:** Gestiona las necesidades de reposición del showroom

Toda esta información es reportada a **Astelvia**, quien actúa como su enlace con las operaciones B2B. Marelis no maneja gastos operativos — su caja es exclusivamente de recaudación. Esto ya estaba documentado en Doc_010 pero esta reunión lo valida desde la perspectiva contable y aclara la cadena de reporte Marelis → Astelvia.

## 13.3 ANGIE — CONTADORA EXTERNA (CONVERSACIÓN DIRECTA)

Cris habló directamente con la contadora Angie después de la reunión con Jackie. Es la profesional contable externa que:
- Recibe toda la información contable que Jackie acumula mensualmente
- Cierra el ciclo contable (cierres, estados financieros, declaraciones ante la DGI)
- Definió el catálogo de cuentas que enviará para implementar en EvolutionOS
- Se reunió con Javier el mismo día de esta reunión para revisar números 2026
- Necesita RUC/DV de todo proveedor y beneficiario para la declaración de renta
- Necesita reportes separados por tipo de operación (entradas, salidas, traspasos) y por país

**Angie NO es empleada de Evolution.** Es contadora externa (licenciada). En EvolutionOS:
- Podría tener un usuario con rol "Contadora" con acceso solo lectura a contabilidad, reportes y estados financieros
- O podría recibir reportes exportados automáticamente por correo sin acceso al sistema
- **Decisión pendiente:** Preguntar a Javier si Angie tendrá acceso directo al sistema

---

# PARTE 14: RESUMEN DE HALLAZGOS NUEVOS VS. DOCUMENTACIÓN EXISTENTE

## 14.1 INFORMACIÓN COMPLETAMENTE NUEVA (no estaba en ningún documento)

| # | Hallazgo | Impacto en EvolutionOS |
|---|----------|----------------------|
| 1 | Brink's — sistema de custodia de efectivo con desfase de 1-2 días, aplica a B2B y B2C | Nuevo tipo de depósito con estado intermedio |
| 2 | Astelvia opera la caja menor B2B, recibe efectivo de clientes B2B y es puente entre B2B y B2C | Rol ampliado — necesita acceso operativo a caja menor + vista consolidada POS |
| 3 | Caja menor B2B con modelo de fondo fijo (imprest) y ciclo de reembolso vía cheque | Nuevo submódulo en Tesorería con monto base configurable |
| 4 | Dos cajas menores separadas: B2B (fondo de gastos, planta alta) vs POS/B2C (recaudación de ventas, Marelis, planta baja) | Confirma arquitectura dual — módulos distintos en el sistema |
| 5 | Proveedores de gastos fijos NO están en ningún sistema | Ampliar catálogo de proveedores (productos vs. servicios) |
| 6 | Contenedores CIF — Compras no siempre sabe que es CIF | Campo obligatorio en OC: término de compra FOB/CIF |
| 7 | Comprobantes de pago se olvidan — necesidad de cola de pendientes | Panel de comprobantes pendientes para Jackie |
| 8 | Muy pocas transferencias entre cuentas propias | Funcionalidad de baja prioridad |
| 9 | Gastos bancarios como categoría contable explícita | Plan de cuentas debe incluir "Comisiones Bancarias" |
| 10 | Balance inicial 2026 como punto de partida | Prerequisito para arranque del módulo contable |
| 11 | "Tareo" como componente de costo CIF adicional | Añadir campo en gastos de importación |
| 12 | Mota — proveedor donde Evolution retira en bodega del proveedor | Impacta lógica de responsabilidad en daños |
| 13 | B2C/Showroom: Marelis opera caja POS, no maneja gastos, solo venta y cierre | Confirma que POS es módulo independiente sin submódulo de gastos |
| 14 | Febrero 2026 sin conciliar por costos incorrectos en Dynamo | Dolor activo que el sistema debe resolver |
| 15 | Compras olvida dar seguimiento a reclamos con proveedores | Sistema debe auto-rastrear reclamos abiertos con alertas |
| 16 | Prioridad de aprobación: Jackie/Astelvia primero, Javier solo para decisiones críticas | Refinamiento del modelo de cascada de aprobaciones |
| 17 | **RUC y DV obligatorios** por proveedor/beneficiario para declaración DGI | Campos obligatorios al crear cualquier proveedor en el sistema |
| 18 | **Cédula + firma** para pagos en efectivo a personas naturales | Campos obligatorios en gastos de caja menor a personas |
| 19 | **Tres reportes mensuales para DGI**: Entradas, Salidas, Traspasos | Reportes automáticos separados por tipo de operación ZLC |
| 20 | **Traspasos ZLC** se subdividen en traspaso-compra y traspaso-venta | El sistema debe distinguir operaciones internas ZLC de importaciones/exportaciones |
| 21 | **País obligatorio** en toda transacción (compras y ventas) | Campo país debe aparecer siempre en reportes, sin ingreso manual repetido |

## 14.2 INFORMACIÓN QUE COMPLEMENTA/PROFUNDIZA DOCUMENTOS EXISTENTES

| # | Tema | Doc existente | Qué añade este documento |
|---|------|---------------|-------------------------|
| 1 | Bancos | Doc_007 | Confirmación definitiva de 6 bancos activos (sin Allbank). Distribución operativa. |
| 2 | Gastos fijos | Doc_011 (1.5) | Detalle de transición efectivo→ACH, Jackie sin Excel para gastos fijos, todo en carpetas por proveedor |
| 3 | CxP y conciliación con proveedores | Doc_011 (1.1) | Perspectiva de Jackie sobre el cotejo pago vs. recepción, febrero 2026 sin conciliar |
| 4 | Integración bancaria | Doc_007 (conciliación) | Viabilidad por banco (QuickBooks como referencia), modelo de clasificación de transacciones |
| 5 | Protección de marca | Corrección #2 | Confirmación directa de Jackie: inflar costos rompe conciliación bancaria |
| 6 | Métricas contables | Doc_007 (dashboard) | Detalle de lo que Javier quiere ver: comparativos mes a mes, búsqueda por proveedor |
| 7 | Notificaciones | Doc_008 | Refinamiento: no saturar, prioridad Jackie/Astelvia primero, Javier solo para críticas |
| 8 | Cierre contable | Doc_007 | Confirmación: actualmente solo anual, se recomienda mensual, sistema debe auto-generar |
| 9 | Componentes CIF | Doc_003 | Se añade tareo como componente. DMC y agua son SIEMPRE obligatorios (incluso en CIF) |
| 10 | Separación B2B/B2C | Doc_010 | Confirmación operativa: dos cajas menores separadas, showroom (Marelis) solo recauda, B2B maneja gastos |
| 11 | Reclamos a proveedores | Doc_011 (1.1) | Compras olvida seguimiento — sistema debe auto-rastrear reclamos abiertos |
| 12 | Reportes para contadora | Doc_011 (1.2) | Detalle de tres tipos (Entradas/Salidas/Traspasos), país obligatorio, separación DGI |
| 13 | Datos fiscales proveedores | Doc_006, Doc_008 | RUC/DV obligatorios — requerimiento DGI para declaración de renta |
| 14 | Cierre anual | Doc_007 | Confirmación directa de la contadora: sistema genera cierre, ella recibe reporte para DGI |

## 14.3 CONTRADICCIONES O CORRECCIONES IDENTIFICADAS

| # | Tema | Documento anterior | Lo que dice esta reunión | Resolución |
|---|------|--------------------|------------------------|------------|
| 1 | Cantidad de bancos | Doc_007 lista Allbank (1002-005) | Jackie no mencionó Allbank, confirma 6 bancos sin él | Eliminar Allbank del plan de cuentas activo |
| 2 | Quién entra los costos CIF | Doc_003 implica que Compras calcula todo | Jackie es quien conoce y registra flete, puerto, APA, tareo | Jackie ingresa gastos CIF, sistema calcula automático |
| 3 | Componentes del CIF | Doc_003 lista: flete, seguro, handling, gastos adicionales | Jackie lista: flete, gastos portuarios, APA, tareo, inspección, DMC, agua | Actualizar lista de componentes CIF con todos los que Jackie mencionó |

---

**FIN DEL DOCUMENTO 013**

**Próximas acciones:**
1. Recibir documentos de Jackie (ver Parte 11)
2. Implementar catálogo de cuentas de la contadora
3. Configurar balance inicial 2026
4. Actualizar rol de Astelvia en sistema: acceso a caja menor B2B + vista consolidada POS/B2C
5. Confirmar si Angie (contadora) tendrá usuario en EvolutionOS
6. Investigar viabilidad de integración bancaria con los 6 bancos
7. Sesión pendiente con Compras/Bodega (Celly/Jesús) para su perspectiva
