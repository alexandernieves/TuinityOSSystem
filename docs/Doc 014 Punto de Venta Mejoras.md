# DOCUMENTO 014 — MÓDULO PUNTO DE VENTA B2C (TIENDA) — REUNIÓN CON MARELIS

## Origen y Contexto

Este documento especifica el módulo de Punto de Venta (POS) de Evolution Zona Libre basado en la reunión presencial con Marelis González (supervisora de cajas/showroom) y su equipo en marzo de 2026. La reunión fue grabada (176 segmentos) y este documento es el análisis exhaustivo de esa conversación, complementado con decisiones ya tomadas en documentos anteriores (Docs 009, 010) sobre la operación B2C.

**Participantes:**
- **Marelis González** — Supervisora de Cajas / Showroom. Responsable principal de la operación de la tienda. Administra inventario del POS, registra productos nuevos, supervisa cierre de caja, atiende clientes y maneja el WhatsApp de ventas.
- **Elisa Garay** — Asistente de Cajas. Atiende clientes en el punto de venta, cobra, y apoya a Marelis. Estaba de vacaciones al momento de la reunión.
- **Tuinity / Cristofer** — Desarrollador líder. Presentó el prototipo y recopiló feedback.

**Contexto de la operación:** La tienda de Evolution opera en la planta baja del mismo edificio donde están las oficinas. Vende botellas individuales al público — cualquier persona que entre puede comprar. Es una operación de retail directo al consumidor (DTC/B2C), completamente diferente al B2B de arriba. Sin embargo, toda la mercancía viene de la misma bodega B2B mediante transferencias internas. La tienda es el segundo negocio dentro de Evolution — más pequeño pero con potencial de crecimiento.

**Principio inamovible:** B2B y B2C son operaciones COMPLETAMENTE SEPARADAS dentro del mismo sistema. Inventarios separados, contabilidades separadas, roles separados. Conectados únicamente por transferencias formales de mercancía. El POS no ve los módulos de B2B y B2B no ve el POS, excepto para transferencias.

**Prerequisitos:** Leer Docs 04 (Inventario — transferencias B2B→B2C), 09 (Feature 6 — conversión cajas↔botellas), y 010 (Parte 7 — POS/Tienda). Este documento PROFUNDIZA y COMPLETA lo que esos documentos mencionaron superficialmente.

---

# PARTE 1: LA OPERACIÓN ACTUAL DE LA TIENDA

## 1.1 CÓMO FUNCIONA HOY EN DYNAMO

La operación actual del POS en Dynamo es extremadamente básica:

1. Cliente llega a la tienda y elige botellas
2. Marelis o Elisa escanean el código de barras del producto
3. El sistema muestra: producto, precio, cantidad disponible en tienda
4. Ponen la cantidad (ej: 3 botellas)
5. Cobran: efectivo, tarjeta o transferencia
6. Si es efectivo, el sistema calcula el cambio
7. Listo, el cliente se va

No hay perfiles de clientes, no hay facturas fiscales, no hay programas de lealtad. Es venta al contado pura: llega, paga, se va.

## 1.2 LOS PROBLEMAS ACTUALES

### Problema 1: No ven el inventario de bodega B2B
Marelis explicó: "Hay veces que un cliente quiere algo que aquí nada más tengo una caja, pero no puedo asegurarle. Tengo que llamar allá para ver si hay." Para confirmar si hay stock arriba, tiene que llamar a Celly o subir físicamente a verificar. Quiere ver el stock de bodega desde su sistema, separado del suyo pero visible.

### Problema 2: Cierre de caja manual en Excel
Dynamo muestra totales de ventas pero no los detalla por transacción ni por método de pago. Marelis tiene que llevar un Excel aparte donde registra: cuántas transferencias hubo, de cuánto cada una, cuánto en tarjeta, cuánto en efectivo. Esto debería ser automático.

### Problema 3: El cierre NO se puede hacer en frente de clientes
Marelis fue clara: "Es mentira que voy a sacar, a veces que hay dos mil, tres mil dólares. O sea, de cien hay bastante, de cincuenta tengo bastante." El cierre tiene que poder hacerse desde la computadora de atrás, no en el punto de venta donde los clientes ven.

### Problema 4: Registro de productos completamente manual
Cuando llega mercancía nueva a la tienda, Marelis tiene que crear el producto en su Dynamo local: buscar el código de barras, crear la ficha, poner el precio, todo manualmente. Ella dijo: "Ayer trajeron una compra. Esa compra yo la tengo que meter allí atrás." Y si un producto tiene dos códigos de barras diferentes, tiene que crearlo DOS veces. Esto es absurdo porque el producto ya existe en el catálogo de B2B — debería llegar automáticamente cuando se transfiere.

