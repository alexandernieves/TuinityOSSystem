# DOCUMENTO 10 — MÓDULO: PUNTO DE VENTA B2C

## Contexto
Este documento especifica el módulo de Punto de Venta B2C para la nueva plataforma de Evolution Zona Libre. En Dynamo, este módulo existe como una instancia COMPLETAMENTE SEPARADA llamada "Dynamo Caja" con su propia base de datos independiente del B2B — el problema más grave de toda la arquitectura actual. El módulo de Punto de Venta dentro de Dynamo B2B tiene 13 submódulos pero su funcionalidad core (Crear Factura) NO FUNCIONA (error: "terminal no registrada"), y el Cierre de Caja lleva dormido desde 2020.

La tienda B2C está ubicada en la planta baja del edificio de Evolution en la Zona Libre de Colón. Vende botellas individuales al público — consumidores finales, visitantes de la zona, compradores al detal. Es una operación secundaria frente al B2B ($8.7M anuales), pero genera ingresos y sirve como showroom del catálogo de productos.

**El principio fundamental:** B2B y B2C son dos modelos de negocio distintos que operan bajo la misma empresa. Comparten catálogo de productos y la contabilidad GENERAL de Evolution — pero mantienen inventarios completamente separados, operaciones independientes y contabilidad separable. El B2C funciona como una sucursal independiente dentro de la plataforma: tiene su propia bodega (en la parte trasera de la tienda), su propio stock, su propia contabilidad. La mercancía se mueve entre B2B y B2C exclusivamente mediante transferencias explícitas de inventario, como si fueran dos sucursales de la misma empresa. Al final, la contabilidad debe poder verse consolidada (toda Evolution) O separada (solo B2B, solo B2C).

**Prerequisito:** Leer Documentos 01 a 09 y el Documento Maestro antes de este documento. Especialmente la sección 12 (Conversión de unidades B2B ↔ B2C) del Doc 01, la sección de Transferencias del Doc 04, los asientos contables del Doc 07, y la sección de Crear Cliente Contado del Doc 06.

**⚠️ ACTUALIZACIÓN IMPORTANTE sobre la Regla #1 del Doc 01:**
El Doc 01 establecía "Una sola base de datos. B2B y B2C comparten el mismo inventario." Esto se ha **refinado** tras mayor entendimiento de la operación: B2B y B2C comparten la misma PLATAFORMA y el mismo CATÁLOGO de productos, pero manejan **inventarios completamente separados** — como dos sucursales. La tienda tiene su propia bodega (parte trasera del local, planta baja) y el B2B tiene la suya (en otra ubicación). Se comunican exclusivamente mediante transferencias de inventario formales. La contabilidad también es independiente, pero consolidable a nivel empresa. Este documento refleja esa arquitectura refinada.

---

## 1. QUÉ REEMPLAZA ESTE MÓDULO EN DYNAMO

### La realidad: Un sistema separado roto

En Dynamo, el B2C NO es un módulo dentro del sistema — es una instancia COMPLETA separada llamada "Dynamo Caja" con su propia base de datos. El problema no es que estuvieran separados (de hecho, operacionalmente SÍ deben ser inventarios separados), sino que eran DOS SISTEMAS DIFERENTES que no se hablaban entre sí. No había forma de hacer transferencias de inventario coordinadas ni de ver la contabilidad consolidada.

**Dynamo B2B (instancia 1):**
| # | Submódulo del POS | Estado | Destino en EvolutionOS |
|---|-------------------|--------|----------------------|
| 1 | Crear Factura | ❌ NO FUNCIONA — error "terminal no registrada" | → Ventas B2B (facturación) |
| 2 | Gestión de Ventas | Funciona | → Ventas B2B (pipeline) |
| 3 | Consulta de Facturas | Funciona (datos expuestos) | → Ventas B2B + Reportes |
| 4 | Consulta de Artículos Vendidos | Funciona (datos expuestos) | → Reportes |
| 5 | Detalle de Artículos Vendidos | Funciona (datos expuestos) | → Reportes |
| 6 | Consulta de Devoluciones | Funciona (vacío) | → Ventas B2B (devoluciones) |
| 7 | Análisis de Ventas | Funciona | → Reportes |
| 8-13 | Reportes POS (8) + Cobros Tarjetas + Cierre de Caja + Cobros por Caja | Reportes funcionan. **Cobros y Cierre → dormidos desde 2020** | **→ Punto de Venta B2C** |

**Dynamo Caja (instancia 2 — B2C separado):**
- Sistema completamente independiente con su propia base de datos
- No se ha explorado directamente — acceso limitado
- Se sabe que tiene funcionalidad de caja básica (venta por botella)
- Inventario desincronizado con B2B permanentemente

**Total en Dynamo:** 2 sistemas independientes + 13 submódulos dispersos entre ambos

**En la nueva plataforma:** Un módulo dedicado **PUNTO DE VENTA B2C** dentro de la misma plataforma EvolutionOS, con su propio inventario independiente, su propia contabilidad, y su propia operación — pero todo dentro de una sola plataforma que permite transferencias coordinadas y contabilidad consolidable.

---

## 2. EL PRINCIPIO ARQUITECTÓNICO — DOS NEGOCIOS, UNA PLATAFORMA

### 2.1 Lo que comparten B2B y B2C

| Recurso compartido | Cómo se comparte | Notas |
|-------------------|-----------------|-------|
| **Plataforma** | Una sola aplicación (EvolutionOS) | Mismo sistema, módulos diferentes |
| **Catálogo de productos** | Misma ficha de producto | B2B ve en cajas, B2C ve en botellas (conversión automática) |
| **Proveedores** | Mismo catálogo | Las compras entran por B2B, B2C recibe vía transferencia |
| **Infraestructura** | Misma plataforma, mismo login | Un usuario puede tener acceso a ambos módulos si su rol lo permite |
| **Contabilidad general** | Misma contabilidad de Evolution | Vista consolidada muestra toda la empresa |

### 2.2 Lo que NO comparten B2B y B2C

| Separación | B2B | B2C | Por qué |
|-----------|-----|-----|---------|
| **Inventario** | Bodega B2B (su propio stock en cajas) | Bodega Tienda (su propio stock en botellas) | **Son dos inventarios completamente independientes** |
| **Ubicación física** | Bodega en otra ubicación | Bodega trasera de la tienda (planta baja) | Espacios físicos diferentes |
| **Unidad de venta** | Caja (CJA) | Botella/unidad individual | Modelos de venta diferentes |
| **Tipo de cliente** | Internacional (Extranjero) | Local (Consumidor Final) | Mercados diferentes |
| **Pipeline de venta** | 6 etapas con aprobaciones | Venta directa inmediata (caja) | Complejidad vs. velocidad |
| **Documentación aduanal** | DMC, BL, certificados | Ninguna (venta local) | Solo B2B sale de ZL |
| **Impuestos** | 0% (exento en zona franca) | 0% (exento en zona franca — misma ubicación) | Mismo régimen fiscal |
| **Forma de pago típica** | Crédito (30/60/90 días) | Contado (inmediato) | Flujo de caja diferente |
| **Factura** | Factura de Zona Franca | Factura de Zona Franca (mismo régimen) | Mismo tipo fiscal |
| **Cuentas contables** | 4001-001 Ventas B2B | 4001-002 Ventas B2C | Segregación contable |
| **Inventario contable** | 1201-001 Inventario Bodega B2B | 1201-002 Inventario Bodega Tienda | Valoración independiente |
| **Caja** | 1001-003 Caja B2B | 1001-002 Caja B2C | Cajas físicas diferentes |
| **Reportes** | Ventas mayoristas, comisiones, pipelines | Ventas diarias, cierre caja, ticket promedio | Métricas distintas |

### 2.3 Dos inventarios independientes — Cómo funciona

**Concepto clave:** El B2B y el B2C manejan inventarios completamente separados. No comparten stock. Son como dos sucursales de la misma empresa, cada una con su propia bodega, su propio conteo, su propia operación. La mercancía solo se mueve entre ellos mediante una transferencia de inventario explícita.

**¿Por qué separados?** Los vendedores B2B venden en base al inventario que ven en su módulo. Si el B2C se estuviera descontando del mismo inventario en tiempo real, un vendedor podría prometer 50 cajas que "ve disponibles" mientras la tienda está vendiendo botellas de esas mismas cajas. Eso genera exactamente el tipo de desincronización que ya sufren con Dynamo. Inventarios separados = cada quien sabe exactamente con qué cuenta.

