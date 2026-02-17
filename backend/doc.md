
TUINITY
Inteligencia Artificial y Automatización Empresarial


DOCUMENTO MAESTRO
Diagnóstico Completo, Entrevistas con Empleados
y Requerimientos de Negocio

EVOLUTION ZONA LIBRE
Zona Libre de Colón, Panamá

Febrero 2026  |  Versión 3.0 — Documento Maestro
Documento confidencial — uso interno exclusivo
No contiene cifras financieras ni datos comerciales sensibles

CONTENIDO

01  Entendiendo el negocio de Evolution
02  Cómo opera Evolution hoy
03  Los módulos actuales y qué debemos aprender
04  Entrevistas con empleados
4.1  Margarita — Departamento de Ventas
4.2  Ariel — Departamento de Tráfico
4.3  Celly y Jesús — Compras y Bodega
05  Lógica de negocio que el sistema debe respetar
06  Requerimientos consolidados por módulo
07  Matriz de roles y permisos
08  Los problemas concretos que debemos resolver
09  Qué vamos a construir
10  Plan de implementación
11  Lo que aún no sabemos

1. ENTENDIENDO EL NEGOCIO DE EVOLUTION

Antes de hablar de módulos o funcionalidades, necesitamos entender cómo funciona el negocio de Evolution. Ninguno en nuestro equipo es experto en zona libre ni en distribución de licores, así que este documento también sirve para cerrar esa brecha. Si no entendemos el negocio, no podemos construir un sistema que lo soporte.
¿Qué es la Zona Libre de Colón?
La Zona Libre de Colón es un área de comercio internacional en Panamá donde las empresas importan productos de todo el mundo y los re-exportan a compradores de América Latina y el Caribe. Es como un gigantesco almacén intermedio entre fabricantes (en Europa, Asia, Estados Unidos) y distribuidores regionales.
Lo especial de una zona libre es que la mercancía que entra y sale tiene un tratamiento fiscal diferente: no paga los mismos impuestos que un comercio regular. Por eso los productos tienen códigos arancelarios, documentación de aduana, y se manejan términos de comercio internacional como FOB y CIF.
Esto es importante para el sistema porque no es un e-commerce ni una tienda local. Cada producto tiene capas de información regulatoria y logística que un negocio convencional no necesita, pero que aquí son obligatorias para operar legalmente.
¿Qué hace Evolution exactamente?
Evolution es un importador y distribuidor mayorista de bebidas alcohólicas: whisky, vodka, cognac, vinos y otros licores. Su modelo de negocio funciona así:
1. Compra en volumen: Evolution negocia con proveedores internacionales (ej: Global Brands, JP Chenet, Adycorp) y compra mercancía por contenedores o paletas.
2. Almacena en bodega: La mercancía llega a sus bodegas en Zona Libre, donde se organiza por zonas. También tienen un showroom.
3. Vende a distribuidores (B2B): Sus clientes son otros negocios: distribuidores de otros países, cadenas, comerciantes mayoristas. Vende por cajas, paletas o contenedores. Esta es la operación principal.
4. Tienda minorista (B2C): En la planta baja tienen una tienda donde venden botella por botella. Operación secundaria pero también genera ingresos.
¿Por qué esto es relevante para el sistema?
Porque el sistema no puede tratar a Evolution como una tienda que vende productos. Es un negocio de importación con complejidades: cada producto tiene datos arancelarios y de comercio internacional; los precios no son fijos, dependen del nivel del cliente; las cantidades son masivas y la venta es por cajas, no por unidades; hay un flujo de ventas largo con cotizaciones y aprobaciones; y el costo de un producto no es solo lo que pagaron, sino lo que pagaron más flete, seguro y gastos de internación.

PRINCIPIO FUNDAMENTAL: Si construimos el sistema como si fuera un POS de tienda, vamos a fallar. Tiene que ser un sistema de gestión comercial de importación con capacidades de punto de venta, no al revés.
El equipo de Evolution
A través de las entrevistas hemos identificado los siguientes roles clave:

Persona
Rol / Departamento
Responsabilidades principales
Javier
Dueño / Gerente General
Decisiones finales, aprobaciones, visión del negocio. Regla: ningún producto más de 4-6 meses en bodega.
Estelia
Socia / Gerencia
Co-gestión del negocio junto a Javier.
Jackie
Contabilidad / Gerencia
Contabilidad, reportes financieros, apoyo a gerencia. También sabe de tráfico.
Margarita
Vendedora B2B
Crea cotizaciones, gestiona clientes, negocia precios. Vendedora principal.
Arnold
Vendedor B2B
Segundo vendedor del equipo comercial.
María
Tráfico / Logística
Apoyo en tráfico y documentación de despacho.
Ariel
Tráfico
DMC, BL, documentación regulatoria de Zona Libre.
Celly
Compras y Bodega
Alimenta el sistema, registra entradas, gestiona inventario B2B/B2C, negocia con proveedores.
Jesús
Compras y Bodega (nuevo)
Viene de otra empresa de ZL (perfumería). Aporta visión fresca.
2. CÓMO OPERA EVOLUTION HOY

El sistema actual: Dynamo POS
Dynamo es una aplicación de escritorio desarrollada por Dynamo Software Solutions. El equipo accede por conexión remota a un servidor interno — si el servidor falla o la conexión se cae, nadie puede trabajar. Cuando se va la luz en la oficina, toda la empresa se paraliza, incluyendo bodega que está en otro edificio con electricidad propia.
El sistema tiene 6 módulos principales con más de 60 submódulos. Pero la mayoría son la misma tabla mostrando los mismos datos con un filtro diferente. En lugar de tener un reporte con filtros, tienen un submódulo separado para cada variación. Esto infla artificialmente la complejidad.

Característica
Detalle
Acceso
Conexión remota a servidor interno (punto único de falla)
Interfaz
Aplicación de escritorio con estética oscura, tablas planas sin interactividad
Arquitectura
Dos instancias separadas (Dynamo B2B + Dynamo Caja B2C) con bases de datos independientes
Entrada de datos
Predominantemente manual, producto por producto, con atajos de teclado (F3, F5, F6)
Módulos
6 módulos principales, 60+ submódulos, muchos inoperativos o redundantes
Reportes
Reportes estáticos predefinidos; cada variación es un submódulo separado
Satisfacción
Ningún empleado reportó aspectos positivos del sistema
El problema de las dos bases de datos
Este es probablemente el problema más grave a nivel de arquitectura. Dynamo tiene dos instancias separadas: Dynamo (B2B) para la operación mayorista, y Dynamo Caja (B2C) para la tienda minorista. Ambos venden del mismo inventario físico, pero cada uno tiene su propia cuenta de cuánto hay.
Si bodega tiene 100 cajas de Whisky Black & White y el B2B dice que hay 80 mientras el B2C dice 15, la suma es 95 y no 100. ¿Dónde están las otras 5? Nadie sabe. Esto obliga a conciliar manualmente y es fuente constante de errores.
Dato confirmado por Celly: bodega vende por CAJA, tienda por UNIDAD (botella). Una caja de 6 botellas en bodega = 6 unidades en tienda. Cuando bodega transfiere producto a tienda, le asigna un "costo" inflado (no el real) para generar margen adicional para la operación mayorista.

REGLA PARA LA NUEVA PLATAFORMA: Una sola base de datos. B2B y B2C comparten el mismo inventario, clientes, contabilidad. Lo que cambia es la interfaz y los permisos, no los datos. El sistema debe manejar la conversión de unidades (caja ↔ botella) automáticamente.
Lo que los empleados dicen del sistema
Durante las entrevistas, ningún empleado pudo mencionar algo positivo de Dynamo. El sistema está allí porque no tienen alternativa. La única excepción: Celly pidió que no se quite la "lista automática" — un autocompletado que le facilita el ingreso de datos.
Las quejas principales: interfaz confusa y anticuada; módulos importantes no funcionan (Crear Factura crashea en ambos sistemas); todo se ingresa manualmente; los reportes no ayudan; no hay estadísticas; el sistema se paraliza con la luz; costos y márgenes visibles para todos sin control de acceso.
Relación con proveedor de tecnología
Celly y Jesús enfatizaron fuertemente: necesitan un proveedor presente y accesible. Han tenido experiencias con programadores que venden y desaparecen. Esperan visitas presenciales regulares (mínimo una al mes) y tiempo de respuesta rápido.
3. LOS MÓDULOS ACTUALES Y QUÉ DEBEMOS APRENDER DE CADA UNO

