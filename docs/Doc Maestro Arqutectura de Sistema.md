# DOCUMENTO MAESTRO — CÓMO FUNCIONA EvolutionOS COMO SISTEMA UNIFICADO

## Para Qué Sirve Este Documento

Los Documentos 01 a 08 explican cada módulo por separado. Este documento explica **cómo todos los módulos se hablan entre sí para funcionar como un solo organismo**. Es la diferencia entre tener 8 aplicaciones separadas (que es lo que es Dynamo) y tener UN sistema integrado donde todo se retroalimenta automáticamente.

**Lee este documento ANTES de codear cualquier módulo.** Sin entender cómo se conectan las piezas, vas a construir islas que no se comunican — exactamente el error que destruyó a Dynamo.

---

## La Filosofía Central: Un Solo Sistema, Una Sola Verdad

### El Problema de Dynamo (lo que NO queremos repetir)

Dynamo tiene módulos que parecen funcionar, pero están desconectados entre sí. Ejemplo real:

- El módulo de **Ventas** registra facturas por $1.47 millones al mes
- El módulo de **Contabilidad** tiene los estados financieros completamente vacíos
- ¿Por qué? Porque alguien tenía que ir MANUALMENTE al módulo de contabilidad y ejecutar un proceso de "Actualización de Transacciones" para que las ventas se convirtieran en asientos contables
- Nadie lo hacía → la contabilidad quedó abandonada por meses

Otro ejemplo:

- Se factura a un cliente → pero el inventario no se descuenta automáticamente
- Se registra un cobro → pero el saldo del cliente no se actualiza automáticamente en la ficha

El resultado: la gente de Evolution confía más en sus Excels que en Dynamo, porque Dynamo les da información incompleta o desactualizada.

### Lo Que EvolutionOS Debe Ser

Un sistema donde **una sola acción desencadena TODO lo que debe pasar**. Cuando alguien emite una factura:

1. La factura se crea ✓
2. El inventario se descuenta solo ✓
3. El saldo del cliente se actualiza solo ✓
4. El asiento contable se genera solo ✓
5. La comisión del vendedor se calcula sola ✓
6. El P&L se actualiza en tiempo real ✓
7. Si el cliente excede su límite de crédito, gerencia recibe una alerta ✓

**Nadie tiene que ir a otro módulo a hacer nada.** Todo sucede en cadena, automáticamente, en el momento.

### La Regla de Una Sola Verdad

Cada dato existe en UN SOLO lugar y se lee desde ahí. Ejemplos:

- El **stock** de un producto se calcula desde su historial de movimientos. No hay dos tablas con números distintos de stock.
- El **saldo** de un cliente se calcula desde sus facturas y pagos. No hay un campo manual que Jackie tenga que actualizar.
- El **P&L del mes** se calcula desde los asientos contables que se generaron automáticamente. No hay un reporte separado que alguien deba generar.

Si un dato aparece en dos lugares, siempre se deriva del mismo origen. Nunca hay contradicción.

---

## Cómo Entender las Conexiones: Las 5 Entidades que Todo Lo Conectan

Hay 5 entidades que aparecen en TODOS los módulos. Son el esqueleto del sistema:

### 1. EL PRODUCTO
Aparece en: Catálogo, Compras, Inventario, Cotizaciones, Pedidos, Facturas, Contabilidad

Un producto es el hilo conductor de todo. Desde que Celly lo compra a un proveedor en Holanda hasta que Margarita lo vende a un cliente en Curazao, el MISMO producto atraviesa todos los módulos:

```
PROVEEDOR → [Compra] → BODEGA → [Cotización] → [Pedido] → [Factura] → CLIENTE
                         ↓                                      ↓
                    Inventario sube                     Inventario baja
                    Costo se registra                   Costo de venta se registra
                    CxP se crea                         CxC se crea
                    Asiento contable                    Asiento contable
```

El producto tiene información que es compartida pero con **acceso diferenciado**:
- **Todos ven:** Nombre, código, marca, stock disponible
- **Solo gerencia y compras ven:** Costo, proveedor, márgenes
- **Solo gerencia ve:** Los 5 niveles de precio (A-E)
- **Vendedores ven:** Solo el precio correspondiente al nivel del cliente que están cotizando

### 2. EL CLIENTE
Aparece en: Directorio de Clientes, Cotizaciones, Pedidos, Facturas, Cobros, CxC, Contabilidad

El cliente conecta las ventas con las finanzas:

```
CLIENTE
├── Tiene un NIVEL DE PRECIO (A, B, C, D, E) → determina qué precios ve el vendedor
├── Tiene un LÍMITE DE CRÉDITO → bloquea ventas si se excede
├── Tiene un VENDEDOR ASIGNADO → determina quién cobra comisión
├── Tiene FACTURAS → determinan su saldo
├── Tiene PAGOS → reducen su saldo
├── Tiene un SALDO VIVO → se calcula automáticamente de facturas - pagos
└── Todo esto alimenta → el ESTADO DE CUENTA y el AGING de morosidad
```

**Dato crítico:** El saldo del cliente NUNCA se guarda como un número fijo que alguien actualiza. Se CALCULA en tiempo real sumando todas las facturas pendientes menos todos los pagos aplicados. Así, siempre es correcto y nunca se desincroniza.

### 3. LA FACTURA
Aparece en: Ventas, Inventario, CxC, Contabilidad, Comisiones

La factura es el documento más conectado de todo el sistema. Cuando se crea una factura, es como tirar una piedra al agua — las ondas llegan a todos lados:

```
FACTURA EMITIDA
├── → Inventario: restar las cantidades vendidas del stock
├── → Cliente: su saldo sube (le debe más a Evolution)
├── → CxC: aparece como factura pendiente de cobro
├── → Contabilidad: genera 2 asientos automáticos:
│    ├── Asiento de venta: DB CxC / CR Ingresos
│    └── Asiento de costo: DB Costo de Ventas / CR Inventario
├── → Comisiones: calcula la comisión del vendedor basada en el margen
├── → Dashboard: actualiza ventas del día/mes en tiempo real
└── → Alertas: si el cliente excede crédito, notifica a gerencia
```

