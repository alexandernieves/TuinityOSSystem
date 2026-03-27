# DOCUMENTO 01 — INTRODUCCIÓN COMPLETA AL PROYECTO EVOLUTION ZONA LIBRE

## Para quién es este documento
Este documento está diseñado para ser consumido por un agente de desarrollo (Claude Code o un desarrollador humano) que va a construir la plataforma de gestión comercial de Evolution Zona Libre. Contiene TODA la información necesaria para entender el negocio, las personas, el sistema actual, los problemas, las reglas de negocio, y los principios de diseño. No se omite ningún detalle.

Los documentos posteriores (02, 03, 04...) cubrirán módulo por módulo las especificaciones técnicas con screenshots reales del sistema actual, campos exactos, flujos de trabajo, y wireframes de la nueva plataforma.

## Tabla de contenido
1. Qué es el proyecto
2. Qué es Evolution Zona Libre
3. Qué es la Zona Libre de Colón y por qué importa
4. El modelo de negocio de Evolution
5. Las personas de Evolution — quién hace qué
6. El sistema actual: Dynamo POS
7. Por qué Dynamo debe ser reemplazado por completo
8. Las reglas de negocio que el sistema debe respetar
9. La estructura de costos de importación (FOB → CIF)
10. Los 5 niveles de precio — sistema actual y su problema
11. La documentación de tráfico de Zona Libre
12. La conversión de unidades B2B ↔ B2C
13. La matriz de roles y permisos
14. Los módulos que vamos a construir
15. El plan de implementación
16. Las preguntas sin resolver
17. Principios de diseño de la nueva plataforma
18. Lo que descubrimos explorando Dynamo directamente

---

## 1. QUÉ ES EL PROYECTO

Tuinity (la empresa consultora) fue contratada para reemplazar el sistema de gestión actual de Evolution Zona Libre. El sistema actual se llama Dynamo POS, fue desarrollado por un programador independiente hace muchos años, está lleno de fallas, y la empresa ha llegado al punto donde el sistema les impide operar eficientemente.

El proyecto tiene tres fases conceptuales:

**Fase A — Replicar Dynamo con tecnología moderna.** Copiar exactamente lo que Dynamo hace (lo que funciona), pero con una interfaz moderna, limpia, estilo Shopify. El principio es: si los empleados de Evolution han podido trabajar con Dynamo durante años, eso significa que Dynamo define el punto de partida mínimo. Todo lo que Dynamo hace, la nueva plataforma debe hacerlo igual o mejor. Si no replicamos Dynamo primero, los empleados no pueden migrar.

**Fase B — Arreglar lo que está roto y optimizar.** Una vez que la copia funcional existe, empezar a resolver los problemas documentados: módulos que no funcionan, disponibilidad negativa, costos visibles para todos, carga manual producto por producto, etc. Aquí también entra la consolidación de submódulos redundantes en vistas con filtros.

**Fase C — Inteligencia artificial y automatización.** Una vez que la base está limpia y estable, integrar agentes de IA para reabastecimiento inteligente, cotizaciones asistidas, predicción de morosidad, consultas en lenguaje natural, copiloto operativo, y optimización de precios. Esta fase NO forma parte del alcance actual de desarrollo.

**El primer entregable concreto** es un prototipo frontend funcional — sin backend complejo, pero con datos mockeados reales y todas las pantallas navegables — que sirva como referencia visual exacta de cómo debe verse y funcionar la plataforma final. Este prototipo es lo que el desarrollador backend (EJ) usará para integrar la funcionalidad real.

---

## 2. QUÉ ES EVOLUTION ZONA LIBRE

Evolution es un importador y distribuidor mayorista de bebidas alcohólicas ubicado en la Zona Libre de Colón, Panamá. El dueño es Javier Lange. La empresa tiene aproximadamente 8-10 empleados operativos.

Vende whisky, vodka, cognac, vinos, tequila, ron, champaña, licores, y también algunos productos no alcohólicos como bebidas energizantes (Ciclon Energy Drink) y snacks (Papitas Pringles en varias presentaciones). Sin embargo, el corazón del negocio son los licores.

Evolution NO es una tienda, NO es un e-commerce, NO es un restaurante. Es una empresa de comercio internacional de importación y re-exportación que opera bajo las regulaciones especiales de una zona franca. Cada transacción involucra documentación aduanera, códigos arancelarios, y cumplimiento regulatorio. Si el sistema se construye como si fuera un POS de tienda, va a fallar.

**Principio fundamental del documento maestro original:** "Si construimos el sistema como si fuera un POS de tienda, vamos a fallar. Tiene que ser un sistema de gestión comercial de importación con capacidades de punto de venta, no al revés."

---

## 3. QUÉ ES LA ZONA LIBRE DE COLÓN Y POR QUÉ IMPORTA

La Zona Libre de Colón (ZLC) es un área de comercio internacional en Panamá donde las empresas importan productos de todo el mundo y los re-exportan a compradores de América Latina y el Caribe. Funciona como un gigantesco almacén intermedio entre fabricantes (Europa, Asia, Estados Unidos) y distribuidores regionales.

### Por qué esto afecta directamente al sistema:

**Tratamiento fiscal especial:** La mercancía que entra y sale de la Zona Libre tiene impuestos mínimos o nulos para mercancía en tránsito. Esto lo confirmamos al explorar Dynamo — los campos de IMPUESTOS en las órdenes de compra están típicamente vacíos. Los "gastos" asociados a una importación son principalmente flete marítimo, seguro, handling y almacenamiento, NO impuestos tradicionales.

**Código arancelario obligatorio:** Cada producto DEBE tener un código arancelario asignado para poder moverse legalmente dentro y fuera de la Zona Libre. Un producto sin arancel no puede existir en el sistema — es un requisito legal, no una preferencia. En Dynamo, el campo "Arancel" existe en cada ficha de producto (ejemplo: 2208309000 para whisky, 2204109000 para champaña, 2208601000 para vodka).

**Documentación regulatoria obligatoria:** Cada venta que sale de la Zona Libre requiere un DMC (Declaración de Movimiento Comercial). Los embarques marítimos requieren un BL (Bill of Lading). Ciertos destinos (como San Andrés, Colombia) requieren un Certificado de Libre Venta del Ministerio de Salud. Todo esto hoy se hace manualmente — 15 a 20 minutos por DMC, duplicando datos que ya existen en el sistema.

**Términos de comercio internacional:** Los precios se manejan en FOB (Free On Board — precio en puerto de origen) y CIF (Cost, Insurance, Freight — costo total aterrizado en bodega). La diferencia es fundamental: si compran a $50 FOB pero el CIF es $72, el margen se calcula sobre $72. Si el sistema no hace bien este cálculo, la empresa puede creer que gana cuando pierde.

**Empresas relacionadas dentro de ZL:** Evolution tiene relación con otras empresas dentro de la Zona Libre: Mainz, Malta, y Milano. Los traspasos de mercancía entre estas empresas generan un tipo especial de DMC (DMC de Traspaso). Todavía no está confirmado si son subsidiarias, empresas relacionadas, o simplemente clientes frecuentes.

---

## 4. EL MODELO DE NEGOCIO DE EVOLUTION

### Operación B2B (principal — donde se genera el ingreso real)