### Problema 5: No hay métricas de qué se vende y qué no
Marelis sabe "a simple vista" qué se mueve, pero no tiene datos concretos. Quiere poder ver qué productos son los que más venden, cuáles no se mueven, para poder empujar los lentos o pedir reposición de los rápidos.

### Problema 6: WhatsApp sin automatización
Reciben ~30-40 mensajes diarios por WhatsApp, con 5 clientes fijos que compran todos los días. Cuando la tienda está llena de clientes físicos, no pueden atender WhatsApp. Los mensajes se acumulan.

---

# PARTE 2: CÓMO DEBE FUNCIONAR EL POS EN EVOLUTIONOS

## 2.1 ARQUITECTURA — MÓDULO AISLADO CON CONEXIONES CONTROLADAS

El POS es un módulo independiente dentro de EvolutionOS. Marelis y Elisa entran al sistema con sus propios usuarios y solo ven el módulo de Punto de Venta. No ven Ventas B2B, no ven Compras, no ven Tráfico, no ven Contabilidad. Es como si tuvieran una aplicación diferente, pero está en la misma plataforma.

**Lo que el POS tiene propio (aislado):**
- Su propio inventario (en botellas/unidades, no en cajas)
- Su propia caja registradora
- Sus propias ventas y transacciones
- Sus propios reportes y métricas
- Su propio cierre de caja

**Lo que comparte con B2B (conexiones controladas):**
- El catálogo de productos (cuando B2B crea un producto, existe automáticamente en POS)
- Los códigos de barras (si B2B registra 3 códigos, los 3 funcionan en POS)
- Las transferencias de mercancía (bodega envía cajas → tienda recibe botellas)
- La contabilidad consolidada (las ventas de la tienda suman a la empresa total)

**Lo que el POS puede VER de B2B (solo lectura):**
- Stock disponible en bodega (para saber si pueden pedir más) — solo cantidades, NUNCA costos ni precios B2B

## 2.2 CATÁLOGO DE PRODUCTOS — AUTOMÁTICO, NO MANUAL

### El cambio fundamental
En Dynamo, Marelis tiene que crear manualmente cada producto en su sistema local. En EvolutionOS, los productos del catálogo son COMPARTIDOS. Cuando Celly crea un producto en el módulo de Productos (B2B), ese producto ya existe en el POS automáticamente con su nombre, foto, códigos de barras, descripción, y especificaciones. Marelis no tiene que crear nada.

### ¿Qué sí maneja Marelis?
Lo ÚNICO que la tienda maneja por su cuenta es el **precio de venta al detal**. El precio al detal es diferente al precio por caja de B2B — es el precio de una botella individual para el público.

### ¿Quién define el precio al detal?
**Pendiente de definir con Javier.** Actualmente no está claro si Marelis pone el precio, si gerencia lo define, o si se calcula automáticamente desde el costo. Lo que sí es claro es que el precio al detal NO es simplemente el costo de la botella dividido — tiene un margen de retail. Para el sistema, se recomienda:

- Gerencia/Compras define un precio al detal sugerido para cada producto (puede ser un % sobre el costo unitario)
- Marelis puede ajustar dentro de un rango autorizado
- Si quiere poner un precio fuera del rango, requiere aprobación de gerencia
- El precio al detal se almacena en la ficha del producto, separado de los precios B2B (A-E)

Esto debe confirmarse con Javier en la próxima reunión.

### ¿Qué pasa cuando llega un producto NUEVO que nunca ha estado en la tienda?
Cuando bodega transfiere un producto que la tienda nunca ha tenido, el producto aparece en el inventario POS con toda su información (nombre, foto, códigos de barra) pero SIN precio al detal. Marelis recibe una alerta: "Producto nuevo sin precio: [nombre]. Asignar precio antes de vender." No puede venderlo hasta que tenga precio asignado.

### Múltiples códigos de barras
Funciona igual que en B2B (Doc 009, Feature 3). Si un producto tiene 3 códigos (caja principal, caja secundario, botella), cualquiera que Marelis escanee identifica el producto correctamente. Esto resuelve el problema que describió: "Llega una caja con un código y la misma caja pero con otro código." Ya no tiene que crear el producto dos veces.

---

## 2.3 INVENTARIO DE LA TIENDA

### Separado pero visible
La tienda tiene su propio inventario en UNIDADES (botellas), completamente independiente del inventario B2B que está en CAJAS. Pero Marelis puede VER (solo lectura) cuántas unidades hay en bodega B2B de cada producto que ella vende. Ella dijo: "Sería mejor como ver la cantidad que ellos tienen allá."

