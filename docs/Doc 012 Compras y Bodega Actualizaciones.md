# DOCUMENTO 012 — REUNIÓN CON COMPRAS Y BODEGA (CELLY Y JESÚS) — MARZO 2026

## Origen y Contexto

Este documento recopila TODOS los requerimientos, descubrimientos operativos, y decisiones que surgieron de la reunión presencial con el departamento de Compras y Bodega de Evolution Zona Libre en marzo de 2026. La reunión fue grabada en su totalidad (768 segmentos de audio) y este documento es el resultado del análisis exhaustivo de esa grabación.

**Participantes:**
- **Celideth Dominguez (Celly)** — Supervisora de Compras. Es la persona que más interactúa con Dynamo en el día a día. Registra compras, recibe mercancía, negocia con proveedores, gestiona inventario en bodega, y también vende a ciertos clientes usando el perfil de Javier.
- **Jesús Ferreira** — Asistente de Compras y Bodega. Apoya a Celly en recepción de mercancía, verificación física de productos, conteo de lotes, y operaciones de almacén.
- **Tuinity / Cristofer** — Desarrollador líder. Presentó el prototipo del sistema a Celly y Jesús y recopiló feedback.
- **Javier Lange** — Estuvo presente parcialmente. Intervino en temas de protección de marca y precios.

**Contexto:** Esta reunión ocurrió el mismo día que la reunión con ventas y tráfico (Doc 010), pero fue una sesión separada en la bodega. Celly y Jesús NO estuvieron presentes en la reunión de oficinas donde se definieron funcionalidades de ventas y tráfico. Varias decisiones que los afectan directamente (como que bodega genera la lista de empaque) se tomaron sin ellos — pero en esta sesión se confirmó que están de acuerdo y que ya operan de forma similar.

**Prerequisitos:** Leer Documentos 03 (Compras e Importación), 04 (Inventario), 09 (Mejoras post-reunión), 010 (Reunión ventas/tráfico), y 011 (Contabilidad y gastos de importación). Este documento COMPLEMENTA Y CORRIGE información de esos documentos basándose en cómo Celly realmente opera.

---

# PARTE 1: DESCUBRIMIENTO CRÍTICO — CELLY NO USA ÓRDENES DE COMPRA

## 1.1 EL HALLAZGO

El Doc 03 y toda la documentación anterior asumen un flujo de compras de 2 pasos: primero se crea una Orden de Compra (OC), luego se recibe la mercancía convirtiendo la OC en factura. Pero Celly reveló que en la práctica **casi nunca usa el paso de la Orden de Compra.** Va directo a registrar la factura.

Celly lo explicó así: "Muy poco yo uso este enlace. Yo me voy directo a la factura, porque ya quiero que los proveedores, perdón, los vendedores vean la mercancía que está por llegar." Y cuando se le preguntó por qué no usa la OC, explicó que le causaba problemas de duplicación: si creaba la OC y luego la convertía a factura, a veces se duplicaban los registros. Además, pasar por OC primero significaba que los vendedores NO veían la mercancía por llegar hasta que ella convirtiera a factura — un paso extra innecesario.

## 1.2 EL FLUJO REAL DE CELLY (CÓMO COMPRA EN LA PRÁCTICA)

**Paso 1 — Negociación por WhatsApp (fuera del sistema):**
Celly negocia directamente con los proveedores por WhatsApp. Tiene múltiples proveedores (Mota, Hueta, PBG, Global Brands, Triple Double) y juega con sus ofertas: pide cotización a 3-4 proveedores del mismo producto, compara precios, negocia descuentos, evalúa tiempos de entrega. Si un proveedor no le baja el precio pero despacha más rápido, puede elegirlo sobre el más barato. Este proceso puede tomar varios días y múltiples idas y vueltas. Nada de esto se registra en Dynamo — todo es WhatsApp, correo y papeles.

**Paso 2 — Confirmación al proveedor (fuera del sistema):**
Cuando Celly decide comprar, confirma al proveedor por WhatsApp o correo. En este momento ya sabe exactamente qué va a comprar, a qué precio, y cuándo llega aproximadamente.

**Paso 3 — Registro en Dynamo (directo a factura):**
Celly entra a Dynamo y registra la compra directamente como factura. Ingresa: proveedor, número de factura, productos, cantidades, costos, y fecha estimada de llegada. Al guardar, los productos aparecen automáticamente como "Por Llegar" en el inventario y los vendedores ya pueden verlos y venderlos.

**Paso 4 — Llegada física y actualización:**
Cuando la mercancía llega a bodega, Celly verifica cantidades (y ajusta si llegaron menos), y presiona "Actualizar" para pasar la mercancía de "Por Llegar" a "Existencia/Disponible." En este momento los vendedores pueden facturar esos productos.

## 1.3 QUÉ SIGNIFICA ESTO PARA EVOLUTIONOS

El Doc 03 diseñó el módulo de compras con OC como paso obligatorio. Basándonos en cómo Celly realmente trabaja, el flujo debe simplificarse:

**Flujo simplificado para EvolutionOS:**

1. **Celly registra la compra** — sin pasar por borrador ni OC. Ingresa proveedor, factura, productos, cantidades, costos FOB, y fecha estimada de llegada. Al guardar, la mercancía pasa automáticamente a "Por Llegar" y los vendedores la ven de inmediato.

2. **Mercancía en tránsito** — Estado: "En tránsito." Los vendedores ven los productos como "Por Llegar" con fecha estimada. Pueden crear cotizaciones y pedidos con esos productos (venta anticipada).

3. **Mercancía llega** — Celly verifica cantidades, ajusta si es necesario, registra lotes y fechas de vencimiento, y confirma la recepción. Estado pasa a "Completada." Las cantidades pasan de "Por Llegar" a "Existencia." En este punto, Jackie o Celly agregan los gastos de internación (Doc 011).

4. **Si hay problemas** — Si llegaron menos unidades, producto dañado, o discrepancias, la orden pasa a "En recepción" (estado intermedio) mientras se resuelve. Celly ajusta las cantidades y cierra cuando está resuelto.

**Solo tres estados:** En tránsito → En recepción (si hay problemas) → Completada. No hay "Pendiente" ni "Borrador" porque Celly solo registra compras ya confirmadas con el proveedor.

### ¿Y qué pasa con la OC formal?

Si en el futuro necesitan generar una OC formal para enviar al proveedor (como documento oficial), el sistema puede generar un PDF de la compra registrada con formato de Orden de Compra. Pero no es un paso obligatorio del flujo — es una opción de exportación.

---

# PARTE 2: FUNCIONALIDADES SOLICITADAS PARA EL MÓDULO DE COMPRAS

## 2.1 BÚSQUEDA DE PRODUCTOS POR NOMBRE AL CREAR COMPRA

### Qué pidió Celly
Al agregar productos a una compra, Celly quiere escribir el nombre del producto y que aparezcan resultados, igual que en Dynamo con F5. Ella dijo: "¿Aquí yo puedo escribir el nombre y ya?" y describió cómo en Dynamo escribe el nombre y le salen todas las referencias. También quiere poder ver productos con disponibilidad cero: "Le daba incluir cero y me salían todas las referencias que tenía creadas."

### Cómo debe funcionar
El campo de búsqueda de productos debe ser inteligente (fuzzy): Celly empieza a escribir "Johnny" y aparecen todos los Johnnie Walker en todas sus presentaciones. Si quiere ver productos que no tiene en stock (para reordenar), puede activar un toggle "Mostrar sin stock" y aparecen todos los productos del catálogo, incluyendo los que tienen existencia cero.

### Selección múltiple
Igual que en ventas (Doc 010), Celly debe poder marcar varios productos con checkboxes y agregarlos todos a la compra de golpe, en vez de uno por uno. Después de agregarlos, pone cantidad y costo a cada uno.

## 2.2 LOTES Y FECHAS DE VENCIMIENTO EN LA COMPRA

### Qué pidió Celly
Celly fue enfática: al registrar o recibir una compra, debe poder ingresar el lote y la fecha de vencimiento de cada producto. Ella dijo: "Llegaron dos mil ciento noventa y dos cajas de agua, pero con lote tal y fecha de vencimiento tal." Actualmente lo pone en el campo de comentarios de Dynamo, lo cual es informal y no permite rastreo.

### El problema de los múltiples lotes
Jesús mostró físicamente en la bodega cajas del mismo producto con lotes diferentes (L4050 vs L3250). Un mismo envío puede traer 100 cajas del producto X, pero 65 con un lote y 35 con otro, con fechas de vencimiento diferentes. Celly quiere registrar esto al momento de la recepción.

Celly además explicó que esto pasa incluso con el MISMO proveedor: "Del mismo proveedor, pero me imagino que tenían presentación vieja y presentación nueva." Y puede suceder también con DIFERENTES proveedores del mismo producto: "Yo le compro a varios proveedores y el proveedor ese le da un lote y este proveedor le da otro lote."

### Cómo debe funcionar en la recepción de mercancía

Al confirmar la recepción de un producto, además de la cantidad total, aparece la opción de desglosar por lotes:

```
Producto: HEINEKEN 24×330ML
Total recibido: 100 cajas

  Lote 1: L4050 │ 65 cajas │ Vence: 15/09/2026
  Lote 2: L3250 │ 35 cajas │ Vence: 01/06/2026
  
  [+ Agregar otro lote]
  
  Total lotes: 100 ✅ (coincide con cantidad recibida)
```

**Validación:** La suma de unidades por lote debe coincidir con la cantidad total recibida. Si no coincide, el sistema alerta antes de permitir confirmar.