**Y cuando se ANULA una factura, todo lo anterior se revierte automáticamente.** El inventario vuelve, el saldo del cliente baja, el asiento contable se reversa, la comisión se cancela. AUTOMÁTICAMENTE.

### 4. EL PAGO/COBRO
Aparece en: CxC, Contabilidad, Bancos

Cuando Jackie registra un cobro:

```
COBRO REGISTRADO
├── → Se aplica a una o más facturas (la más antigua primero, o Jackie elige)
├── → Cada factura afectada actualiza su saldo pendiente
├── → Si una factura queda en $0, cambia a estado "Pagada"
├── → Contabilidad: genera asiento automático DB Banco / CR CxC
├── → El banco específico donde llegó el dinero se actualiza
└── → Dashboard: actualiza cobros del día
```

### 5. EL ASIENTO CONTABLE
Aparece en: Contabilidad (pero se GENERA desde todos los demás módulos)

El asiento contable es el RESULTADO de las operaciones, nunca el punto de partida. Esto es lo más importante de entender:

```
¿Quién genera asientos contables?
├── Ventas: cada factura genera asiento de ingreso + asiento de costo
├── Cobros: cada pago genera asiento de banco + reducción de CxC
├── Compras: cada recepción genera asiento de inventario + CxP
├── Pagos a proveedores: cada pago genera asiento de CxP + banco
├── Ajustes de inventario: cada ajuste aprobado genera asiento
├── Notas de crédito/débito: cada una genera su asiento
└── Jackie (manual): SOLO para excepciones (reclasificaciones, depreciación, cierre)
```

**La contabilidad se llena SOLA.** Jackie nunca tiene que ir a crear un asiento para una venta o un cobro. Eso se genera automáticamente. Jackie solo interviene para cosas excepcionales que el sistema no puede automatizar.

---

## Las Cadenas Completas: Qué Pasa Cuando...

### Cadena 1: "Margarita quiere venderle a SIMEON 333"

**Paso a paso, qué sucede en el sistema:**

**1. Margarita crea una cotización**
- Selecciona al cliente SIMEON 333 del directorio
- El sistema lee que SIMEON 333 tiene nivel de precio "B"
- Margarita agrega productos a la cotización
- Para cada producto, el sistema sugiere automáticamente el precio del Nivel B
- Margarita NO VE el costo, NO VE el margen, NO VE que el cliente es nivel "B"
- Lo que SÍ ve: un indicador de color (🟢 verde o 🔴 rojo) que le dice si la venta va a comisionar o no
  - 🟢 = el margen está por encima del 10% (umbral configurable) → va a ganar comisión
  - 🔴 = el margen está por debajo del 10% → no comisiona o comisiona menos
- Si Margarita baja el precio demasiado (por debajo del Nivel E, que es el mínimo absoluto), el sistema BLOQUEA y pide aprobación de gerencia

**2. La cotización va a aprobación**
- El sistema envía una notificación a Javier o Estelia
- Ellos SÍ ven: costo, margen, nivel del cliente, todo
- Aprueban o rechazan
- Si aprueban, la cotización cambia a estado "Aprobada" y Margarita recibe notificación

**3. La cotización se convierte en pedido**
- Margarita (o gerencia) convierte la cotización aprobada en pedido
- El sistema verifica DOS cosas automáticamente:
  - **¿Hay stock suficiente?** Si no hay, avisa qué productos faltan
  - **¿El cliente tiene crédito disponible?** Si el pedido haría que SIMEON 333 exceda su límite de crédito, el sistema bloquea y pide excepción
- Si todo está bien, el pedido se crea y el stock se RESERVA (no se descuenta aún, pero queda apartado para que otro vendedor no lo venda)

**4. El pedido se convierte en factura**
- Gerencia o Contabilidad generan la factura desde el pedido aprobado
- **AQUÍ ES DONDE TODO SUCEDE DE GOLPE:**
  - Inventario: las cantidades se descuentan del stock real
  - Un registro de movimiento se crea para cada producto (tipo: "venta")
  - El asiento contable se genera automáticamente:
    - Se registra el ingreso por venta
    - Se registra el costo de lo vendido
    - Se registra la cuenta por cobrar del cliente
  - La comisión de Margarita se calcula y se registra
  - SIMEON 333 ahora tiene una factura pendiente → su saldo sube
  - El dashboard de ventas se actualiza en tiempo real
  - Si SIMEON 333 excedió su límite de crédito con esta factura, gerencia recibe alerta

**5. SIMEON 333 paga**
- Jackie registra el cobro cuando llega el dinero al banco
- Selecciona a qué banco llegó (ej: Banesco, porque es cliente venezolano)
- El sistema aplica el pago a la factura más antigua pendiente (o Jackie elige manualmente)
- La factura actualiza su saldo pendiente (si queda en $0, cambia a "Pagada")
- El asiento contable se genera: el dinero entra al banco, sale de CxC
- El saldo de SIMEON 333 baja
- Todo en tiempo real

**Resumen:** Desde que Margarita crea la cotización hasta que Jackie registra el cobro, el sistema maneja TODO automáticamente. Nadie tiene que ir a otro módulo a "actualizar" nada. Ni inventario, ni contabilidad, ni CxC. Todo fluye solo.

---

### Cadena 2: "Celly compra mercancía a Brands Collection en Holanda"

**1. Celly crea la orden de compra**
- Selecciona al proveedor BRANDS COLLECTION B.V.
- Agrega los productos que necesita comprar (ej: 500 cajas de whisky)
- Ingresa el costo por unidad (FOB — precio del proveedor antes de flete/seguro)
- Ingresa los gastos de importación: flete marítimo, seguro, otros gastos
- El sistema calcula el **costo CIF** (Cost + Insurance + Freight) por unidad
- Este costo CIF es el costo REAL del producto puesto en bodega de Evolution