```
PROVEEDOR INTERNACIONAL
        │
        ▼
   ┌─────────────┐
   │  RECEPCIÓN   │  ← Compras registra la mercancía (cajas)
   │  (Módulo     │     Todo entra a la Bodega B2B
   │   Compras)   │
   └──────┬──────┘
          │
          ▼
   ┌──────────────┐                              ┌──────────────┐
   │  BODEGA B2B   │    TRANSFERENCIA DE          │ BODEGA TIENDA│
   │  (Su propio   │    INVENTARIO                │ (Su propio   │
   │   inventario  │ ──────────────────────────►  │  inventario  │
   │   en cajas)   │    5 cajas → 60 botellas     │  en botellas)│
   │               │ ◄──────────────────────────  │              │
   │  200 cajas    │    Transferencia inversa      │  120 botellas│
   └──────┬──────┘                              └──────┬──────┘
          │                                            │
          ▼                                            ▼
   ┌──────────────┐                              ┌──────────────┐
   │  VENTA B2B    │                              │  VENTA B2C    │
   │  (Por caja)   │                              │  (Por botella)│
   │               │                              │               │
   │  Descuenta de │                              │  Descuenta de │
   │  Bodega B2B   │                              │  Bodega Tienda│
   └──────────────┘                              └──────────────┘
```

**Lo que ve cada lado:**
- Un vendedor B2B ve: "JW Black Label — 200 cajas disponibles". No le importa ni ve cuántas botellas tiene la tienda.
- Un cajero B2C ve: "JW Black Label — 120 botellas disponibles". No le importa ni ve cuántas cajas hay en bodega B2B.
- Gerencia ve: "JW Black Label — 200 cajas B2B + 120 botellas tienda (= 10 cajas equivalentes) = 210 cajas totales empresa".

**Transferencia de inventario (el único punto de contacto):**
Cuando la tienda necesita reponer stock o cuando el B2B necesita mercancía que está en la tienda, se hace una transferencia formal. Esto es como cuando una sucursal le pide mercancía a otra — hay un documento, una conversión de unidades, una confirmación de recepción, y un asiento contable.

**Conversión de unidades al transferir:**
- El campo "Qty × Bulto" de la ficha del producto define cuántas unidades individuales tiene una caja
- Ejemplo: BLACK & WHITE 24×375ML → Qty × Bulto = 24 → 1 caja = 24 botellas
- Ejemplo: JOHNNIE WALKER BLACK 12/1L → Qty × Bulto = 12 → 1 caja = 12 botellas
- Al transferir 5 cajas de JW Black a tienda: sale de Bodega B2B como 5 cajas, entra a Bodega Tienda como 60 botellas

**Flujo bidireccional:**
- **B2B → B2C (el más común):** La Bodega B2B transfiere cajas a la tienda para reponer stock. Es como un proveedor interno — la tienda hace pedidos de reposición al B2B.
- **B2C → B2B (menos común pero necesario):** Si el B2B necesita cubrir un pedido grande y no le alcanza, puede solicitar mercancía de la tienda. Ejemplo: bodega tiene 3 cajas de un producto pero el cliente pidió 5 — se transfieren 24 botellas de la tienda (= 2 cajas) a la Bodega B2B.

### 2.4 La contabilidad separada pero consolidable

**⚠️ PUNTO CRÍTICO ACLARADO POR JAVIER:**

La contabilidad de B2B y B2C debe ser completamente separada. Son dos modelos de negocio distintos bajo la misma empresa. Pero al final, la contabilidad general de Evolution incluye ambos y debe poder verse de tres formas:

```
                    CONTABILIDAD EVOLUTION
                    ┌──────────────────────┐
                    │    CONSOLIDADA        │  ← Vista general de toda la empresa
                    │    (B2B + B2C)        │     Estados financieros totales
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                  ▼
   ┌──────────────────┐              ┌──────────────────┐
   │  CONTABILIDAD    │              │  CONTABILIDAD    │
   │  B2B             │              │  B2C             │
   │                  │              │                  │
   │  Ingresos B2B    │              │  Ingresos B2C    │
   │  Costo ventas B2B│              │  Costo ventas B2C│
   │  CxC clientes    │              │  Caja tienda     │
   │  Inv. Bodega     │              │  Inv. Tienda     │
   └──────────────────┘              └──────────────────┘
```

**Cada operación se contabiliza en sus cuentas específicas:**
- Venta B2B → DB 1101-001 CxC Clientes / CR 4001-001 Ventas B2B
- Venta B2C → DB 1001-002 Caja Ventas B2C / CR 4001-002 Ventas B2C
- Inventario Bodega B2B → 1201-001
- Inventario Bodega Tienda → 1201-002

**Vista consolidada:** Suma de ambas. Los estados financieros de "Evolution Zona Libre S.A." incluyen B2B + B2C.
**Vista separada:** Filtro por centro de costo / unidad de negocio. Jackie puede ver solo B2B, solo B2C, o todo junto. Cada uno con su propio inventario, sus propios ingresos, su propio costo.

### 2.5 Transferencias entre B2B y B2C — Tratamiento contable

Las transferencias de inventario entre B2B y B2C son el equivalente a transferencias entre sucursales. Son operaciones formales que generan documentos, requieren confirmación de recepción, y producen asientos contables en ambos lados.

**⚠️ DISCREPANCIA IDENTIFICADA — REQUIERE CONFIRMACIÓN CON JAVIER:**

La documentación previa (Docs 01, 04, y la Bible doc) indica consistentemente que el costo de transferencia B2B→B2C es **INFLADO** — mayor al costo real — para generar un "margen interno" donde el negocio mayorista le "vende" al negocio minorista con ganancia.

Sin embargo, la indicación más reciente es que el punto de venta **NO se considera un cliente** y las transferencias son **al mismo costo** — es decir, la mercancía se mueve entre sucursales sin markup.

**Las dos posibilidades y sus implicaciones:**

| Aspecto | Opción A: Costo inflado (documentado previamente) | Opción B: Mismo costo (indicación reciente) |
|---------|---------------------------------------------------|---------------------------------------------|
| Precio transferencia | Mayor al costo real | Igual al costo real |
| B2C como entidad | Sucursal que "compra" al B2B con markup | Sucursal que recibe mercancía al mismo costo |
| Margen B2C | Calculado sobre costo inflado (margen visible menor) | Calculado sobre costo real (margen visible es el real) |
| Contabilidad | Genera ingreso interno B2B + costo B2C inflado | Solo movimiento de inventario entre sucursales |
| Utilidad B2C | Menor (su "costo" es mayor) | Mayor (su costo es el real) |
| Utilidad B2B | Mayor (tiene "ingreso" por la transferencia) | No hay utilidad por transferencia |

**PREGUNTAS PARA JAVIER:**
1. ¿La transferencia es al costo real o al costo inflado?
2. Si es al costo inflado: ¿cuál es el factor o markup? ¿Es fijo o variable por producto?
3. ¿El B2C genera un P&L independiente que debe cuadrar por sí solo?

**El sistema debe soportar ambos escenarios** — la configuración define si las transferencias entre sucursales llevan markup o no. Esto se configura en Configuración → Inventario → Transferencias.

**Asiento contable de la transferencia (sin markup):**
```
DB  1201-002  Inventario Bodega Tienda (B2C)     $XXX (al costo)
CR  1201-001  Inventario Bodega B2B              $XXX (al costo)
```

**Asiento contable de la transferencia (con markup):**
```
DB  1201-002  Inventario Bodega Tienda (B2C)     $XXX (al costo inflado)
CR  1201-001  Inventario Bodega B2B              $YYY (al costo real)
CR  4002-001  Ingreso por Transferencia Interna   $ZZZ (la diferencia = markup)
```

---

## 3. LAS PERSONAS DEL PUNTO DE VENTA

### Personal de tienda (por confirmar)
No se entrevistó directamente al personal de la tienda B2C durante la fase de discovery. La información se obtuvo indirectamente a través de las entrevistas con Celly (compras/bodega) y el análisis del sistema.

**Lo que sabemos:**
- La tienda opera en planta baja del edificio de Evolution
- Vende botellas individuales al público
- Los clientes son consumidores finales, visitantes de zona libre, compradores locales
- Las ventas son mayoritariamente de contado (efectivo, tarjeta, transferencia)
- El personal de tienda necesita un sistema de caja rápido y simple