**Sobre errores de transcripción de lotes:** Antes, los errores de lotes (confundir una O con un 0, una L con un 1) ocurrían porque ARIEL hacía la lista de empaque desde la oficina sin estar en la bodega. Celly le mandaba los lotes escritos a mano y Ariel los transcribía — ahí se generaban los errores. Con el cambio de flujo del Doc 010 (bodega genera la lista de empaque), Celly es quien registra los lotes directamente en el sistema. Ella está físicamente al lado de los productos, puede leer las etiquetas directamente, y no tiene excusa para equivocarse. No hace falta adjuntar foto de la etiqueta — Celly registra lo que ve.

### ¿Qué pasa si Celly no tiene la información de lotes al momento de registrar la compra?

Cuando Celly registra la compra (antes de que llegue la mercancía), probablemente NO tiene los lotes ni las fechas de vencimiento — esos datos solo se conocen al recibir físicamente las cajas. El flujo es: al registrar la compra, solo pone producto, cantidad y costo. Al RECIBIR la mercancía (cuando cambia de "En tránsito" a "Completada"), ahí es donde desglose los lotes y fechas de vencimiento.

### Impacto en inventario

Cada lote se registra como una entrada separada en la tabla de lotes del producto (tabla producto_lotes_vencimiento del Doc 009, Feature 4). Esto permite:
- Ver en inventario cuántas unidades tiene cada lote: "Tengo 160 del lote bueno y 40 del lote que está por vencer"
- Aplicar FIFO en ventas: se vende primero el lote con fecha más próxima
- Identificar qué lotes hay que mover rápido (los próximos a vencer)
- Generar certificados de libre venta con los lotes correctos para tráfico

### Impacto en certificados de tráfico (problema identificado por Celly)

Celly explicó un problema real: cuando se despacha mercancía con múltiples lotes, los certificados de libre venta deben incluir TODOS los lotes que van en el embarque. Si se omite un lote, el inspector en destino puede rechazar la mercancía. Celly dijo: "Si yo selecciono varios de esta factura, los dos lotes ahí. Que vean que ese producto va con dos lotes."

**Solución:** Al generar la lista de empaque y los documentos de tráfico, el sistema debe incluir automáticamente los lotes de cada producto que se está despachando. Si un producto tiene unidades de múltiples lotes en el embarque, todos los lotes aparecen en los documentos.

---

## 2.3 ADJUNTAR DOCUMENTOS A LA COMPRA

### Qué pidió Celly
Celly quiere adjuntar dos tipos de documentos a cada compra:

**1. La cotización/proforma del proveedor:** El documento con el que negoció antes de confirmar. Celly dijo: "Si pudiera adjuntar el archivo como tú dices y que yo pudiera escanearlo, ahí cuando contabilidad abra, que vea el documento." Esto es la proforma original del proveedor antes de que se convierta en factura.

**2. La factura firmada del proveedor:** Cuando llega la mercancía, Celly recibe la factura física, la firma confirmando que recibió completo, la escanea, y la quiere subir al sistema. Ella dijo: "Cuando llega la factura, yo nada más lo único que cambio es el número de factura. Y lo que hago es firmar de que llegó completo."

### Cómo debe funcionar

En cada compra registrada, hay una sección "Documentos Adjuntos" con:

```
DOCUMENTOS DE ESTA COMPRA
──────────────────────────

📎 Cotización/Proforma del proveedor     [Subir archivo]  ✅ Adjunto
📎 Factura del proveedor (firmada)       [Subir archivo]  ⚠️ Pendiente
📎 Otros documentos                      [Subir archivo]  

[+ Agregar documento]
```

Cada documento tiene: tipo (del dropdown o libre), archivo (PDF/JPG/PNG), fecha de carga, y quién lo subió. Contabilidad (Jackie) y Gerencia pueden acceder a estos documentos desde CxP para verificar pagos.

### ¿Qué pasa si Celly olvida adjuntar la factura?

El sistema no bloquea la operación (porque la factura física puede llegar días después de la recepción), pero muestra un indicador visual: "⚠️ Factura del proveedor no adjunta." Esto queda visible para contabilidad cuando revisa la CxP de ese proveedor.

---

## 2.4 FECHA ESTIMADA DE LLEGADA VISIBLE PARA VENDEDORES

### Qué pidió Celly
Los vendedores necesitan ver cuándo llega la mercancía que está por llegar. Celly pone la fecha estimada pero en Dynamo no se refleja bien — a veces la pone en comentarios y los vendedores no la ven. Celly dijo: "Que le pongo aproximado, porque muchas veces aquí yo pongo estima llegar, puede ser antes o puede ser después."

### Cómo debe funcionar

**Al registrar la compra:** Celly tiene un campo obligatorio "Fecha estimada de llegada." Este campo aparece visible para los vendedores cuando consultan productos "Por Llegar."

**Lo que ve el vendedor al buscar un producto:**

```
JOHNNIE WALKER BLACK 12/1L
──────────────────────────
En bodega:      45 cajas    ✅ Disponible ahora
Por llegar:     120 cajas   📦 Orden OC-2026-0042 — ETA: 20 marzo 2026
                50 cajas    📦 Orden OC-2026-0048 — ETA: 5 abril 2026
```