Cada módulo de Dynamo explicado en términos de negocio: qué hace, por qué existe, qué funciona, qué no, y qué debemos llevar a la nueva plataforma.
Punto de Venta — Cómo funciona la venta directa
En Evolution, la venta directa solo ocurre en la tienda B2C. La operación B2B usa el módulo de Ventas con su pipeline de cotizaciones y pedidos.
Dynamo tiene 13 submódulos aquí, pero el principal (Crear Factura) no funciona en ninguno de los dos sistemas. Arroja un error de "terminal no registrada". Los otros 12 son consultas y reportes desde diferentes ángulos: por factura, por cobro, por tarjeta, por caja, por artículo. La mayoría son redundantes. El más valioso es Análisis de Ventas (ventas, costos y utilidad por período).

Para la nueva plataforma: Estos 13 submódulos se reducen a 3 vistas: caja de facturación rápida para B2C, panel de gestión de ventas, y centro de reportes con filtros dinámicos. El 80% de lo que hoy son submódulos separados pasa a ser filtros dentro de una misma vista.
Inventario — El control de la mercancía
Catálogo de productos
Cada producto tiene capas de información propias de un importador en zona libre: datos comerciales (referencia, marca, grupo), datos de importación (país de origen, código arancelario — obligatorio para que el producto se mueva legalmente), datos logísticos (unidades por bulto, peso, dimensiones, metros cúbicos — necesarios para cotizar flete), descripciones multilingües (español, inglés, portugués — clientes de toda América Latina), y 5 niveles de precio (A=más caro, E=más barato) donde cada cliente está asociado a un nivel.
Hallazgo crítico: la descripción es el identificador principal
Evolution NO trabaja por código de barras ni por referencia interna. Trabaja por DESCRIPCIÓN. Los códigos de barras existen (hasta 5 por producto) pero son backup. La "referencia" es el SKU del proveedor, sin significado operativo para Evolution. La búsqueda diaria es siempre por nombre/descripción, que debe incluir: marca, tipo de licor, tamaño (200ml, 375ml, 700ml, 750ml), si tiene estuche, regulador, corcho, si es rellenable. Un error aquí es crítico.

Para la nueva plataforma: Todos estos campos existen por razones reales. Mejorar: búsqueda inteligente, importación masiva, repositorio propio de imágenes (hoy las buscan en Google), edición controlada por roles, campo de descripción sin límite de caracteres.
Cómo entra la mercancía: el flujo de compras
Cuando Evolution compra, crean una Orden de Compra al proveedor internacional. El proveedor da precio FOB (Free On Board — precio en puerto de origen). A eso se suma flete marítimo, seguro, aranceles y gastos de handling/almacenamiento. Todo junto = Costo CIF (Cost, Insurance, Freight) = costo real aterrizado en bodega.
La diferencia FOB vs CIF es fundamental: si compran a $50 FOB pero el CIF es $72, el margen se calcula sobre $72. Si el sistema no hace bien este cálculo, la empresa puede creer que gana cuando pierde.
Actualmente las órdenes se ingresan manualmente, producto por producto. Si un embarque trae 40 productos diferentes, hay que teclear los 40 uno por uno. Horas de trabajo y errores frecuentes.

Dato importante: Dynamo tiene funciones de importación masiva escondidas en Herramientas. Aún no sabemos si el equipo las conoce o usa. Si existen y no se usan, debemos entender por qué para no repetir el error.
El problema de la disponibilidad negativa
Dynamo calcula: DISPONIBLE = EXISTENCIA + POR LLEGAR − SEPARADAS. El problema grave: permite que el disponible sea negativo. Encontramos un producto con existencia de 5 pero 25 separadas = disponible de -20. Evolution le prometió a clientes 20 unidades que no tiene ni va a tener.

REGLA OBLIGATORIA: No permitir disponibilidad negativa. Si un pedido dejaría el disponible por debajo de cero, el sistema debe bloquear la operación. Caso excepcional: aprobación de supervisor con registro.
Otros controles de inventario
Ajustes de inventario: permiten sumar/restar stock manualmente pero sin aprobación (riesgo). Transferencias: tienen mecanismo de doble verificación (captura y confirmación) — buena práctica a mantener. Inventario físico: manual, por zonas; último conteo registrado parece ser de 2015. Existencia mínima: muestra productos bajo stock pero no permite tomar acción directa.
Clientes — Más que un directorio
En B2B, un cliente es una relación comercial con condiciones específicas: nivel de precio, límite de crédito, condiciones de pago (30, 60, 90 días), historial de compras, y saldo pendiente. El módulo es en realidad un módulo de Cuentas por Cobrar con CRM básico (11 submódulos). Hay clientes de crédito (alta compleja con documentación) y de contado (alta rápida). El análisis de morosidad es uno de los submódulos más importantes. La anulación de transacciones no requiere aprobación — riesgo de control.
Contabilidad — La pregunta pendiente
Dynamo tiene módulo completo: libro mayor, plan de cuentas, estados financieros, emisión de cheques, conciliación bancaria. Pero todavía no sabemos si Evolution realmente usa Dynamo como sistema contable principal o tienen software externo. Esta respuesta cambia completamente el alcance.

PENDIENTE DE VALIDAR: ¿Dynamo es el sistema contable principal o tienen software externo? Esto define si construimos contabilidad completa o solo integración.
Configuración
Solo 2 submódulos: registro de bodegas y herramientas del sistema. No fue diseñado para ser flexible. La nueva plataforma necesita gestión de usuarios con roles/permisos, flujos de aprobación, catálogos maestros, y notificaciones.
Ventas — Donde Evolution genera su ingreso
El módulo más importante. La venta B2B tiene 6 etapas con controles de aprobación:

1. Cotización: Vendedor crea propuesta con productos, cantidades y precios según nivel del cliente.
2. Aprobación de cotización: Supervisor revisa precios, descuentos y condiciones.
3. Pedido: Cliente acepta → se convierte en pedido. Mercancía se marca como "Separada" en inventario.
4. Aprobación de pedido: Se valida disponibilidad real y que el cliente esté al día con pagos.
5. Lista de empaque: Bodega recibe documento con todo lo que tiene que preparar.
6. Factura: Se genera la factura formal una vez todo está listo para despachar.

Además incluye: procesos especiales (notas de crédito, devoluciones), DMC-Movimiento Comercial, reportes de ventas, consulta de pedidos reservados, y ventas por vendedor para comisiones.
4. ENTREVISTAS CON EMPLEADOS — LO QUE REALMENTE PASA EN EL DÍA A DÍA

Las entrevistas fueron transcritas y analizadas para extraer requerimientos concretos, dolores operativos y reglas de negocio no visibles solo con el análisis del sistema.

IMPORTANCIA: Los módulos nos muestran qué funciones existen. Las entrevistas nos muestran cómo realmente trabajan las personas y dónde pierden tiempo, cometen errores, o carecen de herramientas. Sin esta información, construiríamos un sistema bonito que no resuelve los problemas reales.
4.1  Margarita — Departamento de Ventas
Margarita es la vendedora principal del equipo B2B. Junto con Arnold, son solo dos vendedores manejando toda la operación comercial mayorista. Recibe solicitudes de clientes (correo, WhatsApp, teléfono), crea cotizaciones seleccionando productos y precios según nivel, y envía al cliente para revisión.
Hallazgo 1: No puede ver el último precio vendido
Al cotizar para un cliente recurrente, no puede ver automáticamente a qué precio le vendió la última vez. Tiene que buscar manualmente la última factura, consumiendo tiempo y generando inconsistencias — si le vendió a $52 y hoy pone $55, el cliente se queja.

Requerimiento: Al seleccionar cliente + producto en cotización, mostrar automáticamente el último precio vendido y la fecha.
Hallazgo 2: Motor de precios demasiado rígido
Los 5 niveles son estáticos, pero Margarita necesita precios especiales por negociación, volumen, o país/destino. Si necesita un precio entre nivel B y C, tiene que ponerlo manualmente y pierde trazabilidad.

Requerimiento: Motor de precios con fórmula precio = costo × (1 + % margen), porcentaje variable por producto y potencialmente por país/cliente. Los 5 niveles como base, con excepciones controladas con aprobación.
Hallazgo 3: Cotizaciones sin imágenes de producto
Los clientes necesitan ver imágenes. Los archivos con imágenes salían tan pesados (20-30 MB) que no podían abrirse. Margarita termina enviando Excel plano sin imágenes.

Requerimiento: Cotizaciones exportables con imágenes en formato ligero (PDF optimizado o link web), no archivos pesados.
Hallazgo 4: Líneas no reordenables
No puede cambiar el orden de productos en una cotización ni insertar entre líneas existentes.