**Lo que NO sabemos (preguntas pendientes):**
| # | Pregunta | Por qué importa |
|---|---------|-----------------|
| 1 | ¿Cuántas personas operan la tienda? | Define cantidad de terminales/cajas |
| 2 | ¿Quién es el encargado de tienda? | Define el rol y permisos principales |
| 3 | ¿Cuál es el horario de operación? | Define turnos y cierres de caja |
| 4 | ¿Aceptan solo efectivo o también tarjeta/transferencia? | Define métodos de pago a configurar |
| 5 | ¿Hay ventas a crédito en tienda o solo contado? | Define si necesita módulo de CxC local |
| 6 | ¿Cuántas ventas hacen por día aproximadamente? | Define escala y rendimiento requerido |
| 7 | ¿Emiten factura fiscal a cada cliente o solo ticket? | Define integración con DGI si aplica | Javier |
| 8 | ¿Hay devoluciones frecuentes en tienda? | Define flujo de devoluciones B2C |
| 9 | ¿Se hacen descuentos o promociones en tienda? | Define motor de precios B2C |
| 10 | ¿Quién decide los precios de venta B2C? | Define quién configura precios al detal |

### Roles que interactúan con el POS B2C

| Rol | Acceso al módulo B2C | Qué hace |
|-----|---------------------|----------|
| Cajero(a) de tienda | ✓ Completo (operativo) | Vende, cobra, abre/cierra caja |
| Encargado de tienda | ✓ Completo (con anulaciones) | Todo lo del cajero + anular ventas + descuentos + reportes |
| Javier / Estelia | ✓ Completo (gerencia) | Todo + configuración de precios + ver utilidades |
| Jackie (contabilidad) | ✓ Solo lectura + cierres | Verifica cierres de caja, concilia, ve reportes |
| Celly (bodega) | ✗ No accede al POS | Pero ve las transferencias B2B→B2C en su módulo |
| Vendedores B2B | ✗ No acceden al POS | Son módulos completamente separados |
| Tráfico | ✗ No accede al POS | El B2C no genera documentación aduanal |

---

## 4. FLUJOS DE TRABAJO DEL PUNTO DE VENTA

### 4.1 Flujo de venta directa (el más común)

```
CLIENTE entra a la tienda (planta baja)
        ↓
CAJERO(A) abre el módulo POS en su terminal
        ↓
Busca producto → Agrega al carrito (por botella/unidad)
        ↓
Sistema muestra: precio unitario, subtotal, total
        ↓
Cliente indica forma de pago: Efectivo / Tarjeta / Transferencia
        ↓
CAJERO(A) cobra → registra pago → Sistema genera ticket/factura
        ↓
Inventario de tienda se descuenta automáticamente
        ↓
Asiento contable automático:
   DB 1001-002 Caja B2C      $XX.XX
   CR 4001-002 Ventas B2C     $XX.XX
   +
   DB 5001-001 Costo de Venta $XX.XX
   CR 1201-002 Inv. Bodega Tienda    $XX.XX
```

**Tiempo estimado por transacción:** 1-3 minutos (venta rápida, sin aprobaciones)

### 4.2 Flujo de apertura y cierre de caja

```
INICIO DEL DÍA:
    CAJERO(A) abre sesión en el sistema
        ↓
    "Abrir Caja" → Registra monto inicial (fondo de caja)
        ↓
    Sistema registra: fecha, hora, cajero, monto inicial
        ↓
    Caja abierta — lista para vender

DURANTE EL DÍA:
    Cada venta se acumula en la caja abierta
    El sistema trackea: ventas, cobros, devoluciones, medios de pago

FIN DEL DÍA / FIN DEL TURNO:
    CAJERO(A) inicia "Cierre de Caja"
        ↓
    Sistema calcula: total teórico (lo que debería haber)
        ↓
    CAJERO(A) cuenta físicamente el efectivo → ingresa monto real
        ↓
    Sistema compara:
        Monto teórico: $1,250.00
        Monto real:    $1,235.00
        Diferencia:    -$15.00 (faltante)
        ↓
    Si hay diferencia → CAJERO(A) registra observación
        ↓
    Cierre guardado → Firma del cajero → disponible para Jackie
        ↓
    Caja cerrada — no se pueden registrar más ventas hasta nueva apertura
```

### 4.3 Flujo de reposición de stock (transferencia B2B → B2C)

```
ENCARGADO DE TIENDA detecta que stock de JW Black está bajo
        ↓
Solicita reposición a Bodega B2B (dentro del sistema o verbal a Celly)
        ↓
CELLY o BODEGA crea transferencia de inventario: Bodega B2B → Bodega Tienda
    → 5 cajas de JW Black Label 12/1L
        ↓
Sistema convierte automáticamente al salir de B2B y entrar a Tienda:
    5 cajas × 12 botellas = 60 botellas
        ↓
ENCARGADO DE TIENDA confirma recepción en su módulo: 60 botellas recibidas ✓
    (Regla: persona que crea ≠ persona que confirma)
        ↓
Cada inventario se actualiza independientemente:
    Inventario Bodega B2B: -5 cajas (su propio stock baja)
    Inventario Bodega Tienda: +60 botellas (su propio stock sube)
        ↓
Asiento contable automático:
    DB 1201-002 Inv. Bodega Tienda (B2C)    [monto según configuración]
    CR 1201-001 Inv. Bodega B2B             [monto según configuración]
```

### 4.4 Flujo de transferencia inversa (B2C → B2B)

```
VENDEDOR B2B necesita 5 cajas de producto X para un pedido
    → Su inventario (Bodega B2B) solo tiene 3 cajas
    → Bodega Tienda tiene 48 botellas (= 4 cajas equivalentes)
        ↓
CELLY crea transferencia inversa: Bodega Tienda → Bodega B2B
    → 24 botellas (= 2 cajas de 12)
        ↓
Sistema convierte: 24 botellas → 2 cajas
        ↓
BODEGA B2B confirma recepción: 2 cajas recibidas ✓
        ↓
Cada inventario se actualiza independientemente:
    Inventario Bodega Tienda: -24 botellas
    Inventario Bodega B2B: +2 cajas
```

### 4.5 Flujo de devolución en tienda

```
CLIENTE regresa con producto y ticket/factura
        ↓
ENCARGADO DE TIENDA verifica:
    → ¿Tiene ticket/factura? ¿Dentro del plazo? ¿Producto en condiciones?
        ↓
Registra devolución en el sistema:
    → Selecciona factura original
    → Selecciona producto(s) a devolver
    → Motivo de devolución
        ↓
Si requiere aprobación (según configuración) → Encargado aprueba
        ↓
Sistema genera nota de crédito o reembolso:
    → Si fue efectivo: devolución en efectivo (se descuenta de caja)
    → Si fue tarjeta: nota de crédito para proceso con banco
        ↓
Inventario: producto devuelto reingresa al stock de Bodega Tienda
        ↓
Asientos contables reversos automáticos
```

---

## 5. ESPECIFICACIÓN DE LA NUEVA PLATAFORMA — MÓDULO PUNTO DE VENTA B2C

### 5.1 Arquitectura del Módulo

```
PUNTO DE VENTA B2C
├── Caja (interfaz principal de venta)
│   ├── Pantalla de venta rápida
│   ├── Búsqueda de producto (por nombre, código, código de barras)
│   ├── Carrito / orden en curso
│   ├── Cobro (múltiples métodos de pago)
│   └── Ticket / factura
│
├── Órdenes
│   ├── Historial de ventas del día
│   ├── Historial completo (con filtros por fecha, cajero, etc.)
│   ├── Detalle de orden
│   ├── Reimprimir ticket/factura
│   └── Devoluciones
│
├── Gestión de Caja
│   ├── Apertura de caja
│   ├── Cierre de caja
│   ├── Movimientos de caja (entradas y salidas de efectivo)
│   ├── Historial de cierres
│   └── Fondo de caja
│
├── Inventario de Tienda (propio)
│   ├── Stock disponible (en botellas/unidades — inventario propio)
│   ├── Productos bajo mínimo
│   ├── Solicitudes de reposición al B2B
│   ├── Conteo físico de tienda
│   └── Historial de transferencias recibidas
│
├── Clientes B2C
│   ├── Registro rápido (consumidor final)
│   ├── Consulta de clientes
│   └── Historial de compras por cliente
│
├── Facturación
│   ├── Factura de Zona Franca (integración DGI si aplica)
│   ├── Notas de crédito
│   └── Historial de facturas emitidas
│
├── Reportes B2C
│   ├── Ventas del día / semana / mes
│   ├── Productos más vendidos
│   ├── Ventas por cajero
│   ├── Ventas por método de pago
│   ├── Ticket promedio
│   └── Margen por producto (solo gerencia)
│
└── Configuración B2C
    ├── Precios de venta al detal
    ├── Terminales/cajas registradas
    ├── Métodos de pago activos
    └── Permisos de descuento
```