### Lo que Marelis ve en su inventario

```
INVENTARIO TIENDA
═════════════════

| Producto | En tienda | En bodega (B2B) | Precio detal | Estado |
|----------|-----------|-----------------|-------------|--------|
| JW Black 12/1L | 8 uds | 45 cajas (540 uds) | $55.00 | ✅ OK |
| Heineken 24×330ml | 12 uds | 200 cajas (4,800 uds) | $3.50 | ✅ OK |
| Clase Azul Repo. 6/750 | 1 ud | 3 cajas (18 uds) | $180.00 | ⚠️ Bajo |
| Absolut 12/1L | 0 uds | 30 cajas (360 uds) | $22.00 | 🔴 Sin stock |
```

**"En bodega (B2B)"** muestra la cantidad equivalente en unidades (cajas × qty_por_bulto) para que Marelis entienda cuánto hay disponible arriba sin tener que hacer cálculos mentales. Si ve que hay 0 en tienda pero 540 en bodega, puede solicitar reposición inmediatamente.

**Lo que Marelis NO ve:** Costos de compra, precios B2B (A-E), proveedores, márgenes. Solo ve cantidades y su precio de venta al detal.

### Transferencias (reposición) — Flujo completo

**Paso 1 — Marelis detecta que necesita mercancía:**
Ve que un producto está bajo o agotado en su inventario. O un cliente pregunta por algo que no tiene pero sabe que hay arriba.

**Paso 2 — Marelis crea solicitud de reposición:**
Desde su módulo POS, selecciona "Solicitar reposición." Elige los productos y las cantidades que necesita (en unidades/botellas).

```
SOLICITUD DE REPOSICIÓN #REP-2026-0015
───────────────────────────────────────

| Producto | En tienda | Solicitado | En bodega |
|----------|-----------|------------|-----------|
| JW Black 12/1L | 1 ud | 12 uds (1 caja) | 540 uds ✅ |
| Clase Azul 6/750 | 1 ud | 6 uds (1 caja) | 18 uds ✅ |
| Absolut 12/1L | 0 uds | 24 uds (2 cajas) | 360 uds ✅ |

[Enviar solicitud →]
```

El sistema muestra si hay stock suficiente en bodega. Si Marelis pide algo que no hay en bodega, el sistema alerta: "⚠️ Bodega no tiene stock suficiente de [producto]."

**Paso 3 — Bodega recibe la solicitud:**
Celly o Jesús ven la solicitud en su módulo de inventario. Revisan, preparan la mercancía físicamente, y confirman el envío. Al confirmar, el sistema hace la conversión automática: cajas → botellas, a costo real (sin margen, según decisión de Javier en Doc 010).

**Paso 4 — Marelis recibe y confirma:**
Cuando la mercancía baja a la tienda, Marelis abre la solicitud y confirma: "Recibido: 12 botellas JW Black, 6 botellas Clase Azul, 24 botellas Absolut." Al confirmar, su inventario se actualiza automáticamente.

**Regla:** Quien envía (bodega) NO es quien confirma recepción (tienda). Doble verificación para evitar errores.

**¿Qué pasa si llega menos de lo solicitado?** Marelis confirma solo lo que recibió. Si solicitó 24 y llegaron 20, confirma 20. Los 4 restantes quedan como "pendiente" en la solicitud y bodega puede completar después.

---

## 2.4 PUNTO DE VENTA — LA CAJA REGISTRADORA

### Flujo de venta

**Paso 1 — Escaneo o búsqueda:**
Marelis o Elisa escanean el código de barras del producto con la pistola lectora. También pueden buscar por nombre si el código no funciona o si la botella no tiene código visible. Al encontrar el producto, aparece: nombre, foto miniatura, precio al detal, stock disponible en tienda.

**Paso 2 — Cantidad:**
Ingresan la cantidad. Si el cliente quiere 3 botellas de Heineken, ponen 3. El sistema verifica que hay suficiente stock. Si no hay, alerta: "Solo hay 2 unidades disponibles de este producto."

**Paso 3 — Carrito:**
Los productos se acumulan en un carrito/lista de la venta actual. Pueden agregar múltiples productos. Cada línea muestra: producto, cantidad, precio unitario, subtotal.

```
VENTA ACTUAL
════════════

| Producto | Cant. | Precio | Subtotal |
|----------|-------|--------|----------|
| Clase Azul Reposado 750ml | 1 | $180.00 | $180.00 |
| Heineken 330ml | 6 | $3.50 | $21.00 |
| Johnnie Walker Red 1L | 2 | $28.00 | $56.00 |

                              TOTAL: $257.00

[Cobrar →]
```