**Múltiples órdenes del mismo producto:** Celly confirmó que puede haber 2-3 órdenes activas del mismo producto de diferentes proveedores. Cada una con su propia fecha. El vendedor debe ver TODAS las órdenes pendientes con sus fechas, no un total consolidado.

**Lo que el vendedor NO ve:** Costos, nombre del proveedor, ni detalles financieros de la compra. Solo: número de orden (para referencia), cantidad por llegar, y fecha estimada.

### ¿Qué pasa si la fecha cambia?

A veces los barcos se retrasan. Celly debe poder actualizar la fecha estimada en cualquier momento. Al actualizarla, los vendedores ven la fecha nueva automáticamente. Si un vendedor ya le prometió una fecha a un cliente basándose en la fecha anterior, es su responsabilidad comunicar el cambio — pero el sistema muestra la fecha actualizada en tiempo real.

---

## 2.5 HISTORIAL DE COMPRAS POR PROVEEDOR

### Qué pidió Celly
Celly necesita ver todo lo que le ha comprado a un proveedor específico durante un período. Ella dijo: "Yo necesito saber qué le compré durante el mes a Global Brands." Javier también lo necesita para negociaciones: saber cuánto volumen le dan a cada proveedor.

### El problema de Dynamo
En Dynamo, cada producto solo guarda UN proveedor (el último al que se le compró). Si Celly compra Johnnie Walker a Triple Double y luego lo compra a Mota, el producto queda asociado a Mota. Los reportes "por proveedor" muestran data incompleta porque no guardan el historial de proveedores por orden. Celly dijo: "Le doy clic al proveedor y no me aparecen todos los productos que le he comprado."

### Cómo debe funcionar en EvolutionOS

En EvolutionOS, el proveedor se vincula a la ORDEN DE COMPRA, no al producto. Un producto puede haber sido comprado a 4 proveedores diferentes. El historial se construye desde las órdenes.

**Vista "Historial por Proveedor" dentro del módulo de Compras:**

Celly selecciona un proveedor y un rango de fechas. El sistema muestra:

```
HISTORIAL DE COMPRAS — GLOBAL BRANDS, S.A.
Período: Enero 2026 — Marzo 2026
──────────────────────────────────────────

| Fecha | Orden | Producto | Cantidad | Costo FOB | Total |
|-------|-------|----------|----------|-----------|-------|
| 15/01 | OC-0012 | JW Black 12/1L | 50 cajas | $40.00 | $2,000 |
| 15/01 | OC-0012 | Finlandia 12/1L | 30 cajas | $25.00 | $750 |
| 20/02 | OC-0034 | JW Black 12/1L | 80 cajas | $42.00 | $3,360 |
| 20/02 | OC-0034 | JD Honey 12/750 | 40 cajas | $35.00 | $1,400 |

TOTAL COMPRADO A GLOBAL BRANDS: $7,510 (200 cajas, 4 productos)
```

**Filtros:** Por rango de fechas, por producto específico, por estado de la orden.

**Exportable:** A PDF y Excel para que Celly pueda analizar y compartir con Javier.

---

## 2.6 COMPARACIÓN ENTRE PROVEEDORES

### Qué pidió Celly (y Javier)
Javier le pidió a Celly poder comparar precios entre proveedores del mismo producto. Celly lo describió: "Yo tengo tres, cuatro proveedores diferentes con un solo producto. Además, me voy al que tiene el precio más barato."

### Cómo debe funcionar

**Vista "Comparación de Proveedores" dentro del módulo de Compras:**

Celly selecciona los proveedores que quiere comparar y un producto o grupo de productos:

```
COMPARACIÓN DE PROVEEDORES — JOHNNIE WALKER BLACK 12/1L
────────────────────────────────────────────────────────

| Proveedor | Último precio | Penúltimo | Tendencia | Tiempo entrega | Última compra |
|-----------|--------------|-----------|-----------|----------------|--------------|
| GLOBAL BRANDS | $42.00 | $40.00 | ↑ Subiendo | 2-3 semanas | 20/02/2026 |
| TRIPLE DOUBLE | $41.50 | $41.50 | → Estable | 4-5 semanas | 05/01/2026 |
| MOTA (PBG) | $43.00 | $44.00 | ↓ Bajando | 1-2 semanas | 15/03/2026 |
```

Esto le permite a Celly decidir: Triple Double es $0.50 más barato que Global Brands, pero tarda el doble en entregar. Mota es el más caro pero el más rápido. Decisiones informadas.

**Vista más amplia (todos los productos vs proveedores):**

Javier pidió poder ver TODO el inventario con columnas por proveedor:

```
| Producto | En stock | GLOBAL BRANDS | TRIPLE DOUBLE | MOTA |
|----------|----------|--------------|---------------|------|
| JW Black 12/1L | 45 | $42.00 (50 cajas) | $41.50 (80 cajas) | $43.00 (30 cajas) |
| JW Red 12/1L | 120 | $28.00 (100 cajas) | — | $29.00 (60 cajas) |
| Finlandia 12/1L | 30 | $25.00 (30 cajas) | — | — |
```