Requerimiento: Líneas de cotización reordenables, insertables y eliminables libremente.
Hallazgo 5: Margarita confirmó que no hay nada positivo en Dynamo. Su expectativa: que la nueva plataforma haga lo mismo pero mejor y más rápido.
4.2  Ariel — Departamento de Tráfico
Ariel trabaja en tráfico — documentación de movimiento de mercancía dentro y fuera de la Zona Libre. Jackie también tiene esta experiencia.
El descubrimiento más importante: el DMC
El DMC (Declaración de Movimiento Comercial) es un documento regulatorio obligatorio del gobierno de la Zona Libre. No es interno de Evolution — es un sistema externo. Cada vez que mercancía entra, sale o se traspasa, hay que registrarlo en la plataforma web del DMC. Tres tipos: Entrada (mercancía de proveedor internacional), Salida (despacho a cliente), y Traspaso (entre empresas dentro de ZL como Mainz, Malta o Milano).
El problema central: duplicación total de trabajo
Todo lo que Ariel hace en el DMC es manual y duplicado. El flujo: se crea pedido en Dynamo → factura → lista de empaque. Después, Ariel abre la plataforma web del DMC y RE-TECLEA toda la información: productos, cantidades, códigos arancelarios, pesos, embarcador, consignatario, booking, barco. Le toma 15-20 minutos por DMC, y a veces tiene que hacer varios el mismo día.
Sistema de numeración manual inventado por Ariel
Como la lista de empaque mezcla los productos sin orden, Ariel inventó su propio sistema: numera cada producto con un número que corresponde a su línea arancelaria (todos los "1" son whisky, todos los "2" son vodka). Ingenioso pero innecesario si el sistema estuviera bien diseñado.

REQUERIMIENTO CRÍTICO: La lista de empaque debe agrupar productos por categoría arancelaria automáticamente. Esto elimina por completo el sistema manual de Ariel.
El BL (Bill of Lading) y Certificado de Libre Venta
Ariel también maneja el BL (conocimiento de embarque) y el Certificado de Libre Venta (requisito sanitario para ciertos destinos como San Andrés, Colombia). En ambos casos, arma documentos manualmente jalando datos de Dynamo hacia Excel, reformateándolos y completando campos a mano.
El dolor más grande: modificaciones post-facturación
Escenario frecuente: ya se facturó, se hizo lista de empaque, incluso el DMC... y el cliente quiere cambiar algo. Proceso actual: desaprobar todo, eliminar factura, hacer cambios, re-aprobar, re-facturar, y si el DMC ya estaba hecho, anularlo y hacerlo desde cero. Todo el trabajo se pierde y se repite.

REQUERIMIENTO CRÍTICO: Mecanismo de modificación controlada post-aprobación. En vez de destruir → reconstruir, permitir "enmiendas" que registren qué cambió y quién autorizó. Cambios menores con aprobación rápida; cambios mayores con re-aprobación completa.

Requerimientos de Ariel consolidados:
1. Generación automática de documentos DMC pre-llenados desde factura y lista de empaque.
2. Lista de empaque agrupada por categoría arancelaria, no mezclada.
3. Formato de BL pre-llenado reutilizando datos del cliente que no cambian.
4. Generación automática de documento para Certificado de Libre Venta cuando el destino lo requiera.
5. Modificación post-aprobación sin destruir todo el pipeline.
6. Poder trabajar en múltiples documentos de tráfico simultáneamente.
7. Preparación anticipada: empezar DMC con días de anticipación para embarques grandes.
4.3  Celly y Jesús — Departamento de Compras y Bodega
Entrevista más densa — más de una hora y media. Celly es la encargada de bodega y compras. Jesús es nuevo, viene de otra empresa de ZL (perfumería). Javier (dueño) presente indirectamente a través de sus directrices.
Hallazgo 1: La descripción es el identificador (ya documentado)
Ya cubierto en Sección 3. Evolution NO trabaja por código de barras. Descripción = identificador primario.
Hallazgo 2: Ingreso de compras = dolor operativo central
Celly recibe facturas/proformas de proveedores, cada uno con formato diferente. Algunos envían PDF con descripción completa; otros, intencionalmente, solo ponen "vodka" sin marca ni detalle (para evitar fuga de información comercial). En esos casos, los detalles reales vienen en el cuerpo de un correo aparte. Celly junta las piezas: imprime PDF, imprime correo, cruza manualmente. Todo se ingresa uno por uno. Un error duplicó una referencia y alimentó inventario erróneo.

Requerimiento: Importación masiva desde archivos (Excel/CSV). Subir factura en formato tabular, mapear columnas, cargar todas las líneas de una vez. Si un producto no existe, ofrecer crearlo en el acto.
Hallazgo 3: Productos duplicados
El mismo producto puede estar registrado varias veces con descripciones ligeramente diferentes. Sin validación al crear.

Requerimiento: Matching inteligente al crear producto: "¿Es este el mismo que...?" antes de crear uno nuevo.
Hallazgo 4: Costos visibles para todos — PROBLEMA GRAVE
Todo el mundo ve todo: costos de compra, márgenes, proveedores. Bodega imprime picking lists con costos. Los vendedores ven costos bajos y ofrecen precios más bajos, destruyendo el margen que Compras negoció.

ESCENARIO REAL: Celly negocia y baja el costo de $48 a $45. La vendedora ve el costo nuevo y, para cerrar la venta, ofrece precio más bajo al cliente. El cliente se acostumbra. Cuando el costo vuelve a subir, ese precio "bajo" ya es lo que el cliente espera. La ventaja competitiva que Celly negoció se perdió.

REGLA: Control de acceso por rol es obligatorio. Vendedores NUNCA deben ver costos de compra. Picking lists de bodega solo muestran descripción y cantidad.
Hallazgo 5: Transferencia B2B→B2C con costo inflado
Cuando bodega transfiere producto a tienda B2C, no le pone el costo real sino un costo mayor. Esto genera un "margen interno" donde el negocio mayorista le "vende" al negocio minorista con ganancia. El sistema debe soportar costos de transferencia diferenciados.
Hallazgo 6: Costo promedio ponderado
Jesús insistió en que el sistema debe calcular automáticamente el costo promedio ponderado cuando entra mercancía nueva a diferente precio. Fórmula: ((Qty_existente × Costo_existente) + (Qty_nueva × Costo_nuevo)) / Qty_total. También pidió comparativo de impacto: si el costo cambia, ver inmediatamente cómo afecta el margen.
Hallazgo 7: Sin estadísticas ni analítica
Jesús enfatizó: movimiento de producto por mes (entradas y salidas), comparación año contra año, identificación de productos estancados (regla de Javier: máximo 4-6 meses en bodega), patrones estacionales (Carnaval, fin de año).

Requerimiento: Dashboard de analítica: rotación de inventario, comparativos por período, productos estancados, patrones estacionales. Filtrable por producto, categoría, proveedor, período.
Hallazgo 8: Infraestructura
Cuando se va la luz, toda la empresa se paraliza. Celly ha pedido servidor separado para bodega. Jesús advierte sobre seguridad cloud (sufrieron hackeo en empresa anterior).
Hallazgo 9: Prioridad acordada
Ambos coinciden: primero el B2B, después el B2C. El corazón del negocio es la distribución mayorista.
5. LÓGICA DE NEGOCIO QUE EL SISTEMA DEBE RESPETAR

Estas son las reglas operativas de Evolution. No son sugerencias. Si el sistema no las implementa correctamente, la operación no funciona.
Flujo de venta B2B
El ciclo completo tiene 6 etapas secuenciales. Cada una debe completarse antes de avanzar:

1. Cotización — Vendedor crea cotización con productos, cantidades y precios según nivel del cliente. Debe ver automáticamente el último precio vendido.
2. Aprobación de cotización — Supervisor revisa y aprueba antes de enviar al cliente.
3. Pedido — Cliente acepta → se convierte en pedido. Inventario se marca como "Separado". No puede separar más de lo disponible.
4. Aprobación de pedido — Se valida disponibilidad real, crédito del cliente, y condiciones comerciales.
5. Lista de empaque — Bodega recibe lista agrupada por categoría arancelaria, SIN costos ni precios.
6. Factura — Factura formal. Después, tráfico genera documentos DMC y BL.

MEJORA CRÍTICA: Enmienda post-aprobación para cambios menores sin destruir todo el pipeline. El sistema actual obliga a desaprobar → eliminar → rehacer → re-aprobar, desperdiciando horas.
Estructura de costos de importación