**2. La mercancía llega a la Zona Libre**
- Celly (o Jesús en almacén) registra la recepción
- Para cada producto recibido:
  - El **inventario sube** — las cantidades se agregan al stock
  - El **costo del producto se actualiza** con el nuevo costo CIF
  - Se genera un **movimiento de inventario** tipo "recepción de compra"
- El asiento contable se genera automáticamente:
  - Inventario sube (activo de la empresa sube)
  - Cuentas por Pagar al proveedor sube (Evolution le debe a Brands Collection)

**3. Impacto en el resto del sistema**
- Los **precios de venta NO cambian automáticamente** al cambiar el costo — esto es decisión de gerencia
- Pero el **margen** que ven Javier y Estelia SÍ se actualiza: si el costo subió, el margen bajó
- El **dashboard de compras** muestra la nueva compra
- El **inventario** ahora muestra stock actualizado — los vendedores pueden cotizar estos productos

**4. Evolution le paga a Brands Collection**
- Jackie registra el pago (desde el banco que corresponda, posiblemente Banco of China para proveedores asiáticos, o un banco europeo para Brands Collection)
- El asiento contable: baja la CxP (ya no le debemos) y baja el banco (salió el dinero)

---

### Cadena 3: "Se detecta mercancía dañada en bodega"

**1. Jesús reporta el problema**
- Va al módulo de inventario y crea una solicitud de ajuste
- Selecciona: "Ajuste negativo" → motivo: "Daño"
- Agrega los productos dañados con cantidades
- **NO se descuenta nada aún** — es solo una solicitud

**2. Gerencia aprueba el ajuste**
- Javier o Estelia reciben notificación
- Ven: qué productos, qué cantidades, cuánto vale lo que se va a perder
- Aprueban o rechazan
- Si aprueban:
  - El **inventario baja** — las cantidades dañadas se restan
  - Se genera un **movimiento de inventario** tipo "ajuste negativo"
  - El **asiento contable** se genera: la pérdida se registra como gasto (ajuste de inventario)
  - El **P&L** refleja este gasto automáticamente
  - Todo queda en el **log de auditoría**: quién solicitó, quién aprobó, motivo, monto

---

### Cadena 4: "Jackie necesita anular una factura que se emitió por error"

**1. Solicitud de anulación**
- Jackie va a la factura y hace click en "Solicitar Anulación"
- El sistema le pide un motivo (obligatorio): "Error en los productos facturados"
- Se crea una solicitud de aprobación
- Gerencia recibe notificación

**2. Aprobación**
- Javier ve: la factura, el monto, el motivo, quién la solicita
- Si el monto es mayor al umbral configurado (ej: $5,000), SOLO Javier puede aprobar
- Si es menor, Estelia también puede
- Aprueba la anulación

**3. El sistema REVIERTE TODO automáticamente**
- La factura cambia a estado "Anulada"
- El **inventario SUBE** — las cantidades vuelven al stock (porque la venta ya no existe)
- El **saldo del cliente BAJA** — ya no le debe eso a Evolution
- Si había pagos aplicados a esa factura, se DESAPLICAN (quedan como saldo a favor del cliente)
- El **asiento contable de reverso** se genera automáticamente:
  - Se reversa el ingreso
  - Se reversa el costo de venta
  - Se reversa la CxC
  - El inventario vuelve a la contabilidad
- La **comisión del vendedor** se cancela
- Todo queda en el **log de auditoría** con detalle completo

**ESTO es lo que hace que EvolutionOS sea fundamentalmente distinto a Dynamo.** En Dynamo, anular una factura es un dolor de cabeza que requiere ajustes manuales en múltiples módulos. En EvolutionOS, es un click + aprobación + todo se reversa automáticamente.

---

### Cadena 5: "Cierre de mes contable"

**1. Jackie inicia el cierre**
- Va al módulo de contabilidad y solicita cerrar el mes de febrero 2026
- El sistema ejecuta una **checklist de validaciones automáticas:**
  - ¿Todas las facturas del mes tienen su asiento contable? ✓ (si es automático, siempre sí)
  - ¿Todos los cobros del mes están registrados? ✓
  - ¿La conciliación bancaria de TODOS los bancos activos está cerrada?
    - Si algún banco no está conciliado, muestra cuáles faltan
  - ¿El balance de prueba cuadra? (total débitos = total créditos)
  - ¿El inventario contable coincide con el inventario físico del sistema?

**2. Si todo está verde, Jackie solicita aprobación**
- Javier recibe la solicitud con el resumen del mes:
  - Ventas: $1.47M
  - Costo de ventas: $1.23M
  - Margen bruto: 16.5%
  - Gastos: $XX,XXX
  - Utilidad neta: $XX,XXX
- Javier aprueba → el período se cierra
- **Nadie puede modificar, agregar o anular transacciones de febrero después del cierre**

---

## Las Reglas Que Cruzan Todo el Sistema

### ⚠️ REGLA #1 — LA MÁS IMPORTANTE DE TODO EL SISTEMA: COSTOS Y PROVEEDORES SON INFORMACIÓN CLASIFICADA

**Esta es la regla más crítica de todo EvolutionOS. Debe tratarse como una ley inviolable del sistema. Si se viola, se compromete la operación comercial entera de Evolution.**

### Quién puede ver costos y proveedores — SIN EXCEPCIONES:

| Información | Administrador Supremo (Javier) | Gerencia (Estelia) | Compras (Celly) | Contabilidad (Jackie) | TODOS LOS DEMÁS |
|-------------|-------------------------------|-------------------|-----------------|----------------------|-----------------|
| **Costo de compra del producto** | ✅ | ✅ | ✅ | ✅ | ⛔ PROHIBIDO |
| **Costo promedio ponderado** | ✅ | ✅ | ✅ | ✅ | ⛔ PROHIBIDO |
| **Margen de ganancia (%)** | ✅ | ✅ | ✅ | ✅ | ⛔ PROHIBIDO |
| **Margen de ganancia ($)** | ✅ | ✅ | ✅ | ✅ | ⛔ PROHIBIDO |
| **Nombre del proveedor** | ✅ | ✅ | ✅ | ✅ | ⛔ PROHIBIDO |
| **País del proveedor** | ✅ | ✅ | ✅ | ✅ | ⛔ PROHIBIDO |
| **Datos de contacto del proveedor** | ✅ | ✅ | ✅ | ⛔ | ⛔ PROHIBIDO |
| **Órdenes de compra** | ✅ | ✅ | ✅ | ✅ (montos) | ⛔ PROHIBIDO |
| **Gastos de importación (CIF)** | ✅ | ✅ | ✅ | ✅ | ⛔ PROHIBIDO |
| **Nivel de precio del cliente (A-E)** | ✅ | ✅ | ✅ | ✅ | ⛔ PROHIBIDO |
| **Stock valorizado en $** | ✅ | ✅ | ✅ | ✅ | ⛔ PROHIBIDO |

**"TODOS LOS DEMÁS" incluye:** Vendedores, personal de almacén/bodega, tráfico/logística, y CUALQUIER otro rol que no sea los 4 mencionados arriba. No importa si es un vendedor estrella, no importa si lleva 10 años en la empresa, no importa si lo pide de buena fe. **CERO acceso a costos y proveedores.**

### Por qué esta regla es tan estricta

Esto no es paranoia — es protección del negocio. En el mundo real de la Zona Libre:

**Escenario 1 — Fuga de costos al vendedor:** Si un vendedor sabe que un producto cuesta $10 y se vende a $15, cuando un cliente le pide descuento, el vendedor dice "te lo dejo en $11, aún ganamos". ¿Resultado? El margen de Evolution se destruye. El vendedor cierra la venta y cobra comisión, pero Evolution apenas gana $1 en vez de $5. Multiplicado por cientos de transacciones al mes, son decenas de miles de dólares perdidos.

**Escenario 2 — Fuga de proveedor:** Si un vendedor conoce quién es el proveedor de Evolution (ej: Brands Collection B.V. en Holanda), puede contactarlo directamente, montar su propio negocio, y llevarse los clientes. Esto ha pasado en la Zona Libre y es la razón #1 por la que los proveedores son información clasificada.

**Escenario 3 — Fuga al personal de bodega:** Si la gente de bodega sabe cuánto vale la mercancía que están manipulando (stock valorizado), se genera un riesgo de seguridad. Ellos necesitan saber CANTIDADES (cuántas cajas, cuántas botellas), pero NUNCA cuánto valen en dinero.

### Cómo debe implementarse — En 3 capas obligatorias

**CAPA 1 — Interfaz (Frontend):**
Los campos de costo, margen, proveedor y precio por nivel simplemente NO EXISTEN en la pantalla para usuarios sin permiso. No están ocultos, no están en gris, no están "bloqueados" — NO ESTÁN. La interfaz de un vendedor no tiene ni la etiqueta "Costo" en ninguna parte. Es como si esa información no existiera en el sistema.

**CAPA 2 — API (Backend):**
Cuando un usuario sin permiso solicita datos de un producto, la respuesta del backend NO INCLUYE los campos sensibles. No es que el campo venga vacío o con asteriscos — el campo literalmente no existe en la respuesta. Esto protege contra:
- Inspección del código fuente del navegador
- Llamadas directas a la API desde herramientas como Postman
- Cualquier intento técnico de acceder a la información

Ejemplo de lo que recibe un vendedor al consultar un producto:
```
{
  "nombre": "JOHNNIE WALKER BLACK 12/1L",
  "marca": "JOHNNIE WALKER",
  "stock_disponible": 145,
  "precio_sugerido": 45.00    ← (el precio del nivel del cliente, no dice qué nivel es)
}
```

Lo que NO recibe (ni siquiera como campo vacío):
```
  "costo": NO EXISTE EN LA RESPUESTA
  "margen": NO EXISTE EN LA RESPUESTA
  "proveedor": NO EXISTE EN LA RESPUESTA
  "precio_nivel_a": NO EXISTE
  "precio_nivel_b": NO EXISTE
  "precio_nivel_c": NO EXISTE
  "precio_nivel_d": NO EXISTE
  "precio_nivel_e": NO EXISTE
```

**CAPA 3 — Base de datos (Queries):**
Las consultas a la base de datos para usuarios sin permiso deben excluir las columnas sensibles directamente en el SELECT. No se trae la información y luego se filtra — directamente no se consulta. Esto es la protección más profunda: incluso si hay un bug en la capa 2, la información no viaja.

### La regla dentro de la regla: Información que el vendedor SÍ necesita para vender

El vendedor necesita cierta información para hacer su trabajo, pero de forma controlada:

**Lo que SÍ ve:**
- Nombre, código, marca y categoría del producto
- Stock disponible (solo cantidades: "145 unidades", nunca "145 unidades × $10 = $1,450")
- Precio sugerido para el cliente que está cotizando (el sistema automáticamente le muestra el precio del nivel correcto, sin decirle qué nivel es)
- Indicador de comisión: 🟢 (va a ganar comisión) o 🔴 (no comisiona). SOLO el color, NUNCA el porcentaje exacto del margen (esto es configurable — Javier puede decidir si los vendedores ven el % o solo el color)

**Lo que NUNCA ve:**
- Costo de compra
- Margen en $ o %
- Proveedor (nombre, país, contacto)
- Qué nivel de precio tiene el cliente (A, B, C, D, E)
- Los precios de otros niveles
- Stock valorizado en $
- Órdenes de compra
- Gastos de importación
- Datos financieros globales (P&L, balances, saldos bancarios)
- Comisiones de otros vendedores

### Nota final sobre esta regla

Aunque Javier tiene el constructor de roles y puede configurar los permisos como quiera, el sistema debe mostrar **advertencias prominentes** si alguien intenta dar acceso a costos o proveedores a un rol que no sea administrativo o de compras. No bloquear (porque Javier es el dueño y tiene la última palabra), pero sí advertir con algo como:

> "⚠️ Estás a punto de dar acceso a COSTOS DE COMPRA al rol 'Vendedor'. Esto permitirá que los vendedores vean cuánto paga Evolution por cada producto. ¿Estás seguro?"

Esta advertencia debe requerir una confirmación explícita adicional ("Sí, entiendo el riesgo") antes de activarse. Es una barrera de protección contra configuraciones accidentales.

### Regla 2: La Contabilidad Se Alimenta Sola

**NUNCA debe existir una operación financiera sin su reflejo contable.** Esta es la regla más importante del sistema y la que Dynamo violó completamente.

Cada tipo de operación tiene un "mapeo contable" que se configura UNA VEZ al instalar el sistema. Ejemplo:

- "Cuando se emite una factura de crédito" → el sistema sabe que debe crear:
  - Débito a la cuenta de Cuentas por Cobrar
  - Crédito a la cuenta de Ingresos por Ventas
  - Débito a Costo de Ventas
  - Crédito a Inventario

- "Cuando se registra un cobro por transferencia a Banco General" → el sistema sabe:
  - Débito a la cuenta de Banco General
  - Crédito a Cuentas por Cobrar

Estos mapeos los configura Jackie una vez (o se precargan con valores estándar). Después, el sistema los usa automáticamente cada vez que ocurre la operación correspondiente.

**El resultado:** Los estados financieros (P&L, Balance General) están siempre actualizados, en tiempo real, sin que nadie tenga que hacer nada. Javier puede abrir el dashboard financiero a las 3pm y ver las ventas y gastos del día, actualizados al minuto.

### Regla 3: El Inventario Es Sagrado

**Cada entrada y salida de inventario debe tener un origen trazable.** Nunca se modifica el stock directamente — siempre se crea un "movimiento" que explica por qué cambió:

Los tipos de movimiento son:
- **Recepción de compra:** Llegó mercancía del proveedor → stock sube
- **Venta (factura):** Se facturó al cliente → stock baja
- **Ajuste positivo:** Se encontró mercancía extra (aprobado por gerencia) → stock sube
- **Ajuste negativo:** Daño, expiración, robo (aprobado por gerencia) → stock baja
- **Transferencia salida:** Se mueve mercancía de bodega a tienda → stock baja en bodega
- **Transferencia entrada:** Llega mercancía de bodega → stock sube en tienda
- **Ajuste por conteo:** Se hizo conteo físico y hay diferencia → ajuste automático
- **Devolución/Anulación:** Se anuló una factura → stock sube (vuelve)

Cada movimiento guarda: qué cantidad, cuándo, quién lo causó, por qué (referencia al documento origen), y cuánto valía esa mercancía en ese momento.

**Esto permite:** Reconstruir el estado del inventario a cualquier fecha del pasado. "¿Cuántas botellas de Johnnie Walker teníamos el 15 de enero?" → Se puede responder recorriendo los movimientos.

### Regla 4: El Crédito Se Controla en Múltiples Puntos

El sistema verifica el crédito del cliente en TRES momentos:

1. **Al crear el pedido:** ¿El saldo actual + el monto del pedido excede el límite?
2. **Al aprobar el pedido:** Verificación adicional (el saldo puede haber cambiado desde que se creó)
3. **Al generar la factura:** Verificación final antes de emitir

Si en cualquiera de estos puntos el cliente excede su límite y tiene el enforcement activo, el sistema BLOQUEA la operación y solo gerencia puede autorizar la excepción.

El saldo del cliente se calcula siempre en tiempo real: es la suma de todas las facturas pendientes (emitidas + vencidas + parcialmente pagadas) menos cualquier saldo a favor. No es un número almacenado que pueda quedar desactualizado.

### Regla 5: Los Flujos de Aprobación Son Universales

El concepto de "solicitar → aprobar/rechazar" se usa en todo el sistema con el mismo patrón:

- Cotización → aprobación de gerencia
- Pedido → aprobación de gerencia
- Ajuste de inventario → aprobación de gerencia
- Anulación de factura → aprobación de gerencia (con umbral de monto)
- Anulación de cobro → aprobación de gerencia
- Excepción de precio (debajo del mínimo) → aprobación de gerencia
- Cierre contable mensual → aprobación de gerencia
- Cierre contable anual → aprobación SOLO de Javier
- Nota de crédito → aprobación de gerencia

Todos siguen el mismo flujo:
1. Alguien solicita (con motivo obligatorio)
2. El aprobador recibe notificación
3. El aprobador ve el detalle y aprueba o rechaza (con motivo si rechaza)
4. El solicitante recibe notificación del resultado
5. Si fue aprobada, la acción se ejecuta y todo lo que tenga que pasar en cadena, pasa
6. Todo queda registrado: quién solicitó, quién aprobó, cuándo, por qué

**Esto debe implementarse como UN SOLO sistema de aprobaciones que todos los módulos usan**, no como lógica separada en cada módulo. Un solo flujo, reutilizable, con notificaciones integradas.

### Regla 6: Los Precios Siguen una Lógica Automática

Cuando un vendedor agrega un producto a una cotización, el precio se sugiere automáticamente:

1. El sistema lee qué **nivel de precio** tiene el cliente (A, B, C, D o E)
2. El sistema lee cuál es el **precio de ese nivel** para el producto
3. Se llena automáticamente como precio sugerido

El vendedor puede ajustar:
- **Subir el precio:** Siempre permitido sin restricción
- **Bajar un poco:** Permitido, pero el indicador de comisión puede cambiar de verde a rojo
- **Bajar por debajo del nivel E:** BLOQUEADO → requiere aprobación de gerencia