### 5.2 Pantalla de Caja — La Interfaz Principal

**Para quién:** Cajero(a) de tienda. Esta es la pantalla donde pasan el 90% de su tiempo.

**Diseño:** Interfaz limpia, rápida, optimizada para velocidad. No es un dashboard con gráficos — es una caja registradora digital. Dos paneles principales: búsqueda/productos a la izquierda, carrito/cobro a la derecha.

```
┌─────────────────────────────────────────────────────────────────────┐
│  PUNTO DE VENTA — Tienda Evolution                    Cajero: Ana  │
│  Caja #1 — Abierta desde 8:00 AM                     [≡ Menú]     │
├──────────────────────────────────┬──────────────────────────────────┤
│                                  │                                  │
│  🔍 Buscar producto...           │  ORDEN ACTUAL              #047 │
│  [___________________________]   │                                  │
│                                  │  ┌────────────────────────────┐  │
│  Categorías rápidas:             │  │ JW Black Label 1L    ×2   │  │
│  [Whisky] [Vodka] [Ron] [Vino]  │  │   $35.00 c/u     $70.00   │  │
│  [Cerveza] [Champaña] [Otros]   │  │                            │  │
│                                  │  │ Absolut Vodka 750ml ×1    │  │
│  ┌──────────┬──────────┐        │  │   $22.50 c/u     $22.50   │  │
│  │ JW Black │ JW Red   │        │  │                            │  │
│  │ Label 1L │ Label 1L │        │  │ Heineken 6-pack    ×1     │  │
│  │ $35.00   │ $18.50   │        │  │   $8.99 c/u      $8.99    │  │
│  ├──────────┼──────────┤        │  └────────────────────────────┘  │
│  │ Absolut  │ Baileys  │        │                                  │
│  │ 750ml    │ 750ml    │        │  Subtotal:            $101.49    │
│  │ $22.50   │ $19.99   │        │  ─────────────────────────────   │
│  ├──────────┼──────────┤        │  TOTAL:              $101.49    │
│  │ 6-pack   │ 750ml    │        │                                  │
│  │ $8.99    │ $12.00   │        │  [Descuento]  [Nota]  [Cliente] │
│  └──────────┴──────────┘        │                                  │
│                                  │  ┌──────────────────────────────┐│
│  Mostrando 6 de 340 productos   │  │        💳 COBRAR             ││
│  [Ver todos →]                   │  │        $101.49               ││
│                                  │  └──────────────────────────────┘│
│                                  │                                  │
│                                  │  [Cancelar orden] [Pausar]       │
│                                  │                                  │
├──────────────────────────────────┴──────────────────────────────────┤
│  F1: Buscar  F2: Cobrar  F3: Desc.  F5: Cliente  F8: Caja  ESC    │
└─────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades de la pantalla de caja:**

**Panel izquierdo — Productos:**
| Función | Descripción | Interacción |
|---------|------------|-------------|
| Búsqueda rápida | Por nombre, código, código de barras | Teclear o escanear |
| Categorías | Grupos rápidos (Whisky, Vodka, Ron, etc.) | Click para filtrar |
| Grid de productos | Cards con imagen thumbnail, nombre, precio | Click para agregar |
| Lista alternativa | Vista de lista (más productos visibles) | Toggle grid/lista |
| Stock visible | Badge indica stock disponible por producto | Visual (no bloquea) |
| Código de barras | Soporte para lector de barras USB | Auto-agrega al escanear |

**Panel derecho — Orden:**
| Función | Descripción | Interacción |
|---------|------------|-------------|
| Líneas de orden | Producto, cantidad, precio unitario, subtotal | Editable (cantidad, eliminar) |
| Subtotal | Suma de todas las líneas | Auto-calculado |
| Total | Igual al subtotal (exento en ZL) | Auto-calculado |
| Descuento | % o monto fijo — requiere permiso | Botón + input |
| Nota | Observación para la orden | Texto libre |
| Cliente | Asignar cliente (opcional, default: Consumidor Final) | Botón + búsqueda |
| Cobrar | Abre modal de cobro | Botón principal |
| Cancelar | Anula la orden en curso | Con confirmación |
| Pausar | Guarda la orden para retomar después | Para atender otro cliente |

**Atajos de teclado (optimizados para velocidad):**
| Tecla | Acción |
|-------|--------|
| F1 | Foco en búsqueda de producto |
| F2 | Cobrar (abre modal de pago) |
| F3 | Aplicar descuento |
| F5 | Asignar/buscar cliente |
| F8 | Menú de gestión de caja |
| ESC | Cancelar acción actual |
| Enter | Confirmar acción |
| +/- | Incrementar/decrementar cantidad |
| Del | Eliminar línea seleccionada |

### 5.3 Modal de Cobro

Al presionar "Cobrar", se abre el modal de cobro:

```
┌───────────────────────────────────────────┐
│           COBRO — Orden #047              │
│                                           │
│    Total a cobrar:    $101.49             │
│                                           │
│    Método de pago:                        │
│    [● Efectivo] [○ Tarjeta] [○ Transfer.] │
│    [○ Mixto]                              │
│                                           │
│    ── EFECTIVO ────────────────────────   │
│    Monto recibido:  [$ 110.00        ]   │
│    Cambio:          $   8.51             │
│                                           │
│    ── DATOS DEL CLIENTE (opcional) ────   │
│    [  Consumidor Final (default)     ▾]  │
│                                           │
│    ┌─────────────────────────────────┐    │
│    │     ✓ CONFIRMAR COBRO           │    │
│    └─────────────────────────────────┘    │
│                                           │
│    [Cancelar]                             │
└───────────────────────────────────────────┘
```

**Métodos de pago:**

| Método | Campos | Notas |
|--------|--------|-------|
| Efectivo | Monto recibido → calcula cambio | El más común en tienda |
| Tarjeta | Tipo (débito/crédito), últimos 4 dígitos, referencia | Para conciliación bancaria |
| Transferencia | Banco, referencia | Verificación visual del comprobante |
| Mixto | Combinación de los anteriores | Ej: parte efectivo, parte tarjeta |

**Pago mixto:**
El cliente puede pagar $50 en efectivo y $51.49 con tarjeta. El sistema permite dividir el cobro entre múltiples métodos:
```
Método 1: Efectivo     $50.00
Método 2: Tarjeta      $51.49
                       ────────