Esto muestra a quién le compran cada producto, a qué precio, y qué cantidad. Donde aparece "—" significa que nunca le han comprado ese producto a ese proveedor.

---

## 2.7 PROTECCIÓN DE MARCA — CONFIRMACIÓN Y DETALLES OPERATIVOS

### Confirmación del equipo completo
En esta reunión, Javier, Celly y Tuinity discutieron extensamente la protección de marca. Javier explicó directamente a Celly por qué no puede aplicarse al costo y debe ir sobre precios de venta. Las conclusiones finales:

**1. Se aplica sobre precios de venta, NUNCA sobre costos.** Javier a Celly: "Si en el costo yo afecto el costo, contablemente nunca vamos a estar cuadrados, porque va a aparecer un costo aquí, la factura dice otra cosa y yo pagué lo de la factura y no lo de acá."

**2. Afecta TODOS los niveles (A, B, C, D, E) automáticamente.** Javier: "Se suben cinco por ciento a la A, se sube cinco por ciento al B... Pero el vendedor sigue pensando que está vendiendo al diez."

**3. Porcentaje libre entre 0.1% y 5%.** Javier confirmó: "Tres por ciento porque hay productos a los que no les quiero subir el cinco."

**4. Se activa POR PRODUCTO, manualmente por Celly o Gerencia.**

**5. Selección masiva de productos.** Celly pidió poder seleccionar varios productos de una vez y aplicarles el porcentaje en bloque, en vez de ir producto por producto. Ella dijo: "Si yo selecciono varios de esta factura, a cinco productos de estos, yo le puedo poner un tres por ciento."

### Cómo implementar la selección masiva

En el catálogo de productos o desde una vista de orden de compra completada, Celly puede:
1. Filtrar los productos que quiere (por proveedor, por orden, por categoría)
2. Marcar con checkboxes los que quiere afectar
3. Hacer clic en "Aplicar protección de marca"
4. Ingresar el porcentaje (3%, 5%, o lo que sea)
5. Confirmar → todos los precios de venta de los productos seleccionados se ajustan

### ¿Qué pasa si un producto ya tiene protección de marca y Celly quiere cambiarla?

El sistema muestra el porcentaje actual y permite modificarlo o desactivarlo. El cambio afecta los precios de venta inmediatamente. Queda registrado en auditoría: quién cambió, cuándo, porcentaje anterior → nuevo.

---

## 2.8 PRECIO DE REMATE — FUNCIONALIDAD NUEVA

### Qué es
Cuando un producto lleva demasiado tiempo en bodega (más de un año) o está por vencer, Javier da la orden de venderlo por debajo del precio normal, incluso por debajo del costo si es necesario. Celly necesita una forma de establecer este "precio de remate" para que los vendedores lo vean y lo vendan a ese precio sin poder modificarlo.

### Por qué se necesita como funcionalidad separada
Hoy, Javier le dice a Celly por teléfono o WhatsApp: "Ese producto va a siete dólares." Celly no tiene dónde registrar eso en el sistema. Los vendedores no tienen visibilidad de qué productos están en remate ni a qué precio. Y cuando un producto se vende en remate, puede estar por debajo del 10% de margen (o incluso por debajo del costo), lo que normalmente bloquearía la venta.

### Cómo debe funcionar

**Activación del remate:**
En la ficha del producto, Celly o Gerencia activa un toggle: "Producto en remate." Se abre un campo para ingresar el precio de remate (precio fijo, no un porcentaje). Al activarlo:

1. El precio de remate **reemplaza** los precios por nivel (A, B, C, D, E) para ese producto. Los vendedores ven UN solo precio: el de remate.
2. Se desactiva automáticamente la protección de marca para ese producto (no tiene sentido inflar el precio de algo que se está rematando).
3. El indicador de margen aparecerá en rojo (porque probablemente está bajo el 10%), pero el sistema NO lo bloquea — porque ya fue pre-aprobado por Gerencia al activar el remate.
4. La comisión del vendedor NO aplica para ventas en remate (porque el margen es inferior al 10%).

**Lo que ven los vendedores:**
En su catálogo, el producto aparece con un badge: "🏷️ REMATE" y el precio fijo. No pueden modificar este precio. No ven el costo ni por qué está en remate — solo saben que tienen que venderlo a ese precio.

**¿Qué pasa cuando se acaba el stock de remate?**
Si el producto tenía lotes separados (lote viejo en remate, lote nuevo a precio normal), al agotarse el stock del lote viejo, el sistema debe desactivar automáticamente el remate si queda solo el lote nuevo. Celly o Gerencia también pueden desactivar manualmente el remate en cualquier momento.

**Registro:**
Queda en auditoría: quién activó el remate, cuándo, precio de remate establecido, motivo (campo libre o dropdown: "Producto estancado", "Próximo a vencer", "Exceso de inventario", "Orden de Javier").