Evolution compra mercancía en volumen a proveedores internacionales por contenedores o paletas. La mercancía llega a sus bodegas en Zona Libre. Desde allí, vende a distribuidores de otros países — principalmente Curazao, Colombia, y otros destinos en América Latina y el Caribe.

La venta B2B es por cajas, paletas, o contenedores completos. No vende botellas individuales en B2B. El ciclo de venta completo tiene 6 etapas: Cotización → Aprobación de cotización → Pedido → Aprobación de pedido → Lista de empaque → Factura. Después de la factura, Tráfico genera los documentos regulatorios (DMC, BL).

Los clientes B2B tienen condiciones comerciales específicas: nivel de precio (A a E), límite de crédito, condiciones de pago (30, 60, 90 días), y historial de compras. No es venta transaccional — es una relación comercial con negociación.

### Operación B2C (secundaria)

En la planta baja del edificio de oficinas, Evolution tiene una tienda física que vende botellas individuales al público. Es una operación secundaria pero genera ingresos. La tienda vende del MISMO inventario físico que el B2B, pero por unidad en vez de por caja.

La conversión es: 1 caja de 6 botellas en B2B = 6 unidades individuales en B2C. Cuando bodega transfiere producto a la tienda, le asigna un "costo de transferencia" que es MAYOR al costo real, generando un margen interno donde el negocio mayorista le "vende" al negocio minorista con ganancia.

### Los proveedores conocidos

| Proveedor | Tipo de productos |
|-----------|-------------------|
| GLOBAL BRANDS, S.A. | Jack Daniels, Finlandia, y otros |
| TRIPLE DOUBLE TRADING LLC | Johnnie Walker, Glenfiddich, Don Julio, Clase Azul, Beluga |
| JP CHENET | Freixenet, Captain Morgan, Glenlivet, y otros |
| ADYCORP | Chivas Regal, Absolut, y otros |

Dato importante: cada proveedor envía facturas/proformas en formato diferente. Algunos envían PDF con descripción completa; otros, intencionalmente, solo ponen "vodka" sin marca ni detalle para evitar fuga de información comercial. Los detalles reales vienen en el cuerpo de un correo aparte. Celly (la encargada de compras) junta las piezas manualmente: imprime PDF, imprime correo, cruza manualmente.

### El flujo completo del negocio

```
PROVEEDORES INTERNACIONALES
        ↓ (compra por contenedores, precio FOB)
EVOLUTION BODEGA (Zona Libre de Colón)
        ↓ (+ flete + seguro + handling = precio CIF)
    ┌───┴───┐
    ↓       ↓
  B2B     B2C
(cajas)  (botellas)
    ↓       ↓
DISTRIBUIDORES    PÚBLICO
INTERNACIONALES   LOCAL
    ↓
DOCUMENTACIÓN
(DMC, BL, Certificados)
```

---

## 5. LAS PERSONAS DE EVOLUTION — QUIÉN HACE QUÉ

Conocemos a cada persona a través de entrevistas directas realizadas en visita física a las oficinas. Cada uno tiene dolores específicos con el sistema actual y requerimientos concretos para el nuevo.

### Javier — Dueño / Gerente General
- Toma las decisiones finales y aprobaciones
- Establece las reglas del negocio. Regla principal: ningún producto más de 4-6 meses en bodega. Si no se vende, hay que moverlo
- Presente indirectamente en la entrevista con Celly y Jesús, a través de sus directrices
- Usuario administrador en Dynamo (el que usamos para explorar el sistema)

### Estelia — Gerencia / Mano derecha de Javier
- Parte del equipo gerencial, mano derecha de Javier en la gestión del negocio
- No es dueña, pero tiene un rol importante en la toma de decisiones operativas
- No fue entrevistada directamente pero se sabe que tiene acceso completo al sistema

### Jackie — Contabilidad / Gerencia
- Maneja la contabilidad y reportes financieros
- También tiene conocimiento del área de tráfico
- Pregunta pendiente: ¿Qué software contable usa actualmente? Independientemente de la respuesta, la nueva plataforma incluirá contabilidad completa — todo se muda a un solo lugar

### Margarita — Vendedora B2B (principal)
Entrevistada directamente. Es la vendedora principal del equipo comercial.

**Lo que hace:** Crea cotizaciones para clientes internacionales, gestiona relaciones con distribuidores, negocia precios dentro de los rangos permitidos.

**Sus dolores con Dynamo:**
- No puede ver el último precio que le vendió a un cliente específico. Tiene que buscarlo manualmente, y a veces da un precio diferente al anterior. Los clientes se quejan.
- Las cotizaciones no se pueden exportar con imágenes de los productos en un formato ligero para enviar al cliente.
- Las líneas de cotización no se pueden reordenar ni insertar entre medio — solo agregar al final.
- El motor de precios es rígido: solo los 5 niveles base. Cuando necesita hacer una excepción (precio especial por negociación, por país, por volumen), no hay mecanismo formal.

**Lo que necesita del nuevo sistema:**
1. Ver automáticamente el último precio vendido al seleccionar cliente + producto
2. Motor de precios flexible: 5 niveles base + excepciones con aprobación gerencial
3. Cotizaciones exportables con imágenes en formato ligero (PDF liviano)
4. Líneas de cotización reordenables, insertables y eliminables
5. Dashboard de estado por venta (en qué etapa está cada operación)

### Arnold — Vendedor B2B (segundo)
- Segundo vendedor del equipo comercial
- No fue entrevistado directamente pero comparte las mismas necesidades que Margarita

### Ariel — Departamento de Tráfico
Entrevistado directamente. Maneja toda la documentación regulatoria de Zona Libre.

**Lo que hace:** Genera DMC (Declaración de Movimiento Comercial) de entrada, salida, y traspaso. Genera Bill of Lading (BL). Genera Certificado de Libre Venta cuando el destino lo requiere. Todo esto actualmente es 100% manual — toma datos de Dynamo, los pasa a Excel, reformatea, completa campos a mano, y sube a la plataforma del gobierno.

**Sus dolores con Dynamo:**
- Un solo DMC toma 15-20 minutos de trabajo manual duplicando datos que ya existen en el sistema
- La lista de empaque de bodega viene mezclada — no está agrupada por código arancelario, que es como la necesita para el DMC
- Cuando un cliente pide cambios después de que ya se facturó y se hizo la documentación, hay que: desaprobar todo → eliminar factura → hacer cambios → re-aprobar → re-facturar → anular DMC → hacer DMC nuevo desde cero. TODO el trabajo se pierde y se repite
- No puede trabajar en múltiples documentos de tráfico simultáneamente
- No puede preparar DMC con anticipación para embarques grandes que sabe que vienen

**Lo que necesita del nuevo sistema:**
1. Generación automática de DMC pre-llenado desde factura + lista de empaque
2. Lista de empaque agrupada por categoría arancelaria, no mezclada
3. BL pre-llenado reutilizando datos recurrentes del cliente (consignatario, embarcador, booking)
4. Certificado de Libre Venta automático cuando el destino lo requiere
5. Modificación post-aprobación sin destruir todo el pipeline — mecanismo de "enmiendas" que registre qué cambió y quién autorizó
6. Poder trabajar en múltiples documentos de tráfico simultáneamente
7. Preparación anticipada: empezar DMC con días de anticipación para embarques grandes

### María — Tráfico / Logística
- Apoyo a Ariel en tráfico y documentación de despacho
- No fue entrevistada por separado