Costo FOB (Free On Board): Precio del producto en el puerto de origen, antes de flete y seguro.
% Gastos: Flete internacional, seguro, aranceles, handling y otros gastos de internación.
Costo CIF (Cost, Insurance, Freight): Costo total "aterrizado" en bodega. Base real para calcular márgenes y precios.
Costo Promedio Ponderado: Al entrar mercancía nueva: ((Qty_existente × Costo_existente) + (Qty_nueva × Costo_nuevo)) / Qty_total.
Niveles de precio
5 niveles base (A = más caro, E = más barato). Cada cliente tiene un nivel. Precios se recalculan automáticamente cuando cambia el costo. Además: excepciones controladas (precio por negociación específica, por país/destino) y fórmula precio = costo × (1 + % margen) con porcentaje variable.
Documentación de tráfico de Zona Libre
Cada venta genera documentación regulatoria obligatoria:

Documento
Cuándo se necesita
Qué incluye
DMC de Salida
Toda venta que sale de ZL
Productos por código arancelario, cantidades, pesos, embarcador, consignatario, booking, barco
DMC de Entrada
Toda compra de proveedor internacional
Productos, cantidades, códigos arancelarios, proveedor, datos del embarque
DMC de Traspaso
Movimiento entre empresas dentro de ZL (Evolution → Mainz/Malta/Milano)
Similar a salida pero entre empresas relacionadas
Bill of Lading (BL)
Todo embarque marítimo
Booking, datos del barco, consignatario, embarcador, peso/volumen
Certificado de Libre Venta
Envíos a destinos que lo requieren (ej: San Andrés, Colombia)
Información de mercancía para inspección del Ministerio de Salud
Conversión de unidades B2B ↔ B2C
B2B vende por CAJA. B2C vende por UNIDAD (botella). El sistema debe convertir automáticamente: 1 caja de 6 botellas = 6 unidades en B2C. Particularidad: al transferir de bodega a tienda, se asigna un "costo de transferencia" mayor al costo real, generando un margen interno.
6. REQUERIMIENTOS CONSOLIDADOS POR MÓDULO

Todos los requerimientos extraídos de entrevistas y análisis del sistema, organizados por módulo de la nueva plataforma.
Catálogo de Productos
#
Requerimiento
Origen
1
Campo de descripción sin límite, como identificador primario de trabajo
Celly/Jesús
2
Códigos de barras como atributo secundario (múltiples por producto)
Celly/Jesús
3
Referencia del proveedor vinculada al proveedor, no como campo principal
Celly/Jesús
4
Detección inteligente de duplicados al crear productos
Celly/Jesús
5
Importación masiva de productos desde archivos (Excel/CSV)
Análisis sistema
6
Repositorio propio de imágenes de producto
Análisis sistema
7
Descripciones multilingües (español, inglés, portugués)
Análisis sistema
8
Datos arancelarios obligatorios (código arancelario, país de origen)
Análisis sistema
9
Datos logísticos completos (peso, dimensiones, unidades por bulto/paleta)
Análisis sistema
10
5 niveles de precio base + excepciones controladas con aprobación
Margarita + Análisis
11
Precios recalculados automáticamente cuando cambia el costo
Celly/Jesús
Compras e Importación
#
Requerimiento
Origen
1
Importación masiva de órdenes de compra desde archivos del proveedor
Celly (dolor central)
2
Recepción parcial de embarques
Análisis sistema
3
Cálculo automático FOB → CIF con distribución de gastos
Análisis sistema
4
Costo promedio ponderado calculado al ingresar mercancía nueva
Jesús
5
Comparativo de impacto al cambiar costos (anterior vs nuevo, margen)
Jesús
6
Historial completo de compras por producto y por proveedor
Celly
7
Soporte para formatos variables de proveedores (mapeo de columnas)
Celly
Control de Inventario
#
Requerimiento
Origen
1
Stock en tiempo real unificado B2B + B2C
Análisis sistema
2
Bloqueo de disponibilidad negativa (con excepción aprobable)
Análisis sistema
3
Alertas automáticas de reabastecimiento cuando baja de mínimo
Análisis sistema
4
Ajustes con motivos predefinidos (merma, rotura, robo, error, vencimiento) y aprobación
Análisis sistema
5
Transferencias entre bodegas con doble verificación
Análisis sistema
6
Conversión automática caja ↔ botella entre B2B y B2C
Celly
7
Costo de transferencia diferenciado para envíos a tienda B2C
Celly
8
Inventario físico con soporte móvil y lector de código de barras
Análisis sistema
9
Identificación de productos estancados (regla: max 4-6 meses en bodega)
Jesús/Javier
Ventas B2B
#
Requerimiento
Origen
1
Pipeline completo: Cotización → Aprobación → Pedido → Aprobación → Empaque → Factura
Análisis sistema
2
Mostrar último precio vendido al seleccionar cliente + producto
Margarita
3
Motor de precios flexible: niveles base + excepciones + fórmula costo × (1 + %margen)
Margarita
4
Cotizaciones exportables con imágenes en formato ligero
Margarita
5
Líneas de cotización reordenables, insertables y eliminables
Margarita
6
Dashboard de estado por venta (en qué etapa está cada operación)
Análisis sistema
7
Pipeline visual para gerencia
Análisis sistema
8
Mecanismo de enmienda post-aprobación sin destruir pipeline
Ariel
9
Reserva de inventario automática al aprobar pedido ("Separadas")
Análisis sistema
Tráfico y Documentación (MÓDULO NUEVO)
#
Requerimiento
Origen
1
Generación automática de DMC pre-llenado desde factura + lista de empaque
Ariel
2
Lista de empaque agrupada por categoría arancelaria
Ariel
3
BL pre-llenado reutilizando datos recurrentes del cliente
Ariel
4
Certificado de Libre Venta generado cuando el destino lo requiere
Ariel
5
Trabajo simultáneo en múltiples documentos de tráfico
Ariel
6
Preparación anticipada de DMC para embarques grandes
Ariel
Punto de Venta B2C
#
Requerimiento
Origen
1
Caja simplificada para venta rápida (botella por botella)
Análisis sistema
2
Conectada al mismo inventario que B2B (unificado)
Análisis sistema
3
Conversión automática de unidades (caja → botella)
Celly
4
Métodos de pago múltiples
Análisis sistema
Clientes y Cobranza
#
Requerimiento
Origen
1
CRM con historial completo de compras por cliente
Análisis sistema
2
Niveles de precio por cliente con excepciones controladas
Análisis sistema
3
Gestión de crédito (límite, condiciones de pago, documentación)
Análisis sistema
4
Alertas automáticas de morosidad
Análisis sistema
5
Bloqueo automático de ventas a clientes morosos
Análisis sistema
6
Anulación de transacciones solo con aprobación y registro
Análisis sistema
7
Dos tipos de alta: crédito (compleja) y contado (rápida)
Análisis sistema
Reportes y Analítica
#
Requerimiento
Origen
1
Centro único de reportes con filtros dinámicos
Análisis sistema
2
Dashboards visuales con gráficos de tendencia
Análisis sistema
3
Movimiento de producto por mes (entradas y salidas)
Jesús
4
Comparación año contra año
Jesús
5
Identificación de productos estancados con alerta
Jesús
6
Patrones estacionales (Carnaval, fin de año, etc.)
Jesús
7
Ventas por vendedor (para comisiones y evaluación)
Análisis sistema
8
Exportación a Excel/PDF
Análisis sistema
7. MATRIZ DE ROLES Y PERMISOS

El control de acceso es crítico — surgió directamente de las entrevistas. Problema actual: todos ven todo, incluyendo costos y márgenes, destruyendo la ventaja competitiva que Compras negocia.
Visibilidad de información comercial

Rol
Ve costos
Ve proveedores
Ve márgenes
Ve precios venta
Javier/Estelia (dueños)
Sí — Todo
Sí — Todo
Sí — Todo
Sí — Todo
Jackie (contabilidad)
Sí — Todo
Sí — Todo
Sí — Todo
Sí — Todo
Celly (compras/bodega)
Sí
Sí
Sí
Sí
Vendedores (Margarita/Arnold)
NO
NO
NO
Solo precios por nivel
Bodega (operarios)
NO
NO
NO
NO — Solo desc. + cantidad
Tráfico (Ariel/María)
NO
NO
NO
Solo lo necesario para docs
Permisos operativos

Acción
Quién puede
Requiere aprobación de
Crear cotización
Vendedores
No
Aprobar cotización
Supervisor / Gerencia
—
Crear pedido (desde cotización aprobada)
Vendedores
No
Aprobar pedido
Supervisor / Gerencia
—
Generar lista de empaque
Sistema (auto) o Vendedor
No
Generar factura
Vendedor o Administración
Pedido debe estar aprobado
Modificar pedido post-aprob. (menor)
Vendedor o Tráfico
Aprobación rápida de supervisor
Modificar pedido post-aprob. (mayor)
Vendedor
Re-aprobación completa
Ajustar inventario
Bodega
Sí — Supervisor obligatorio
Anular transacción/factura
Administración
Sí — Gerencia obligatorio
Cambiar costos de producto
Compras (Celly)
No, pero deja registro
Cambiar precios de venta
Compras o Gerencia
Sí — Gerencia para excepciones
Crear/editar cliente
Ventas o Administración
No para contado, Sí para crédito
Ver reportes financieros
Gerencia + Contabilidad
—