La comisión se calcula así:
- El sistema conoce el costo del producto (el vendedor NO lo ve)
- El sistema calcula: margen = (precio de venta - costo) / precio de venta × 100
- Si el margen es ≥ al umbral configurado (actualmente 10%): el vendedor ve 🟢 (va a ganar comisión)
- Si el margen es < al umbral: el vendedor ve 🔴 (no comisiona o comisiona menos)
- El vendedor SOLO ve el color, NUNCA el porcentaje exacto (esto es configurable por Javier — si quiere que lo vean, lo activa)

### Regla 7: La Auditoría Es Automática y Total

Cada acción significativa en el sistema genera un registro de auditoría SIN que el usuario tenga que hacer nada. El sistema registra automáticamente:

- **Quién** hizo la acción (usuario)
- **Qué** hizo (crear, editar, eliminar, aprobar, rechazar, anular, login, etc.)
- **Sobre qué** lo hizo (factura, cliente, producto, etc.)
- **Qué cambió** (valor anterior → valor nuevo para cada campo modificado)
- **Cuándo** (fecha, hora exacta)
- **Desde dónde** (IP, dispositivo)

Esto permite responder preguntas como:
- "¿Quién cambió el precio de este producto la semana pasada?"
- "¿Quién aprobó esa anulación de $15,000?"
- "¿Cuántas veces se ha modificado la ficha de este cliente?"

Solo Javier y Estelia (o quienes tengan permiso) pueden ver el log de auditoría.

### Regla 8: Los Permisos Son Configurables por Javier

Javier tiene un constructor visual de roles y permisos donde puede:

- Crear los roles que necesite (no están predefinidos por nosotros)
- Para cada rol, marcar con checkboxes qué puede ver, crear, editar, aprobar y eliminar en cada módulo
- Controlar la visibilidad de campos sensibles (costos, márgenes, proveedores) con toggles
- Dar permisos extra a usuarios individuales sin cambiar el rol completo
- Cambiar todo esto en cualquier momento sin necesidad de un programador

El sistema viene con **templates sugeridos** (Ventas, Compras, Finanzas, Almacén, etc.) que Javier puede usar como punto de partida y ajustar, pero ÉL tiene la última palabra sobre qué ve cada persona.

---

## Los Datos Que Se Comparten Entre Módulos

### Productos ↔ Todos los Módulos

| Módulo que lee el dato | Qué lee del producto | Para qué |
|----------------------|---------------------|----------|
| Compras | Costo, proveedor, código arancelario | Crear órdenes de compra |
| Inventario | Stock, ubicación, unidades por caja | Control de existencias |
| Ventas | Precios por nivel (A-E), nombre, stock | Crear cotizaciones |
| CxC | Precio de venta (de la factura) | Calcular saldos |
| Contabilidad | Costo promedio ponderado | Valorizar inventario, calcular COGS |

**Dato importante:** Cuando Compras actualiza el costo de un producto (porque llegó una nueva compra), ese cambio se refleja automáticamente en:
- El margen que ve gerencia en cotizaciones futuras
- El costo de ventas de facturas futuras
- La valorización del inventario
- PERO NO cambia los precios de venta (eso es decisión de gerencia)
- PERO NO cambia facturas ya emitidas (esas conservan el costo que tenían al momento de facturar)

### Cliente ↔ Ventas ↔ CxC ↔ Contabilidad

```
DIRECTORIO DE CLIENTES
  → Ventas: quién es el cliente, qué nivel tiene, quién es su vendedor
  → CxC: cuánto debe, cuándo vence, historial de pagos
  → Contabilidad: movimientos contables asociados al cliente
  
VENTAS (cotización → pedido → factura)
  → CxC: cada factura emitida se convierte en una cuenta por cobrar
  → Inventario: cada factura descuenta stock
  → Contabilidad: cada factura genera asientos
  → Comisiones: cada factura calcula comisión del vendedor
  
COBROS (pagos del cliente)
  → CxC: reduce el saldo de las facturas
  → Contabilidad: genera asiento de ingreso a banco
  → Dashboard: actualiza métricas de cobro
```

### Compras ↔ Inventario ↔ Productos ↔ Contabilidad

```
ORDEN DE COMPRA
  → Al recibir la mercancía:
     → Inventario: stock sube
     → Productos: costo se actualiza con nuevo CIF
     → Contabilidad: DB Inventario / CR CxP

INVENTARIO
  → Afectado por: recepciones (sube), ventas (baja), ajustes (sube o baja), transferencias
  → Cada movimiento se registra con origen trazable
  → El valor del inventario alimenta el Balance General en contabilidad
```

---

## El Dashboard: Donde Todo Converge

Cada rol ve un dashboard diferente que se alimenta de los datos de todos los módulos relevantes:

### Dashboard de Javier/Estelia (Gerencia)
- **Ventas del día/semana/mes** ← calculado desde facturas
- **Margen bruto** ← calculado desde facturas (venta - costo)
- **CxC total pendiente** ← calculado desde facturas no pagadas
- **Facturas vencidas** ← facturas donde hoy > fecha de vencimiento
- **Top 5 clientes morosos** ← clientes con más deuda vencida
- **Stock bajo mínimo** ← productos donde stock < min_stock configurado
- **Saldos bancarios** ← desde conciliación / registro de cobros
- **P&L del mes** ← calculado en tiempo real desde asientos contables automáticos
- **Aprobaciones pendientes** ← solicitudes que esperan su decisión

### Dashboard de Vendedor (Margarita, Arnold)
- **Sus ventas del mes** ← solo sus facturas
- **Sus cotizaciones pendientes** ← solo sus cotizaciones
- **Sus comisiones del mes** ← calculado desde sus facturas que comisionan
- **Stock de productos clave** ← cantidades disponibles (sin costos)
- **Nada financiero global** ← no ven P&L, no ven CxC global, no ven márgenes

### Dashboard de Contabilidad (Jackie)
- **Cobros del día** ← pagos registrados hoy
- **CxC por aging** ← desglose de deuda por antigüedad (30, 60, 90+ días)
- **Conciliaciones pendientes** ← bancos sin conciliar del mes
- **Cierre pendiente** ← si hay períodos sin cerrar
- **Asientos del día** ← todos los asientos automáticos generados hoy