### Celly — Compras y Bodega
Entrevistada directamente (entrevista más densa — más de hora y media). Es la persona que más interactúa con Dynamo en el día a día.

**Lo que hace:** Recibe facturas/proformas de proveedores internacionales, las ingresa al sistema, gestiona el inventario de bodega B2B, coordina transferencias a la tienda B2C, negocia con proveedores para conseguir mejores costos.

**Sus dolores con Dynamo:**
- Ingresa todo manualmente, producto por producto. Si un embarque trae 40 productos diferentes, teclea los 40 uno por uno. La herramienta de importación desde Excel que tiene Dynamo está ROTA — existe el botón pero da error "Excel no está instalado"
- Productos duplicados: el mismo producto puede estar registrado varias veces con descripciones ligeramente diferentes. No hay validación al crear
- Datos maestros contaminados: el campo "Marca" tiene valores incorrectos (ej: JP CHENET aparece como marca de Pringles y Captain Morgan). El campo "País Origen" tiene placeholder "PAIS ORIGEN (Renombrar)" nunca configurado
- PROBLEMA GRAVE de costos visibles: todo el mundo ve todo — costos de compra, márgenes, proveedores. Los vendedores ven costos bajos y ofrecen precios más bajos al cliente para cerrar ventas, destruyendo el margen que Compras negoció
- Escenario real documentado: Celly negocia y baja el costo de $48 a $45. La vendedora ve el costo nuevo y ofrece precio más bajo al cliente. El cliente se acostumbra. Cuando el costo vuelve a subir, ese precio "bajo" ya es lo que el cliente espera. La ventaja competitiva se perdió
- Cuando se va la luz, toda la empresa se paraliza. Ha pedido servidor separado para bodega

**Lo que necesita del nuevo sistema:**
1. Importación masiva desde archivos Excel/CSV — subir factura del proveedor, mapear columnas, cargar todas las líneas de una vez
2. Si un producto no existe al importar, ofrecer crearlo en el acto
3. Detección inteligente de duplicados: "¿Es este el mismo que...?" antes de crear uno nuevo
4. Control de acceso REAL — vendedores NUNCA deben ver costos de compra, márgenes, ni proveedores
5. Picking lists de bodega que SOLO muestren: número de pedido, marca del cliente, descripción del producto, y cantidad de cajas. NADA más
6. Lo ÚNICO que pidió conservar de Dynamo: la "lista automática" — un autocompletado que le facilita el ingreso de datos

### Jesús — Compras y Bodega (nuevo)
Entrevistado junto con Celly. Es nuevo en Evolution, viene de otra empresa de Zona Libre (una perfumería). Aporta visión fresca porque conoce cómo operan otras empresas de ZL.

**Lo que aporta:**
- Insiste en costo promedio ponderado automático: cuando entra mercancía nueva a diferente precio, el sistema debe calcular ((Qty_existente × Costo_existente) + (Qty_nueva × Costo_nuevo)) / Qty_total
- Pide comparativo de impacto: si el costo cambia, ver inmediatamente cómo afecta el margen
- Necesita analítica: movimiento de producto por mes, comparación año contra año, productos estancados (regla de Javier: max 4-6 meses), patrones estacionales (Carnaval, fin de año)
- Advierte sobre seguridad cloud — sufrieron hackeo en empresa anterior
- Coincide con Celly: primero el B2B, después el B2C

### Nota sobre la relación con el proveedor tecnológico
Tanto Celly como Jesús enfatizaron fuertemente: necesitan un proveedor PRESENTE y ACCESIBLE. Han tenido experiencias con programadores que venden y desaparecen. Esperan visitas presenciales regulares (mínimo una al mes) y tiempo de respuesta rápido. Esto no es un requerimiento técnico sino de relación comercial, pero es importante para el éxito del proyecto.

---

## 6. EL SISTEMA ACTUAL: DYNAMO POS

### Información técnica
- **Desarrollador:** Dynamo Software Solutions (dynamoss.com, dynamoss@outlook.com, teléfono: 6090-3796)
- **Tipo:** Aplicación de escritorio con interfaz oscura, tablas planas sin interactividad
- **Acceso:** Conexión remota a servidor interno en IP 190.102.57.154, puerto 56000
- **Instancia explorada:** EVOLUTION ZL (BODEGA), usuario JAVIER (administrador con acceso total)
- **Entrada de datos:** Predominantemente manual, producto por producto, con atajos de teclado (F3 eliminar, F5 buscar referencia, F6 crear referencia, Esc guardar)
- **Es una sola persona** detrás del sistema, no una empresa. No es responsivo, no se toma en serio los arreglos, y cada implementación nueva toma mucho tiempo

### Arquitectura: el problema más grave
Dynamo tiene DOS instancias completamente separadas:
- **Dynamo (B2B)** — para la operación mayorista de bodega
- **Dynamo Caja (B2C)** — para la tienda minorista

Ambos venden del MISMO inventario físico, pero cada uno tiene su PROPIA base de datos independiente. Si bodega tiene 100 cajas de Whisky Black & White y el B2B dice que hay 80 mientras el B2C dice 15, la suma es 95 y no 100. ¿Dónde están las otras 5? Nadie sabe. Esto obliga a conciliar manualmente y es fuente constante de errores.

**REGLA PARA LA NUEVA PLATAFORMA:** Una sola base de datos. B2B y B2C comparten el mismo inventario, clientes, contabilidad. Lo que cambia es la interfaz y los permisos, NO los datos.

### Estructura del menú principal de Dynamo
Dynamo tiene 6 módulos en el sidebar izquierdo, con más de 60 submódulos en total. Pero la mayoría son la misma tabla mostrando los mismos datos con un filtro diferente. En lugar de tener un reporte con filtros dinámicos, tienen un submódulo separado para cada variación. Esto infla artificialmente la complejidad.

| # | Módulo | Submódulos | Estado |
|---|--------|------------|--------|
| 1 | Punto de Venta | 13 submódulos | Core (Crear Factura) NO FUNCIONA |
| 2 | Inventario | 10 submódulos | El más denso. Parcialmente explorado |
| 3 | Clientes | 11 submódulos | No explorado aún |
| 4 | Contabilidad | Múltiples | No explorado aún. Se construirá completo en nueva plataforma |
| 5 | Configuración | 2 submódulos | No explorado aún |
| 6 | Ventas | Pipeline completo | No explorado aún — EL MÁS CRÍTICO |

### Lo que los empleados dicen del sistema
Durante las entrevistas, NINGÚN empleado pudo mencionar algo positivo de Dynamo. El sistema está allí porque no tienen alternativa. La única excepción: Celly pidió que no se quite la "lista automática" (autocompletado que facilita ingreso de datos).

Quejas principales: interfaz confusa y anticuada, módulos importantes que no funcionan, todo se ingresa manualmente, reportes que no ayudan, no hay estadísticas, el sistema se paraliza cuando se va la luz, costos y márgenes visibles para todos sin control de acceso.

### Datos del módulo de Inventario (explorado directamente)
El módulo de Inventario tiene 10 submódulos:

| # | Submódulo | Tiene sub-menú | Explorado | Notas |
|---|-----------|----------------|-----------|-------|
| 1 | Consulta de Producto | No | ✓ Completo | 3 pestañas: Generales, Movimiento Histórico, Lista |
| 2 | Administración de Productos | No | ✓ Completo | Ficha de producto con todos los campos |
| 3 | Registro de Compras | Sí (4 opciones) | ✓ Parcial | Orden + Factura explorados. Costos por Entrada pendiente |
| 4 | Ajustes de Inventario | No | Pendiente | — |
| 5 | Transferencia de Mercancía | No | Pendiente | Flujo B2B→B2C con costo inflado |
| 6 | Administración de Archivos | Sí | Pendiente | Posible importación masiva |
| 7 | Reportes de Inventario | Sí | Pendiente | Múltiples variaciones de reportes |
| 8 | Herramientas | Sí | Pendiente | — |
| 9 | Inventario Físico | Sí | Pendiente | Último conteo parece ser de 2015 |
| 10 | Consulta Bajo Existencia Mínima | No | Pendiente | Muestra bajo stock pero sin acción directa |

---

## 7. POR QUÉ DYNAMO DEBE SER REEMPLAZADO POR COMPLETO

Dynamo no es un sistema con algunos problemas puntuales que se pueden parchar. Es un sistema entero que falló — en diseño, en mantenimiento, en evolución. Los problemas que listamos abajo son solo los que hemos identificado hasta ahora a través de entrevistas y exploración directa, pero representan una fracción de lo que seguramente existe. Cada módulo que exploremos va a revelar más fallas. La decisión no es "qué arreglamos de Dynamo" sino "cómo construimos su reemplazo completo".

El sistema completo debe ser reemplazado y readaptado con tecnología moderna. Lo que Dynamo hace bien (los flujos de trabajo que los empleados ya conocen) se replica. Lo que hace mal se corrige. Lo que no hace se agrega.

### Problemas identificados hasta el momento

Estos son los que hemos documentado. La lista va a crecer conforme exploremos más módulos.

| # | Problema | Por qué es un problema | Fuente |
|---|----------|------------------------|--------|
| 1 | Crear Factura no funciona | Módulo core del POS roto en AMBOS sistemas (B2B y B2C). Error: "terminal no registrada" | Análisis |
| 2 | Disponibilidad negativa permitida | Se encontró producto con existencia 5, separadas 25, disponible -20. Evolution promete mercancía que no tiene | Análisis |
| 3 | DMC completamente manual | 15-20 minutos por documento, duplicando datos que ya existen en el sistema | Ariel |
| 4 | Modificaciones post-aprobación destruyen todo | Cualquier cambio obliga a desaprobar → eliminar → reconstruir desde cero | Ariel |
| 5 | Costos visibles para todos | Vendedores ven costos y bajan precios, destruyendo márgenes negociados | Celly/Jesús |
| 6 | Dos bases de datos B2B/B2C separadas | Inventario desincronizado permanentemente, conciliación manual | Análisis |
| 7 | Carga manual producto por producto | Horas en ingreso de compras, errores humanos frecuentes | Celly |
| 8 | Consulta de Entradas crasheado | No se puede consultar historial de mercancía recibida | Análisis |
| 9 | Ajustes de inventario sin aprobación | Stock modificable por cualquiera sin supervisión ni trazabilidad | Análisis |
| 10 | Sin alertas automáticas de ningún tipo | Stock bajo, morosidad, etc. se detectan tarde o nunca | Análisis |
| 11 | No se ve último precio vendido | Vendedores dan precios inconsistentes, clientes se quejan | Margarita |
| 12 | Lista de empaque no agrupada por arancelaria | Ariel tiene que reordenar manualmente para poder hacer el DMC | Ariel |
| 13 | Sin métricas ni estadísticas | Imposible tomar decisiones basadas en datos | Jesús |
| 14 | Servidor local = punto único de falla | Se va la luz, toda la empresa se paraliza, incluso bodega que tiene electricidad propia | Celly/Jesús |
| 15 | Sin costo promedio ponderado | Costeo incorrecto cuando cambian precios entre lotes | Jesús |
| 16 | Cotizaciones sin imágenes | Clientes no pueden ver los productos que les ofrecen | Margarita |
| 17 | Datos maestros sucios y duplicados | Campo Marca contaminado, productos duplicados, placeholders nunca configurados | Celly |
| 18 | 60+ submódulos redundantes | Misma información repetida en múltiples pantallas separadas | Análisis |
| 19 | Herramienta de Excel rota | El botón de importar desde Excel existe pero da error "Excel no está instalado" | Exploración directa |

Esta lista es parcial. Todavía no hemos explorado los módulos de Ventas, Clientes, Contabilidad, Configuración, ni la mayoría de los submódulos de Inventario. Es seguro que encontraremos más problemas conforme avancemos.

---

## 8. LAS REGLAS DE NEGOCIO QUE EL SISTEMA DEBE RESPETAR

Estas no son sugerencias. Son reglas operativas de Evolution. Si el sistema no las implementa correctamente, la operación no funciona.

### Regla 1: Una sola base de datos
B2B y B2C comparten el mismo inventario, clientes, contabilidad. Lo que cambia es la interfaz y los permisos, no los datos. El sistema debe manejar la conversión de unidades (caja ↔ botella) automáticamente.

### Regla 2: Disponibilidad nunca negativa
Fórmula: DISPONIBLE = EXISTENCIA + POR LLEGAR − SEPARADAS. Si cualquier operación dejaría el disponible por debajo de cero, el sistema BLOQUEA la operación. Excepción única: un supervisor puede aprobar con registro obligatorio del motivo.

### Regla 3: Descripción es el identificador primario
Evolution NO trabaja por código de barras ni por referencia interna. Trabaja por DESCRIPCIÓN. Los códigos de barras existen (hasta 5 por producto) pero son backup. La "referencia" es el SKU del proveedor, sin significado operativo para Evolution. La búsqueda diaria SIEMPRE es por nombre/descripción, que incluye: marca, tipo de licor, tamaño (200ml, 375ml, 700ml, 750ml), si tiene estuche, regulador, corcho, si es rellenable. Un error aquí es crítico.

### Regla 4: 5 niveles de precio (uso interno) + indicador de comisión (lo que ve el vendedor)
Internamente, el sistema mantiene 5 niveles: A = más caro → E = más barato. Cada cliente tiene un nivel asignado. Los precios se recalculan automáticamente cuando cambia el costo base. Existen excepciones controladas: precios especiales por negociación, por país/destino, por volumen. Estas requieren aprobación gerencial.

**Pero los vendedores NO ven los niveles.** Lo que ellos ven es el indicador de comisión: 🟢 arriba del 10% o 🔴 abajo del 10%. Los niveles son herramienta de gerencia y compras, no del vendedor. Ver Regla 15 para detalle completo.

### Regla 5: Costos OCULTOS para vendedores — Fuga de datos es el problema #1 de Javier
Este es uno de los problemas más graves que Javier identificó personalmente. En Dynamo, los datos se fugan a departamentos que no deberían tenerlos. Los vendedores ven costos de compra, proveedores, y márgenes. Esto les permite manipular los precios — bajan el precio al mínimo donde todavía ganan su comisión, pero destruyen el margen que Compras negoció.

El sistema actual de 5 niveles de precio (A-E) empeora el problema: los vendedores pueden ver todos los niveles y reverse-engineer el costo. Además hay secciones donde el costo aparece literalmente en pantalla.