**¿Qué pasa si escanean un producto que no existe en inventario POS?** El sistema dice: "Este producto no está en el inventario de la tienda." NO permite vender algo que no está en su inventario. Si el producto existe en B2B pero no se ha transferido a la tienda, Marelis debe solicitar reposición primero.

**¿Qué pasa si quieren eliminar un producto del carrito?** Simplemente lo eliminan antes de cobrar. Si ya cobraron y quieren devolver, va por el flujo de devoluciones.

**Paso 4 — Cobro:**
Seleccionan el método de pago:

| Método | Comportamiento |
|--------|---------------|
| **Efectivo** | Ingresan cuánto dio el cliente → sistema calcula cambio. Ej: Total $257, pagó con $300, cambio $43. |
| **Tarjeta** | Se registra como pago por tarjeta. El sistema sabe que hay una comisión bancaria (configurable, ej: 3.5%) que se descuenta del ingreso real. |
| **Transferencia** | Se registra como transferencia bancaria. Marelis puede adjuntar captura del comprobante si quiere. |

**¿Qué pasa si el cliente paga con múltiples métodos?** (Ej: $200 en efectivo y $57 en tarjeta.) El sistema debe permitir pagos divididos. Al presionar "Cobrar," aparecen los métodos y Marelis ingresa cuánto en cada uno. La suma debe dar el total.

**Paso 5 — Venta completada:**
El inventario se descuenta automáticamente. La venta queda registrada con: fecha, hora, productos, cantidades, total, método de pago, y cajero (Marelis o Elisa). No se emite factura fiscal al cliente — la venta queda como registro interno.

### ¿Qué pasa si el cliente quiere factura?
Marelis confirmó que NO emiten facturas fiscales al cliente final. "Eso sí se hace, pero eso yo creo que es del sistema con ellos. Aquí nosotros físicamente no." Las facturas fiscales las maneja Jackie (contabilidad) para la DGI, no la tienda.

---

## 2.5 CIERRE DE CAJA — AUTOMATIZADO

### El problema actual
Dynamo muestra totales del día pero no detalla. Marelis tiene que llevar un Excel aparte para saber cuánto fue en efectivo, cuánto en tarjeta, cuánto en transferencias, y el detalle de cada transacción.

### Cómo debe funcionar en EvolutionOS

**¿Dónde se hace?** Desde la computadora de atrás, NO en el punto de venta frente a los clientes. Marelis fue clara con esto — no puede estar contando $3,000 en billetes donde los clientes la ven.

**¿Quién lo hace?** Marelis. Elisa atiende mientras Marelis cierra atrás.

**Flujo del cierre de caja:**

**Paso 1 — Marelis abre "Cierre de caja" desde su computadora de atrás:**
El sistema le muestra el resumen automático de todas las ventas del día:

```
CIERRE DE CAJA — 10 de Marzo 2026
══════════════════════════════════

RESUMEN DEL SISTEMA (lo que el sistema registró):
──────────────────────────────────────────────────
Ventas totales:          $2,847.50 (42 transacciones)

  Efectivo:              $1,523.00 (18 transacciones)
  Tarjeta:                 $874.50 (15 transacciones)
    - Comisión bancaria:    -$30.61 (3.5%)
    - Ingreso neto tarjeta: $843.89
  Transferencia:           $450.00 (9 transacciones)

DETALLE DE TRANSACCIONES POR MÉTODO:
─────────────────────────────────────
TRANSFERENCIAS:
  09:15 — $45.00 — JW Red 1L ×2 + Heineken ×4
  10:30 — $180.00 — Clase Azul ×1
  11:00 — $55.00 — JW Black 1L ×1
  ... (todas listadas)

TARJETA:
  09:20 — $23.50 — Heineken ×6 + Absolut ×1
  ... (todas listadas)

EFECTIVO:
  09:05 — $12.00 — Cerveza Toña ×4
  ... (todas listadas)
```

**Paso 2 — Marelis cuenta el efectivo físico:**
Ingresa al sistema cuánto dinero hay realmente en la caja, desglosado por denominación si quiere (o solo el total):

```
CONTEO DE EFECTIVO:
───────────────────
Billetes de $100: [  5  ] = $500.00
Billetes de $50:  [  8  ] = $400.00
Billetes de $20:  [ 15  ] = $300.00
Billetes de $10:  [ 12  ] = $120.00
Billetes de $5:   [  8  ] = $40.00
Billetes de $1:   [ 23  ] = $23.00
Monedas:          [      ] = $15.00
Fondo de caja:    [      ] = -$125.00 (lo que había al inicio del día)
──────────────────────────────────
TOTAL EFECTIVO CONTADO: $1,273.00
```