---

## Las Notificaciones: Cómo el Sistema Avisa

El sistema de notificaciones mantiene a todos informados sin que tengan que ir a buscar la información:

**Notificaciones que gerencia recibe:**
- "Nueva cotización requiere aprobación: COT-2026-0042 por $8,500 de Margarita para SIMEON 333"
- "Solicitud de anulación: Factura FZL-2026-0018 por $12,300 — Motivo: Error de registro"
- "ALERTA: Cliente DINORA SAS excedió límite de crédito ($22,248 de $20,000)"
- "Ajuste de inventario pendiente: 15 botellas de Johnnie Walker Black — Motivo: Daño"

**Notificaciones que el vendedor recibe:**
- "Tu cotización COT-2026-0042 fue aprobada ✓"
- "Tu cotización COT-2026-0043 fue rechazada. Motivo: Margen insuficiente"

**Notificaciones que contabilidad recibe:**
- "Nueva factura emitida: FZL-2026-0042 por $8,500 a SIMEON 333"
- "Conciliación bancaria pendiente: BANCO GENERAL — mes de febrero"

Todas las notificaciones son in-app (aparecen en el sistema). Las de alta prioridad TAMBIÉN se envían por email. Cada usuario puede configurar qué recibe por email y qué solo en la app.

---

## Cómo el Sistema Maneja las Monedas

Evolution opera en la Zona Libre de Colón, Panamá. Las monedas relevantes son:

- **USD (Dólar estadounidense):** Moneda principal. Todas las operaciones B2B, compras internacionales, y la mayoría de cobros/pagos.
- **B/. (Balboa panameño):** Moneda local. Paridad 1:1 con USD. Se usa en operaciones locales, cheques a proveedores panameños.

En la práctica, 1 USD = 1 Balboa siempre, así que no hay complejidad de tipo de cambio. Pero el sistema debe registrar en qué moneda se realizó cada transacción para efectos contables y legales.

---

## Multi-Tenancy: Preparado para Crecer

Aunque hoy EvolutionOS es para UNA empresa (Evolution Zona Libre), el sistema debe diseñarse para que en el futuro pueda servir a MÚLTIPLES empresas. Esto significa:

- Cada dato tiene un identificador de empresa que indica a quién pertenece
- Cada consulta siempre filtra por la empresa del usuario logueado
- Un usuario de Evolution nunca ve datos de otra empresa
- Si mañana Javier quiere usar el sistema para otra empresa, se crea otra empresa y listo

Esto no requiere trabajo extra significativo — simplemente que todo dato siempre esté asociado a una empresa y que nunca se haga una consulta sin filtrar.

---

## Integridad Transaccional: Todo o Nada

Cuando una operación toca múltiples partes del sistema (como emitir una factura que afecta inventario + contabilidad + comisiones + CxC), TODO debe ejecutarse junto como una sola unidad atómica.

**Si falla cualquier parte, se revierte TODO.** Nunca puede quedar una factura emitida sin su asiento contable, ni un cobro registrado sin actualizar las facturas correspondientes, ni un ajuste de inventario sin su reflejo contable.

Esto es fundamental para la integridad del sistema. En Dynamo, los módulos desconectados causaban que los datos quedaran inconsistentes. En EvolutionOS, la consistencia está garantizada por diseño: o todo se completa correctamente, o nada sucede.

---

## Resumen de Entidades Principales

El sistema maneja estas entidades principales. Cada una se relaciona con las demás:

| Entidad | Qué es | Se relaciona con |
|---------|--------|-------------------|
| **Empresa** | Evolution ZL y sus datos | Todo — es el contenedor |
| **Usuario** | Cada persona que usa el sistema | Roles, Permisos |
| **Rol** | Conjunto de permisos (lo crea Javier) | Usuarios, Permisos |
| **Producto** | Cada artículo que Evolution vende | Marcas, Categorías, Proveedores, Inventario, Cotizaciones, Facturas |
| **Marca** | Johnnie Walker, JP Chenet, etc. | Productos |
| **Categoría** | Whisky, Vino, Cerveza, etc. | Productos |
| **Proveedor** | Brands Collection, etc. | Productos, Órdenes de Compra |
| **Orden de Compra** | Pedido a un proveedor | Proveedor, Productos, Recepciones |
| **Recepción** | Mercancía que llega a bodega | Orden de Compra, Inventario |
| **Inventario** | Stock actual por producto y almacén | Productos, Almacenes |
| **Movimiento de Inventario** | Cada entrada/salida de stock | Inventario, documentos origen |
| **Ajuste de Inventario** | Corrección de stock (con aprobación) | Inventario, Aprobaciones |
| **Almacén** | Bodega B2B, Tienda B2C | Inventario |
| **Cliente** | Cada empresa/persona que compra | Cotizaciones, Pedidos, Facturas, Pagos |
| **Cotización** | Propuesta de venta (precio, cantidades) | Cliente, Productos, Pedido |
| **Pedido** | Cotización aprobada lista para facturar | Cotización, Cliente, Factura |
| **Factura** | Documento de venta oficial | Pedido, Cliente, Inventario, Contabilidad, Comisiones |
| **Pago/Cobro** | Dinero que entra de un cliente | Facturas, Banco, Contabilidad |
| **Nota de Crédito** | Reducción de deuda del cliente | Factura original |
| **Nota de Débito** | Aumento de deuda del cliente | Cliente |
| **Plan de Cuentas** | Catálogo de cuentas contables | Asientos Contables |
| **Asiento Contable** | Registro de débito/crédito | Plan de Cuentas, documentos origen |
| **Banco** | Cuenta bancaria de Evolution | Cobros, Pagos, Conciliación |
| **Conciliación Bancaria** | Comparar libros vs extracto del banco | Bancos, Asientos |
| **Período Contable** | Mes/año para cierre contable | Asientos, Cierres |
| **Comisión** | Comisión del vendedor por factura | Vendedor, Factura |
| **Solicitud de Aprobación** | Solicitud de permiso para algo | Cualquier documento que requiera aprobación |
| **Notificación** | Aviso a un usuario | Usuarios, cualquier evento |
| **Log de Auditoría** | Registro de toda acción | Usuarios, cualquier entidad |
| **Configuración** | Parámetros del sistema | Todo — controla comportamiento |