Total cobrado:         $101.49  ✓
```

**Después del cobro:**
1. Se imprime ticket (si hay impresora conectada) o se muestra en pantalla
2. Se genera factura si el cliente la solicita
3. Inventario se descuenta automáticamente
4. Asiento contable se genera automáticamente
5. La caja se actualiza con el monto cobrado
6. Se limpia la pantalla para la siguiente venta

### 5.4 Gestión de Caja — Control de efectivo

**Apertura de caja:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Caja | Dropdown | Caja 1 (puede haber más de una terminal) |
| Cajero | Auto | Usuario logueado |
| Fecha/hora | Auto | Timestamp del sistema |
| Fondo inicial | Moneda | Monto con el que empieza la caja (ej: $100.00) |
| Observación | Texto | Opcional |

**Movimientos de caja (entradas y salidas que no son ventas):**

| Tipo | Ejemplo | Efecto |
|------|---------|--------|
| Entrada | Cambio traído del banco | Suma a caja |
| Salida | Pago de taxi para entrega | Resta de caja |
| Retiro parcial | Retiro de exceso de efectivo por seguridad | Resta de caja |

Cada movimiento registra: tipo, monto, motivo, cajero, fecha/hora, aprobado por (si requiere).

**Cierre de caja:**

```
┌───────────────────────────────────────────────────────┐
│  CIERRE DE CAJA — Caja #1                             │
│  Cajero: Ana       Fecha: 27/02/2026                  │
│  Abierta: 8:00 AM  Cierre: 6:00 PM                   │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ── RESUMEN DE VENTAS ──────────────────────────────  │
│  Ventas totales:              $2,340.00               │
│  Devoluciones:                  -$35.00               │
│  Ventas netas:                $2,305.00               │
│  Descuentos otorgados:          -$45.00               │
│                                                       │
│  ── DESGLOSE POR MÉTODO DE PAGO ────────────────────  │
│  Efectivo:                    $1,450.00               │
│  Tarjeta débito:                $520.00               │
│  Tarjeta crédito:               $285.00               │
│  Transferencia:                  $50.00               │
│                              ──────────               │
│  Total cobrado:              $2,305.00               │
│                                                       │
│  ── ARQUEO DE CAJA (EFECTIVO) ──────────────────────  │
│  Fondo inicial:                $100.00               │
│  + Ventas efectivo:          $1,450.00               │
│  + Entradas de caja:            $50.00               │
│  - Salidas de caja:            -$20.00               │
│  - Devoluciones efectivo:      -$35.00               │
│                              ──────────               │
│  Efectivo teórico:           $1,545.00               │
│                                                       │
│  Conteo real: [$ ___________ ]                        │
│  Diferencia:  $___________                            │
│                                                       │
│  Observaciones: [_________________________________]   │
│                                                       │
│  [Cerrar caja ✓]    [Cancelar]                        │
└───────────────────────────────────────────────────────┘
```

**Después del cierre:**
- La caja queda bloqueada para nuevas ventas
- El cierre queda disponible para revisión de Jackie (contabilidad)
- Si hay faltante/sobrante significativo: alerta a gerencia
- El fondo de caja se registra para la próxima apertura

### 5.5 Órdenes — Historial y Gestión

**Historial de ventas:**

| Columna | Descripción |
|---------|-------------|
| # Orden | Número secuencial |
| Fecha/hora | Timestamp de la venta |
| Cliente | Nombre o "Consumidor Final" |
| Productos | Cantidad de ítems |
| Subtotal | Monto de la venta |
| Total | Monto total |
| Método pago | Efectivo / Tarjeta / Transfer. / Mixto |
| Cajero | Quién procesó la venta |
| Status | Completada / Devuelta / Parcialmente devuelta |
| Factura | Número de factura fiscal si se generó |

**Filtros:**
- Fecha: Hoy / Esta semana / Este mes / Rango personalizado
- Cajero: Todos / [nombre]
- Método de pago: Todos / Efectivo / Tarjeta / etc.
- Status: Todas / Completadas / Con devolución
- Cliente: Todos / [nombre o búsqueda]

**Desde el detalle de una orden:**
- Ver detalle completo (productos, cantidades, precios)
- Reimprimir ticket
- Generar factura (si no se generó en el momento)
- Procesar devolución (parcial o total)

### 5.6 Inventario de Tienda — El inventario propio del B2C

**Este es el inventario propio de la tienda — completamente independiente del inventario del B2B.** La tienda tiene su propia bodega (en la parte trasera del local) donde almacena su mercancía. Lo que ve aquí es exclusivamente lo que la tienda tiene. No es una "vista" del inventario general — es SU inventario.

| Columna | Descripción |
|---------|-------------|
| Producto | Nombre del producto |
| Código | Referencia / código de barras |
| Categoría | Grupo (Whisky, Vodka, etc.) |
| Stock actual | En unidades/botellas (su propio inventario) |
| Stock mínimo | Nivel de reposición (configurable) |
| Status | 🟢 OK / 🟡 Bajo / 🔴 Agotado |
| Precio venta | Precio al detal |
| Última reposición | Fecha de última transferencia recibida desde B2B |

**Funcionalidades:**
- **Alerta de bajo stock:** Cuando un producto cae por debajo del mínimo, aparece badge 🟡 y opcionalmente genera solicitud automática de reposición al B2B
- **Solicitar reposición:** Botón que envía solicitud de transferencia de inventario a Bodega B2B pidiendo cajas de productos específicos
- **Ver historial de transferencias:** Cuándo llegó cada reposición, cuántas unidades, de dónde
- **Conteo físico:** La tienda puede hacer su propio conteo físico independiente del B2B, con ajustes de inventario aprobados por encargado/gerencia

**Lo que NO ve el personal de tienda:**
- ✗ Costos de compra
- ✗ Proveedores
- ✗ Márgenes de utilidad (excepto gerencia)
- ✗ Inventario de Bodega B2B (cada quien ve solo su propio inventario)
- ✗ Órdenes de compra o importaciones

### 5.7 Clientes B2C — Registro Simplificado

**Basado en el submódulo "Crear Cliente Contado" del Doc 06:**

La mayoría de ventas B2C son a "Consumidor Final" genérico — el cliente no se registra. Pero cuando el cliente solicita factura con sus datos, se registra con un formulario simplificado.

**Formulario de cliente B2C:**

| Campo | Tipo | Obligatorio | Notas |
|-------|------|------------|-------|
| Nombre | Texto | Sí | Nombre completo o razón social |
| RUC / Cédula | Texto + DV | Sí (para factura) | Identificación panameña |
| Tipo | Auto | — | "Consumidor Final" |
| Teléfono | Texto | No | Para contacto |
| Email | Texto | No | Para enviar factura digital |
| Dirección | Texto | No | — |

**Código automático:** Prefijo "Z" + secuencial (ej: Z0000081) — separado de clientes B2B.

**El cliente B2C NO es el mismo que el cliente B2B.** Son poblaciones diferentes. Un distribuidor de Curazao no compra botellas en la tienda, y un visitante local no compra contenedores completos. Sin embargo, si alguna vez un cliente existe en ambos universos, el sistema debe poder vincularlos (pregunta pendiente #10 del Doc 06).

### 5.8 Facturación B2C

**Dos tipos de documento de venta:**

| Documento | Cuándo | Datos necesarios | Integración |
|-----------|--------|-----------------|-------------|
| **Ticket de venta** | Venta rápida sin datos del cliente | Detalle de productos, totales, método pago | Impresora térmica |
| **Factura de Zona Franca** | Cliente solicita factura con sus datos | Datos del cliente (RUC, nombre) + detalle | DGI si aplica |

**Diferencia con facturación B2B:**
| Aspecto | Factura B2B | Factura B2C |
|---------|-----------|-----------|
| Tipo | Factura de Zona Franca | Factura de Zona Franca (mismo régimen) |
| Impuestos | 0% (exento ZL) | 0% (exento ZL — misma ubicación) |
| Cliente | Extranjero (distribuidor internacional) | Consumidor Final (local o visitante) |
| Moneda | USD | USD |
| Detalle | Por caja | Por botella/unidad |
| Proceso | Desde pipeline de ventas (6 etapas) | Directo desde caja |

**Régimen fiscal:**
La tienda B2C está ubicada físicamente dentro de la Zona Libre de Colón, en la planta baja del mismo edificio de Evolution. Al estar dentro de la zona franca, las ventas B2C gozan de la misma exención fiscal que las ventas B2B — **no se cobra ITBMS (7%) ni ningún otro impuesto de venta**. Todas las ventas son exentas.

**Nota:** Si en algún momento Evolution abriera un punto de venta FUERA de la Zona Libre, sí aplicaría ITBMS. El sistema debe estar preparado para esta posibilidad futura via configuración (impuesto por ubicación de venta), pero para la tienda actual: 0% impuestos.

### 5.9 Precios B2C — Motor de precios al detal

**El B2C tiene su propio esquema de precios, independiente de los 5 niveles (A-E) del B2B.**

Los niveles A-E son precios por CAJA para distribuidores mayoristas. El precio B2C es por BOTELLA para consumidor final. No se calcula dividiendo el precio de caja entre el número de botellas — es un precio independiente definido por gerencia.

| Concepto | B2B | B2C |
|----------|-----|-----|
| Unidad de precio | Por caja | Por botella/unidad |
| Niveles de precio | A, B, C, D, E (5 niveles) | Un solo precio al público |
| Quién define | Compras + Gerencia | Gerencia (Javier/Estelia) |
| Descuentos | Por negociación (umbral comisión 10%) | Por promoción o decisión de encargado |
| Ubicación del precio | Ficha de producto → Precios B2B | Ficha de producto → Precio B2C (campo nuevo) |

**Nuevo campo en la ficha del producto:**

| Campo | Tipo | Ejemplo | Notas |
|-------|------|---------|-------|
| Precio B2C (Venta al detal) | Moneda | $35.00 | Precio por botella/unidad individual |

**Descuentos en tienda:**
- Descuento por ítem o por orden total
- Porcentaje o monto fijo
- Requiere permiso del rol (cajero puede dar hasta X%, encargado más, gerencia ilimitado)
- Cada descuento registra quién lo autorizó


### 5.10 Devoluciones B2C

| Campo | Tipo | Notas |
|-------|------|-------|
| Orden/factura original | Búsqueda | Se busca por número, fecha, o producto |
| Producto(s) a devolver | Selección | De las líneas de la orden original |
| Cantidad | Número | ≤ cantidad original de esa línea |
| Motivo | Dropdown + texto | Producto dañado / Error de cajero / Cliente cambió de opinión / Otro |
| Tipo de reembolso | Dropdown | Efectivo / Crédito en tienda / Nota de crédito |
| Aprobado por | Auto | Según configuración: cajero (montos bajos), encargado (montos altos) |

**Efectos automáticos:**
- Stock de tienda: +N unidades (reingresa el producto)
- Caja: -$XX.XX (si reembolso en efectivo)
- Contabilidad: asiento reverso automático

**Umbrales de aprobación (configurables):**
| Monto de devolución | Quién aprueba |
|---------------------|---------------|
| Hasta $50 | Cajero puede procesar |
| $50 - $200 | Requiere encargado de tienda |
| Más de $200 | Requiere gerencia |

---

## 6. INTEGRACIÓN CON OTROS MÓDULOS

### 6.1 POS B2C ← Productos (Doc 02)

| Dato del producto | Uso en B2C | Transformación |
|------------------|-----------|----------------|
| Nombre/descripción | Se muestra en la caja | Tal cual |
| Código / referencia | Búsqueda rápida | Tal cual |
| Código de barras | Escaneo en caja | Tal cual |
| Imagen | Thumbnail en grid de productos | Tal cual |
| Grupo / subgrupo | Categorías rápidas en caja | Mapeo a categorías B2C |
| Qty × Bulto | Conversión al transferir | 1 caja = N botellas |
| Precio B2C (NUEVO) | Precio de venta al detal | Campo nuevo en ficha |
| Código arancelario | NO se usa en B2C | No aplica (solo B2B/tráfico) |
| Precios A-E (niveles) | NO se muestran en B2C | No aplica (solo B2B) |
| Costos | NUNCA visibles en B2C | Protección estándar |

### 6.2 POS B2C ← → Inventario (Doc 04)

**B2B y B2C manejan inventarios completamente separados.** La tienda tiene su propio stock en su propia bodega. El único punto de contacto es la transferencia de inventario.

| Evento | Efecto en inventario de Bodega Tienda |
|--------|---------------------------------------|
| Venta B2C | Resta stock de Bodega Tienda (en botellas/unidades) |
| Transferencia B2B → B2C | Suma stock en Bodega Tienda (conversión caja→botella) |
| Transferencia B2C → B2B | Resta stock de Bodega Tienda (conversión botella→caja) |
| Devolución B2C | Suma stock en Bodega Tienda |
| Conteo físico tienda | Ajuste de stock en Bodega Tienda (independiente del conteo B2B) |

**Inventarios independientes — lo que ve cada lado:**

| Quién consulta | Qué ve | Ejemplo JW Black Label 12/1L |
|---------------|--------|------------------------------|
| Vendedor B2B | Solo stock de Bodega B2B | "200 cajas disponibles" |
| Cajero B2C | Solo stock de Bodega Tienda | "120 botellas disponibles" |
| Gerencia | Ambos inventarios + total empresa | "200 cajas B2B + 120 bot. tienda = 210 cajas eq. total" |

**Las ventas B2B NUNCA afectan el inventario de la tienda, y viceversa.** Cada operación descuenta de su propio inventario. Esto elimina el riesgo de que un vendedor prometa mercancía que la tienda ya vendió.

### 6.3 POS B2C → Contabilidad (Doc 07)

**Asientos automáticos que genera el POS B2C:**

| Operación | Débito | Crédito |
|-----------|--------|---------|
| Venta B2C (contado efectivo) | 1001-002 Caja B2C | 4001-002 Ventas B2C |
| Venta B2C (tarjeta) | 1002-XXX Banco procesador | 4001-002 Ventas B2C |
| Costo de venta B2C | 5001-001 Costo Mercancía | 1201-002 Inv. Bodega Tienda |
| Devolución B2C | 4101-001 Dev. y Concesiones | 1001-002 Caja B2C |
| Transferencia B2B→B2C | 1201-002 Inv. Bodega Tienda | 1201-001 Inv. Bodega B2B |
| Cierre de caja (depósito) | 1002-XXX Banco | 1001-002 Caja B2C |

**Segregación contable B2B vs B2C:**

Cada asiento lleva un identificador de "centro de costo" o "unidad de negocio" que permite:
- **Vista consolidada:** Estado de resultados de Evolution completo (B2B + B2C)
- **Vista B2B:** Solo cuentas con tag B2B → Ingresos B2B - Costo ventas B2B = Utilidad B2B
- **Vista B2C:** Solo cuentas con tag B2C → Ingresos B2C - Costo ventas B2C = Utilidad B2C

**Ejemplo de Estado de Resultados:**

```
EVOLUTION ZONA LIBRE S.A.
Estado de Resultados — Febrero 2026

                              B2B          B2C         TOTAL
                           ─────────    ─────────    ─────────