### Interacción con la separación de lotes por vencimiento (Doc 009, Feature 4)

Esto es importante: un producto puede tener simultáneamente stock normal (lote nuevo) y stock en remate (lote viejo por vencer). El sistema debe manejar esto como dos "presentaciones" del mismo producto:

```
HEINEKEN 24×330ML
──────────────────
Lote L4050 (vence 15/09/2026) — 160 cajas — Precio normal: Nivel A-E
Lote L3250 (vence 01/04/2026) — 40 cajas — 🏷️ REMATE: $7.00/caja
```

El vendedor ve ambos y puede ofrecer al cliente: "Tengo Heineken a precio normal o tengo 40 cajas en remate que vencen en abril, te las dejo a $7." Esto es exactamente lo que Celly describió como necesidad.

---

## 2.9 REDONDEO DE PRECIOS DE VENTA

### Qué pidió Javier
Todos los precios de venta deben estar redondeados a números "limpios": dólares enteros o incrementos de $0.50. Nunca precios como $123.23 o $19.75.

### Reglas de redondeo

El redondeo aplica cuando el sistema calcula un precio (por ejemplo, al aplicar protección de marca o al calcular precios por nivel):

```
$19.01 a $19.24  →  $19.00  (baja al dólar)
$19.25 a $19.74  →  $19.50  (sube a medio dólar)
$19.75 a $19.99  →  $20.00  (sube al dólar)
```

**Aplica a:** Precios de venta por nivel (A, B, C, D, E). Precios después de aplicar protección de marca. Precios de remate (Celly los pone manualmente así que ya vienen redondeados).

**NO aplica a:** Costos. Los costos siempre son el número exacto de la factura del proveedor, con todos los decimales que tenga. Javier fue claro: "De mi costo no. Si gasté un centavo, gasté un centavo."

### Cuándo se ejecuta el redondeo

El redondeo se aplica automáticamente en dos momentos:
1. Cuando se calculan o actualizan los precios de venta (por cambio de costo, por protección de marca, por actualización manual de precios)
2. Cuando Celly o Gerencia activan/cambian la protección de marca

El vendedor siempre ve precios ya redondeados. Nunca ve decimales raros.

---

## 2.10 PERFIL DE JAVIER CON VISIBILIDAD DE COSTOS EN VENTAS

### Qué pidió Celly
Celly usa el perfil de Javier para vender a ciertos clientes (principalmente Empire, que es la tienda). Cuando crea cotizaciones desde el perfil de Javier, necesita ver el costo del producto para poder calcular rápidamente el precio de venta. Actualmente tiene que salir de ventas, ir a compras, buscar el costo, memorizar el número, y volver a ventas para poner el precio. Celly dijo: "Si hubiera la opción de que ya yo voy montando el producto, pero de una vez ya vaya jalando el último costo y el porcentaje."

### Cómo debe funcionar

El perfil de Javier (Admin Supremo) tiene una configuración especial: al crear una cotización, se muestra una columna adicional de "Último costo" al lado de cada producto. Esto es exclusivo del perfil Admin — ningún vendedor ve esta columna.

```
CREAR COTIZACIÓN (perfil Javier/Admin)
──────────────────────────────────────

| Producto | Disponible | Último costo | Precio | Cantidad | Total |
|----------|------------|-------------|--------|----------|-------|
| JW Black 12/1L | 45 | $42.50 | $52.00 | 10 | $520 |
| Heineken 24×330 | 200 | $19.00 | $25.00 | 50 | $1,250 |
```

Celly ve el costo, calcula mentalmente el precio que quiere dar (generalmente costo + un margen mínimo para Empire), y lo pone directamente.

### Implicación para auditoría

Las acciones realizadas desde el perfil de Javier quedan registradas como acciones de Javier. Pero Celly es quien realmente las ejecuta. Esto crea un problema de trazabilidad. La solución recomendada (ya definida en Doc 009, Feature 15) es crear un rol híbrido para Celly que le dé acceso al módulo de ventas con visibilidad de costos, en vez de usar el perfil de Javier. Pero hasta que se implemente, el perfil de Javier con costos visibles es la solución operativa.

---

# PARTE 3: INVENTARIO — OBSERVACIONES DE BODEGA

## 3.1 VISTA DE LOTES EN INVENTARIO

### Qué pidió Celly
Celly quiere ver en inventario, para cada producto, el desglose de lotes: cuántas unidades tiene de cada lote, con su fecha de vencimiento. Ella dijo: "Que me aparezca la opción de poner la fecha. Para que cuando yo le dé clic, de una vez aparezca: tengo ciento sesenta de esto y cuarenta de esta."

### Cómo debe funcionar

Al hacer clic en un producto en inventario, en la sección de stock, aparece el desglose por lote:

```
HEINEKEN 24×330ML — Stock total: 200 cajas
──────────────────────────────────────────

| Lote | Cantidad | Fecha vencimiento | Estado | Origen |
|------|----------|-------------------|--------|--------|
| L4050 | 160 cajas | 15/09/2026 (189 días) | ✅ Saludable | OC-2026-0042 |
| L3250 | 40 cajas | 01/04/2026 (21 días) | 🔴 Próximo a vencer | OC-2026-0028 |
```