**Paso 3 — Conciliación automática:**
El sistema compara lo que registró vs lo que Marelis contó:

```
CONCILIACIÓN:
─────────────
                    Sistema     Conteo      Diferencia
Efectivo:           $1,523.00   $1,273.00   -$250.00 ⚠️
```

Si hay diferencia, Marelis debe ingresar una explicación: "Se dieron $250 de cambio adicional por error" o lo que sea. Las diferencias quedan registradas para auditoría.

**Paso 4 — Confirmar cierre:**
Marelis confirma el cierre. El sistema genera el reporte final.

**Paso 5 — Envío automático:**
El reporte se envía por correo automáticamente a: Javier (siempre), Jackie (contabilidad), y Astelvia (gerencia). Nadie tiene que hacer nada — al cerrar caja, el correo sale solo.

**Plantilla del correo de cierre:**

```
Asunto: [EvolutionOS] Cierre de caja tienda — 10 marzo 2026

Total vendido: $2,847.50 (42 transacciones)
Efectivo: $1,523.00 | Tarjeta: $874.50 | Transferencia: $450.00
Comisión bancaria: -$30.61
Diferencia en caja: -$250.00 (explicación: [texto de Marelis])

Cajero: Marelis González
Hora de cierre: 18:30

Top 5 productos más vendidos hoy:
1. Heineken 330ml — 24 unidades
2. JW Red 1L — 8 unidades
3. Absolut 1L — 6 unidades
4. Cerveza Toña — 5 unidades
5. Clase Azul 750ml — 3 unidades

→ Ver reporte completo en EvolutionOS: [link]
```

### ¿Qué pasa si Marelis se olvida de cerrar caja?
Al día siguiente, al abrir el POS, el sistema le muestra una alerta: "⚠️ No se cerró caja ayer (10 marzo). ¿Desea hacer el cierre ahora?" No puede procesar ventas del día nuevo sin cerrar el día anterior. Esto garantiza que siempre hay cierre.

---

## 2.6 MÉTRICAS Y REPORTES DE LA TIENDA

### Lo que pidió Marelis
Quiere saber qué se mueve y qué no. Ella dijo: "A simple vista nosotros podemos decir: bueno, esto se mueve menos que lo otro, pero en cuestión al mismo sistema te puede decir: bueno, esto ni se mueve."

### Dashboard de la tienda

Marelis ve un dashboard cuando entra al sistema:

```
TIENDA — HOY (10 marzo 2026)
═════════════════════════════

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ VENDIDO  │ │ TRANSACC │ │ PROMEDIO │ │ STOCK    │
│  HOY     │ │   HOY    │ │ POR VENTA│ │  BAJO    │
│ $1,234   │ │    18    │ │  $68.56  │ │  5 items │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Reportes disponibles

**1. Productos más vendidos (por período):**
Top productos por unidades vendidas y por valor. Filtrable por semana, mes, trimestre. Muestra tendencia: ¿sube o baja vs período anterior?

**2. Productos que no se mueven:**
Lista de productos con X días sin una sola venta. Marelis dijo: "Hay cosas que de repente uno ni lo mira." Estos productos son candidatos para promoción o para devolver a bodega.

**3. Ventas por hora del día:**
¿A qué horas se vende más? Útil para planificar personal. Si de 9-11am no hay casi movimiento pero de 3-6pm es pico, Marelis puede organizar mejor.

**4. Ventas por cajero:**
Si hay más de una cajera, quién vendió más. Útil para métricas de desempeño.

**5. Ventas por método de pago:**
Desglose mensual de efectivo vs tarjeta vs transferencia. Útil para saber tendencias (si cada vez más gente paga por transferencia, quizás el efectivo baja).

**6. Historial de cierres de caja:**
Todos los cierres anteriores con sus diferencias. Si hay un patrón de faltantes, se detecta.

---

## 2.7 DEVOLUCIONES

### Qué mencionó Marelis
Brevemente: "Lo de las devoluciones y eso se maneja con ella [Jackie]." Las devoluciones no las maneja la tienda directamente — pasan por contabilidad/gerencia.

### Cómo debe funcionar

**Flujo de devolución:**

1. Cliente regresa a la tienda con el producto
2. Marelis verifica el producto (que esté sellado, que sea de Evolution, etc.)
3. Marelis crea una solicitud de devolución en el sistema: producto, cantidad, motivo (defecto, error, cambio de opinión)
4. La solicitud va a gerencia para aprobación (Marelis NO puede aprobar devoluciones sola — para evitar fraude)
5. Gerencia aprueba → el sistema genera la devolución: el inventario se suma de vuelta, y se registra si el reembolso es en efectivo, crédito, o cambio por otro producto

**¿Por qué Marelis no puede aprobar sola?** Porque una cajera que puede hacer devoluciones sin supervisión puede simular devoluciones ficticias y quedarse con el dinero. Es una regla básica de control en retail.

---

## 2.8 TICKET / RECIBO PARA EL CLIENTE

### ¿Se le da algo al cliente?
Aunque la tienda no emite factura fiscal, el cliente puede necesitar un comprobante de compra. El sistema debe poder generar un **ticket de venta** simple (no fiscal) que se imprime si el cliente lo pide o si la tienda tiene impresora de tickets.

### Contenido del ticket

```
═══════════════════════════
     EVOLUTION ZONA LIBRE
    Zona Libre de Colón