Documento de picking para bodega: Solo muestra: número de pedido, marca del cliente, descripción del producto, y cantidad de cajas. NADA más. Sin costos, sin precios, sin proveedor, sin márgenes.
8. LOS PROBLEMAS CONCRETOS QUE DEBEMOS RESOLVER

Todos los problemas identificados del análisis y entrevistas, ordenados por prioridad:

#
Problema
Por qué es un problema
Prior.
Fuente
1
Crear Factura no funciona
Módulo core del POS roto en ambos sistemas
CRÍT.
Análisis
2
Disponibilidad negativa
Se compromete mercancía que no existe
CRÍT.
Análisis
3
DMC completamente manual
15-20 min por doc, duplicando datos que ya existen
CRÍT.
Ariel
4
Modif. post-aprob. destruyen todo
Cualquier cambio obliga a desaprobar → eliminar → reconstruir
CRÍT.
Ariel
5
Costos visibles para todos
Vendedores bajan precios al ver costos, destruyen márgenes
CRÍT.
Celly/Jesús
6
Dos bases de datos B2B/B2C
Inventario desincronizado, conciliación manual
ALTA
Análisis
7
Carga manual prod. por prod.
Horas en ingreso de compras, errores humanos
ALTA
Celly
8
Consulta de Entradas crasheado
No se puede consultar historial de mercancía recibida
ALTA
Análisis
9
Ajustes inventario sin aprobación
Stock modificable sin supervisión ni trazabilidad
ALTA
Análisis
10
Sin alertas automáticas
Stock bajo, morosidad, etc. se detectan tarde o nunca
ALTA
Análisis
11
No se ve último precio vendido
Inconsistencias en precios, clientes se quejan
ALTA
Margarita
12
Lista empaque no agrupada
Ariel necesita sistema manual para no equivocarse en DMC
ALTA
Ariel
13
Sin métricas ni estadísticas
Imposible tomar decisiones basadas en datos
ALTA
Jesús
14
Servidor local = punto único falla
Toda la empresa se paraliza cuando se va la luz
ALTA
Celly/Jesús
15
Sin costo promedio ponderado
Costeo incorrecto cuando cambian precios de compra
MED.
Jesús
16
Cotizaciones sin imágenes ligeras
Clientes no pueden ver los productos
MED.
Margarita
17
Datos maestros sucios/duplicados
Catálogos contaminados, productos duplicados
MED.
Celly
18
60+ submódulos redundantes
Misma info en múltiples pantallas = confusión
MED.
Análisis
19
Imágenes de Google
Sin repositorio propio de imágenes
BAJA
Análisis
9. QUÉ VAMOS A CONSTRUIR

Los 60+ submódulos de Dynamo se consolidan en 10 módulos limpios con una sola base de datos. Cada módulo tiene un propósito claro. El módulo de Tráfico es nuevo y surge directamente de las entrevistas con Ariel.

Módulo
Qué reemplaza
Capacidades clave
Catálogo de Productos
Consulta + Administración + Archivos
Ficha completa, búsqueda inteligente, importación masiva, imágenes propias, multilingüe, detección de duplicados
Compras e Importación
Registro de Compras + Costos
Órdenes masivas desde archivo, recepción parcial, cálculo FOB→CIF, costo promedio ponderado, comparativo de impacto
Control de Inventario
Ajustes + Transferencias + Conteo + Stock Mínimo
Stock tiempo real unificado, bloqueo disponibilidad negativa, alertas, ajustes con aprobación, conversión caja↔botella
Ventas B2B
Módulo de Ventas completo
Pipeline con 2 aprobaciones, último precio vendido, motor de precios flexible, cotizaciones con imágenes, enmiendas post-aprobación
Punto de Venta B2C
Crear Factura (hoy no funciona)
Caja simplificada, misma base de inventario, conversión de unidades automática
Tráfico y Documentación
DMC + procesos manuales de Ariel (NUEVO)
DMC/BL/certificados pre-llenados, lista empaque por arancelaria, preparación anticipada
Clientes y Cobranza
Módulo de Clientes completo
CRM con historial, niveles de precio, crédito, alertas de morosidad, bloqueo automático
Reportes y Analítica
Todos los reportes de todos los módulos
Centro único con filtros dinámicos, dashboards, métricas, exportación Excel/PDF
Contabilidad
Módulo de Contabilidad
Módulo propio o integración según lo que se valide
Configuración y Admin
Configuración + Herramientas
Usuarios, roles, permisos, flujos de aprobación, catálogos maestros, notificaciones

Principios de diseño:
Una sola base de datos: B2B y B2C comparten la misma fuente de verdad. Un solo inventario, una sola contabilidad.
Roles y permisos reales: Cada usuario ve solo lo que necesita. Un vendedor no ve costos. Un bodeguero no ve márgenes.
Acciones, no solo consultas: Cada vista que muestra un problema debe permitir tomar acción directa desde esa pantalla.
Carga masiva como estándar: Todo lo que hoy se ingresa uno por uno debe poder cargarse masivamente.
10. PLAN DE IMPLEMENTACIÓN

La prioridad es clara: primero todo lo que necesita el negocio B2B para operar (donde se genera el ingreso real), después lo que completa la operación (B2C, contabilidad, reportes avanzados). La IA es un proyecto independiente posterior.
Principio general: hasta que no se consoliden compras e inventario confiable, no tiene sentido construir el punto de venta B2C (porque la base de datos unificada es el inventario, y si no es confiable, la tienda vende sobre datos incorrectos). Y hasta que no funcione el flujo de ventas B2B completo, no tiene sentido tráfico (porque tráfico genera documentos a partir de la factura y lista de empaque — si esas no existen, no hay documentación que generar).
Fase 1 — Núcleo B2B (Semanas 1 a 8)

Módulo
Alcance
Por qué es prioridad
Estado
Catálogo de Productos
Ficha completa, búsqueda, importación masiva, precios multinivel
Todo depende de un catálogo confiable
COMPLETO (Base)
Compras e Importación
Órdenes con carga masiva, recepción, costeo FOB/CIF, costo promedio
Elimina el dolor #1: la carga manual
COMPLETO (Ciclo Validado)
Control de Inventario
Stock tiempo real, alertas, ajustes con aprobación, bloqueo disp. negativa
Si el inventario no es confiable, nada funciona
COMPLETO (Ciclo B2B Validado)
Ventas B2B
Pipeline completo con ambas aprobaciones, último precio, enmiendas
Donde Evolution genera su ingreso
COMPLETO (Ciclo B2B Validado)
Tráfico y Documentación
DMC pre-llenado, lista empaque por arancelaria, BL básico
Sin documentación, la mercancía no sale de ZL
COMPLETO (Ciclo Validado)
Clientes (básico)
Ficha, nivel de precio, condiciones, crédito básico
Sin clientes configurados, Ventas no opera
COMPLETO (Crédito Validado)
Configuración
Usuarios, roles, permisos, bodegas
Base de control para todo lo anterior
COMPLETO (RBAC Validado)
Fase 2 — Completar operación (Post-estabilización B2B)

| Módulo | Alcance | Estado |
|--------|---------|--------|
| Punto de Venta B2C | Caja simplificada conectada al mismo inventario, conversión de unidades | COMPLETO (Ciclo Validado) |
| Cuentas por cobrar completa | Morosidad, alertas, bloqueo automático, análisis de cartera | COMPLETO (Ciclo Validado) |
| Reportes y Analítica | Dashboards, métricas, productos estancados, patrones estacionales | COMPLETO (Ciclo Validado) |
| Contabilidad | Módulo propio integrado (COA, Partida Doble, P&L, Balance) | COMPLETO (Ciclo Validado) |
| Tráfico Avanzado | Tracking de barcos, booking, control de contenedores, notificaciones | COMPLETO (Ciclo Validado) |
| Inteligencia AI (v1.0) | Reabastecimiento inteligente, Radar de Dead Stock, Proyecciones | COMPLETO (Beta Operativa) |

Fase 3 — Expansión y Optimización (En curso)

| Módulo | Alcance | Estado |
|--------|---------|--------|
| Reabastecimiento Inteligente | Algoritmo ADS, sugerencias de compra automáticas | COMPLETO |
| Radar de Dead Stock | Detección de capital estancado (>90 días inactivo) | COMPLETO |
| Consultas Lenguaje Natural | Interface de búsqueda inteligente (Siguiente paso) | PENDIENTE |
| Notificaciones Push | Alertas proactivas de logística | PENDIENTE |