Celly puede ver de un vistazo cuáles hay que mover rápido y cuáles están bien.

## 3.2 MÚLTIPLES LOTES DEL MISMO PRODUCTO EN LA FICHA

### Qué pidió Celly
Jesús y Celly explicaron que un producto puede tener múltiples lotes activos en cualquier momento, no solo por fechas de vencimiento diferentes sino también porque los proveedores asignan lotes diferentes a cada producción. Celly dijo: "Que si yo tengo tres lotes, se le agreguen los tres lotes al mismo rubro."

### Importancia para tráfico
Celly destacó que los lotes son críticos para los certificados de libre venta. Si un embarque va con productos de dos lotes diferentes, AMBOS lotes deben aparecer en el certificado. Si solo aparece uno y el inspector en destino revisa una caja del otro lote, rechaza la mercancía. Celly dijo: "Yo le pongo los dos lotes. Que vean que ese producto va con dos lotes."

### Cómo se integra con la lista de empaque

Cuando bodega genera la lista de empaque (cambio de flujo definido en Doc 010), la lista debe incluir para cada producto: cantidad, peso, Y lotes con sus cantidades. Si van 100 cajas de Heineken y 65 son del lote L4050 y 35 del lote L3250, la lista de empaque dice:

```
Heineken 24×330ML — 100 cajas
  Lote L4050: 65 cajas
  Lote L3250: 35 cajas
```

Esta información fluye automáticamente a los documentos de tráfico (DMC, certificados).

---

## 3.3 CONTEO FÍSICO Y VERIFICACIÓN DE MERCANCÍA

### Observación de Celly sobre verificación
Celly describió que cuando llega la mercancía, ella va físicamente con una lista y verifica caja por caja. Anota a mano: cantidad, lote, fecha de vencimiento, estado de las cajas. Luego regresa al sistema y actualiza. Quiere que este proceso sea más directo: llevar una tablet o laptop a la bodega, escanear o buscar el producto, e ingresar directamente en el sistema sin tener que anotar en papel y después transcribir.

### Cómo debe funcionar

Al recibir mercancía, Celly o Jesús pueden abrir la recepción pendiente en una tablet:
1. Escanean el código de barras de la caja (o buscan el producto por nombre)
2. El sistema muestra el producto con la cantidad esperada
3. Ingresan la cantidad real recibida
4. Ingresan lote y fecha de vencimiento (si aplica)
5. Si hay daños, toman foto directamente y la adjuntan como evidencia
6. Cuando terminan todos los productos, confirman la recepción

Esto elimina el paso de anotar en papel y después transcribir al sistema.

---

## 3.4 CREACIÓN DE NUEVOS PRODUCTOS

### Confirmación de que solo Compras crea productos
Celly confirmó que solo ella y Jesús crean productos nuevos. Los vendedores no deben tener esta opción. Celly dijo: "Solamente nosotros." Cuando llega un producto nuevo que no existe en el catálogo, Celly lo crea incluyendo: nombre, código de barras, código arancelario, país de origen, unidades por caja, y foto.

### Código arancelario al crear producto
Celly confirmó que al crear un producto, ella misma asigna el código arancelario: "A mí me aparece el arancel. Yo lo puedo agregar." Los aranceles ya están cargados como catálogo (traídos de Dynamo) y ella los selecciona.

---

# PARTE 4: VENTAS DESDE EL PERFIL DE COMPRAS (CASO CELLY)

## 4.1 CÓMO CELLY VENDE HOY

Celly usa el perfil de Javier en Dynamo para vender a ciertos clientes, principalmente Empire (la tienda de abajo) y otros clientes especiales. Ella no pasa por cotización — va directamente a pedido. Ella dijo: "Yo me salto la palabra cotización y me voy directamente a administración de pedidos."

### Flujo de venta de Celly

En EvolutionOS, usando el perfil de Javier (que tiene rol Admin), Celly:
1. Crea cotización (el sistema requiere este paso incluso si es rápido)
2. Se auto-aprueba (porque el perfil Admin puede aprobar inmediatamente)
3. Pasa a pedido
4. Se auto-aprueba
5. Sigue el flujo normal (empaque, factura)

Esto debe ser rápido — para Celly, todo el proceso desde crear hasta tener el pedido listo debería tomar menos de un minuto para clientes como Empire que siempre compran lo mismo.

## 4.2 PRECIO ESPECIAL PARA EMPIRE (TIENDA)

Celly explicó que Empire (la tienda de planta baja) no compra a precios de nivel A-E normal, sino a costo + un margen mínimo. Ella dijo: "El precio, a Empire yo no le vendo en ciento quince." La solución es asignarle a Empire un nivel de precio especial en su ficha de cliente que refleje los precios reducidos que Javier autoriza para la tienda.

