# DOCUMENTO 010 — REQUERIMIENTOS COMPLETOS DE REUNIÓN PRESENCIAL (MARZO 2026)

## Origen y Contexto

Este documento recopila TODOS los requerimientos, mejoras, funcionalidades nuevas, cambios de flujo y decisiones que surgieron de la reunión presencial de marzo de 2026 en las oficinas de Evolution Zona Libre. La reunión fue grabada en su totalidad y este documento es el resultado del análisis completo de dichas grabaciones, complementado con notas de WhatsApp enviadas por Tuinity después de la reunión.

**Participantes presentes en la reunión:**
- **Javier Lange** — Dueño y administrador supremo
- **Tuinity / Cristofer (Cris)** — Desarrollador del sistema, presentó el prototipo
- **Astelvia Watts** — Gerencia, mano derecha de Javier
- **Jakeira Chavez (Jackie)** — Contabilidad, tráfico, asistente de gerencia
- **Ariel Brome** — Asistente de tráfico y facturación
- **Margarita Morelos** — Vendedora B2B
- **Arnold Arenas** — Vendedor B2B
- **María** — Personal de la tienda / POS (planta baja)
- **Carlos** — Mencionado como técnico/soporte del servidor actual

**Ausentes:** Celideth Dominguez (Celly, compras) y Jesús Ferreira (asistente compras/bodega). Los temas de bodega y compras se trataron sin su presencia, pero aplican directamente a sus funciones. Esto es relevante porque varias decisiones tomadas en esta reunión impactan directamente el trabajo de ambos (por ejemplo, el cambio de flujo donde bodega ahora genera la lista de empaque, o el escaneo de facturas de proveedores). Cuando se realice la sesión con ellos, pueden surgir matices, necesidades adicionales o ajustes operativos que complementen lo aquí definido.

**Dinámica de la reunión:** Tuinity presentó el prototipo de EvolutionOS módulo por módulo ante todo el equipo. A medida que avanzaba la demostración, cada miembro del equipo aportó observaciones, necesidades, problemas actuales con Dynamo y sugerencias. Javier tomó decisiones en el momento sobre múltiples temas. La reunión cubrió los módulos de Ventas B2B, Productos/Catálogo, Clientes, Tráfico, y brevemente POS/Tienda. Los módulos de Compras y Contabilidad se pospusieron para sesiones separadas con los respectivos responsables.

**Módulos con sesiones pendientes:**
- **Compras/Bodega** — sesión pendiente con Celly y Jesús. Muchas decisiones de esta reunión les impactan directamente (lista de empaque por bodega, escaneo de facturas, lotes, peso) pero se tomaron sin su presencia. Su sesión puede generar ajustes o requerimientos adicionales.
- **Contabilidad** — sesión pendiente con Jackie a profundidad. Javier lo pospuso: "Ese módulo es muy extenso y es muy delicado, porque estamos hablando de cualquier número que se altere, descuadra absolutamente todo."

**Prerequisitos:** Leer Documentos 01 a 09 y el Documento Maestro de Arquitectura antes de este documento. Todo lo aquí descrito se integra a los módulos ya especificados.

---

# PARTE 1: MÓDULO DE VENTAS B2B

## 1.1 HISTORIAL DE PRECIO POR PRODUCTO POR CLIENTE

### Qué es
Cuando un vendedor está creando una cotización y selecciona un producto, el sistema debe mostrar automáticamente a qué precio se le vendió ese mismo producto a ese mismo cliente la última vez. Este dato aparece de inmediato sin necesidad de buscar en ningún otro módulo ni consultar historiales manualmente.

### Por qué se necesita
Margarita planteó el problema: a veces se le olvida a qué precio le vendió un producto específico a un cliente. Si ella se va de vacaciones y Arnold atiende a su cliente, Arnold no sabe el precio anterior. Javier dio el ejemplo perfecto: "Ella se va de viaje, se va de vacaciones y vengo yo, y el hombre compraba a ciento ochenta y quiero darle a ciento treinta y cinco. Cuando vamos al historial, siempre se le ha vendido a ciento ochenta. Y yo le he regalado cinco dólares." Arnold complementó: el cliente se acostumbra al precio más bajo y después no acepta el original. Peor aún, el cliente aprende a llamar al vendedor que le da mejor precio.

### Cómo debe funcionar
Al seleccionar un producto en la cotización, debe aparecer un indicador junto al campo de precio que diga algo como: "Último precio a este cliente: $180.00 (Nivel E) — Fecha: 15/01/2026". Este historial debe ser visible para TODOS los vendedores que accedan a ese cliente, no solo para el vendedor asignado. Si Arnold está creando una cotización para un cliente de Margarita, Arnold debe ver el historial de precios que Margarita ha manejado con ese cliente.

### Información que debe mostrar
Para cada producto seleccionado en la cotización: el precio unitario de la última venta a ese cliente, el nivel de precio utilizado (A, B, C, D, E), la fecha de la última venta, y quién fue el vendedor que realizó esa venta. Si el producto nunca ha sido vendido a ese cliente, debe indicar: "Sin ventas previas de este producto a este cliente."

---

## 1.2 BLOQUEO DE BAJADA DE PRECIO POR PRODUCTO-CLIENTE

### Qué es
Una vez que se ha establecido un precio para un producto con un cliente específico, el sistema no debe permitir que un vendedor baje ese precio en una cotización futura. El precio solo puede mantenerse igual o subir. Bajar el precio requiere aprobación de gerencia.

### Por qué se necesita
Javier fue directo: "No permita bajar." Y Astelvia reforzó: "A no ser que sea aprobado." El problema es que si un vendedor puede bajar precios libremente, el cliente siempre negociará a la baja y nunca se recupera el margen. Además, los vendedores pueden cometer errores: estar en nivel B y accidentalmente clickear en C, mandando una cotización con un precio que el cliente luego exigirá.

### Cómo debe funcionar
El sistema compara el precio ingresado con el último precio registrado para ese producto con ese cliente. Si el nuevo precio es IGUAL o MAYOR al anterior, procede sin problema. Si el nuevo precio es MENOR al anterior, el sistema bloquea el avance y muestra un mensaje al vendedor: "El precio ingresado es inferior al último precio ofrecido a este cliente ($180.00). Se requiere aprobación de gerencia para reducir el precio." El vendedor no puede continuar sin esa aprobación.

### Excepción con aprobación
Solo Javier o Astelvia pueden aprobar una bajada de precio. La aprobación queda registrada: quién la solicitó, quién la aprobó, el precio anterior, el nuevo precio y la razón. Esto cubre casos legítimos como remates, producto próximo a vencer, clientes estratégicos, o negociaciones especiales que Javier autorice.

### Relación con niveles de precio
El nivel de precio (A, B, C, D, E) ya viene asignado al cliente desde su ficha. El vendedor NO elige el nivel — el sistema lo aplica automáticamente. Pero dentro de un mismo nivel, el vendedor puede intentar dar un precio menor al anterior. Eso es lo que se bloquea aquí.

---

## 1.3 SELECCIÓN MÚLTIPLE DE PRODUCTOS TIPO CARRITO

### Qué es
Al crear una cotización, el vendedor debe poder seleccionar múltiples productos de una sola vez antes de agregarlos a la cotización, en lugar de tener que entrar al catálogo, seleccionar uno, salir, volver a entrar, seleccionar otro, salir, y así sucesivamente.

### Por qué se necesita
Arnold lo pidió explícitamente. Describió su frustración: "Whisky, Buchanan, meto, agrego, tengo que volver a salir. Vuelvo, busco otro whisky, agrego, vuelvo a salir." Quiere poder marcar varios productos y que todos se agreguen de golpe. Tuinity mostró como referencia la interfaz de Shopify donde puedes seleccionar múltiples productos con checkboxes y luego dar a "Agregar" para que todos entren al pedido al mismo tiempo.

### Cómo debe funcionar
Al buscar productos en la cotización, el vendedor ve el catálogo con checkboxes al lado de cada producto. Puede marcar cuantos quiera: este whisky, este ron, este vodka. Cuando termina de seleccionar, presiona un botón "Agregar seleccionados" y todos los productos marcados se agregan a la cotización de una vez. Después, el vendedor pone las cantidades y precios individualmente para cada uno.