La inteligencia artificial ya forma parte del núcleo del sistema.
La plataforma ahora utiliza datos históricos para predecir necesidades futuras. La IA de Tuinity optimiza el flujo de caja identificando compras críticas y liquidaciones necesarias.
Oportunidades identificadas: reabastecimiento inteligente, cotizaciones asistidas, predicción de morosidad, consultas en lenguaje natural, copiloto operativo, optimización de precios.
11. LO QUE AÚN NO SABEMOS

Hay preguntas sin respuesta que impactan directamente qué y cómo construimos. Deben resolverse lo antes posible:

#
Pregunta
Por qué importa para el desarrollo
1
¿Usan Dynamo como sistema contable principal o tienen software externo?
Define si construimos contabilidad completa o solo integración
2
¿El equipo conoce las herramientas de importación masiva de Dynamo?
Si existen y no se usan, debemos entender por qué
3
¿Qué flujos de aprobación existen realmente y quién aprueba qué?
Define roles, permisos y flujos del nuevo sistema
4
¿Cómo concilian inventario entre B2B y B2C hoy?
Define prioridad y método de unificación
5
¿Qué reportes usa la gerencia para tomar decisiones?
Define qué construir primero en reportes
6
¿Cuál es la estructura real de bodegas y zonas de almacenamiento?
Define configuración inicial de inventario
7
¿Cuáles son los destinos que requieren Certificado de Libre Venta?
Define lógica de documentación por destino en Tráfico
8
¿Mainz, Malta y Milano son empresas relacionadas, subsidiarias, o clientes?
Define si traspasos DMC son internos o externos
9
¿Cuál es la fórmula exacta de distribución de gastos de internación?
Necesario para implementar correctamente FOB→CIF
10
¿Hay entrevistas adicionales pendientes con otros departamentos?
Podría revelar requerimientos no documentados

---

## 12. FLUJO DE COMPRAS E IMPORTACIÓN (VALIDADO)

### Resumen del Ciclo Completo

El módulo de **Compras e Importación** ha sido completamente implementado y validado. Este flujo elimina la carga manual de facturas de importación y automatiza el cálculo de costos reales (CIF) mediante la distribución proporcional de gastos de internación.

### 12.1 Asistente de Importación (`/dashboard/compras/importacion`)

**Paso 1: Carga de Archivo Excel**
- El usuario (Celly) sube un archivo `.xlsx` con la factura del proveedor
- Columnas soportadas (flexible):
  - **Producto**: `Description`, `Descripcion`, `Nombre`, `Producto`, `SKU`, `Codigo`, `Item`
  - **Cantidad**: `Quantity`, `Cantidad`, `Qty`, `Unidades`
  - **Precio FOB**: `UnitPrice`, `price`, `Precio`, `FOB`, `Costo Unitario`
- El backend (`POST /purchases/upload`) procesa el archivo y:
  - Busca cada producto en el catálogo (por descripción exacta o parcial)
  - Valida cantidades y precios
  - Retorna la lista de items con sus IDs de producto
  - Calcula el **Total FOB** sumando `(cantidad × precio FOB)` de todos los items

**Paso 2: Definición de Costos de Importación**
- El usuario ingresa los gastos adicionales:
  - **Flete** (Freight)
  - **Seguro** (Insurance)
  - **Otros Costos** (Customs, handling, etc.)
- El frontend calcula automáticamente el **CIF por producto** usando la fórmula:
  ```
  Proporción del Item = (FOB del Item) / (FOB Total)
  Gastos del Item = (Flete + Seguro + Otros) × Proporción
  CIF del Item = FOB del Item + Gastos del Item
  CIF Unitario = CIF del Item / Cantidad
  ```
- Se muestra una tabla con:
  - Producto
  - Cantidad
  - FOB Unitario
  - **CIF Unitario (calculado)**
  - Subtotal CIF

**Paso 3: Revisión y Confirmación**
- El usuario revisa los totales:
  - Total FOB
  - Total Gastos de Importación
  - **Total CIF**
- Ingresa metadatos de la orden:
  - Nombre del Proveedor
  - Número de Factura
  - Número de Proforma (opcional)
  - Fecha de Orden
  - Fecha Estimada de Llegada
  - Notas
- Al confirmar, se crea la **Orden de Compra** (`POST /purchases`) con estado `DRAFT`

### 12.2 Backend: Creación de Orden de Compra

**Endpoint**: `POST /purchases`

**Proceso** (`PurchasesService.create`):
1. Valida que la sucursal existe
2. Verifica que no exista una factura duplicada (mismo proveedor + número de factura)
3. Recalcula los totales FOB y CIF en el backend (validación)
4. Para cada item:
   - Calcula la proporción de gastos según su FOB
   - Distribuye los gastos proporcionalmente
   - Calcula `unitCifValue` y `subtotalCif`
5. Crea el registro `PurchaseOrder` con todos sus `PurchaseOrderItem`
6. Registra la acción en `PurchaseAuditLog` (acción: `CREATED`)

**Resultado**: Orden de Compra en estado `DRAFT`, lista para ser recibida.

### 12.3 Recepción de Mercancía (`/dashboard/compras/[id]`)

**Interfaz**:
- Muestra el detalle completo de la orden:
  - Stats cards con FOB Total, Gastos, CIF Total
  - Tabla de items con:
    - Producto
    - Cantidad ordenada
    - Cantidad recibida (con barra de progreso)
    - FOB Unitario
    - **CIF Unitario (costo real)**
    - Estado (Pendiente / Parcial / Completo)
  - Historial de movimientos (Audit Log)
- Botón **"Recibir Mercancía"** (solo visible si no está completamente recibida)

**Proceso de Recepción**:
1. El usuario hace clic en "Recibir Mercancía"
2. Se abre un modal de confirmación explicando que:
   - La mercancía se ingresará al inventario
   - Se recalculará el **Costo Promedio Ponderado**
3. Al confirmar, se envía `PATCH /purchases/:id/receive` con:
   ```json
   {
     "receivedDate": "2026-02-16T03:00:00Z",
     "items": [
       { "productId": "...", "quantity": 100 }
     ]
   }
   ```

**Backend: Recepción** (`PurchasesService.receive`):
1. Valida que la orden existe y no está completamente recibida
2. Para cada item recibido:
   - Verifica que la cantidad no exceda lo pendiente
   - Actualiza `receivedQuantity` en `PurchaseOrderItem`
   - **Calcula el nuevo Costo Promedio Ponderado**:
     ```
     Valor Antiguo = Stock Actual × Costo Promedio Actual
     Valor Nuevo = Cantidad Recibida × CIF Unitario
     Stock Total = Stock Actual + Cantidad Recibida
     
     Nuevo Costo Promedio = (Valor Antiguo + Valor Nuevo) / Stock Total
     ```
   - Actualiza el producto:
     - `weightedAvgCost` ← Nuevo costo promedio
     - `lastFobCost` ← FOB unitario de esta recepción
     - `lastCifCost` ← CIF unitario de esta recepción
   - Actualiza o crea el registro de `Inventory` para la sucursal
   - Crea un `InventoryMovement` tipo `IN` con referencia a la orden
3. Verifica si todos los items están completamente recibidos
4. Actualiza el estado de la orden:
   - `PARTIAL` si aún hay items pendientes
   - `RECEIVED` si todo fue recibido
5. Registra en `PurchaseAuditLog` (acción: `RECEIVED_FULL` o `RECEIVED_PARTIAL`)

### 12.4 Validación del Flujo

**Scripts de Simulación**:
- `backend/prisma/simulate-import-flow.ts`: Valida el cálculo de CIF y costo promedio
- `backend/prisma/seed-receive-scenario.ts`: Crea una orden de prueba para recepción
- `backend/scripts/generate-test-excel.js`: Genera un archivo Excel de prueba

**Credenciales de Prueba**:
- **Tenant**: `evolution`
- **Usuario Bodega**: `celly@evolution.com`
- **Password**: `Evolution2026!`

**Resultado**: El ciclo completo de importación está operativo y validado end-to-end.

---

## 13. FLUJO DE TRÁFICO Y DOCUMENTACIÓN (VALIDADO)

### Resumen del Ciclo Completo

El módulo de **Tráfico y Documentación** automatiza la generación de documentos de exportación requeridos para que la mercancía salga de la Zona Libre de Colón. Este módulo es crítico porque **sin documentación correcta, la mercancía no puede ser despachada**.

### 13.1 Generación Automática de Envíos

**Trigger**: Cuando una venta B2B es aprobada por ambos niveles (Gerente + Crédito), el sistema automáticamente:

1. Crea un registro de `Shipment` vinculado a la venta
2. Genera `ShipmentItem` para cada producto vendido, **snapshoteando**:
   - `tariffCode` (código arancelario del producto)
   - `weight` (peso unitario × cantidad)
   - `volume` (si aplica)
3. Calcula totales:
   - `totalWeight`: Suma de pesos de todos los items
   - `totalVolume`: Suma de volúmenes
4. Asigna estado inicial: `PENDING`

**Código Relevante**: `sales.service.ts` → método `approveSale()`

### 13.2 Interfaz Principal de Tráfico (`/dashboard/trafico`)

**Control de Acceso**:
- ✅ **WAREHOUSE** (Celly): Acceso completo con permisos `MANAGE_TRAFFIC` y `VIEW_TRAFFIC`
- ✅ **OWNER** (Ariel): Acceso total
- ❌ **SALES** (Margarita): Sin acceso (no tiene `VIEW_TRAFFIC`)

**Funcionalidades**:
1. **Dashboard con Estadísticas**:
   - Envíos Pendientes
   - Envíos Listos
   - Envíos Despachados
   - Total de Envíos

2. **Lista de Envíos** con:
   - Número de envío
   - Cliente
   - Destino
   - Cantidad de items
   - Peso total
   - Estado (Pendiente / Listo / Despachado)

3. **Filtros**:
   - Por estado (Todos / Pendientes / Listos / Despachados)

4. **Acciones por Envío**:
   - **Ver Documentos**: Navega a `/dashboard/trafico/[id]`
   - **Despachar**: Marca el envío como despachado (solo si no está despachado)

### 13.3 Página de Documentos (`/dashboard/trafico/[id]`)

**Información del Envío**:
- Cliente
- Destino
- Peso total
- Cantidad de items

**Documentos Disponibles** (Tabs):

#### 1. **Packing List** (Lista de Empaque)
- **Agrupación por Código Arancelario**: Los items se agrupan automáticamente por su `tariffCode`
- **Información por Grupo**:
  - Código arancelario
  - Lista de productos con:
    - Descripción
    - Cantidad
    - Peso individual
- **Totales**: Peso total del envío

**Endpoint**: `GET /traffic/shipments/:id/packing-list`

**Lógica de Agrupación** (`TrafficService.getPackingList`):
```typescript
const groupedByTariff: Record<string, any[]> = {};
for (const item of shipment.items) {
    const code = item.tariffCode || 'NO-CODE';
    if (!groupedByTariff[code]) {
        groupedByTariff[code] = [];
    }
    groupedByTariff[code].push({
        description: item.product.description,
        quantity: item.quantity,
        weight: item.weight
    });
}
```

#### 2. **DMC** (Declaración de Mercancías de Colón)
- **Pre-llenado** con información del envío:
  - Exportador: Evolution Zona Libre
  - Consignatario: Cliente
  - País de destino
  - Valor FOB total (calculado desde la venta)
- **Tabla de Items**:
  - Código arancelario
  - Descripción
  - Cantidad
  - Peso
  - Valor FOB
- **Totales**: Peso total y valor FOB total

**Endpoint**: `GET /traffic/shipments/:id/dmc`

#### 3. **Bill of Lading (BL)**
- Shipper: Evolution Zona Libre
- Consignee: Cliente
- Port of Loading: Colón, Panama
- Port of Discharge: Destino del envío
- Total Packages: Cantidad de items
- Gross Weight: Peso total
- Description of Goods: "General merchandise as per packing list"

**Endpoint**: `GET /traffic/shipments/:id/bl`

#### 4. **Certificado de Libre Venta**
- **Propósito**: Certifica que los productos están autorizados para venta y consumo en Panamá
- **Requerido para**: Ciertos destinos (según regulaciones del país)
- **Contenido**:
  - Declaración oficial
  - Exportador
  - País de destino
  - Lista de productos con:
    - Descripción
    - Marca
    - Cantidad
  - Fecha de emisión
  - Validez para exportación

**Endpoint**: `GET /traffic/shipments/:id/free-sale`

### 13.4 Funcionalidad de Impresión

**Botón "Imprimir"**:
- Oculta elementos de navegación y controles (`print:hidden`)
- Mantiene solo el contenido del documento activo
- Formato optimizado para impresión en papel tamaño carta

**CSS Print**:
```css
@media print {
  .print\\:hidden { display: none; }
}
```

### 13.5 Flujo de Despacho

**Proceso**:
1. Celly revisa todos los documentos generados
2. Verifica que la información es correcta
3. Imprime los documentos necesarios
4. Hace clic en **"Despachar"** en la lista de envíos
5. El sistema:
   - Actualiza el estado del envío a `DISPATCHED`
   - Registra la fecha de despacho (`dispatchedAt`)
   - Actualiza las estadísticas del dashboard

**Endpoint**: `POST /traffic/shipments/:id/dispatch`

**Payload**:
```json
{
  "dispatchedAt": "2026-02-16T03:00:00Z"
}
```

### 13.6 Validación del Flujo

**Prerequisito**: Debe existir una venta aprobada que haya generado un envío.

**Credenciales de Prueba**:
- **Usuario**: `celly@evolution.com` (WAREHOUSE)
- **Password**: `Evolution2026!`

**Pasos de Validación**:
1. Crear y aprobar una venta B2B (esto genera el envío automáticamente)
2. Navegar a `/dashboard/trafico`
3. Verificar que el envío aparece en la lista
4. Hacer clic en "Ver Docs"
5. Revisar cada documento (Packing List, DMC, BL, Certificado)
6. Verificar que el Packing List agrupa correctamente por código arancelario
7. Imprimir un documento de prueba
8. Marcar el envío como despachado
9. Verificar que el estado cambia a "DESPACHADO"

**Resultado**: El módulo de Tráfico y Documentación está completamente operativo y listo para producción.

---

## 14. PUNTO DE VENTA B2C (VALIDADO)

### Resumen del Ciclo Completo

El módulo de **Punto de Venta (POS) B2C** permite realizar ventas al público en la tienda física (Tienda Colón). Este sistema está completamente integrado con el inventario central, permitiendo ventas rápidas sin necesidad de registrar clientes.

### 14.1 Gestión de Sesiones de Caja

**Apertura de Caja**:
- El cajero debe abrir una sesión antes de realizar ventas
- Se registra el **monto de apertura** (efectivo inicial en caja)
- Se vincula la sesión al usuario y sucursal
- Estado: `OPEN`

**Endpoint**: `POST /pos/cash-sessions/open`

**Payload**:
```json
{
  "openingCash": 100.00,
  "branchId": "branch-id"
}
```

**Cierre de Caja**:
- Al finalizar el turno, el cajero cierra la sesión
- Se registra el **monto de cierre** (efectivo final contado)
- El sistema calcula:
  - Total de ventas realizadas durante la sesión
  - Efectivo esperado = Apertura + Ventas
  - **Diferencia** = Cierre - Esperado
- Estado: `CLOSED`

**Endpoint**: `PATCH /pos/cash-sessions/:id/close`

**Payload**:
```json
{
  "closingCash": 1250.00,
  "notes": "Cierre de turno"
}
```

### 14.2 Interfaz Principal del POS (`/dashboard/pos`)

**Control de Acceso**:
- ✅ **SALES** (Margarita, Vendedor): Acceso completo con permiso `MANAGE_POS`
- ✅ **OWNER** (Ariel): Acceso total
- ❌ **WAREHOUSE** (Celly): Sin acceso (no tiene `MANAGE_POS`)

**Layout**:
- **Panel Izquierdo**: Catálogo de productos
  - Búsqueda rápida por descripción
  - Grid de productos con:
    - Descripción
    - Precio (nivel C por defecto para B2C)
    - Stock disponible
  - Click en producto → Agregar al carrito

- **Panel Derecho**: Carrito de compra
  - Lista de items seleccionados
  - Controles de cantidad (+/-)
  - Botón eliminar item
  - **Total** en grande
  - Botón **"Cobrar"**

**Funcionalidades**:
1. **Búsqueda de Productos**: Input con filtro en tiempo real
2. **Agregar al Carrito**: Click en tarjeta de producto
3. **Ajustar Cantidad**: Botones +/- (valida stock disponible)
4. **Eliminar Item**: Botón de basura
5. **Validación de Stock**: No permite vender más del disponible
6. **Cálculo Automático**: Total se actualiza en tiempo real

### 14.3 Proceso de Venta

**Flujo**:
1. Cajero agrega productos al carrito
2. Verifica el total
3. Click en **"Cobrar"**
4. Se abre modal de pago:
   - Muestra total a pagar
   - Input para monto recibido
   - Calcula y muestra el **cambio** automáticamente