**Total: ~30 entidades principales** que se interconectan para formar un sistema unificado.

---

## Lo Que Hace Diferente a un SaaS de Clase Mundial

Para que EvolutionOS sea realmente un sistema de primer nivel y no "otro Dynamo mejorado", debe cumplir estos principios:

### 1. Consistencia
Si un dato cambia en un lugar, se refleja INSTANTÁNEAMENTE en todos los demás lugares donde aparece. El stock nunca muestra un número en inventario y otro distinto en ventas.

### 2. Automatización
La regla general es: si un humano tiene que ir a otro módulo a hacer algo porque "el sistema no lo hace solo", es un bug. Las operaciones manuales son la excepción (asientos contables especiales, ajustes manuales), no la norma.

### 3. Trazabilidad
Desde cualquier dato del sistema se puede navegar hasta su origen. Desde el P&L se puede llegar hasta la factura específica. Desde el inventario se puede ver cada movimiento. Desde el asiento contable se puede ver qué operación lo generó. La cadena nunca se rompe.

### 4. Seguridad por diseño
La protección de datos sensibles no es un "feature" que se agrega después — es parte fundamental de la arquitectura. Cada endpoint, cada consulta, cada respuesta se filtra según los permisos del usuario.

### 5. Integridad transaccional
Cuando una operación toca múltiples partes del sistema (factura + inventario + contabilidad + comisión), TODO se ejecuta junto o NADA se ejecuta. Si falla cualquier parte, se revierte todo. Nunca puede quedar a medias.

### 6. Escalabilidad
El sistema funciona igual con 10 facturas al mes que con 10,000. No requiere procesos manuales de "actualización" ni "regeneración". Todo es en tiempo real.

---

## Prioridad de Implementación Recomendada

Para construir esto de manera ordenada, la secuencia sugerida es:

**Fase 1: El Esqueleto (autenticación + configuración)**
- Empresa, Usuarios, Roles, Permisos
- Login, autenticación, control de acceso
- Sin esto, nada funciona

**Fase 2: El Catálogo (productos + proveedores)**
- Productos, Marcas, Categorías, Proveedores
- Importación de datos desde Dynamo
- Sin productos, no se puede comprar ni vender

**Fase 3: El Flujo de Compra (compras + inventario)**
- Órdenes de compra, Recepciones
- Inventario (stock, movimientos, almacenes)
- Ajustes, transferencias, conteo físico
- Sin inventario, no se puede vender

**Fase 4: El Flujo de Venta (clientes + ventas + CxC)**
- Directorio de clientes
- Cotización → Pedido → Factura (con todas las cadenas automáticas)
- Cobros, aplicación de pagos
- Comisiones
- Este es el corazón del negocio

**Fase 5: La Contabilidad (automática)**
- Plan de cuentas + mapeos
- Asientos automáticos (que ya se generaron desde la Fase 4)
- Estados financieros en tiempo real
- Conciliación bancaria
- Cierres

**Fase 6: Los Dashboards (inteligencia)**
- Dashboard de gerencia, vendedor, contabilidad
- Reportes dinámicos
- Alertas y notificaciones

**Cada fase debe funcionar completa antes de pasar a la siguiente.** La Fase 4 (ventas) es la más compleja porque es la que dispara más cadenas automáticas.

---

## Datos Reales de Evolution para Pruebas

Para que las pruebas sean realistas, usar estos datos reales extraídos de Dynamo:

**Clientes reales:**
- INVERSIONES SIMEON 333 C.A. (Venezuela)
- DINORA SAS (saldo $22,248.02)
- JOSE ANDRADE
- SERVIMAS, S.A. (Panamá — tienda local)
- G&S CONSTRUCTION (Curazao)
- JAWAD INTERNACIONAL (Caribe)

**Productos reales (estructura):**
- Whisky: JOHNNIE WALKER BLACK 12/1L, JOHNNIE WALKER RED 12/1L
- Vino: JP CHENET (varios), FOLONARI VALPOLICELLA
- Cerveza: HEINEKEN, marcas importadas
- Códigos arancelarios: 2208309000 (whisky), etc.

**Métricas reales:**
- Ventas mensuales: ~$1.47M
- Ventas diarias promedio: ~$11,566
- Margen promedio: 16.54%
- Facturas por día: 4-6
- 12 bancos activos (BANESCO, BANISTMO, CREDICORP, MULTIBANK, ALLBANK, BANCO GENERAL, BAC PANAMA, ST GEORGE BANK, METRO BANK, BANCO MERCANTIL, BANCO OF CHINA)

**Equipo:**
- Javier Lange (dueño)
- Estelia (gerencia/mano derecha)
- Jackie (contabilidad)
- Margarita Morelos (vendedora principal)
- Arnold (vendedor)
- Celly (compras)
- Jesús (almacén)
- Ariel, María (tráfico)

---

## FIN DEL DOCUMENTO MAESTRO

Este documento explica CÓMO funciona EvolutionOS como sistema integrado. No dice cómo codear las tablas ni qué framework usar — eso lo resuelve el developer o la IA. Lo que SÍ dice es:

1. **Qué debe pasar** cuando alguien hace una acción (las cadenas de eventos)
2. **Por qué** cada módulo necesita información de los demás
3. **Qué reglas** cruzan todo el sistema y nunca se pueden violar
4. **Qué datos** se comparten entre módulos y cómo fluyen
5. **Qué principios** hacen que esto funcione como un SaaS de clase mundial y no como otro Dynamo

Los Documentos 01 a 08 dan el detalle de cada módulo. Este documento es el mapa que los une a todos.