Los filtros del catálogo (por rubro, por marca, por búsqueda) deben funcionar mientras se está seleccionando. El vendedor puede filtrar por "whisky", seleccionar tres, luego cambiar el filtro a "ron", seleccionar dos más, y al agregar se suman los cinco al pedido.

---

## 1.4 ORDENAMIENTO AUTOMÁTICO POR RUBRO EN TODOS LOS DOCUMENTOS

### Qué es
Todos los documentos del sistema — cotizaciones, pedidos, facturas, listas de empaque, documentos de tráfico — deben ordenar los productos automáticamente por rubro (categoría de bebida), no por orden de ingreso ni por orden alfabético.

### Por qué se necesita
Javier lo confirmó: "Por rubro, no alfabético, porque prefiero por rubro." Ariel explicó el problema actual en Dynamo: "Está un tequila arriba, después nace una página y otro tequila, entonces tengo que pasar la página." Los documentos salen desordenados y tanto ventas como tráfico pierden tiempo organizando manualmente.

### Cómo debe funcionar
Cuando se genera cualquier documento, los productos se agrupan automáticamente: primero todos los whiskys juntos, luego todos los rones, luego todos los vodkas, tequilas, cervezas, vinos, licores, y así sucesivamente. Dentro de cada rubro, los productos se ordenan alfabéticamente. Cada grupo de rubro debe tener un subtotal (cantidad de bultos, peso, valor) para facilitar la lectura y los documentos de tráfico.

Los rubros deben estar correctamente clasificados. Se identificó que bourbon no es whisky — productos como Jack Daniel's y Jim Beam son bourbons. La clasificación debe coincidir con cómo factura el proveedor: "Facturarlo como te lo venden, tal cual" dijo Javier.

---

## 1.5 INDICADOR DE MARGEN POR PRODUCTO (VERDE/ROJO)

### Qué es
Cada producto en una cotización o pedido debe mostrar un indicador visual que señale si el precio asignado está por encima o por debajo del margen mínimo del 10%. Verde significa que está por encima del 10%, rojo significa que está por debajo.

### Por qué se necesita
Javier lo explicó al equipo: "Todo lo que factures bajo el diez por ciento va a estar en rojo y nosotros lo tenemos que aprobar." Es su mecanismo principal de control de márgenes. Los vendedores ven el indicador y saben que si algo está en rojo, va a requerir aprobación antes de avanzar.

### Cómo debe funcionar

**Vista individual (dentro del pedido):** Al ver el detalle de una cotización, cada línea de producto muestra un ícono verde (✓) si está arriba del 10% de margen o rojo (✗) si está abajo. El vendedor NO ve el porcentaje exacto de margen ni el costo — solo ve el indicador de color. Esto le dice "estás bien" o "vas a necesitar aprobación" sin revelar información de costos.

**Vista de lista (fuera del pedido):** En el listado general de cotizaciones/pedidos, cada documento muestra un indicador prorrateado. Si la mayoría de productos están en verde, el pedido general aparece en verde. Si hay productos en rojo, el pedido general aparece en rojo. Javier decidió que sea por producto individual: "Puede ser que estoy rematando tres o cuatro productos en uno solo y la proforma completa solo compra remate. Entonces, por producto, por producto."

**Importante:** El indicador NUNCA revela el costo real, el margen exacto ni información financiera al vendedor. Solo muestra si cumple o no con el umbral del 10%.

---

## 1.6 DOBLE APROBACIÓN: COTIZACIÓN Y PEDIDO

### Qué es
El flujo de ventas requiere DOS aprobaciones separadas en momentos diferentes: primero se aprueba la cotización (verificación de márgenes y precios) y luego se aprueba el pedido (verificación de fondos o pago del cliente).

### Por qué se necesita
Durante la reunión, Tuinity planteó que si un pedido tiene productos en rojo (bajo margen) y el cliente ya pagó, sería un problema: "Si pasamos a que el hombre pague de una vez, ya estamos comprometiéndonos porque ya el cliente nos pagó. Y ese margen no lo hemos verificado bien." Javier entendió: "Comprendo. Aprobar la proforma primero." Y todo el equipo concordó: "La proforma debe ser aprobada primero."

### Flujo completo detallado

**Paso 1 — Cotización en borrador:** El vendedor crea la cotización, agrega productos, precios, notas. El documento está en estado "Borrador". En este estado es completamente editable.

**Paso 2 — Envío de cotización:** El vendedor envía la cotización. Si hay productos en rojo (bajo el 10% de margen), la cotización se detiene y pasa a aprobación de márgenes. Gerencia (Javier/Astelvia) revisa los productos en rojo y decide: aprobar (con registro de razón) o rechazar (el vendedor debe ajustar precios). Si todos los productos están en verde, la cotización avanza sin esta aprobación.

**Paso 3 — Cotización aprobada → Pedido:** Una vez que la cotización está aprobada (o si no necesitó aprobación de márgenes), el cliente confirma que quiere comprar. La cotización se convierte en Pedido.

**Paso 4 — Aprobación de pedido (pago/fondos):** El pedido requiere que el cliente tenga fondos o haya realizado el pago. Jackie o gerencia verifican y aprueban. Si el cliente tiene fondos suficientes registrados en el sistema, la aprobación puede ser automática.

**Paso 5 — Pedido aprobado → Empaque:** Una vez aprobado el pedido, pasa a bodega para lista de empaque.

**Paso 6 — Empaque → Factura:** Bodega confirma lo que realmente se cargó. Se genera la factura basada en lo que bodega confirmó, no en lo que el pedido decía originalmente.

### Regla de Javier sobre fondos
"Hay clientes que mandan plata, no sobre factura, mandan plata." Algunos clientes envían dinero por adelantado sin estar atado a una factura específica. Eso son FONDOS, no pagos. El sistema debe manejar un concepto de "saldo a favor" o "fondos del cliente" que se aplican a pedidos. Si el cliente tiene fondos suficientes para cubrir el pedido y todos los productos están en verde, el pedido puede aprobarse automáticamente.

Si el cliente tiene fondos pero hay productos en rojo: primero se aprueba la cotización (márgenes), luego se aprueba el pedido (se aplican los fondos).

Si el cliente quiere agregar un producto adicional estando el pedido ya aprobado: si el producto está en verde y tiene fondos, simplemente se agrega. Si está en rojo, vuelve a pasar aprobación de márgenes.

---

## 1.7 FOTOS DE PRODUCTO VISIBLES EN COTIZACIÓN Y CATÁLOGO

### Qué es
Las fotos de los productos deben ser visibles tanto en el catálogo de productos cuando el vendedor está seleccionando, como en el documento de cotización que se genera para el cliente.

### Por qué se necesita
Javier criticó fuertemente las fotos de Dynamo: "Las fotos que tiene del Dynamo son totalmente horribles, pixelizadas y van horribles." El sistema nuevo debe tener fotos de alta calidad. Arnold pidió que los catálogos que se envían al cliente tengan fotos para dar una imagen profesional. Tuinity confirmó durante la demo que las fotos ya están contempladas pero faltaba incluirlas en la interfaz de cotización.

### Cómo debe funcionar
En el catálogo de productos, cada producto muestra su foto miniatura. Cuando el vendedor busca un producto para agregarlo a la cotización, la foto aparece junto al nombre, precio y disponibilidad. Esto ayuda a identificar visualmente el producto correcto (especialmente importante cuando hay múltiples presentaciones del mismo licor: 50ml, 375ml, 750ml, 1L).

En el documento de cotización que se genera (PDF para envío al cliente), cada producto debe tener su foto al lado. El cliente ve fotos nítidas de lo que está comprando.

---

## 1.8 MULTIIDIOMA ESPAÑOL/INGLÉS EN DOCUMENTOS

### Qué es
Las cotizaciones, pedidos y facturas deben tener la opción de generarse en español o en inglés.

### Por qué se necesita
Ariel lo pidió: "Sería bueno que tenga la opción de cambiarlo, esta factura de pedido, de cambiarlo de español a inglés." Tuinity reconoció: "Importante. Esa sí no la había pensado." Javier confirmó: "Hay mucho cliente que lo necesita en inglés."