5. Cajero ingresa monto recibido
6. Click en **"Confirmar Pago"**
7. El sistema:
   - Crea la venta (`POST /sales`)
   - **No requiere cliente** (customerId = null)
   - Descuenta inventario automáticamente
   - Registra la venta en la sesión de caja
   - Muestra toast con el cambio
8. Carrito se limpia automáticamente

**Endpoint de Venta**: `POST /sales`

**Payload**:
```json
{
  "customerId": null,
  "branchId": "tienda-colon-id",
  "items": [
    {
      "productId": "product-id",
      "quantity": 2,
      "unitPrice": 15.99
    }
  ],
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "notes": "Venta POS"
}
```

**Características Especiales**:
- **Sin Cliente**: Las ventas B2C no requieren registrar un cliente
- **Pago Inmediato**: Siempre `paymentStatus: PAID`
- **Método de Pago**: Por ahora solo `CASH` (efectivo)
- **Precio Nivel C**: Se usa el precio de venta al público
- **Descuento de Inventario**: Automático al confirmar venta
- **Sin Aprobaciones**: Las ventas POS no requieren aprobación

### 14.4 Historial de Sesiones (`/dashboard/pos/sessions`)

**Información Mostrada**:
- Lista de todas las sesiones de caja (abiertas y cerradas)
- Por cada sesión:
  - ID de sesión
  - Cajero
  - Monto de apertura
  - Monto de cierre
  - Total de ventas
  - **Diferencia** (con indicador visual):
    - Verde + ↑ si hay sobrante
    - Rojo + ↓ si hay faltante
  - Estado (Abierta / Cerrada)
  - Botón "Ver Reporte"

**Estadísticas Globales**:
- Total de sesiones
- Ventas totales acumuladas
- Promedio de ventas por sesión

**Endpoint**: `GET /pos/cash-sessions?page=1&limit=50`

### 14.5 Reporte de Sesión

**Contenido del Reporte** (Endpoint: `GET /pos/cash-sessions/:id/report`):
- Información de la sesión:
  - Cajero
  - Fecha y hora de apertura/cierre
  - Duración
- Resumen financiero:
  - Apertura
  - Total de ventas
  - Efectivo esperado
  - Efectivo contado (cierre)
  - **Diferencia**
- Detalle de ventas:
  - Lista de todas las ventas realizadas
  - Productos vendidos
  - Totales por método de pago

### 14.6 Integración con Inventario

**Descuento Automático**:
- Al confirmar una venta POS, el sistema:
  1. Valida stock disponible antes de procesar
  2. Crea un `InventoryMovement` tipo `OUT`
  3. Actualiza `Inventory.quantity` restando la cantidad vendida
  4. Vincula el movimiento a la venta

**Validación de Stock**:
- Antes de agregar al carrito: Verifica `stock > 0`
- Al aumentar cantidad: Verifica `quantity <= stock`
- Al confirmar venta: Valida stock disponible (por si cambió)

**Manejo de Errores**:
- Si el stock es insuficiente al confirmar:
  - Se muestra error al usuario
  - No se procesa la venta
  - El carrito se mantiene intacto

### 14.7 Validación del Flujo

**Credenciales de Prueba**:
- **Usuario**: `margarita@evolution.com` (SALES) o `vendedor@evolution.com`
- **Password**: `Evolution2026!`

**Pasos de Validación**:
1. Iniciar sesión con usuario SALES
2. Navegar a `/dashboard/pos`
3. Abrir caja con monto inicial (ej: $100)
4. Buscar un producto
5. Agregar al carrito (verificar que se agrega)
6. Ajustar cantidad (verificar límite de stock)
7. Agregar más productos
8. Click en "Cobrar"
9. Ingresar monto recibido mayor al total
10. Verificar cálculo de cambio
11. Confirmar pago
12. Verificar que el carrito se limpia
13. Verificar que el inventario se descontó
14. Realizar más ventas
15. Cerrar caja
16. Navegar a `/dashboard/pos/sessions`
17. Verificar que la sesión aparece cerrada
18. Ver reporte de la sesión

**Resultado**: El módulo de Punto de Venta B2C está completamente operativo y listo para uso en tienda física.


---

## 15. Reportes y Analítica (Dashboard Ejecutivo)

### 15.1 Resumen del Módulo
El módulo de analítica proporciona una visión estratégica del negocio, consolidando datos de ventas, inventario y finanzas en indicadores clave de rendimiento (KPIs).

**Características Principales**:
- **KPIs en Tiempo Real**: Ventas totales, ticket promedio, valor del inventario y cuentas por cobrar.
- **Cálculo de Crecimiento**: Comparativa automática contra el periodo anterior.
- **Top 10**: Listado de productos más vendidos y mejores clientes por volumen de compra.
- **Alertas Críticas**: Visibilidad inmediata de stock bajo y facturas vencidas.
- **Tendencia de Ventas**: Gráfico histórico de desempeño diario.

### 15.2 Estructura Backend
- **Service**: `AnalyticsService`
- **Controller**: `AnalyticsController`
- **Endpoints**:
  - `GET /analytics/stats?period=month`: KPIs globales.
  - `GET /analytics/top-products?period=month&limit=10`: Ranking de productos.
  - `GET /analytics/top-customers?period=month&limit=10`: Ranking de clientes.
  - `GET /analytics/low-stock?threshold=10`: Inventario crítico.
  - `GET /analytics/overdue-invoices`: Morosidad crítica.
  - `GET /analytics/sales-trend?period=month`: Datos para gráficas.

---

## 16. Cuentas por Cobrar (Administración de Cartera)

### 16.1 Resumen del Módulo
Gestión especializada de la deuda de clientes B2B, automatizando el control de riesgo y la recuperación de cartera.

**Características Principales**:
- **Aging Report (Antigüedad)**: Estratificación de la deuda en periodos (Corriente, 1-30, 31-60, 61-90, +90 días).
- **Gestión de Cobros**: Registro de interacciones (Llamadas, Visitas, Promesas de Pago).
- **Bloqueo Automático**: Motor que bloquea clientes por exceder límite de crédito o por mora severa (>60 días).
- **Dashboard de Morosidad**: Identificación rápida de los 10 mayores deudores.

### 16.2 Estructura Backend
- **Service**: `ReceivablesService`
- **Controller**: `ReceivablesController`
- **Modelos**: `CreditAlert`, `CollectionInteraction`, `PaymentRecord`.
- **Endpoints**:
  - `GET /receivables/dashboard`: Resumen ejecutivo de la cartera.
  - `GET /receivables/aging-report`: Detalle por cliente y periodo.
  - `POST /receivables/interactions`: Registro de gestión de cobro.
  - `POST /receivables/auto-block`: Ejecución manual del proceso de bloqueo.

---

## 17. Contabilidad Integrada

### 17.1 Resumen del Módulo
Sistema contable de partida doble totalmente integrado con la operación comercial (Ventas, Compras, Pagos).

**Características Principales**:
- **Plan de Cuentas (COA)**: Estructura jerárquica ajustable (Activo, Pasivo, Patrimonio, Ingresos, Gastos).
- **Asientos Automáticos**: Generación automática de pólizas contables al confirmar ventas (Afecta CxC, Inventario, Costo de Venta e Ingresos).
- **Libro Diario**: Registro cronológico de todas las operaciones contables.
- **Estados Financieros**:
  - **Balance General**: Situación financiera acumulada.
  - **Estado de Resultados (P&L)**: Utilidad o pérdida en tiempo real.

### 17.2 Estructura Backend
- **Service**: `AccountingService`
- **Controller**: `AccountingController`
- **Modelos**: `Account`, `JournalEntry`, `JournalLine`.
- **Endpoints**:
  - `POST /accounting/init-coa`: Inicializa plan de cuentas base para Panamá.
  - `GET /accounting/accounts`: Lista el catálogo de cuentas.
  - `GET /accounting/reports/p-and-l`: Genera estado de resultados.
  - `GET /accounting/reports/balance-sheet`: Genera balance general.

### 17.3 Lógica de Asientos
Al realizar una venta, el sistema genera el siguiente asiento automático:
1. **DEBITO** Cuentas por Cobrar (Activo)
2. **CREDITO** Ventas de Mercancía (Ingreso)
3. **DEBITO** Costo de Ventas (Egreso) - *Basado en costo landeado (CIF)*
4. **CREDITO** Inventario (Activo)

---

**Resultado**: Los módulos de **Analytics**, **CXC** y **Contabilidad** están 100% operativos y validados, cerrando el ciclo financiero del sistema.


Fin del documento  |  Versión 4.0 — Documento Maestro  |  Febrero 2026
Documento vivo. Se actualiza con cada nueva fuente de información.