**Regla estricta para la nueva plataforma:**
- Los vendedores NUNCA ven: costos de compra, proveedores, márgenes exactos, porcentajes de ganancia
- Los de tráfico NUNCA ven: costos, proveedores, márgenes
- Los de bodega NUNCA ven: costos, proveedores, márgenes, precios de venta
- SOLO ven costos: Javier (dueño), Estelia (gerencia), Jackie (contabilidad), Celly (compras) — personas que NECESITAN el dato para hacer su trabajo
- Los picking lists de bodega SOLO muestran: número de pedido, marca del cliente, descripción del producto, y cantidad de cajas. NADA más

### Regla 15: Sistema de comisiones por margen — Indicador arriba/abajo del 10%
Esta regla viene directamente de Javier y es fundamental para el módulo de ventas.

**Cómo funciona:**
- Cada producto tiene un costo real (que el vendedor NO ve)
- Existe un umbral de comisión: **10% de margen**
- Si el vendedor vende un producto a un precio que genera MÁS del 10% de margen → **SÍ cobra comisión** sobre esa venta
- Si el vendedor vende un producto a un precio que genera MENOS del 10% de margen → **NO cobra comisión** sobre esa venta

**Lo que el vendedor VE al crear una cotización:**
- El precio que está poniendo
- Un indicador simple tipo semáforo: 🟢 "Comisiona" o 🔴 "No comisiona"
- NADA MÁS. No ve el porcentaje exacto de margen. No ve cuánto falta para llegar al 10%. No ve el costo

**Lo que el vendedor NO VE:**
- El costo del producto
- El margen exacto (no sabe si está en 11% o en 40%)
- El proveedor
- Los otros niveles de precio

**El efecto deseado por Javier:**
Los vendedores se motivan a vender al precio más alto posible porque saben que mientras más alto, más seguro es que comisionan. Pero no pueden calcular el punto exacto del 10% para bajar el precio justo ahí. Esto protege los márgenes del negocio.

**Casos especiales:**
- Hay productos muy comerciales (sodas, bebidas energizantes, productos competitivos) donde el margen natural es menor al 10%. Estos productos se venden igual porque el negocio los necesita en su catálogo, pero el vendedor no comisiona sobre ellos. El indicador le muestra 🔴 y el vendedor sabe que es un producto de acompañamiento, no de ganancia.
- El vendedor debe poder ver el indicador en TIEMPO REAL mientras arma la cotización — no después de enviarla. Así puede ajustar precios antes de presentarle al cliente.

**Implicación para el diseño del módulo de ventas:**
El motor de precios NO debe mostrar los 5 niveles (A-E) al vendedor. El vendedor pone un precio, y el sistema le dice en tiempo real si comisiona o no. El sistema internamente calcula contra el costo real, pero el vendedor solo ve el resultado binario: arriba o abajo.

### Regla 16: Los vendedores venden — no investigan
Principio general de Javier: los vendedores deben dedicarse a vender, no a estar investigando proveedores, costos, o márgenes. El sistema nuevo debe darles exactamente la información que necesitan para vender (catálogo, disponibilidad, indicador de comisión, historial de precios al cliente) y NADA más. Cualquier dato adicional es una fuga que perjudica al negocio.

### Regla 6: Ajustes de inventario con aprobación obligatoria
Todo ajuste manual de stock (suma o resta) requiere aprobación de supervisor + motivo predefinido (merma, rotura, robo, error de conteo, vencimiento, otro). Actualmente en Dynamo cualquiera puede ajustar sin supervisión — riesgo grave.

### Regla 7: Costo promedio ponderado
Cuando entra mercancía nueva a un precio diferente al existente: ((Qty_existente × Costo_existente) + (Qty_nueva × Costo_nuevo)) / Qty_total. Esto debe calcularse automáticamente al confirmar recepción de mercancía.

### Regla 8: Arancel obligatorio
Ningún producto puede existir en el sistema sin código arancelario. Es requisito legal de Zona Libre para que el producto pueda moverse. El sistema debe bloquearlo si se intenta guardar sin arancel.

### Regla 9: Transferencia B2B→B2C con costo inflado
Cuando bodega transfiere producto a la tienda B2C, el costo de transferencia es MAYOR al costo real. Esto genera un "margen interno" donde el negocio mayorista le "vende" al negocio minorista con ganancia. No es el costo real — es un costo artificial más alto.

### Regla 10: Conversión automática caja ↔ botella
B2B vende por CAJA. B2C vende por UNIDAD (botella). El sistema convierte automáticamente: 1 caja de 6 botellas en B2B = 6 unidades en B2C. Usa el campo "Qty × Bulto" del producto para la conversión.

### Regla 11: Flujo de ventas B2B secuencial
6 etapas que deben completarse en orden:
1. Cotización — vendedor crea con productos, cantidades y precios según nivel del cliente
2. Aprobación de cotización — supervisor revisa y aprueba antes de enviar al cliente
3. Pedido — cliente acepta → se convierte en pedido. Inventario se marca como "Separado"
4. Aprobación de pedido — se valida disponibilidad real, crédito del cliente, condiciones comerciales
5. Lista de empaque — bodega recibe lista agrupada por categoría arancelaria, SIN costos ni precios
6. Factura — factura formal. Después, tráfico genera DMC y BL

### Regla 12: Enmienda post-aprobación
En vez de destruir → reconstruir, el sistema debe permitir "enmiendas" que registren qué cambió y quién autorizó. Cambios menores (cantidad, agregar línea) con aprobación rápida del supervisor. Cambios mayores (precio, eliminar productos significativos) con re-aprobación completa.

### Regla 13: Productos estancados
Regla de Javier: ningún producto más de 4-6 meses en bodega. El sistema debe identificar productos estancados automáticamente y generar alertas.

### Regla 14: Doble verificación en transferencias
La persona que crea una transferencia entre bodegas NO puede ser la misma que la confirma en destino. Buena práctica que ya existe en Dynamo y se debe mantener.

---

## 9. LA ESTRUCTURA DE COSTOS DE IMPORTACIÓN (FOB → CIF)

| Concepto | Qué es | Ejemplo |
|----------|--------|---------|
| Costo FOB (Free On Board) | Precio del producto en el puerto de origen, ANTES de flete y seguro | $50.00 |
| Gastos de internación | Flete marítimo + seguro + aranceles (mínimos en ZL) + handling + almacenamiento | $22.00 |
| Costo CIF (Cost, Insurance, Freight) | Costo total "aterrizado" en bodega. Es la BASE REAL para calcular márgenes y precios | $72.00 |
| Costo promedio ponderado | Al entrar mercancía nueva: ((Qty_existente × Costo_existente) + (Qty_nueva × Costo_nuevo)) / Qty_total | Variable |

**PREGUNTA PENDIENTE CRÍTICA:** No sabemos exactamente dónde ni cómo Evolution registra los gastos de internación para calcular el CIF en Dynamo. Los campos de IMPUESTOS y GASTOS en la orden de compra OC-03566 que exploramos estaban vacíos. Existe un submódulo "Consulta de Costos por Entrada" que podría contener esta información pero no se pudo acceder porque el dueño estaba usando la cuenta.

---

## 10. LOS 5 NIVELES DE PRECIO — SISTEMA ACTUAL Y SU PROBLEMA

El sistema actual de Dynamo maneja 5 niveles de precio por producto:

| Nivel | Tipo de cliente | Ejemplo (Black & White 24×375ml) |
|-------|----------------|----------------------------------|
| A | Más caro — clientes nuevos, bajo volumen | $111.00 |
| B | Clientes regulares | $106.00 |
| C | Clientes frecuentes | $102.00 |
| D | Alto volumen | $97.00 |
| E | Más barato — VIP, máximo volumen | $97.00 |

**Nota:** En el producto explorado (Jack Daniels Mini), los niveles D y E son idénticos ($97). Esto podría significar que en la práctica solo usan 4 niveles. Pendiente de confirmar con Javier.

**El problema fundamental con este sistema:** Los 5 niveles son visibles para los vendedores. Conociendo el precio más bajo (E) y el más alto (A), un vendedor con sentido común puede estimar el costo y el margen. Esto anula el propósito de ocultar costos.

**Cómo debe funcionar en la nueva plataforma:**
Los niveles de precio pueden seguir existiendo internamente como referencia para gerencia y compras, pero los vendedores NO deben ver la tabla de niveles. En su lugar, el vendedor pone un precio y el sistema le muestra únicamente si ese precio está por encima o por debajo del umbral de comisión del 10% de margen (ver Regla 15). Gerencia define rangos de precio sugeridos por producto, pero el vendedor no puede reverse-engineer el costo desde esos rangos.

---

## 11. LA DOCUMENTACIÓN DE TRÁFICO DE ZONA LIBRE

| Documento | Cuándo se necesita | Qué incluye |
|-----------|-------------------|-------------|
| DMC de Salida | Toda venta que sale de ZL | Productos por código arancelario, cantidades, pesos, embarcador, consignatario, booking, barco |
| DMC de Entrada | Toda compra de proveedor internacional | Productos, cantidades, códigos arancelarios, proveedor, datos del embarque |
| DMC de Traspaso | Movimiento entre empresas dentro de ZL (Evolution ↔ Mainz/Malta/Milano) | Similar a salida pero entre empresas relacionadas |
| Bill of Lading (BL) | Todo embarque marítimo | Booking, datos del barco, consignatario, embarcador, peso/volumen |
| Certificado de Libre Venta | Envíos a destinos que lo requieren (ej: San Andrés, Colombia) | Información de mercancía para inspección del Ministerio de Salud |

**Estado actual:** TODO manual. Ariel toma datos de Dynamo, los copia a Excel, reformatea, completa campos a mano. 15-20 minutos por DMC.

**En la nueva plataforma:** Módulo de Tráfico y Documentación que NO existe en Dynamo. Se genera automáticamente desde la factura + lista de empaque.

---

## 12. LA CONVERSIÓN DE UNIDADES B2B ↔ B2C

- B2B vende por CAJA. B2C vende por UNIDAD (botella)
- 1 caja de N botellas en B2B = N unidades en B2C
- N viene del campo "Qty × Bulto" de la ficha del producto
- Al transferir de B2B a B2C, el sistema convierte automáticamente
- El costo de transferencia es INFLADO (mayor al real) para generar margen interno
- Todo opera sobre UNA SOLA base de datos — la conversión es de visualización y operación, no de datos separados

---

## 13. LA MATRIZ DE ROLES Y PERMISOS

### Visibilidad de información comercial

| Rol | Ve costos | Ve proveedores | Ve márgenes | Ve precios venta | Ve stock |
|-----|-----------|---------------|-------------|-------------------|----------|
| Javier (dueño) / Estelia (gerencia) | ✓ Todo | ✓ Todo | ✓ Todo | ✓ Todo | ✓ Todo |
| Jackie (contabilidad) | ✓ Todo | ✓ Todo | ✓ Todo | ✓ Todo | ✓ Todo |
| Celly (compras/bodega) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Vendedores (Margarita/Arnold) | ✗ NUNCA | ✗ NUNCA | ✗ NUNCA — Solo indicador arriba/abajo 10% (comisiona sí/no) | Solo el precio que ellos ponen, NO los 5 niveles | ✓ Disponible solamente |
| Bodega (operarios) | ✗ NUNCA | ✗ NUNCA | ✗ NUNCA | ✗ NUNCA — Solo descripción + cantidad | Solo descripción + cantidad |
| Tráfico (Ariel/María) | ✗ NUNCA | ✗ NUNCA | ✗ NUNCA | Solo lo necesario para documentos | ✓ Para documentación |

### Permisos operativos

| Acción | Quién puede | Requiere aprobación |
|--------|-------------|---------------------|
| Crear/editar producto | Compras (Celly) | No |
| Crear orden de compra | Compras | No |
| Recibir mercancía (convertir orden→factura) | Compras / Bodega | No |
| Ajustar inventario manualmente | Bodega | SÍ — Supervisor obligatorio |
| Transferir mercancía entre bodegas | Bodega | Confirmación en destino (persona diferente) |
| Crear cotización | Vendedores | No |
| Aprobar cotización | Supervisor / Gerencia | — |
| Crear pedido (desde cotización aprobada) | Vendedores | No |
| Aprobar pedido | Supervisor / Gerencia | — |
| Generar lista de empaque | Sistema (auto) o Vendedor | No |
| Generar factura | Vendedor o Administración | Pedido debe estar aprobado |
| Modificar pedido post-aprobación (menor) | Vendedor o Tráfico | Aprobación rápida de supervisor |
| Modificar pedido post-aprobación (mayor) | Vendedor | Re-aprobación completa |
| Anular transacción/factura | Administración | SÍ — Gerencia obligatorio |
| Cambiar costos de producto | Compras (Celly) | No, pero deja registro auditado |
| Cambiar precios de venta | Compras o Gerencia | SÍ — Gerencia para excepciones |
| Crear/editar cliente | Ventas o Administración | No para contado, SÍ para crédito |
| Ver reportes financieros | Gerencia + Contabilidad | — |

### Documento de picking para bodega
SOLO muestra: número de pedido, marca del cliente, descripción del producto, y cantidad de cajas. NADA más. Sin costos, sin precios, sin proveedor, sin márgenes. Esto es una regla explícita.

---

## 14. LOS MÓDULOS QUE VAMOS A CONSTRUIR

La nueva plataforma consolida los 60+ submódulos de Dynamo en módulos limpios. Lo que hoy son submódulos separados para cada variación de reporte se convierte en filtros dentro de una misma vista. La funcionalidad NO se pierde — se reorganiza.