### Cómo debe funcionar
Al crear o exportar un documento (cotización, pedido, factura), debe haber un selector de idioma. Los encabezados, etiquetas de campos, términos comerciales y toda la estructura del documento se traduce al idioma seleccionado. El contenido variable (nombres de productos, notas del vendedor) permanece como fue ingresado. Los nombres de productos pueden tener un campo de nombre en inglés opcional en la ficha de producto. Si existe el nombre en inglés y el documento está en inglés, se usa ese nombre. Si no existe, se usa el nombre original.

Toda la plataforma debe ser bilingüe: español como idioma base e inglés como segundo idioma.

---

## 1.9 COTIZACIÓN DESCARGABLE COMO PDF

### Qué es
Toda cotización creada en el sistema debe poder descargarse como archivo PDF para que el vendedor lo envíe por el canal que prefiera: WhatsApp, correo electrónico, o cualquier otro medio.

### Por qué se necesita
Margarita explicó: "Yo tengo muchos clientes que a ellos no les gusta que yo les mande por correo. WhatsApp." Javier confirmó: "Yo mismo prefiero que me llegue todo al WhatsApp." La realidad es que la mayoría de clientes internacionales operan por WhatsApp, no por correo.

### Cómo debe funcionar
En el detalle de cada cotización hay un botón "Descargar PDF". El vendedor descarga el archivo a su computadora o iPad y lo envía por WhatsApp, correo o como prefiera. El PDF incluye: encabezado de Evolution ZL, datos del cliente, productos con fotos, precios (si corresponde), totales, gastos adicionales, y condiciones. El PDF queda guardado también en el sistema para referencia.

Adicionalmente, el sistema debe poder enviar la cotización directamente por correo al email del cliente registrado. Javier fue claro: el correo institucional de cada vendedor debe ser el remitente, nunca un correo personal.

---

## 1.10 GASTOS ADICIONALES DESGLOSADOS EN COTIZACIÓN

### Qué es
Las cotizaciones y facturas deben incluir una sección de gastos adicionales donde se detallan los costos extra que se le cobran al cliente: flete (freight), acarreo, certificados, gastos bancarios, manejo, traspaso y cualquier otro gasto.

### Por qué se necesita
Javier explicó: "Nunca se va a ir una vaina sin gastos. Ni entrar tampoco, ni entrar ni salir." Todo pedido tiene gastos asociados. Actualmente en Dynamo existe una ventana de gastos que funciona bien conceptualmente: abres la ventana, detallas cada gasto, cierras y el total se suma a la factura. Ariel confirmó que el flete siempre es el gasto más alto y más importante para el cliente.

### Cómo debe funcionar

**El flete siempre visible y separado:** Javier decidió que el flete se muestre separado del resto de gastos: "El flete sí deberíamos ponerlo aparte." El cliente necesita ver claramente cuánto cuesta el transporte de su mercancía porque es el gasto más significativo (típicamente $2,000-3,000+).

**Ventana de gastos adicionales:** Similar a como funciona en Dynamo. El vendedor o tráfico abre una ventana, agrega líneas de gastos: certificado de libre venta, gastos bancarios, acarreo, manejo, traspaso, o lo que aplique. Cada línea tiene nombre del gasto y monto. El sistema suma automáticamente.

**Presentación en el documento:**
```
Subtotal mercancía:     $8,500.00
Flete (freight):        $2,800.00
Gastos adicionales:       $450.00  [Ver desglose]
─────────────────────────────────
TOTAL:                 $11,750.00
```

El cliente ve el total y si quiere el desglose de los $450 en gastos adicionales, puede acceder al detalle. Internamente, el vendedor y tráfico siempre ven el desglose completo.

**Gastos obligatorios:** Ningún pedido puede avanzar a estado de factura sin tener gastos asignados. Si un vendedor intenta facturar sin haber puesto gastos, el sistema le advierte: "Faltan los gastos adicionales. Complete esta información para continuar."

---

## 1.11 EDICIÓN DE PEDIDOS EN DIFERENTES ESTADOS

### Qué es
Los pedidos deben ser editables en casi cualquier estado del pipeline, con diferentes niveles de aprobación según qué tan avanzado esté el proceso.

### Por qué se necesita
Ariel explicó que frecuentemente los clientes piden cambios después de que el pedido ya está creado: agregar productos, quitar productos, cambiar cantidades. Actualmente, para hacer cualquier cambio hay que "desaprobar todo el pedido", lo cual es engorroso.

### Reglas de edición por estado

**Borrador:** Completamente editable sin restricciones. El vendedor puede cambiar lo que quiera.

**Cotización enviada:** Editable. El vendedor puede agregar o quitar productos, cambiar cantidades. Si agrega un producto en rojo, deberá pasar aprobación de márgenes.

**Pedido (esperando pago):** Editable con registro del cambio. Si el vendedor agrega productos, los nuevos se suman al total y el cliente debe cubrir la diferencia. Los cambios se reflejan en tiempo real para todos los módulos que ven ese pedido.

**Pedido aprobado (esperando empaque):** Editable con aprobación de gerencia. Como el pedido ya fue aprobado, cualquier cambio requiere que se re-apruebe. El sistema debe notificar a bodega si un pedido que ya estaban preparando fue modificado.

**Empacado:** Editable solo con aprobación de gerencia. Ariel confirmó que esto pasa: "Sí, se puede dar una modificación a último segundo." Pero Javier quiere minimizar estos casos.

**Facturado (factura interna, antes de enviar al gobierno):** Modificable SOLO con aprobación de Javier o gerencia. Javier fue enfático: "Modificar una factura es prohibido en cualquier lado del universo." Si se necesita agregar algo, la solución preferida es crear un nuevo pedido con los productos adicionales y una nueva factura.

**Facturado (factura enviada al gobierno/DGI):** PROHIBIDO modificar. Solo Javier puede autorizar una anulación, con explicación detallada obligatoria y documentación de soporte. Si el cliente necesita algo adicional, se hace una factura nueva. Si necesita algo menos, se anula la factura (solo Javier) y se genera una nueva. Javier dijo: "El único que va a aprobar soy yo, porque eso no es normal." y "Cuando vengan a auditarlo, tiene que decir que yo fui, yo estoy consciente, yo puedo explicarlo."

---

## 1.12 PROTECCIÓN DE MARCA (CORRECCIÓN DE DOC 009)

### Qué es — VERSIÓN CORREGIDA
La protección de marca es un porcentaje configurable que se aplica sobre los PRECIOS DE VENTA de ciertos productos seleccionados. NO se aplica sobre el costo (como se indicó erróneamente en el Doc 009). El costo real permanece intacto tal cual lo indica la factura de compra del proveedor.

### Por qué se corrigió
Inflar el costo creaba un problema contable grave: si la factura del proveedor dice $20 y el sistema registra $25 como costo, esos $5 no tienen respaldo documental. En una auditoría, la diferencia queda sin justificación. "¿Cómo voy a declarar un costo de $25 si en realidad pagué $20? ¿Dónde quedan esos $5?" Contablemente es un desastre.

### Cómo debe funcionar (versión final)
En la ficha de cada producto, existe un toggle: "Aplica protección de marca" (visible solo para Gerencia y Compras). Junto al toggle hay un campo numérico: "Porcentaje de protección: [____]%". El rango permitido es de 0.1% a 5.0% máximo (tope definido por Javier).

Cuando se activa, TODOS los precios de venta del producto (niveles A, B, C, D, E) se incrementan automáticamente en ese porcentaje. El vendedor ve los precios ya ajustados sin saber que existe esta protección. El costo real no se toca.

### Objetivo real
Los vendedores creen que siguen vendiendo al mismo 10% de siempre. Pero como los precios de venta ya están inflados por la protección de marca, el margen real de la empresa es mayor (por ejemplo, 13%, 14%, 15%). Los vendedores no saben que existe este mecanismo. Solo Gerencia y Compras lo ven y controlan.

### Quién puede ver y modificar
Solo los roles de Gerencia (Javier, Astelvia) y Compras (Celly) pueden ver que existe la protección de marca, activarla, desactivarla o cambiar el porcentaje. Para los vendedores, tráfico, contabilidad y cualquier otro rol, este campo simplemente no existe en la interfaz.

### Registro
Cada cambio en la protección de marca queda registrado: quién lo activó, cuándo, qué porcentaje puso, porcentaje anterior. Esto es para auditoría interna de Javier.