═══════════════════════════
Fecha: 10/03/2026  14:35
Ticket: #T-2026-00142
Cajero: Marelis G.
───────────────────────────
Clase Azul Rep. 750ml  ×1
                    $180.00
Heineken 330ml         ×6
                     $21.00
JW Red Label 1L        ×2
                     $56.00
───────────────────────────
TOTAL:              $257.00
Método: Efectivo
Recibido:           $300.00
Cambio:              $43.00
───────────────────────────
   ¡Gracias por su compra!
═══════════════════════════
```

**Opcional:** Si la tienda no tiene impresora de tickets, el ticket se puede mostrar en pantalla o no generarse. No es obligatorio darlo al cliente.

---

## 2.9 AJUSTES DE INVENTARIO EN TIENDA

### Qué es
Igual que en bodega B2B (Doc 04), la tienda necesita poder hacer ajustes de inventario: una botella se rompió, se descubrió un faltante en conteo, un producto venció en estante, etc.

### Cómo funciona

Marelis crea un ajuste: selecciona el producto, tipo (negativo por merma/rotura, positivo por corrección), cantidad, motivo (dropdown: Rotura, Merma, Vencimiento, Error de conteo, Otro), y puede adjuntar foto como evidencia.

**Aprobación:** Los ajustes de inventario de la tienda requieren aprobación de gerencia, igual que en B2B. Marelis no puede ajustar inventario sin que alguien lo autorice. Esto previene que se "desaparezcan" botellas sin justificación.

---

## 2.10 PRODUCTOS CON FECHA DE VENCIMIENTO EN TIENDA

### Qué es
Al igual que en B2B (Doc 009, Feature 4), la tienda maneja productos con vencimiento: cervezas, sidras, vinos, algunos licores. Los lotes y fechas de vencimiento que Celly registra al recibir mercancía en B2B se transfieren automáticamente al POS cuando esos productos bajan a la tienda.

### Cómo funciona
Marelis ve en su inventario los productos con fecha de vencimiento y el sistema le alerta cuando algo está próximo a vencer (30/15/7 días). Los productos más próximos a vencer deben venderse primero (FIFO). Si un producto vence en estante, Marelis hace un ajuste de inventario con motivo "Vencimiento."

### Integración con el precio de remate (Doc 012)
Si un producto está próximo a vencer, Marelis o gerencia puede activar un precio de remate para moverlo rápido, usando la misma funcionalidad de precios flexibles de la Parte 4.

---

## 2.11 BOTELLAS DAÑADAS DURANTE TRANSFERENCIA

### Qué pasa si al recibir la transferencia faltan botellas o hay rotura

Cuando bodega envía 24 botellas de JW Red (2 cajas) pero al llegar a la tienda hay una botella rota, Marelis confirma solo 23. La diferencia (1 botella) queda registrada como discrepancia en la transferencia. Esta botella rota se registra como ajuste de inventario en B2B (merma/rotura) con aprobación de gerencia.

**Flujo:**
1. Bodega envía 24 botellas
2. Marelis recibe y cuenta: solo 23 están bien, 1 rota
3. Marelis confirma recepción de 23
4. El sistema registra: transferido 24, recibido 23, diferencia 1
5. Bodega recibe notificación: "Tienda reporta 1 botella dañada en transferencia #TR-2026-XXXX"
6. Se genera ajuste de inventario por la botella rota (requiere aprobación)

---

## 2.12 ARQUEO DE CAJA (CONTEO PARCIAL SIN CERRAR)

### Qué es
A veces Marelis necesita saber cuánto hay en caja a mitad del día sin hacer el cierre completo. Por ejemplo, si necesita retirar efectivo para depositarlo antes de cerrar, o si Javier le pregunta cuánto llevan vendido.

### Cómo funciona
Botón "Arqueo de caja" disponible en cualquier momento del día. Muestra las ventas acumuladas hasta ese momento desglosadas por método de pago. Marelis puede ingresar un conteo parcial de efectivo para verificar que cuadra. El arqueo NO cierra la caja — es solo una consulta. Pueden hacer arqueos múltiples durante el día.

---

# PARTE 3: REQUERIMIENTO DE ARQUITECTURA — API PARA INTEGRACIONES FUTURAS

## 3.1 POR QUÉ ES NECESARIO

EvolutionOS no debe ser un sistema cerrado. Debe diseñarse con capacidad de exponer una API (Application Programming Interface) que permita a servicios externos consultar información del sistema de forma segura. Esto abre la puerta a futuras integraciones: automatizaciones de atención al cliente, conexiones con plataformas de mensajería, herramientas de analítica externa, y cualquier otra necesidad que surja una vez la plataforma esté completamente operativa.

**Esto NO se implementa ahora.** La prioridad es que la plataforma funcione al 100%. Pero la arquitectura debe estar PREPARADA para que cuando llegue el momento de integrar servicios externos, no haya que reconstruir nada — solo abrir los puertos y exponer los endpoints.

## 3.2 QUÉ DEBE PODER EXPONER LA API

**Datos del POS (lectura):**
- Inventario disponible en tienda (productos, cantidades, precios al detal)
- Información de productos (nombre, foto, descripción, presentación)

**Datos de B2B (lectura, restringida):**
- Catálogo de productos (sin costos, sin precios B2B, sin proveedores)
- Stock disponible (solo cantidades, sin valorización)

**Lo que la API NUNCA expone:**
- Costos de compra
- Precios B2B (A-E)
- Información de proveedores
- Datos financieros (CxC, CxP, márgenes)
- Información personal de clientes B2B

## 3.3 SEGURIDAD

- Autenticación requerida (API key o token) para cualquier consulta
- Permisos granulares por endpoint (qué puede consultar cada integración)
- Rate limiting (máximo X consultas por minuto)
- Logging completo (quién consultó qué y cuándo)
- Solo lectura por defecto — escritura solo con autorización explícita de Javier

---

# PARTE 4: PRECIOS AL DETAL — FLEXIBLES Y EDITABLES

## 4.1 FILOSOFÍA: COMO SHOPIFY

El precio al detal debe ser completamente flexible y modificable, similar a como funciona en Shopify donde el dueño pone el precio al producto y sus variantes libremente. No hay fórmulas automáticas obligatorias ni aprobaciones para cambiar un precio. La persona responsable del POS debe poder cuadrar los precios sin fricción.

## 4.2 CÓMO FUNCIONA

Cada producto en el inventario POS tiene un campo editable: **"Precio al detal."** Este precio es independiente de los precios B2B (A-E) y del costo CIF. Es el precio al que se vende la botella al público.

**Quién puede editar el precio al detal:**
- **Marelis** (supervisora POS) — puede poner y modificar precios libremente
- **Gerencia** (Javier, Astelvia) — puede poner y modificar precios
- **Compras** (Celly) — puede poner y modificar precios (porque ella conoce los costos)
- **Elisa** (cajera) — NO puede modificar precios, solo vende al precio establecido

**Cómo se edita:**
Marelis entra al producto desde su módulo POS, ve el precio actual, lo cambia, guarda. Así de simple. Puede hacerlo producto por producto o en masa (seleccionar varios productos y ajustar porcentualmente o a un precio fijo).

**Edición en masa (útil cuando llega mercancía nueva):**

```
AJUSTAR PRECIOS AL DETAL
════════════════════════