Ingresos por Ventas       $1,470,000    $45,000    $1,515,000
(-) Dev. y Descuentos       -$12,000       -$800      -$12,800
Ventas Netas              $1,458,000    $44,200    $1,502,200

(-) Costo de Ventas       $1,218,000    $28,730    $1,246,730

UTILIDAD BRUTA              $240,000    $15,470      $255,470
  Margen bruto               16.45%     34.99%        17.01%

(-) Gastos Operativos        ...         ...          ...
```

### 6.4 POS B2C ← Clientes (Doc 06)

| Relación | Detalle |
|----------|---------|
| Cliente contado (prefijo Z) | Creados desde el POS con formulario simplificado |
| Consumidor Final genérico | Default cuando no se registra cliente |
| Historial de compras | Cada venta B2C asociada al cliente (si se registró) |

### 6.5 POS B2C ← Configuración (Doc 08)

| Configuración | Uso en B2C |
|--------------|-----------|
| Usuarios y roles | Define quién puede ser cajero, encargado, etc. |
| Terminales/cajas | Registro de cajas habilitadas para venta |
| Métodos de pago | Cuáles están activos en tienda |
| Secuencias de numeración | Formato de tickets, facturas B2C, órdenes |
| Umbrales de descuento por rol | Cuánto puede descontar cada rol |
| Umbrales de devolución por rol | Hasta cuánto puede devolver cada rol sin aprobación |

### 6.6 POS B2C ↛ Tráfico (Doc 09)

**El módulo B2C NO interactúa con Tráfico.** Las ventas B2C son locales — la mercancía no sale de la Zona Libre, no requiere DMC, BL, ni certificados. El personal de tráfico no tiene acceso al módulo POS.

### 6.7 POS B2C ↛ Ventas B2B (Doc 05)

**El módulo B2C NO interactúa con Ventas B2B.** Son pipelines completamente separados:
- B2B: Cotización → Aprobación → Pedido → Aprobación → Empaque → Factura (6 etapas)
- B2C: Producto → Carrito → Cobrar → Ticket (1 paso)

Los vendedores B2B (Margarita, Arnold) no acceden al POS. El personal de tienda no accede a Ventas B2B.

---

## 7. REGLAS DE NEGOCIO DEL MÓDULO B2C

### Regla B2C-01: Venta siempre inmediata
Toda venta B2C es de contado. No hay pipeline, no hay aprobaciones, no hay pedidos previos. Cliente elige, paga, se lleva el producto. Si en algún momento se requieren ventas a crédito en tienda, se agrega como funcionalidad futura.

### Regla B2C-02: Sin impuestos (Zona Libre)
La tienda B2C opera dentro de la Zona Libre de Colón. Todas las ventas son exentas de ITBMS y cualquier otro impuesto de venta, igual que el B2B. Si en un futuro Evolution abriera un punto de venta fuera de la zona franca, el sistema debe permitir configurar impuestos por ubicación.

### Regla B2C-03: Inventario en unidades, no en cajas
Todo el inventario visible en el módulo B2C se muestra en unidades individuales (botellas), nunca en cajas. La conversión es automática basada en "Qty × Bulto" del producto.

### Regla B2C-04: No se vende lo que no hay
Si el stock en Bodega Tienda llega a 0 para un producto, NO se puede vender. No hay disponibilidad negativa en B2C. Si el cajero intenta vender un producto agotado, el sistema bloquea y sugiere solicitar reposición al B2B.

### Regla B2C-05: Caja siempre abierta para vender
No se pueden registrar ventas si no hay una caja abierta. El cajero debe hacer apertura de caja antes de su primera venta del día/turno.

### Regla B2C-06: Cierre de caja obligatorio
Al final de cada turno/día, el cajero debe hacer cierre de caja. No se puede abrir una nueva caja si la anterior no se cerró (por el mismo cajero o por un supervisor).

### Regla B2C-07: Descuentos controlados
Los descuentos tienen umbrales por rol. Cada descuento registra quién lo aplicó y quién lo autorizó (si requirió aprobación). No hay descuentos "invisibles" — todo queda en el historial de la orden.

### Regla B2C-08: Precios B2C independientes de B2B
Los precios de venta al detal NO se calculan desde los precios mayoristas. Son un campo independiente en la ficha del producto, definido por gerencia. El margen B2C es típicamente mucho mayor que el B2B (el usuario no ve el margen, solo gerencia).

### Regla B2C-09: Costos NUNCA visibles en B2C
La misma regla general del sistema: el personal de tienda NUNCA ve costos de compra, proveedores, márgenes. Solo ve precios de venta y stock disponible. Gerencia puede ver márgenes en los reportes B2C.

### Regla B2C-10: Contabilidad siempre separable
Cada transacción B2C genera asientos contables con tag/centro de costo "B2C". Esto permite generar estados financieros solo de la tienda, solo del B2B, o consolidados.

---

## 8. VISIBILIDAD Y PERMISOS

### Matriz de acceso al módulo POS B2C

| Funcionalidad | Cajero | Encargado tienda | Gerencia (Javier/Estelia) | Contabilidad (Jackie) | Otros roles |
|--------------|--------|------------------|--------------------------|----------------------|-------------|
| Pantalla de venta (caja) | ✓ | ✓ | ✓ | ✗ | ✗ |
| Cobrar | ✓ | ✓ | ✓ | ✗ | ✗ |
| Aplicar descuento (hasta X%) | ✓ (limite bajo) | ✓ (limite medio) | ✓ (ilimitado) | ✗ | ✗ |
| Abrir/cerrar caja | ✓ (la suya) | ✓ (todas) | ✓ (todas) | ✗ | ✗ |
| Ver historial de órdenes | ✓ (las suyas) | ✓ (todas) | ✓ (todas) | ✓ (solo lectura) | ✗ |
| Procesar devolución | ✓ (montos bajos) | ✓ (montos medios) | ✓ (todos) | ✗ | ✗ |
| Anular venta | ✗ | ✓ (con motivo) | ✓ | ✗ | ✗ |
| Ver inventario tienda | ✓ (stock solamente) | ✓ (stock + mínimos) | ✓ (todo) | ✗ | ✗ |
| Solicitar reposición | ✓ | ✓ | ✓ | ✗ | ✗ |
| Reportes B2C | ✗ | ✓ (ventas) | ✓ (ventas + márgenes) | ✓ (financieros) | ✗ |
| Configurar precios B2C | ✗ | ✗ | ✓ | ✗ | ✗ |
| Ver costos/márgenes | ✗ NUNCA | ✗ NUNCA | ✓ | ✓ | ✗ NUNCA |
| Ver cierres de caja | ✓ (los suyos) | ✓ (todos) | ✓ | ✓ | ✗ |

---

## 9. REPORTES ESPECÍFICOS DEL B2C

Estos reportes viven dentro del módulo POS B2C para uso del encargado de tienda y gerencia. Jackie accede desde Contabilidad con los filtros de unidad de negocio.

### 9.1 Reporte de Ventas Diarias

| Métrica | Descripción |
|---------|------------|
| Ventas brutas | Total antes de devoluciones y descuentos |
| Devoluciones | Total de devoluciones del día |
| Descuentos | Total de descuentos aplicados |
| Ventas netas | Brutas - devoluciones - descuentos |
| Ticket promedio | Ventas netas / número de transacciones |
| Transacciones | Cantidad de ventas realizadas |
| Por método de pago | Desglose: efectivo, tarjeta, transferencia |
| Por cajero | Desglose por persona |
| Por hora | Curva de ventas por hora del día (para identificar horas pico) |

### 9.2 Reporte de Productos Más Vendidos (B2C)

| Columna | Descripción |
|---------|------------|
| Producto | Nombre |
| Unidades vendidas | En el período seleccionado |
| Ingresos generados | Precio × cantidad |
| % del total de ventas | Participación |
| Margen (solo gerencia) | Utilidad por producto |
| Tendencia | ↑ / ↓ / → vs período anterior |

### 9.3 Reporte de Cierres de Caja

| Columna | Descripción |
|---------|------------|
| Fecha | Día del cierre |
| Cajero | Quién cerró |
| Ventas totales | Del turno |
| Efectivo teórico | Lo que debería haber |
| Efectivo real | Lo que se contó |
| Diferencia | Sobrante (+) o faltante (-) |
| Status | OK / Con diferencia |

---

## 10. CONFIGURACIÓN ESPECÍFICA DEL B2C

Parámetros en Configuración → Punto de Venta:

### 10.1 Terminales / Cajas

| Parámetro | Ejemplo | Notas |
|-----------|---------|-------|
| Número de caja | Caja 1 | Puede haber múltiples terminales |
| Ubicación | Planta baja - Tienda | Descripción física |
| Impresora asociada | POS-Printer-01 | Para tickets |
| Status | Activa / Inactiva | — |

### 10.2 Métodos de Pago

| Método | Activo | Notas |
|--------|--------|-------|
| Efectivo | ✓ | Siempre activo |
| Tarjeta débito | ✓ / ✗ | Configurable |
| Tarjeta crédito | ✓ / ✗ | Configurable |
| Transferencia bancaria | ✓ / ✗ | Configurable |
| Pago mixto | ✓ / ✗ | Permite combinar métodos |

### 10.3 Impuestos

| Parámetro | Valor actual | Notas |
|-----------|-------------|-------|
| Impuesto de venta | 0% (exento) | Tienda dentro de Zona Libre — mismo régimen que B2B |
| Configurable por ubicación | Sí | Si se abre tienda fuera de ZL, se puede configurar ITBMS u otro impuesto |

### 10.4 Descuentos

| Rol | Descuento máximo sin aprobación | Aprobador |
|-----|-------------------------------|-----------|
| Cajero | 5% | Encargado |
| Encargado | 15% | Gerencia |
| Gerencia | Sin límite | — |

### 10.5 Devoluciones

| Rol | Monto máximo sin aprobación | Aprobador |
|-----|---------------------------|-----------|
| Cajero | $50 | Encargado |
| Encargado | $200 | Gerencia |
| Gerencia | Sin límite | — |

### 10.6 Secuencias de Numeración

| Documento | Formato | Ejemplo |
|-----------|---------|---------|
| Orden B2C | POS-YYYY-NNNNNN | POS-2026-000047 |
| Ticket | TK-YYYY-NNNNNN | TK-2026-000047 |
| Factura B2C | FBC-YYYY-NNNN | FBC-2026-0012 |
| Nota de crédito B2C | NCB-YYYY-NNNN | NCB-2026-0003 |
| Cierre de caja | CC-YYYY-NNNN | CC-2026-0089 |

---

## 11. PROBLEMAS QUE ESTE MÓDULO RESUELVE

| # | Problema actual | Impacto | Solución en EvolutionOS |
|---|----------------|---------|------------------------|
| 1 | Dos bases de datos B2B/B2C separadas sin comunicación | Inventario desincronizado, sin forma de hacer transferencias coordinadas, sin contabilidad consolidable | Una sola plataforma con dos inventarios independientes pero comunicados: transferencias formales, contabilidad consolidable, catálogo compartido |
| 2 | "Crear Factura" no funciona en Dynamo | Módulo core del POS roto — error "terminal no registrada" | POS completamente nuevo, diseñado desde cero |
| 3 | Cierre de caja dormido desde 2020 | Sin control de efectivo, sin arqueo, sin trazabilidad | Cierre de caja completo con arqueo y reporte automático |
| 4 | Sin conversión automática de unidades | Transferencias B2B→B2C requieren cálculos manuales | Conversión automática caja↔botella basada en Qty × Bulto |
| 5 | Contabilidad mezclada o inexistente | No se puede ver P&L del B2C separado del B2B | Asientos automáticos con centro de costo → vista separada o consolidada |
| 6 | Sin control de descuentos | Cualquiera puede dar descuentos sin registro | Umbrales por rol, cada descuento registrado y auditable |
| 7 | Sin historial de ventas B2C organizado | No se puede analizar qué se vende, cuándo, a quién | Historial completo con filtros, reportes, tendencias |
| 8 | Régimen fiscal no documentado | No estaba claro si B2C cobraba impuestos o no | Confirmado: tienda dentro de ZL = 0% impuestos, igual que B2B. Sistema preparado para impuesto por ubicación si se expande |
| 9 | Sin integración POS → contabilidad | Jackie no recibe datos del POS automáticamente | Cada venta genera asiento contable automático en tiempo real |
| 10 | Stock de tienda invisible para el B2B y viceversa | Si B2B necesita mercancía de tienda, no saben cuánto hay ni pueden coordinar | Gerencia ve inventario consolidado (ambas bodegas). Transferencias formales bidireccionales dentro de la plataforma |

---

## 12. CONSOLIDACIÓN DYNAMO → NUEVA PLATAFORMA

| Funcionalidad actual | Dónde está en Dynamo | Estado | Destino en EvolutionOS |
|---------------------|---------------------|--------|----------------------|
| Venta B2C (caja) | Dynamo Caja (instancia separada) | Sistema aparte | → POS B2C: Caja |
| Crear Factura (POS) | Punto de Venta → submódulo #1 | ❌ NO FUNCIONA | → POS B2C: Facturación |
| Cobros Tarjetas | Punto de Venta → submódulo #10 | → Dormido | → POS B2C: Métodos de pago |
| Cierre de Caja | Punto de Venta → submódulo #11 | Dormido desde 2020 | → POS B2C: Gestión de Caja |
| Cobros por Caja | Punto de Venta → submódulo #12 | → B2C | → POS B2C: Gestión de Caja |
| Crear Cliente Contado | Clientes → submódulo #3 | Funciona | → POS B2C: Clientes B2C |
| Transferencia B2B→B2C | Inventario → Transferencia | ❌ COMPLETAMENTE ROTO | → Inventario (creación) + POS B2C (recepción) |
| Inventario tienda | Dynamo Caja (separado) | Base de datos aparte | → Inventario propio de Tienda B2C (independiente de Bodega B2B, comunicado por transferencias) |
| Reportes de venta B2C | Dynamo Caja | Desconocido | → POS B2C: Reportes B2C |
| Devoluciones B2C | Punto de Venta → Devoluciones | Funciona (vacío) | → POS B2C: Devoluciones |

---

## 13. PREGUNTAS PENDIENTES

| # | Pregunta | Por qué importa | Preguntar a |
|---|---------|-----------------|-------------|
| 1 | ¿Cuántas personas operan la tienda B2C? | Define cantidad de terminales y roles | Javier |
| 2 | ¿Quién es el encargado de tienda? | Define rol principal del módulo | Javier |
| 3 | ¿Cuál es el horario de operación de la tienda? | Define turnos, cierres de caja | Encargado tienda |
| 4 | ¿Qué métodos de pago acepta la tienda actualmente? | Configura métodos activos en el POS | Encargado tienda |
| 5 | ¿Cuántas ventas diarias hace la tienda aproximadamente? | Escala, rendimiento, planificación | Encargado tienda |
| 6 | ¿Se emite factura a cada venta o solo cuando el cliente la solicita? | Define flujo de facturación | Javier / Jackie |
| 7 | ¿Hay ventas a crédito en la tienda o solo contado? | Define si necesita CxC local | Javier |
| 8 | ¿Se hacen descuentos o promociones en tienda? ¿Quién los autoriza? | Define motor de descuentos | Javier |
| 9 | ¿Quién define los precios de venta al detal (B2C)? | Define flujo de precios B2C | Javier |
| 10 | ¿La transferencia B2B→B2C es al costo real o al costo inflado? | **CRÍTICA** — afecta toda la contabilidad B2C y el P&L separado | Javier |
| 11 | Si es costo inflado: ¿cuál es el factor/markup? ¿Fijo o variable? | Define configuración de transferencias | Javier |
| 12 | ¿El B2C debe generar su propio P&L que cuadre independientemente? | Define nivel de separación contable | Jackie / Javier |
| 13 | ¿Hay impresora térmica de tickets en la tienda? ¿Qué modelo? | Define integración de hardware | Encargado tienda |
| 14 | ¿Se manejan devoluciones en tienda? ¿Con qué frecuencia? | Define complejidad del flujo de devoluciones | Encargado tienda |
| 15 | ¿Los clientes B2C pueden ser también clientes B2B? | Define si se vinculan fichas | Javier |

---

## 14. PRIORIDAD DE IMPLEMENTACIÓN DENTRO DEL MÓDULO

### Fase 1 — No incluido (B2C es Fase 2 del proyecto general)
El B2C se construye DESPUÉS de estabilizar el B2B. Esto está definido en el plan de implementación del Doc 01: "Hasta que no se consoliden compras e inventario confiable, no tiene sentido construir B2C."

### Fase 2a — Núcleo B2C (primera iteración)
- Pantalla de caja (venta rápida)
- Búsqueda y grid de productos
- Cobro (efectivo y tarjeta)
- Ticket de venta
- Apertura y cierre de caja básico
- Inventario de tienda (vista simplificada)
- Conversión automática de unidades al transferir
- Asientos contables automáticos con tag B2C
- Registro rápido de cliente contado

### Fase 2b — Completar B2C
- Facturación formal (integración DGI si aplica en ZL)
- Pago mixto
- Devoluciones con aprobaciones
- Reportes completos (ventas diarias, productos más vendidos, cierres)
- Descuentos con umbrales por rol
- Motor de solicitud de reposición
- Historial completo de órdenes con filtros
- Vista de P&L separado B2C en contabilidad

### Fase 3 — Avanzado
- Lector de código de barras integrado
- Impresora térmica de tickets
- Programa de lealtad / clientes frecuentes (si aplica)
- Promociones configurables (2×1, descuento por volumen, etc.)
- App móvil para consulta de stock en tienda
- Analítica de ventas B2C (horas pico, tendencias, estacionalidad)

---

## FIN DEL DOCUMENTO 10

Este documento cubre la totalidad del módulo de Punto de Venta B2C: desde la arquitectura de dos negocios independientes bajo una plataforma, los inventarios separados comunicados por transferencias, la separación contable, la interfaz de caja, los flujos de venta/cobro/devolución, la gestión de caja, la integración con todos los módulos relevantes, las reglas de negocio, los permisos, los reportes, la configuración, y las preguntas pendientes.

**Documentos relacionados:**
- **Documento 01:** Introducción — sección 12 (conversión unidades B2B↔B2C), reglas 9 y 10
- **Documento 02:** Productos — campo Qty × Bulto (conversión), nuevo campo Precio B2C
- **Documento 04:** Inventario — sección de Transferencias B2B↔B2C, conversión y costo
- **Documento 05:** Ventas B2B — submódulos POS redirigidos a B2C (Cobros Tarjetas, Cierre Caja, Cobros por Caja)
- **Documento 06:** Clientes — sección Crear Cliente Contado
- **Documento 07:** Contabilidad — cuentas separadas B2B/B2C, asiento de venta B2C
- **Documento 08:** Configuración — rol Logística, métodos de pago, secuencias de numeración
- **Documento 09:** Tráfico — NO aplica a B2C (no hay documentación aduanal)
- **Documento Maestro:** Arquitectura — inventarios separados por sucursal, transferencias coordinadas