---

## 1.13 MARGEN MÍNIMO DEL 10% — PISO OBLIGATORIO

### Qué es
El sistema debe impedir que cualquier venta se realice con un margen inferior al 10% sin aprobación de gerencia. Este es el piso duro que ningún vendedor puede romper por sí solo.

### Por qué se necesita
Javier explicó a todo el equipo: "Todo lo que factures bajo el diez por ciento va a estar en rojo y nosotros lo tenemos que aprobar." La frustración principal de Javier es que los vendedores no se esfuerzan por vender arriba del 10% porque con el 10% ya ganan comisión. Esto mantiene los márgenes bajos. El margen soñado de Javier es 15%+, y actualmente promedia 12.52%.

### Cómo debe funcionar
Cuando un vendedor ingresa un precio para un producto en una cotización, el sistema calcula internamente el margen (sin mostrarlo al vendedor). Si el margen está por debajo del 10%, el producto se marca en rojo y la cotización no puede avanzar sin aprobación de gerencia. El vendedor ve: "El precio ingresado no cumple con el margen mínimo requerido" — sin revelar cuál es el costo ni cuánto le falta.

### Excepción
Solo Javier o Astelvia pueden aprobar ventas bajo el 10%. Casos típicos: remate de producto próximo a vencer, liquidación de mercancía estancada, cliente estratégico, o negociación especial autorizada.

---

## 1.14 DASHBOARD EJECUTIVO DE VENTAS POR VENDEDOR

### Qué es
Pantalla exclusiva para Javier donde ve de un vistazo todo lo que se ha facturado desglosado por vendedor, incluyendo venta bruta, descuentos, venta neta, costos, utilidad, porcentaje de margen, y cuánto de las ventas aplica para comisión.

### Por qué se necesita
Javier tiene este reporte en Dynamo y es su módulo favorito. Lo usa para "tirar sus números rápidamente y saber cómo va el negocio y cuánto le toca a él." Es su termómetro ejecutivo.

### Cómo debe funcionar
Una tabla con filtro de rango de fechas que muestra por cada vendedor:

| Vendedor | Código | Venta Bruta | Descuento | Venta Neta | Costo | Utilidad | % Margen | Venta Comisión |
|----------|--------|-------------|-----------|------------|-------|----------|----------|----------------|
| JAVIER LANGE | 01 | $5,334,453 | 0.00 | $5,334,453 | $4,626,509 | $707,944 | 13.27% | $2,852,083 |
| MARGARITA MORELOS | 03 | $5,825,558 | 0.00 | $5,825,558 | $5,053,287 | $772,270 | 13.25% | $3,935,511 |

La columna "Venta Comisión" muestra cuánto de lo vendido aplica para comisión (solo las ventas por encima del 10% de margen). La diferencia entre Venta Neta y Venta Comisión representa ventas que no generan comisión (remates, merma, ventas bajo margen).

Debe incluir: filtro por fecha, totales en el footer, y dos botones — "Ver Factura" (para profundizar en las facturas de un vendedor) y "Utilidad por Producto" (para ver qué productos generan más ganancia).

**Acceso:** SOLO Javier. Nadie más ve este dashboard. Contiene información de costos y márgenes que es clasificada.

---

## 1.15 CORREOS INSTITUCIONALES OBLIGATORIOS

### Qué es
Todos los envíos de documentos del sistema (cotizaciones, facturas, estados de cuenta) deben realizarse desde los correos institucionales de la empresa, nunca desde correos personales.

### Por qué se necesita
Javier lo estableció como regla: "Se establece el correo de la empresa. No de que Jackie arroba hotmail punto com, no. Tiene que ser a un correo de la empresa." Los documentos del sistema que se envían al cliente deben salir desde ventas1@evolutionzl.com, contabilidad@evolutionzl.com, etc.

---

# PARTE 2: CATÁLOGO WEB INTERACTIVO PARA CLIENTES

**NOTA IMPORTANTE SOBRE UBICACIÓN EN EL SISTEMA:** El catálogo web NO es un módulo independiente. Vive DENTRO del módulo de Productos como una funcionalidad adicional. El módulo de Productos es el catálogo público donde todos los roles pueden ver fichas de producto, precios de venta, especificaciones e información comercial no confidencial. Es diferente al módulo de Inventario, que contiene información sensible como costos, proveedores y stock detallado, restringido por rol. El catálogo web es una extensión natural del módulo de Productos: el vendedor selecciona productos del catálogo y genera un link compartible para el cliente.

## 2.1 CONCEPTO GENERAL

### Qué es
Un catálogo digital en formato de página web que el vendedor genera desde el módulo de Productos y envía al cliente mediante un link. El cliente abre el link, ve los productos con fotos y especificaciones, selecciona lo que quiere, pone las cantidades, y devuelve su selección al vendedor. Reemplaza completamente el Excel que se usaba antes.

### Por qué se necesita
Arnold fue quien empujó más fuerte esta idea: "La presencia. El cliente cuando vea esa página dice: estos manes están volando, este catálogo qué es, esto nunca lo he visto." Javier apoyó: "Eso es lo que Arnold quiere decirte, que nos veamos modernos, punteros." Tuinity propuso: "Se puede crear un catálogo que deriva a una página web donde el cliente puede elegir y tocar cosas como si fuera un Excel sin ser un Excel."

Margarita describió el proceso actual: "Yo se la mando, el cliente la subraya en amarillo, la manda para atrás. Entonces, ella tiene que estar viendo cuáles son las que están en amarillo y escribiendo acá." Eso se acabó con el catálogo web.

El catálogo web es la primera carta de presentación de Evolution ante el cliente. Es el paso número uno para concretar una venta, especialmente con clientes nuevos. Para clientes actuales, demuestra que la empresa se ha modernizado. Un catálogo profesional con fotos de calidad, interactivo, fácil de usar desde el celular — esto empuja las ventas desde el primer contacto.

## 2.2 REGLAS DE CONTENIDO

El catálogo web SIEMPRE se envía sin precios de venta. No es opcional — es la regla definitiva. Los precios se manejan exclusivamente en la cotización formal que se genera DESPUÉS de que el cliente selecciona lo que quiere del catálogo.

Javier fue absolutamente categórico: "Eso es prohibido. O sea, tú tienes que bloquear eso."

**NUNCA se incluye en el catálogo web:**
- Precios de venta — BLOQUEADO, sin excepción
- Costos — nunca bajo ninguna circunstancia
- Cantidades en inventario — el cliente no debe saber cuánto tenemos
- Información de proveedores — clasificada
- Información financiera de ningún tipo

**SÍ se incluye (información no sensitiva útil para el cliente):**
- Foto del producto en alta calidad
- Nombre y descripción completa del producto
- Presentación: tamaño de la botella (750ml, 1L, etc.)
- Unidades por caja (12 botellas, 24 botellas, etc.)
- País de origen del producto
- Ficha técnica si está disponible (contenido, especificaciones del fabricante)
- Categoría/rubro (whisky, ron, vodka, etc.)

Esta información no es sensitiva pero es fundamental para que el cliente pueda tomar una decisión de compra informada. El cliente necesita saber si una caja trae 6 o 12 botellas antes de pedir cantidades, por ejemplo.

### Lógica comercial de esta decisión
Catálogo sin precios + Cotización formal con precios es el flujo correcto por tres razones: primero, protección comercial — un catálogo con precios puede ser reenviado a la competencia para que cotice más barato; sin precios, es inofensivo. Segundo, simplifica el sistema — el catálogo SIEMPRE es sin precios, un solo camino, sin confusión. Tercero, refuerza el pipeline — el catálogo genera interés, la cotización cierra la venta. Sin precios, el cliente TIENE que volver al vendedor para saber cuánto cuesta, y ahí el vendedor tiene la conversación de venta.

## 2.3 OPCIONES DE GENERACIÓN DEL CATÁLOGO

Desde el módulo de Productos, el vendedor puede generar el catálogo con tres opciones:

1. **Todo el catálogo completo:** Todos los productos que Evolution vende, estén o no en existencia. Para dar la visión completa de lo que la empresa ofrece.
2. **Solo lo que hay en existencia:** Únicamente productos con stock disponible. "Así el cliente va más puntual en elegir lo que quiere comprar en el momento." Esto evita que el cliente pida algo que no hay.
3. **Filtrado por rubro:** El vendedor selecciona qué rubros incluir. "Mándame los whisky que tienes" → el vendedor filtra solo whisky y genera el catálogo con todos los whiskys disponibles. Puede ser un solo rubro o varios.

Adicionalmente, el vendedor puede seleccionar manualmente productos específicos para incluir, construyendo un catálogo personalizado para un cliente en particular. La idea es que sea rápido: seleccionar, generar link, enviar.

## 2.4 COMPORTAMIENTO EN TIEMPO REAL

Arnold preguntó: "Margarita vendió quinientas piezas, pero cuando yo voy a pasar el catálogo en el link, ¿salen las mismas quinientas o se actualiza?" Tuinity respondió: "Tiene que ser en tiempo real, cien por cien." Si un vendedor acaba de vender la mitad del inventario, el catálogo de otro vendedor ya no muestra esos productos como disponibles. Esto solo aplica cuando se usa la opción "solo lo que hay en existencia."

## 2.5 FLUJO COMPLETO: CATÁLOGO → COTIZACIÓN

1. El vendedor entra al módulo de Productos y selecciona "Generar catálogo para cliente."
2. Elige la opción: todo, solo existencia, por rubro, o selección manual.
3. El sistema genera un link único a una página web interactiva.
4. El vendedor envía el link al cliente por WhatsApp y/o correo.
5. El cliente abre el link en su celular o computadora.
6. Ve los productos con fotos, descripciones, presentaciones. Puede buscar y filtrar.
7. Selecciona los que quiere y pone las cantidades deseadas.
8. Envía su selección de vuelta.
9. El vendedor recibe la selección del cliente.
10. El vendedor genera la cotización formal CON precios basada en la selección del cliente, aplicando automáticamente el nivel de precio correspondiente.
11. La cotización se envía al cliente para revisión y confirmación.

Este es el pipeline natural: catálogo (sin precios) → selección del cliente → cotización (con precios) → pedido → pago → empaque → factura → despacho.

## 2.6 ENVÍO POR WHATSAPP Y CORREO

El link se puede enviar por cualquier medio. Javier pidió: "Correo y WhatsApp." Si el cliente tiene correo registrado en el sistema, se envía por correo también. Pero el canal principal es WhatsApp porque la mayoría de clientes operan por ahí. El link es simplemente una URL que funciona en cualquier dispositivo — el cliente solo necesita un navegador web.

---

# PARTE 3: PRODUCTOS E INVENTARIO

**NOTA SOBRE LA DIFERENCIA ENTRE PRODUCTOS E INVENTARIO:** Son dos módulos separados con propósitos diferentes. El módulo de **Productos** es el catálogo comercial — contiene información no confidencial: qué productos existen, fotos, precios de venta por nivel, especificaciones, presentaciones, fichas técnicas. Todos los roles acceden a este módulo. El módulo de **Inventario** es operativo y financiero — contiene información sensible: costos reales, proveedores, stock detallado, valorización del inventario, historial de compras. Solo acceden roles autorizados (gerencia, compras, contabilidad). Esta separación es fundamental para la seguridad de la información.

## 3.1 FICHA TÉCNICA DEL PRODUCTO

### Qué es
Incluir en la ficha de cada producto su ficha técnica completa: contenido, fórmula, composición, especificaciones del fabricante.

### Por qué se necesita
Javier dijo: "Déjale una opción de ficha técnica porque la podemos montar. Las fichas que tenemos se las podemos montar a cada producto." Actualmente, cuando un cliente pide la ficha técnica, el vendedor tiene que llamar a Jackie o a bodega para que se la busquen y envíen. Con esto, el vendedor encuentra la ficha directamente en el sistema: "Ya no tiene que llamar a Jackie: ey, pásame la ficha técnica. No, la encontró de una vez. Pin, coge. Tiempo es dinero."

### Implementación
En la ficha de producto, agregar un campo o tab "Ficha Técnica" donde se puede subir un archivo PDF/imagen con la ficha del fabricante, o llenar campos de texto con la información técnica del producto.

---

## 3.2 SEPARACIÓN DE LOTES POR VENCIMIENTO EN VENTAS

### Qué es
Cuando existe producto del mismo SKU pero con diferentes fechas de vencimiento (lote viejo próximo a vencer y lote nuevo), el sistema debe separarlos para que se vendan a precios diferentes y el cliente sepa exactamente qué está comprando.

### Por qué se necesita
Un vendedor mencionó el problema: "Cuando tú tienes lo que se está rematando, más lo que ya tú has pedido recientemente, no se vayan a mezclar al momento que lo vayas a querer vender para que me lo venda a precio de remate el nuevo." Javier confirmó: "Toma nota de eso, es importante." El riesgo es que el cliente reclame: "Me vendiste a precio de remate pero me mandaste producto nuevo" o viceversa.

### Cómo debe funcionar
El sistema trata lotes con diferentes fechas de vencimiento como productos separados a efectos de venta. Al crear una cotización, si hay dos lotes del mismo producto con fechas diferentes, ambos aparecen como opciones distintas con su fecha de vencimiento visible. El vendedor (y el cliente) saben exactamente qué están comprando: producto con vencimiento próximo (a precio de remate) o producto nuevo (a precio normal).

### Relación con compras
Javier añadió: "El proveedor le tiene que decir antes, cuando ya vamos a montar la compra: bueno, vence en diciembre." La fecha de vencimiento del producto que está por llegar debe registrarse en la orden de compra ANTES de que llegue, para que el sistema pueda identificar los lotes correctamente desde el momento del ingreso.

---

## 3.3 PRODUCTOS RESERVADOS DESAPARECEN DEL CATÁLOGO

### Qué es
Cuando un vendedor reserva mercancía en un pedido/cotización, esas unidades desaparecen del inventario disponible para todos los demás vendedores y del catálogo web que se envía a clientes.

### Por qué se necesita
Arnold preguntó: "Solo están en reserva, no están facturados. ¿Esos productos le van a aparecer a Arnold en el catálogo?" Javier respondió que no deben aparecer: "Ya cuando se reserva, ya es un compromiso brutal." El problema actual es que en Dynamo aparece todo y se generan conflictos: un cliente pide algo que ya está reservado para otro.

### Cómo debe funcionar
Al crear un pedido/cotización con productos, esas cantidades pasan a estado "separado/reservado" y se restan del disponible. Otros vendedores ven solo lo que queda disponible. Si la cotización expira (pasa la fecha de vigencia sin que el cliente confirme), la mercancía se libera automáticamente.

Si un vendedor necesita vender mercancía que está reservada para otro cliente, debe comunicarse con el otro vendedor/cliente. No hay mecanismo automático para "robar" reservas — es una decisión humana que Javier o gerencia debe tomar.

---

## 3.4 DEPURACIÓN DE CATEGORÍAS Y RUBROS

### Qué es
Revisar y corregir la clasificación de productos para que los rubros sean correctos. Bourbon no es lo mismo que whisky. Jack Daniel's y Jim Beam son bourbons, no whiskys.

### Por qué se necesita
Javier lo señaló: "Creo que el sistema lo tenemos mal grabado y eso hay que arreglarlo." La clasificación debe coincidir con cómo el proveedor factura: "Es mejor facturarlo como me lo venden."

### Acción requerida
Depurar la base de datos de productos antes de la migración. Cada producto debe tener su rubro correctamente asignado según la clasificación estándar de la industria y cómo lo factura el proveedor.

---

## 3.5 BOTÓN "NUEVO PRODUCTO" OCULTO PARA VENDEDORES

### Qué es
Los vendedores no deben ver la opción de crear nuevos productos. Solo el departamento de compras/bodega crea productos.

### Por qué se necesita
Tuinity lo mencionó y Javier confirmó: "Eso es el trabajo de bodega." Los vendedores solo consultan el catálogo y venden. La creación de productos es responsabilidad exclusiva de compras.

---

## 3.6 PAÍS DE ORIGEN OBLIGATORIO POR PRODUCTO

### Qué es
Cada producto debe tener registrado su país de origen en la ficha del producto.