| Módulo Nuevo | Reemplaza en Dynamo | Funcionalidad clave |
|-------------|---------------------|---------------------|
| Catálogo de Productos | Consulta + Admin de Productos | Ficha completa, búsqueda inteligente, importación masiva, precios multinivel, repositorio de imágenes |
| Compras e Importación | Registro de Compras + Costos | Órdenes masivas desde archivo, recepción parcial, cálculo FOB→CIF, costo promedio ponderado |
| Control de Inventario | Ajustes + Transferencias + Conteo + Stock Mín. | Stock tiempo real unificado, bloqueo disponibilidad negativa, alertas, ajustes con aprobación, conversión caja↔botella |
| Ventas B2B | Módulo de Ventas completo | Pipeline 6 etapas con 2 aprobaciones, último precio vendido, motor de precios con indicador de comisión (arriba/abajo 10% margen), enmiendas post-aprobación. Vendedores NO ven costos ni niveles — solo indicador binario comisiona/no comisiona |
| Punto de Venta B2C | Crear Factura (hoy roto) | Caja simplificada, misma base de inventario, conversión de unidades automática |
| Tráfico y Documentación | DMC + procesos manuales (NUEVO) | DMC/BL/certificados pre-llenados, lista empaque por arancelaria, preparación anticipada |
| Clientes y Cobranza | Módulo de Clientes completo | CRM con historial, niveles de precio, crédito, alertas de morosidad, bloqueo automático |
| Reportes y Analítica | Todos los reportes de todos los módulos | Centro único con filtros dinámicos, dashboards, métricas, exportación Excel/PDF |
| Contabilidad | Módulo de Contabilidad | Módulo contable completo: libro mayor, plan de cuentas, estados financieros, conciliación bancaria. Todo en un solo lugar |
| Configuración | Configuración + Herramientas | Usuarios, roles, permisos, flujos de aprobación, catálogos maestros, bodegas, notificaciones |

### Principios de diseño de consolidación:
- **Una sola base de datos:** B2B y B2C comparten la misma fuente de verdad
- **Roles y permisos reales:** Cada usuario ve solo lo que necesita
- **Acciones, no solo consultas:** Cada vista que muestra un problema permite tomar acción directa
- **Carga masiva como estándar:** Todo lo que hoy se ingresa uno por uno debe poder cargarse masivamente

---

## 15. EL PLAN DE IMPLEMENTACIÓN

### Fase 1 — Núcleo B2B (prioridad máxima)
La prioridad es todo lo que necesita el negocio B2B para operar, donde se genera el ingreso real.

| Módulo | Alcance | Por qué es prioridad |
|--------|---------|---------------------|
| Catálogo de Productos | Ficha completa, búsqueda, importación masiva, precios multinivel | Todo depende de un catálogo confiable |
| Compras e Importación | Órdenes con carga masiva, recepción, costeo FOB/CIF, costo promedio | Elimina el dolor #1: la carga manual |
| Control de Inventario | Stock tiempo real, alertas, ajustes con aprobación, bloqueo disp. negativa | Si el inventario no es confiable, nada funciona |
| Ventas B2B | Pipeline completo con ambas aprobaciones, último precio, enmiendas | Donde Evolution genera su ingreso |
| Tráfico y Documentación | DMC pre-llenado, lista empaque por arancelaria, BL básico | Sin documentación, la mercancía no sale de ZL |
| Clientes (básico) | Ficha, nivel de precio, condiciones, crédito básico | Sin clientes configurados, Ventas no opera |
| Configuración | Usuarios, roles, permisos, bodegas | Base de control para todo lo anterior |

**Principio:** Hasta que no se consoliden compras e inventario confiable, no tiene sentido construir B2C. Y hasta que no funcione ventas B2B completo, no tiene sentido tráfico.

### Fase 2 — Completar operación (después de estabilizar B2B)
- Cuentas por cobrar completa (morosidad, alertas, bloqueo automático)
- Punto de Venta B2C (caja simplificada conectada al mismo inventario)
- Contabilidad completa (libro mayor, estados financieros, conciliación — todo centralizado en la nueva plataforma)
- Reportes y Analítica (dashboards, métricas, productos estancados)
- Tráfico avanzado (certificados sanitarios, BL completo, preparación anticipada)

### Fase 3 — Inteligencia artificial (posterior)
La IA necesita datos limpios y procesos estables. Primero la base, después la inteligencia. Oportunidades identificadas: reabastecimiento inteligente, cotizaciones asistidas, predicción de morosidad, consultas en lenguaje natural, copiloto operativo, optimización de precios.

---

## 16. LAS PREGUNTAS SIN RESOLVER

| # | Pregunta | Por qué importa | Dónde buscar |
|---|----------|-----------------|--------------|
| 1 | ¿Qué software contable usa Jackie actualmente? | Entender qué datos y flujos hay que migrar a la nueva plataforma (contabilidad completa se construye sí o sí) | Preguntar a Jackie |
| 2 | ¿Dónde se registran gastos de internación para calcular CIF? | Define flujo de costeo | Explorar "Consulta de Costos por Entrada" en Dynamo |
| 3 | ¿Qué significa "Rata %" (AA.OG, AA.MI, GU.OE) en movimiento histórico? | Entender el costeo por lote | Preguntar a Celly |
| 4 | ¿Por qué niveles D y E son idénticos ($97)? | Define si realmente usan 5 niveles o 4 | Preguntar a Javier |
| 5 | ¿Cuántos productos activos vs. fantasma? | Define limpieza necesaria pre-migración | Filtrar en Dynamo |
| 6 | ¿Venden regularmente productos no alcohólicos? | Define categorías y alcance del catálogo | Preguntar a Javier |
| 7 | ¿Fórmula exacta de distribución de gastos FOB→CIF? | Implementar costeo correcto | Preguntar a Celly/Jackie |
| 8 | ¿Mainz, Malta, Milano son subsidiarias, relacionadas, o clientes? | Define traspasos DMC como internos o externos | Preguntar a Javier |
| 9 | ¿Flujos de aprobación reales (quién aprueba qué en la práctica)? | Define permisos y flujos del sistema | Preguntar a Javier |
| 10 | ¿Cuántas bodegas tienen configuradas? | Define configuración inicial de inventario | Explorar Configuración en Dynamo |
| 11 | ¿Cuáles son los destinos que requieren Certificado de Libre Venta? | Define lógica de documentación por destino | Preguntar a Ariel |
| 12 | ¿Cuál es la estructura real de bodegas y zonas de almacenamiento? | Define configuración de inventario | Explorar Dynamo + visita física |
| 13 | ¿Qué reportes usa la gerencia para tomar decisiones hoy? | Define qué construir primero en reportes | Preguntar a Javier/Estelia |
| 14 | ¿Hay entrevistas adicionales pendientes con otros departamentos? | Podría revelar requerimientos no documentados | Coordinar con Javier |

---

## 17. PRINCIPIOS DE DISEÑO DE LA NUEVA PLATAFORMA

### Estilo visual
- **Referencia:** Shopify Admin — limpio, minimalista, profesional
- Sidebar con navegación entre módulos
- Tarjetas de estadísticas (stat cards) en cada módulo con contadores relevantes
- Tablas con búsqueda, filtros dinámicos, y paginación
- Badges de color para estados (verde=ok, amarillo=advertencia, rojo=error)
- Formularios con dropdowns, búsqueda inteligente, y validación visual
- Paleta: azules profesionales, grises neutros, verde para éxito, amarillo para advertencia, rojo para error

### Patrón de cada módulo
```
Cada módulo tiene:
├── Lista principal (tabla con búsqueda + filtros)
│   ├── Stat cards arriba (contadores relevantes)
│   ├── Barra de búsqueda + filtros tipo badge
│   ├── Tabla con columnas relevantes
│   ├── Click en fila → abre detalle
│   └── Botón "+ Nuevo [elemento]"
├── Vista de detalle
│   ├── Header con info principal + badges de status
│   ├── Tabs para diferentes secciones
│   ├── Botones de acción contextuales
│   └── Breadcrumb o botón "Volver"
└── Formularios de creación/edición
    ├── Layout de 2 columnas para formularios grandes
    ├── Dropdowns con opción [+] crear nuevo inline
    ├── Validación visual en tiempo real
    └── Botones Guardar / Cancelar
```