Empire es una empresa de Javier pero opera como CLIENTE dentro del sistema. No es una transferencia interna — es una venta con factura a un precio muy reducido (costo + margen mínimo). Esto es diferente de las transferencias B2B→B2C (que van a costo sin factura, según Doc 010). Empire genera factura, genera CxC, genera asiento contable — como cualquier otro cliente, solo que con precios especiales que Javier autoriza.

---

# PARTE 5: CORRECCIONES A DOCUMENTOS ANTERIORES

### CORRECCIÓN A — Flujo de compras simplificado
**Dónde aparece la versión anterior:** Doc 03 describe un flujo de 2 pasos obligatorios (OC → Factura/Recepción)
**Corrección:** El flujo real de Celly es directo. No usa OC como paso previo. En EvolutionOS, al registrar una compra confirmada, la mercancía aparece inmediatamente como "Por Llegar." No hay paso intermedio de "borrador" ni "pendiente." Los tres estados son: En tránsito → En recepción (si hay problemas) → Completada.

### CORRECCIÓN B — Gastos de importación: porcentaje único vs detallado
**Dónde aparece la versión anterior:** Doc 03 describe %Gastos como un único porcentaje sobre FOB
**Corrección:** Los gastos de importación son DETALLADOS línea por línea (12 tipos: DMCE, APA, flete, acarreo, etc., según Doc 011). Se agregan al momento de la recepción o después. El porcentaje único de Dynamo se reemplaza por un desglose completo con comprobante adjunto por cada gasto.

### CORRECCIÓN C — Proveedor por producto vs proveedor por orden
**Dónde aparece la versión anterior:** Dynamo asocia UN proveedor por producto
**Corrección:** En EvolutionOS, el proveedor se asocia a la ORDEN DE COMPRA, no al producto. Un producto puede haberse comprado a múltiples proveedores a lo largo del tiempo. El historial se construye desde las órdenes, no desde la ficha del producto.

### ADICIÓN D — Precio de remate como funcionalidad
No existía en ningún documento anterior. Es una funcionalidad nueva que permite a Gerencia/Compras establecer un precio fijo reducido para productos que necesitan liquidarse, con pre-aprobación implícita para vender bajo el 10% de margen.

### ADICIÓN E — Redondeo de precios
No estaba definido en ningún documento anterior. Todos los precios de venta se redondean a dólares enteros o incrementos de $0.50.

---

# PARTE 6: RESUMEN DE FUNCIONALIDADES PARA IMPLEMENTACIÓN

| # | Funcionalidad | Módulo | Prioridad | Complejidad |
|---|--------------|--------|-----------|-------------|
| 1 | Flujo de compras simplificado (sin OC obligatoria) | Compras | CRÍTICA | Media — reestructura el flujo existente |
| 2 | Búsqueda de productos por nombre + selección múltiple | Compras | ALTA | Baja — ya existe en ventas, replicar |
| 3 | Registro de lotes y fechas de vencimiento en recepción | Compras/Inventario | ALTA | Media — requiere UI de desglose por lotes |
| 4 | Adjuntar documentos (cotización, factura firmada) | Compras | ALTA | Baja — upload de archivos |
| 5 | Fecha estimada de llegada visible para vendedores | Compras/Ventas | ALTA | Baja — es un campo visible |
| 6 | Historial de compras por proveedor con filtros | Compras/Reportes | MEDIA | Baja — es un reporte con filtros |
| 7 | Comparación entre proveedores del mismo producto | Compras/Reportes | MEDIA | Media — requiere vista cruzada |
| 8 | Protección de marca con selección masiva | Productos | ALTA | Media — lógica de selección + aplicación en bloque |
| 9 | Precio de remate por producto | Productos/Ventas | ALTA | Media — precio especial que override niveles |
| 10 | Redondeo de precios a dólar entero o $0.50 | Productos | MEDIA | Baja — es una regla de cálculo |
| 11 | Costo visible en cotización para perfil Admin | Ventas | MEDIA | Baja — columna condicional por rol |
| 12 | Vista de lotes en inventario con desglose | Inventario | ALTA | Media — ya diseñado en Doc 009 |
| 13 | Lotes en documentos de tráfico automáticamente | Tráfico | ALTA | Media — integración con lista de empaque |
| 14 | Recepción de mercancía desde tablet/móvil | Compras/Inventario | MEDIA | Baja — responsive design |

---

## FIN DEL DOCUMENTO 012

Este documento complementa directamente los Docs 03 (Compras), 04 (Inventario), 09 (Mejoras), 010 (Reunión ventas/tráfico), y 011 (Contabilidad/gastos). El hallazgo principal es que el flujo de compras es significativamente más simple de lo que se asumía en el Doc 03 — Celly no usa OC como paso previo, va directo a registrar la compra confirmada. Esto simplifica el módulo y lo hace más eficiente.

**Sesiones aún pendientes:** Reunión de profundización con Jackie sobre conciliación bancaria, cierre mensual, y comisiones. Esta sesión generará un documento adicional.