### Por qué se necesita
Ariel lo necesita para los certificados de libre venta: "Cada referencia que vaya en esa factura tenga su país de origen." Actualmente, Ariel tiene que buscar manualmente el país de origen de cada producto, a veces revisando la caja física o buscando en Internet. Javier decidió: "Eso se alimenta en la sección de compra, cuando viene la compra y se mete todo, se mete el país de origen."

### Implementación
El país de origen se registra en la ficha del producto al momento de la compra/recepción de mercancía. Una vez registrado, está disponible automáticamente para tráfico al generar certificados. Si un producto ya tiene país de origen registrado, no se pide de nuevo (a menos que cambie de proveedor/origen).

---

## 3.7 PESO Y CUBICAJE ACTUALIZADOS CONSTANTEMENTE

### Qué es
El peso y cubicaje de cada producto debe mantenerse actualizado, ya que los fabricantes cambian el packaging y el peso real varía.

### Por qué se necesita
Javier explicó el problema: los pesos en el sistema actual no son exactos, lo que genera problemas al cargar contenedores. "Nosotros tenemos que volver a hacerle, aunque sea sacrificar un sábado, venir aquí a pesar toda la mercancía, buscar una pesa real, poner el sistema al lado, pesarlos y verificar." Celly mostró un ejemplo donde una marca cambió el packaging completo, por lo que la caja ya no pesa lo mismo.

### Implementación
Cada vez que llega mercancía nueva, bodega debe verificar el peso y cubicaje. Si ha cambiado desde la última recepción, se actualiza en el sistema. Esto es especialmente importante para listas de empaque y cálculo de capacidad de contenedores. El sistema debe manejar que diferentes lotes del mismo producto pueden tener pesos diferentes (packaging viejo vs nuevo).

---

## 3.8 BÚSQUEDA INTELIGENTE FUZZY

### Qué es
Los campos de búsqueda de productos deben encontrar resultados aunque el usuario escriba el nombre incorrectamente.

### Por qué se necesita
Tuinity lo describió: "Este tipo de lupitas son muy sofisticadas. Ustedes pueden escribir hasta el nombre mal y solamente porque cuadra como un sentido con el nombre de otro producto, les aparece." Esto es importante porque los nombres de licores son en múltiples idiomas y los vendedores no siempre los escriben correctamente.

---

# PARTE 4: CLIENTES

## 4.1 FECHA DE CUMPLEAÑOS DEL CONTACTO PRINCIPAL

### Qué es
Un campo en la ficha del cliente para registrar la fecha de cumpleaños del contacto principal (la persona con quien el vendedor interactúa), con envío automático de correo de felicitación y notificación interna.

### Por qué se necesita
Margarita lo pidió: "Es algo que he querido hace muchos años, es un sueño." Javier apoyó con entusiasmo: "Tal como lo hacen los bancos, a mí me mandan feliz cumpleaños. A todos nos debe pasar."

### Cómo debe funcionar
El campo de cumpleaños se registra para el CONTACTO del cliente, no necesariamente el dueño. Javier explicó: "El contacto es lo importante. Yo prefiero estar bien con el que me compra." El sistema envía tres notificaciones el día del cumpleaños:
1. Correo automático al cliente: felicitación de Evolution ZL
2. Correo interno a TODO el equipo de Evolution: "Hoy cumple años [contacto] de [empresa cliente]"
3. Notificación in-app al vendedor asignado

## 4.2 ANIVERSARIO DE RELACIÓN COMERCIAL

### Qué es
El sistema rastrea desde qué fecha es cliente y notifica aniversarios.

### Por qué se necesita
Javier lo quiere para fidelización: "¿Tú sabes que hoy tú cumples tanto tiempo siendo mi cliente? Hoy cumples un año más, que son siete años conmigo." Lo considera un detalle importante para mantener relaciones comerciales fuertes. Se usa la fecha de creación del cliente en el sistema (migrada desde Dynamo si existe esa data).

---

## 4.3 CREACIÓN RÁPIDA DE CLIENTE PARA COTIZAR

### Qué es
Permitir crear un cliente con solo el nombre para poder enviarle una cotización, sin requerir la debida diligencia completa de entrada.

### Por qué se necesita
Margarita describió el caso: un cliente nuevo chatea por WhatsApp pidiendo cotización. No tiene debida diligencia porque aún no se sabe si va a comprar. Javier aprobó: "Yo no tengo ningún problema con que ellos puedan hacer una cotización a nombre de Pedro Pérez. El sistema me va a resguardar de que todos los clientes tengan su debida diligencia, sea un principio, en el camino o al final."

### Cómo debe funcionar
Al crear una cotización, el vendedor puede agregar un cliente nuevo poniendo solo el nombre. El cliente se crea en el sistema en estado "incompleto" con alerta permanente de que falta debida diligencia. Se puede cotizar libremente, pero el pedido no puede avanzar a factura sin que la debida diligencia esté al menos en proceso.

---

## 4.4 PAPELERA DE CLIENTES INACTIVOS

### Qué es
Si un cliente creado rápidamente no completa su debida diligencia en 3 meses, pasa a una lista de "inactivos" — no se borra, se archiva.

### Por qué se necesita
Javier no quiere que se borren: "Nunca borro un cliente. Tampoco podemos tener cargado de gente ahí que no es nada, pero sí quiero tener un lugar para conservar un historial." Tuinity sugirió: "Lo borra del día a día, pero lo mete en un banco de información."

### Cómo debe funcionar
A los 3 meses sin debida diligencia completa, el cliente pasa automáticamente a estado "Inactivo." No aparece en las listas principales ni en búsquedas del día a día, pero existe en una sección de "Clientes Inactivos" o "Papelera" donde se puede recuperar. Si el cliente llama meses después, el vendedor puede buscarlo en la papelera y reactivarlo. Javier lo visualiza como: "En un año voy a esa papelera y digo: estos clientes, ¿por qué no habrán comprado?"

---

## 4.5 EXCEPCIÓN DE DEBIDA DILIGENCIA CON APROBACIÓN

### Qué es
Gerencia puede aprobar que un cliente se mantenga activo sin debida diligencia completa.

### Por qué se necesita
Javier reconoció: "Hay clientes que nunca lo van a llenar." Existen casos legítimos donde un cliente lleva años comprando pero nunca va a completar una debida diligencia formal. "Tiene que haber una salida, no puede ser todo robotizado." Pero esta excepción SOLO la puede otorgar gerencia (Javier o Astelvia), nunca los vendedores.

### Cómo debe funcionar
En la ficha del cliente, gerencia puede activar: "Cliente aprobado sin debida diligencia completa." Queda registrado quién lo aprobó y cuándo. El cliente se identifica claramente en el sistema como "sin DD aprobada" para que si algún día se necesita mostrar documentación a una autoridad, Javier sepa exactamente cuáles clientes están en esta situación: "El día de mañana que necesito enseñar algo, enseño lo que está en orden. Lo que no está identificado, vélo para allá."

---

## 4.6 CHECKLIST DE DEBIDA DILIGENCIA VISIBLE

### Qué es
Un checklist visual que muestra qué documentos de la debida diligencia están completos y cuáles faltan.

### Por qué se necesita
Javier lo describió: "Diez requisitos. Check, check, check, check, check. Pero hay nueve check y uno le falta. Y que el sistema te lo diga: le falta esto." Astelvia pidió que aparezca una alerta permanente de clientes con documentación pendiente.

### Cómo debe funcionar
En la ficha del cliente, tab de debida diligencia, aparece un checklist con cada documento requerido. Los que están completos tienen ✓ verde, los que faltan tienen ✗ rojo. El sistema genera un listado automático de "Clientes con debida diligencia pendiente" que es visible para gerencia y contabilidad, y como notificación al vendedor asignado para que le recuerde al cliente.

---

# PARTE 5: TRÁFICO Y LOGÍSTICA

## 5.1 DOCUMENTOS PRELLENADOS AUTOMÁTICAMENTE

### Qué es
Los documentos de tráfico (DMC, Bill of Lading, certificados) se prellenan automáticamente con la información de la factura del pedido. Ariel solo verifica, no llena manualmente.

### Por qué se necesita
Actualmente, Ariel llena todo manualmente leyendo la factura y transcribiendo datos. Tuinity explicó la solución: "Cada uno de estos documentos se prellenan automáticamente con la información de la factura, que tú solamente tengas que verificar que todo esté bien, más no escribirlo."