☑ Heineken 330ml         — Precio actual: $3.50  → Nuevo: [$3.75]
☑ Cerveza Toña 330ml     — Precio actual: $2.50  → Nuevo: [$2.75]
☐ JW Black 1L            — Precio actual: $55.00 → (sin cambio)
☑ Absolut 1L             — Precio actual: $22.00 → Nuevo: [$23.00]

O aplicar ajuste global a seleccionados: [+5%] [Aplicar]

[Guardar cambios]
```

**Redondeo:** Aplica la misma regla que B2B — precios a dólar entero o $0.50. Nunca $3.23 ni $22.75.

**Auditoría:** Cada cambio de precio queda registrado: quién lo cambió, cuándo, precio anterior → precio nuevo. Visible para gerencia.

## 4.3 ¿QUÉ PASA CON PRODUCTOS NUEVOS SIN PRECIO?

Cuando llega mercancía nueva (por transferencia desde bodega) de un producto que la tienda nunca ha tenido, aparece en inventario POS con toda su información PERO sin precio al detal. Marelis recibe una alerta: "Producto nuevo sin precio: [nombre]. Asignar precio antes de vender." El sistema NO permite vender un producto sin precio asignado.

---

# PARTE 5: CORRECCIONES A DOCUMENTOS ANTERIORES

### CORRECCIÓN A — Inventario NO conectado
**Dónde aparece la versión anterior:** Doc Consolidación (EVOLUTION_ZL_Documentacion_Completa) dice: "Conectada al MISMO inventario que B2B (base unificada)"
**Corrección:** Los inventarios son SEPARADOS. La tienda tiene su propio inventario en unidades/botellas. La bodega B2B tiene su inventario en cajas. Están conectados SOLO por transferencias. Marelis ve el stock de bodega como referencia (solo lectura) pero NO vende del inventario de B2B.

### CORRECCIÓN B — Productos NO se crean manualmente en POS
**Dónde aparece la versión anterior:** Dynamo requiere creación manual de cada producto en el POS local
**Corrección:** En EvolutionOS, el catálogo de productos es compartido. Cuando B2B crea un producto, existe automáticamente en POS. Marelis ya no crea productos — solo asigna precio al detal cuando llega algo nuevo.

### ADICIÓN C — API como requerimiento de arquitectura
EvolutionOS debe diseñarse con capacidad de exponer API para integraciones externas futuras. Esto no se implementa ahora — se implementa cuando la plataforma esté completamente operativa. Pero la arquitectura debe estar preparada desde el inicio para no tener que reconstruir después.

---

# PARTE 6: RESUMEN DE FUNCIONALIDADES PARA IMPLEMENTACIÓN

| # | Funcionalidad | Prioridad | Complejidad |
|---|--------------|-----------|-------------|
| 1 | POS básico: escanear, carrito, cobrar (efectivo/tarjeta/transferencia) | CRÍTICA | Media |
| 2 | Inventario POS separado con visibilidad de stock B2B (solo lectura) | CRÍTICA | Media |
| 3 | Catálogo compartido — productos automáticos desde B2B | ALTA | Baja |
| 4 | Múltiples códigos de barras funcionando en POS | ALTA | Baja |
| 5 | Precios al detal flexibles y editables (estilo Shopify) | ALTA | Baja |
| 6 | Edición de precios en masa (selección múltiple + ajuste %) | ALTA | Media |
| 7 | Transferencias/reposición con solicitud y confirmación | ALTA | Media |
| 8 | Cierre de caja automatizado con detalle por transacción y método | ALTA | Media |
| 9 | Reporte diario automático a Javier por correo | ALTA | Baja |
| 10 | Métricas: productos más vendidos, menos movidos, ventas por hora | MEDIA | Baja |
| 11 | Pagos divididos (parte efectivo, parte tarjeta) | MEDIA | Baja |
| 12 | Devoluciones con aprobación de gerencia | MEDIA | Media |
| 13 | Ticket de venta para el cliente (no fiscal) | MEDIA | Baja |
| 14 | Ajustes de inventario en tienda con aprobación | ALTA | Baja |
| 15 | Productos con vencimiento y alertas (FIFO) | ALTA | Media |
| 16 | Manejo de botellas dañadas en transferencia | MEDIA | Baja |
| 17 | Arqueo de caja parcial (sin cerrar) | MEDIA | Baja |
| 18 | Fondo de caja y conteo por denominación de billetes | MEDIA | Baja |
| 19 | Alerta de cierre pendiente si se olvidó cerrar ayer | MEDIA | Baja |
| 20 | API preparada para integraciones externas futuras | FUTURA | Alta |

---

## FIN DEL DOCUMENTO 014

Este documento especifica el módulo de Punto de Venta B2C de EvolutionOS basado en la reunión con Marelis González. El POS es una operación independiente dentro del mismo sistema — inventario separado, contabilidad separada, roles separados — conectada a B2B solo por transferencias de mercancía y catálogo compartido de productos. Los precios al detal son completamente flexibles y editables por Marelis y Gerencia, al estilo Shopify.

**Nota sobre prioridad:** Javier decidió que el POS se implementa DESPUÉS de estabilizar el B2B. Este documento está listo para cuando llegue ese momento, pero el desarrollo no arranca hasta que ventas, compras, inventario y tráfico estén operativos.