### Principio de consolidación
Los 60+ submódulos de Dynamo se consolidan. Lo que hoy son submódulos separados para cada variación de reporte se convierte en filtros dentro de una misma vista. Misma lógica de negocio, menos pantallas, más filtros. La funcionalidad NO se pierde — se reorganiza.

### Optimizado para desktop
Evolution trabaja en computadoras de escritorio en su oficina. La plataforma debe estar optimizada para pantallas grandes. Responsive es bueno tenerlo pero NO es prioridad — desktop first.

---

## 18. LO QUE DESCUBRIMOS EXPLORANDO DYNAMO DIRECTAMENTE

Estas son las observaciones y hallazgos de la exploración directa de Dynamo con capturas de pantalla, organizados por área.

### Ficha de producto (Administración de Productos)
Producto analizado: WHISKY JACK DANIELS N°7 BLACK MINI 120X50ML 40%V (Ref: 01-00296)

**Campos confirmados con valores reales:**
- Referencia: 01-00296 (formato inconsistente en el catálogo — algunos son códigos largos, otros 01-XXXXX)
- Descripción: WHISKY JACK DANIELS N°7 BLACK MINI 120X50ML 40%V (campo más largo e importante)
- Grupo: WHISKY / Sub-Grupo: WHISKY
- Marca: BLACK & WHITE ← ERROR: debería decir JACK DANIELS. Datos contaminados
- País Origen: "PAIS ORIGEN (Renombrar)" ← PLACEHOLDER nunca configurado
- Composición: "COMPOSICION (Renombrar)" ← PLACEHOLDER nunca configurado
- Proveedor: GLOBAL BRANDS, S.A.
- Ref. Showroom: 764009031846
- Código Barra: 10764009031560 (soporta múltiples con botón +)
- Arancel: 2208309000
- Unidad: CJA, Factor: 1
- Qty × Bulto: 24, Qty × Paleta: 60
- Dimensiones: 8.00 × 11.00 × 15.00 cm → M³: 0.02163, Ft³: 0.76388 (auto-calculados)
- Kilos × Bulto: 17.300
- Qty Mínima: 20.00
- Detallada/Inglés/Portugués: todos VACÍOS (nadie los llena)
- Precios: A=111, B=106, C=102, D=97, E=97
- Imagen: cargada manualmente desde Google. Botón literal: "Buscar Imagen en Google"
- Costo: muestra código "AA.MI" (significado pendiente)
- Status: Activo (pero algunos productos usan la palabra "INACTIVO" en la descripción como parche)

### Lista de productos
- Columnas: Referencia, Descripción, Código Barra, Existencia, Por Llegar, Separado, Disponible, Precio A, Cantidad Mínima, Marca
- Gran mayoría de productos con todo en cero — catálogo inflado con productos fantasma
- Productos no alcohólicos confirmados: Pringles (sal y vinagre, ranch, BBQ, wavy), Ciclon Energy Drink
- Campo Marca contaminado sistémicamente: JP CHENET aparece como marca de Pringles y Captain Morgan
- Filtros rápidos disponibles: "Ver Productos con Cantidad Mínima", "Ver Productos Bajo Cantidad Mínima", "Ver Productos DISPONIBLE"

### Movimiento histórico de producto
Ejemplo analizado: BLACK & WHITE 24×375ml. Muestra historial completo:
- Oct 2025: Compra de 220 cajas (OC-03373)
- Oct-Dic 2025: Ventas de 80+120+20 a BRAND DISTRIBUIDOR CURACAO → saldo 0
- Ene 2026: Compra de 129 cajas (OC-03526)
- Ene 2026: Venta inmediata de 129 a BRAND DISTRIBUIDOR CURACAO → saldo 0
- Cliente recurrente identificado: BRAND DISTRIBUIDOR CURACAO (compra todo el lote cada vez)
- Columna "Rata %" muestra AA.OG, AA.MI, GU.OE — código de moneda o costo por lote, pendiente decodificar
- Doble click permite ver factura o gastos de compra asociados

### Registro de Compras
- 4 submódulos: Registro de Ordenes, Consulta de Orden, Consulta de Costos por Entrada, Consulta de Entradas
- Al crear documento nuevo, 3 opciones: Orden (amarilla), Factura, Factura—Cargar Registro de la Orden
- Flujo confirmado de 2 pasos: Orden de Compra → Factura de Compra (cargando desde orden existente)
- Atajos: F3 eliminar líneas, F5 buscar referencia, F6 crear referencia, Esc guardar

### Orden de compra real analizada (OC-03566)
- Proveedor: TRIPLE DOUBLE TRADING LLC
- Factura proveedor: TD002038
- Fecha: 06/02/2026
- Status: Factura (ya recibida — pasó por el flujo completo)
- Total: $214,194.00
- 11 líneas de productos (todos premium):

| Producto | Qty | Costo | Total |
|----------|-----|-------|-------|
| WHISKY JOHNNIE W. RED NR 12X750ML 40%VOL | 100 | $73.00 | $7,300 |
| WHISKY JOHNNIE W. BLACK 12YRS 24X375ML 40%V | 50 | $195.00 | $9,750 |
| WHISKY JOHNNIE WALKER GREEN 6X1000ML | 50 | $175.00 | $8,750 |
| WHISKY GLENFIDDICH 12AÑO CRCH 12X750ML 40% | 25 | $255.00 | $6,375 |
| WHISKY MONKEY SHOULDER 6X700ML 40%VOL | 30 | $88.00 | $2,640 |
| WHISKY JAMESON 1X4500ML 40%VOL W/CRADLE G | 3 | $50.00 | $150 |
| TEQUILA 1800 COCONUT R NK 12X750ML 35%V | 47 | $115.00 | $5,405 |
| TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V | 23 | $528.00 | $12,144 |
| TEQUILA CLASE AZUL REPOSADO GB 6X750ML 40% | 7 | $840.00 | $5,880 |
| WHISKY GLENFIDDICH 15YRS 12X750ML 40%VOL | 25 | $411.00 | $10,275 |

- Campos IMPUESTOS y GASTOS vacíos → pregunta crítica sobre dónde se registra el CIF
- Ícono de Excel en toolbar: EXISTE pero está ROTO — da error "Excel no está instalado"
- Bug visual detectado: tooltip al pasar mouse sobre JW Green muestra descripción de JW Black (referencias cruzadas)

---

## FIN DEL DOCUMENTO 01

Este documento contiene TODO lo que sabemos sobre Evolution hasta este momento. Los siguientes documentos (02, 03, 04...) cubrirán las especificaciones técnicas módulo por módulo con screenshots detallados del sistema actual, campos exactos, flujos de trabajo paso a paso, y wireframes de la nueva plataforma.

Orden de los próximos documentos:
- **Documento 02:** Módulo Catálogo de Productos — campos, pantallas, flujos, wireframes
- **Documento 03:** Módulo Compras e Importación — campos, pantallas, flujos, wireframes
- **Documento 04:** Módulo Control de Inventario — campos, pantallas, flujos, wireframes
- **Documento 05+:** Ventas B2B, Clientes, Tráfico, B2C, Reportes, Configuración

Cada documento se alimentará con screenshots directos de Dynamo conforme se vayan explorando los módulos restantes.