### Cómo debe funcionar
Cuando un pedido llega al módulo de tráfico (después de facturado), se crea automáticamente un expediente. Al generar cualquier documento (DMC, BL, certificado), el sistema toma los datos de la factura: cliente, país, productos, cantidades, peso, cubicaje, aranceles, país de origen. Ariel abre el documento, verifica que todo esté correcto, y confirma. Para el DMC, como es un sistema externo de la Zona Libre, Ariel copia y pega la información prellenada.

---

## 5.2 LISTA DE EMPAQUE LA GENERA BODEGA — CAMBIO DE FLUJO CRÍTICO

### Qué es
La lista de empaque (packing list) ahora la genera el departamento de compras/bodega, no tráfico. Bodega tiene la mercancía física y es quien sabe exactamente qué se cargó en el contenedor.

### Por qué se necesita
Javier tomó la decisión durante la reunión: "La bodega va a tener la lista de empaque porque ellos son los que tienen la mercancía." Ariel actualmente genera la lista de empaque basándose en la factura, pero no siempre coincide con lo que realmente se cargó. Astelvia explicó: "La bodega era la que decía lo que había y lo que se podía facturar." Javier confirmó: "Yo creo que lo estamos haciendo al revés. Lo que debe mandar es la lista de empaque y la factura es el final."

### Nuevo flujo
1. **Pedido aprobado** → pasa a bodega
2. **Bodega prepara** la mercancía físicamente
3. **Bodega genera lista de empaque** con lo que REALMENTE cargó (lotes, cantidades, peso verificado)
4. **Lista de empaque** → pasa a tráfico y ventas
5. **Se genera la factura** basada en la lista de empaque (no al revés)
6. **Tráfico genera documentos** basados en la factura

Esto elimina el problema de facturas que no coinciden con lo cargado. Javier fue enfático: "Que no sea que facturamos y después perdón, no hay. Eso hay que evitarlo."

### Lotes y datos en la lista de empaque
Bodega es responsable de registrar correctamente los lotes de cada producto. Antes esto lo hacía Ariel manualmente y con errores frecuentes ("un cero, una O, no sé cuál es"). Javier decidió: "Tú no tienes nada que ver con eso. Tú vas a ver tu lote aquí. ¿Quién se equivocó? Ese es el problema de ellos."

---

## 5.3 UPLOAD DE DOCUMENTOS GENÉRICOS EN EXPEDIENTES

### Qué es
Un botón universal para subir cualquier tipo de archivo al expediente de tráfico: facturas de gastos, certificados de inspección, pagos de navieras, APA, recibos, y cualquier otro documento.

### Por qué se necesita
Javier simplificó: "El botón ahí, monta todo. Ustedes mismos le dan el nombre. Alimenta, alimenta, alimenta y cuando lo quieres buscar, sale todo y tú eliges el que quieras. Un botón de alimentación." No quiere botones individuales para cada tipo de documento — quiere un solo botón donde se sube cualquier archivo y el usuario le pone nombre descriptivo.

### Cómo debe funcionar
En cada expediente de tráfico, hay un botón "Subir documento." El usuario sube el archivo (PDF, imagen, etc.), le pone un nombre descriptivo ("Certificado inspección - Lote Barceló marzo 2026") y queda adjunto al expediente. Todos los documentos del expediente se pueden ver, descargar y buscar.

---

## 5.4 ALERTA DE LLEGADA DE CONTENEDORES

### Qué es
El departamento de compras registra la información del BL (Bill of Lading) con la fecha estimada de llegada. Tráfico recibe una alerta cuando se acerca esa fecha.

### Por qué se necesita
Ariel y Jesús (compras) lo pidieron. Actualmente se manejan por correo: "Jesús, por favor, el viernes viene llegando el barco tal." Quieren que esa información esté centralizada en el sistema. Javier complementó: "Cuando el proveedor envía el BL, el departamento de compras alimenta ese documento con la información del BL, barco y cuándo llega. Y él lo puede ver aquí en tráfico."

### Cómo debe funcionar
Compras registra el BL con: naviera, barco, número de contenedor, fecha estimada de llegada, productos que trae. Tráfico ve en su módulo una sección de "Llegadas esperadas" con las fechas. A medida que se acerca la fecha, aparecen alertas: "Mañana llega contenedor X con naviera Y."

---

## 5.5 DEADLINE DE DEVOLUCIÓN DE CONTENEDOR VACÍO

### Qué es
Un contador de días que alerta sobre el plazo para devolver el contenedor vacío a la naviera después de haberlo descargado.

### Por qué se necesita
Ariel explicó que la naviera da aproximadamente 7 días para devolver el contenedor vacío. Si se pasan, generan cargos adicionales. Javier dijo que generalmente lo devuelven rápido, pero si hay múltiples entradas simultáneas, alguno se puede pasar.

### Cómo debe funcionar
Cuando se registra la llegada de un contenedor, empieza a correr un contador. El sistema muestra cuántos días lleva cada contenedor descargado. A los 5 días: alerta amarilla. A los 7 días: alerta roja. Priorización visual: los contenedores con más días aparecen primero.

---

## 5.6 RESUMEN POR RUBRO PARA DMC

### Qué es
Poder generar un resumen de la factura agrupado por rubro que muestra solo categorías, cantidades totales de bultos, códigos arancelarios y valores — sin detallar productos individuales. Esto facilita el llenado del DMC.

### Por qué se necesita
Ariel explicó que el DMC necesita la información agrupada por tipo de producto, no por producto individual. Actualmente lo hace manualmente: "Literalmente estaba conectando cables: uno, uno, uno, whisky, dos, dos." La agrupación automática por rubro que ya se documentó en Feature 7 del Doc 009 aplica aquí directamente para tráfico.

---

## 5.7 EXPEDIENTE COMPLETO CON TIMELINE

### Qué es
Cada pedido que llega a tráfico tiene un expediente con historial de todo lo que ha pasado: cuándo se creó, cuándo se generó cada documento, cuándo se despachó.

### Por qué se necesita
Tuinity lo mostró en el prototipo: "Aquí hay un pequeño historial de fechas de cuándo se hizo qué. El expediente se creó tal fecha, se creó el DMC, se creó el BL, se creó el certificado, se registró el DMC oficialmente." Javier quiere trazabilidad completa: "Si quieren saber qué pasó con un expediente, lo saben todo."

---

# PARTE 6: COMPRAS

## 6.1 ESCANEO AUTOMÁTICO DE FACTURAS DE PROVEEDORES

### Qué es
Al recibir mercancía, el departamento de compras sube la factura del proveedor y el sistema la escanea automáticamente para integrar los productos, cantidades y costos sin ingreso manual.

### Por qué se necesita
Javier fue absolutamente enfático — repitió múltiples veces: "Yo no quiero un humano alimentando factura." Y explicó por qué: "Cometen errores, porque de mil ML siete cincuenta, mete el costo al revés, porque me acaba de pasar. Los tamaños son muchos: cincuenta, doscientos, tres siete cinco, quinientos, siete cincuenta. El humano se equivoca, normal, se distrae, lo llaman el celular."

### Cómo debe funcionar
Compras sube la factura del proveedor (PDF o imagen). El sistema la procesa y extrae: productos, cantidades, precios unitarios, costos totales. Antes de confirmar, el sistema muestra lo que detectó para verificación humana: "Ey, vamos a añadir esto, esto, esto. ¿Estás seguro de que esos son los productos?" El usuario verifica: "Sí, está completo, listo." Y se confirma la entrada.

---

## 6.2 GASTOS DE IMPORTACIÓN PARA CÁLCULO DE COSTO

### Qué es
Al recibir mercancía, compras debe poder registrar todos los gastos asociados a la importación para que el sistema calcule automáticamente el costo final de cada producto.

### Por qué se necesita
Javier mencionó al pasar: "Cuando estamos comprando, poder recibir y ordenar todos nuestros gastos que estamos incurriendo a la hora de comprar para que automáticamente me dé un costo sumando la operación."

---

# PARTE 7: POS / TIENDA (PLANTA BAJA)

## 7.1 CIERRE DE CAJA AUTOMATIZADO

### Qué es
Al final del día, las cajeras cierran caja desde el sistema: ingresan el conteo físico del efectivo y el sistema concilia automáticamente con las ventas registradas.

### Por qué se necesita
Javier quiere que esto sea rápido y automatizado: "Ya la caja lo tiró, ellos meten nada más la plata que contaron, le pongo pum, me lo manda a mi correo." El cierre debe tomar "uno, dos minutos."

### Cómo debe funcionar
La cajera ingresa el conteo de efectivo. El sistema compara con las ventas del día. Genera un reporte de cierre que incluye: ventas en efectivo, ventas por tarjeta (con comisión bancaria descontada), transferencias, total, diferencias. El reporte se envía automáticamente al correo de Javier y al de contabilidad.

---

## 7.2 REPORTE DIARIO A JAVIER POR CORREO

### Qué es
Todos los días, al cerrar caja, Javier recibe un correo con el reporte del día de la tienda.

### Cómo debe funcionar
El correo incluye: total vendido, desglose por método de pago, comisión bancaria, productos más vendidos del día, y cajero responsable. Se envía automáticamente sin que nadie tenga que hacer nada adicional.

---

## 7.3 REPOSICIÓN DESDE BODEGA

### Qué es
La tienda solicita mercancía a bodega mediante el sistema. Bodega aprueba y envía.

### Por qué se necesita
Javier explicó: "La lista de empaque la preparan ellos. El traslado final lo reciben en base a la bodega. Aquí no manda nadie ahí abajo. Todo lo que diga la bodega es lo que tiene."

### Cómo debe funcionar
La tienda crea una solicitud de reposición con los productos y cantidades que necesita. Bodega recibe la solicitud, prepara la mercancía, genera la lista de empaque, y envía. La tienda recibe y confirma.

---

## 7.4 SISTEMA COMPLETAMENTE SEPARADO

### Qué es
El POS de la tienda es un módulo independiente dentro de EvolutionOS. No comparte inventario con B2B. Son como dos negocios diferentes dentro del mismo sistema.

### Prioridad
Javier lo pospuso: "Eso lo vamos a ver la otra semana. Primero debemos tener la certeza [del B2B]."

---

# PARTE 8: SISTEMA GENERAL

## 8.1 TODO DEBE SER IMPRIMIBLE Y EXPORTABLE

### Qué es
Todos los módulos del sistema deben permitir generar reportes, documentos e informes que sean estéticamente profesionales y fáciles de imprimir o exportar como PDF.

### Por qué se necesita
Es un requerimiento transversal de Javier. Cada pantalla, cada reporte, cada documento debe tener opción de impresión/exportación con diseño limpio y profesional.

---

## 8.2 SESIONES MÚLTIPLES SIMULTÁNEAS

### Qué es
Un usuario puede estar conectado al sistema desde múltiples dispositivos al mismo tiempo sin que uno desconecte al otro.

### Por qué se necesita
En Dynamo, si alguien estaba conectado con un usuario, nadie más podía entrar con ese mismo usuario. Javier se molestaba: "Antes era que yo quería entrar, pero si todos estaban ocupados, yo no puedo entrar." Tuinity confirmó: "El usuario de Javier puede tener tres computadoras metidas en su usuario y las tres están activas, no te salta de ninguna."

---

## 8.3 ACCESO REMOTO DESDE CUALQUIER DISPOSITIVO

### Qué es
El sistema funciona en cualquier dispositivo con Internet: computadora de escritorio, laptop, iPad, tablet. Los vendedores deben poder trabajar desde fuera de la oficina.

### Por qué se necesita
Javier quiere que los vendedores tengan iPads con Internet para hacer cotizaciones donde estén: "El vendedor tiene que tener su iPad abierto. Rayando de una vez. ¿Tú qué quieres? Vamos, pa, pa, pa. Lo comprometiste."

---

## 8.4 TAMAÑO DE FUENTE AJUSTABLE

### Qué es
Opción para aumentar o disminuir el tamaño del texto en la plataforma.

### Por qué se necesita
Astelvia lo pidió directamente: "Nosotros no somos jóvenes, somos viejos y esa letra está demasiado pequeñita."

---

## 8.5 TEMA CLARO Y OSCURO

### Qué es
Opción de cambiar entre interfaz clara (blanca) y oscura (negra).

### Por qué se necesita
Tuinity lo mostró como funcionalidad existente: "El sistema tiene opción de cambiar la pantalla, si la quieres blanca o la quieres negra." Javier comentó: "Cada quien con sus ojos."

---

# PARTE 9: DECISIONES DE JAVIER TOMADAS EN LA REUNIÓN

Estas son decisiones explícitas que Javier tomó durante la reunión y que son definitivas:

1. **Los vendedores no ven el módulo de clientes completo** — solo la información necesaria para vender. Cuentas por cobrar, debida diligencia y datos financieros son de contabilidad/gerencia.

2. **Los vendedores no crean productos** — eso es responsabilidad de compras/bodega.

3. **El catálogo web va SIN precios** — prohibido y bloqueado, sin excepción.

4. **Precios solo pueden subir, nunca bajar sin aprobación.**

5. **Anulación de facturas: SOLO Javier aprueba.**

6. **La lista de empaque la hace bodega, no tráfico** — cambio de flujo inmediato.

7. **La factura es lo ÚLTIMO** — después de que bodega confirma la lista de empaque.

8. **Debida diligencia: se puede cotizar sin ella, pero debe completarse. 3 meses para completar antes de pasar a inactivo.**

9. **Gastos son obligatorios** — ningún pedido sale sin gastos asignados.

10. **El flete se muestra separado** de los demás gastos.

11. **Rubros para ordenamiento, NO alfabético.**

12. **Correos institucionales obligatorios** para toda comunicación del sistema.

13. **Facturas internas modificables con aprobación de gerencia. Facturas del gobierno: solo Javier.**

---

# RESUMEN DE IMPACTO POR MÓDULO

| Módulo | Cantidad de mejoras | Prioridad |
|--------|-------------------|-----------|
| Ventas B2B | 15 mejoras | CRÍTICA — es el módulo que más feedback recibió |
| Productos (incluye Catálogo Web) | 15 mejoras | ALTA — incluye el catálogo web interactivo como funcionalidad del módulo |
| Clientes | 6 mejoras | MEDIA-ALTA — incluye debida diligencia |
| Tráfico | 7 mejoras | ALTA — cambio de flujo de lista de empaque |
| Compras | 2 mejoras | ALTA — escaneo de facturas es prioridad de Javier |
| POS/Tienda | 4 mejoras | BAJA — pospuesto para después del B2B |
| Sistema General | 5 mejoras | MEDIA — son transversales |

---

## FIN DEL DOCUMENTO 010

Este documento se lee JUNTO con los Documentos 01-09 y el Documento Maestro. No reemplaza nada — agrega las funcionalidades, mejoras y decisiones que surgieron de la reunión presencial de marzo de 2026. Cada feature se integra a los módulos ya especificados y respeta las reglas de negocio establecidas.

### Nota importante sobre alcance de esta reunión

Esta reunión cubrió principalmente los módulos de Ventas B2B, Productos/Catálogo, Clientes, Tráfico y brevemente POS/Tienda. Los módulos de **Compras** y **Contabilidad** quedaron prácticamente sin abordar en profundidad. Jackie (contabilidad) estuvo presente pero Javier decidió posponer su módulo: "Ese módulo es muy extenso y muy delicado." Celideth (compras) y Jesús (bodega) estuvieron ausentes.

Esto significa que quedan pendientes al menos dos sesiones de feedback importantes:

1. **Sesión con Compras/Bodega (Celly y Jesús):** Cubrirá el módulo de Compras en detalle, el flujo operativo de bodega, la generación de listas de empaque desde su perspectiva, recepción de mercancía, manejo de lotes, peso y cubicaje, y todo lo relacionado con la operación diaria del almacén.

2. **Sesión con Contabilidad (Jackie):** Cubrirá el módulo de Contabilidad completo, cuentas por cobrar, cuentas por pagar, conciliación, reportes financieros, y la integración contable con todos los demás módulos.

Cada sesión posterior generará su propio documento de requerimientos siguiendo el mismo formato exhaustivo utilizado aquí. Cada pequeño dato de estas reuniones es oro — no se puede perder nada.
