# DOCUMENTO 08 — MÓDULO: CONFIGURACIÓN Y ADMINISTRACIÓN DEL SISTEMA

## Contexto
Este documento especifica el módulo de Configuración y Administración del Sistema para la nueva plataforma de Evolution Zona Libre. En Dynamo, este módulo **no existe**. No hay forma de crear usuarios, asignar roles, modificar permisos, ni configurar parámetros del sistema sin intervención directa del programador de Dynamo Software Solutions. Esto genera dependencia total del proveedor y elimina la autonomía operativa de Evolution.

La nueva plataforma debe ofrecer autonomía completa a Javier y Estelia para administrar su sistema: crear usuarios, definir roles, configurar parámetros comerciales, y controlar el acceso — como lo hace cualquier plataforma SaaS moderna (Shopify, QuickBooks, Xero, HubSpot).

**Prerequisito:** Leer Documentos 01 a 07 antes de este documento. Los requisitos de roles y permisos provienen directamente de las reglas de negocio documentadas en cada módulo.

---

## 1. QUÉ REEMPLAZA ESTE MÓDULO EN DYNAMO

### Lo que Dynamo tiene en su menú "Configuración":

El menú "Configuración" de Dynamo existe en el sidebar pero contiene funcionalidades limitadas — principalmente catálogos de datos maestros (tipos de documento, tipos de transacción, parámetros fiscales). **NO contiene:**

- ❌ Gestión de usuarios (crear, editar, eliminar, activar/desactivar)
- ❌ Gestión de roles (definir permisos por rol)
- ❌ Control de acceso por módulo o pantalla
- ❌ Configuración de parámetros comerciales (niveles de precio, comisiones, etc.)
- ❌ Configuración de notificaciones o alertas
- ❌ Logs de auditoría
- ❌ Personalización de la interfaz
- ❌ Gestión de la empresa (datos fiscales, logo, información)
- ❌ Backup o exportación de datos

### Cómo se gestionan los usuarios hoy:

Según la documentación recopilada, Dynamo tiene usuarios pre-configurados por el programador:
- **JAVIER** (visible en la esquina superior derecha de todas las pantallas)
- Otros usuarios del equipo (Jackie, Margarita, Arnold, etc.) — probablemente configurados directamente en la base de datos de Visual FoxPro

Para agregar un usuario, cambiar una contraseña, o modificar un permiso, Evolution tiene que contactar a Dynamo Software Solutions (dynamoss@outlook.com, 6090-3796). Esto es una dependencia operativa inaceptable.

### En la nueva plataforma:

Un módulo completo de **Configuración y Administración** que permite a Javier y Estelia gestionar todo el sistema de forma autónoma, sin necesitar un programador. Dividido en secciones claras: Empresa, Usuarios y Roles, Parámetros Comerciales, Catálogos Maestros, Auditoría, y Sistema.

---

## 2. CONSOLIDACIÓN DE REQUISITOS DE TODOS LOS DOCUMENTOS

A lo largo de los Documentos 01 a 07, se han identificado requisitos específicos de configuración que deben centralizarse en este módulo:

### De Doc 01 (Introducción):
- Regla #5: Costos NUNCA visibles para vendedores — requiere control de acceso por campo
- Regla #15: Indicador de comisión 🟢/🔴 basado en threshold del 10% — parámetro configurable
- Regla #4: Niveles de precio A-E por producto — configuración de niveles
- Equipo de 8-10 personas con roles definidos — necesita gestión de usuarios

### De Doc 02 (Productos):
- Campos visibles según rol (costo solo para gerencia/compras)
- Importación Excel de productos — configuración de mapeo de columnas

### De Doc 03 (Compras/Importación):
- Proveedores con templates de importación guardados
- % de gastos para cálculo CIF — parámetro configurable por entrada

### De Doc 04 (Inventario):
- Aprobación de ajustes de inventario — flujo configurable
- Conversión caja→botella — parámetro por producto
- Almacenes/ubicaciones — catálogo configurable

### De Doc 05 (Ventas B2B):
- Pipeline de aprobación (cotización→pedido→factura) — flujo configurable
- Comisiones: threshold 10%, % por vendedor — parámetros configurables
- Tipos de factura (Zona Franca, Fiscal) — catálogo
- Exposición de datos de proveedores — control de acceso

### De Doc 06 (Clientes/CxC):
- Nivel de precio por cliente (A-E) — solo visible para gerencia
- Límite de crédito con enforcement — parámetro por cliente
- Anulación de transacciones con aprobación — flujo configurable
- Umbral de aprobación para anulaciones ($5,000) — parámetro configurable

### De Doc 07 (Contabilidad):
- Plan de cuentas — catálogo maestro
- Mapeo de operaciones a cuentas contables — configuración
- Cierres con aprobación — flujo configurable
- 12 bancos — catálogo configurable

---

## 3. ESPECIFICACIÓN DEL MÓDULO EN LA NUEVA PLATAFORMA

### 3.1 Arquitectura del Módulo

```
CONFIGURACIÓN Y ADMINISTRACIÓN
│
├── 1. MI EMPRESA
│   ├── Datos de la empresa (nombre, RUC, dirección, logo)
│   ├── Información fiscal (tipo contribuyente, régimen, etc.)
│   ├── Sucursales / Ubicaciones (Bodega B2B, Tienda B2C)
│   └── Datos de contacto y branding
│
├── 2. USUARIOS Y ROLES
│   ├── Gestión de Usuarios (crear, editar, desactivar)
│   ├── Gestión de Roles (crear, configurar permisos)
│   ├── Permisos por Módulo (granular hasta nivel de campo)
│   └── Sesiones Activas (ver quién está conectado)
│
├── 3. PARÁMETROS COMERCIALES
│   ├── Niveles de Precio (A, B, C, D, E — configurar estructura)
│   ├── Comisiones (threshold, % por vendedor)
│   ├── Condiciones de Pago (30, 60, 90 días — opciones)
│   ├── Impuestos (ITBMS 7%, exenciones Zona Libre)
│   ├── Monedas (USD principal, Balboas local)
│   └── Numeración de Documentos (prefijos, secuencias)
│
├── 4. FLUJOS DE APROBACIÓN
│   ├── Aprobación de Cotizaciones (activar/desactivar)
│   ├── Aprobación de Pedidos (activar/desactivar)
│   ├── Aprobación de Ajustes de Inventario
│   ├── Aprobación de Anulaciones (umbral de monto)
│   ├── Aprobación de Cierres Contables
│   └── Aprobación de Excepciones de Precio
│
├── 5. CATÁLOGOS MAESTROS
│   ├── Países y Ciudades (ISO 3166, datos limpios)
│   ├── Áreas y Sub-Áreas (destinos de exportación)
│   ├── Marcas (catálogo de marcas de productos)
│   ├── Categorías de Producto
│   ├── Proveedores
│   ├── Aranceles (códigos aduaneros)
│   ├── Bancos (catálogo de cuentas bancarias)
│   ├── Tipos de Documento (factura, NC, ND, recibo, etc.)
│   ├── Formas de Pago (transferencia, cheque, efectivo, etc.)
│   └── Motivos de Anulación (predefinidos)
│
├── 6. NOTIFICACIONES Y ALERTAS
│   ├── Configurar alertas por evento
│   ├── Canales (en-app, email)
│   └── Frecuencia y destinatarios
│
├── 7. AUDITORÍA Y SEGURIDAD
│   ├── Log de Auditoría (todas las acciones del sistema)
│   ├── Historial de Cambios por registro
│   ├── Sesiones y accesos
│   └── Políticas de contraseña
│
└── 8. SISTEMA
    ├── Información de la plataforma
    ├── Importación / Exportación de datos
    ├── Backup y restauración
    └── Integraciones (API, webhooks)
```

---

### 3.2 MI EMPRESA — Datos del Negocio

**Datos principales (configurados una vez, editables por Gerencia):**

| Campo | Valor para Evolution | Editable por |
|-------|---------------------|-------------|
| Nombre Legal | EVOLUTION ZONA LIBRE, S.A. | Solo Javier |
| Nombre Comercial | Evolution ZL / Evolution Duty Free | Solo Javier |
| RUC | [RUC de Evolution] | Solo Javier |
| DV | [Dígito verificador] | Solo Javier |
| Tipo de Contribuyente | Jurídico | Solo Javier |
| Régimen Fiscal | Zona Libre de Colón | Solo Javier |
| Dirección | Zona Libre de Colón, Panamá | Gerencia |
| Teléfono Principal | 433-3676 | Gerencia |
| Email Principal | contabilidad@evolutionzl.com | Gerencia |
| Logo | [Logo de Evolution] | Gerencia |
| Moneda Principal | USD ($) | Solo Javier |
| Moneda Secundaria | PAB (B/.) Balboas | Solo Javier |
| Zona Horaria | America/Panama (EST -5) | Sistema |

**Sucursales / Ubicaciones:**

| Código | Nombre | Tipo | Descripción |
|--------|--------|------|-------------|
| BODEGA | Evolution ZL Bodega | Almacén B2B | Planta alta — operación principal de zona libre |
| TIENDA | Evolution Duty Free | Tienda B2C | Planta baja — venta al detalle |

Estas ubicaciones alimentan: inventario (stock por ubicación), ventas (tipo de factura), y contabilidad (caja de ventas asociada).

---

### 3.3 USUARIOS Y ROLES — Sistema Flexible Controlado por Javier

#### Filosofía: Autonomía Total para el Dueño

**Principio fundamental:** Javier (como Administrador Supremo) tiene control TOTAL para crear, modificar y eliminar roles y permisos según las necesidades cambiantes de su negocio. El sistema NO viene con roles rígidos predefinidos por los desarrolladores. En su lugar, ofrece:

1. **Constructor de Roles** — Javier crea los roles que necesite (pueden ser 3 o 15, él decide)
2. **Constructor de Permisos** — Para cada rol, Javier define exactamente qué puede ver, crear, editar, aprobar y eliminar, módulo por módulo, campo por campo
3. **Templates sugeridos** — Al hacer el setup inicial, el sistema SUGIERE configuraciones típicas que Javier puede aceptar, modificar o ignorar completamente
4. **Cambios en tiempo real** — Si Javier necesita que Margarita vea algo nuevo o que Arnold deje de ver algo, lo cambia él mismo en segundos. Sin llamar a nadie.

Esto elimina por completo la dependencia de Dynamo donde cualquier cambio de usuario o permiso requería al programador externo.

#### El Único Rol Fijo: Administrador Supremo

El sistema tiene UN SOLO rol que no se puede eliminar ni modificar: **Administrador Supremo**. Este es Javier. Es el dueño del sistema.

| Característica | Detalle |
|---------------|---------|
| Quién lo tiene | Javier Lange (asignado en setup inicial) |
| ¿Se puede eliminar? | No — siempre debe existir al menos un Admin Supremo |
| ¿Se puede transferir? | Sí — Javier puede designar a otra persona como Admin Supremo |
| ¿Se puede compartir? | Sí — puede haber más de un Admin Supremo si Javier quiere |
| Acceso | TODO — todos los módulos, todos los campos, todas las acciones |
| Exclusivo | Gestión de roles y permisos, datos fiscales de la empresa, configuración del sistema |

**TODO lo demás es configurable por Javier.**

#### Gestión de Usuarios

**Campos por usuario:**

| Campo | Tipo | Obligatorio | Notas |
|-------|------|------------|-------|
| Nombre completo | Texto | Sí | — |
| Email | Email validado | Sí | Login del sistema |
| Contraseña | Encriptada | Sí | Política de seguridad configurable |
| Teléfono | Texto | No | Para notificaciones |
| Rol | Dropdown | Sí | Uno o más roles asignados (Javier los define) |
| Sucursal | Multi-select | Sí | A qué ubicaciones tiene acceso |
| Status | Dropdown | Sí | Activo / Inactivo / Suspendido |
| Foto | Imagen | No | Avatar para la interfaz |
| Último acceso | Auto | — | Fecha/hora del último login |
| Creado por | Auto | — | Quién creó el usuario |
| Fecha creación | Auto | — | Cuándo se creó |

**Acciones sobre usuarios (solo Admin Supremo y usuarios con permiso de gestión):**
- Crear nuevo usuario
- Editar datos del usuario
- Asignar/cambiar roles
- Resetear contraseña (genera link temporal)
- Desactivar usuario (no eliminar — mantiene historial)
- Ver historial de actividad del usuario
- Forzar cierre de sesión

#### Constructor de Roles — Cómo Funciona

**Pantalla de creación de rol:**

```
┌─────────────────────────────────────────────────────────┐
│  CREAR ROL                                               │
│                                                          │
│  Nombre del rol: [________________________]              │
│  Descripción:    [________________________]              │
│  Color/ícono:    [🔵] (para identificar en la interfaz) │
│                                                          │
│  ┌─ PERMISOS POR MÓDULO ──────────────────────────────┐ │
│  │                                                      │ │
│  │  📦 PRODUCTOS                          [▼ expandir]  │ │
│  │  🛒 COMPRAS E IMPORTACIÓN              [▼ expandir]  │ │
│  │  📊 INVENTARIO                         [▼ expandir]  │ │
│  │  💰 VENTAS B2B                         [▼ expandir]  │ │
│  │  👥 CLIENTES                           [▼ expandir]  │ │
│  │  💵 CUENTAS POR COBRAR                 [▼ expandir]  │ │
│  │  📒 CONTABILIDAD                       [▼ expandir]  │ │
│  │  ⚙️ CONFIGURACIÓN                      [▼ expandir]  │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  [Guardar Rol]  [Cancelar]  [Usar Template ▼]           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Al expandir un módulo, Javier ve checkboxes granulares por cada acción y campo sensible:**

```
📦 PRODUCTOS                                    [Todo ✓] [Nada ✗]
├── Acceso al módulo                            [✓]
├── ACCIONES:
│   ├── Ver lista de productos                  [✓]
│   ├── Crear producto                          [✓]
│   ├── Editar producto                         [✓]
│   ├── Desactivar producto                     [✓]
│   ├── Importar desde Excel                    [✓]
│   └── Exportar a Excel                        [✓]
├── CAMPOS SENSIBLES (visibilidad):
│   ├── Ver costos de compra                    [✓] ← Toggle independiente
│   ├── Ver márgenes                            [✓]
│   ├── Ver precios por nivel (A-E)             [✓]
│   ├── Ver proveedor del producto              [✓]
│   └── Ver stock valorizado ($)                [✓]
└── ALCANCE:
    ├── Ver todos los productos                 [✓]
    └── Ver solo productos de su departamento   [ ]
```

**Ejemplo para Ventas B2B (expandido):**

```
💰 VENTAS B2B                                   [Todo ✓] [Nada ✗]
├── Acceso al módulo                            [✓]
├── ACCIONES:
│   ├── Crear cotización                        [✓]
│   ├── Editar cotización                       [✓]
│   ├── Aprobar cotización                      [✓]
│   ├── Crear pedido                            [✓]
│   ├── Aprobar pedido                          [✓]
│   ├── Generar factura                         [✓]
│   ├── Anular transacción (solicitar)          [✓]
│   ├── Anular transacción (aprobar)            [✓]
│   └── Exportar a Excel                        [✓]
├── CAMPOS SENSIBLES (visibilidad):
│   ├── Ver costos en cotización                [✓]
│   ├── Ver margen en cotización                [✓]
│   ├── Ver comisiones (propias)                [✓]
│   ├── Ver comisiones (de otros vendedores)    [✓]
│   ├── Ver indicador 🟢/🔴 de comisión        [✓]
│   └── Ver % exacto de comisión               [✓]
├── ALCANCE:
│   ├── Ver todas las cotizaciones              [✓]
│   ├── Ver solo cotizaciones propias           [ ]
│   ├── Ver dashboard global de ventas          [✓]
│   └── Ver solo sus métricas                   [ ]
└── APROBACIONES:
    ├── Puede ser aprobador de cotizaciones     [✓]
    ├── Puede ser aprobador de pedidos          [✓]
    └── Puede ser aprobador de anulaciones      [✓]
```

**Ejemplo para Clientes y CxC (expandido):**

```
👥 CLIENTES                                     [Todo ✓] [Nada ✗]
├── Acceso al módulo                            [✓]
├── ACCIONES:
│   ├── Ver directorio de clientes              [✓]
│   ├── Crear cliente                           [✓]
│   ├── Editar cliente (datos básicos)          [✓]
│   ├── Editar cliente (datos comerciales)      [✓]
│   ├── Desactivar/bloquear cliente             [✓]
│   └── Exportar a Excel                        [✓]
├── CAMPOS SENSIBLES (visibilidad):
│   ├── Ver nivel de precio del cliente         [✓]
│   ├── Cambiar nivel de precio                 [✓]
│   ├── Ver límite de crédito                   [✓]
│   ├── Configurar límite de crédito            [✓]
│   ├── Ver saldo / balance del cliente         [✓]
│   ├── Ver costos y ganancia por cliente       [✓]
│   └── Ver condiciones de pago                 [✓]
├── ALCANCE:
│   ├── Ver todos los clientes                  [✓]
│   └── Ver solo clientes asignados             [ ]
│
💵 CUENTAS POR COBRAR
├── Acceso al módulo                            [✓]
├── ACCIONES:
│   ├── Dashboard de CxC / morosidad            [✓]
│   ├── Registrar cobro/pago                    [✓]
│   ├── Generar estado de cuenta                [✓]
│   ├── Enviar estado de cuenta por email       [✓]
│   ├── Solicitar anulación                     [✓]
│   └── Aprobar anulación                       [✓]
└── APROBACIONES:
    ├── Puede ser aprobador de anulaciones      [✓]
    └── Umbral de aprobación personal ($)       [___$5,000___]
```

**Atajos de configuración:**
- **[Todo ✓]** — Activa todos los permisos del módulo (para roles tipo admin)
- **[Nada ✗]** — Desactiva todos los permisos del módulo (para roles sin acceso)
- **[Copiar de otro rol]** — Duplica la configuración de un rol existente y ajusta

#### Templates Sugeridos (Setup Inicial)

Al crear el sistema por primera vez, se le presentan a Javier **templates pre-configurados como punto de partida**. Javier puede aceptarlos tal cual, modificarlos, o crear todo desde cero.

**Templates disponibles:**

| Template | Descripción | Para quién (ejemplo) |
|----------|-------------|---------------------|
| 🔑 **Administrador** | Acceso total a todos los módulos y campos | Javier, Estelia |
| 💰 **Ventas** | Cotizaciones, pedidos, ficha de clientes. Sin costos, sin contabilidad | Margarita, Arnold |
| 📦 **Compras** | Órdenes de compra, proveedores, costos. Sin ventas B2B | Celly |
| 💵 **Finanzas** | Contabilidad, CxC, CxP, reportes financieros. Sin ventas operativas | Jackie |
| 📊 **Almacén** | Inventario (cantidades), recepciones, transferencias. Sin costos ni precios | Jesús |
| 🚚 **Logística** | Tráfico, documentación, seguimiento. Sin financieros | Ariel, María |
| 👁️ **Solo lectura** | Ve todo pero no puede crear, editar ni aprobar nada | Auditor externo, consultor |

**Cada template es solo un punto de partida.** Javier lo selecciona, se cargan los checkboxes, y luego Javier ajusta lo que quiera antes de guardar el rol. También puede:

- Renombrar el rol (ej: cambiar "Ventas" a "Vendedor Senior" o "Ejecutivo Comercial")
- Duplicar un rol existente y crear variantes (ej: "Vendedor" y "Vendedor Junior" con menos permisos)
- Crear roles desde cero sin usar ningún template

#### Ejemplo Práctico: Cómo Javier Configuraría su Equipo

**Escenario: Javier quiere configurar el acceso de Margarita (vendedora principal)**

```
Paso 1: Javier va a Configuración → Usuarios → Crear Usuario
        → Nombre: Margarita Morelos
        → Email: margarita@evolutionzl.com
        → Rol: [selecciona "Vendedor" del dropdown]

Paso 2: El sistema pre-carga los permisos del template "Ventas"

Paso 3: Javier revisa y AJUSTA lo que necesite:
        → Productos: ✓ Ver lista, ✗ Ver costos, ✗ Ver proveedor
        → Ventas: ✓ Crear cotización, ✓ Crear pedido, ✗ Generar factura
        → Clientes: ✓ Ver asignados, ✗ Ver todos
        → Contabilidad: ✗ (todo desactivado)
        
Paso 4: Guardar → Margarita ya tiene acceso configurado

Paso 5: Mañana Javier decide que Margarita SÍ necesita ver el saldo
        de sus clientes para cobrar mejor
        → Va a Configuración → Roles → "Vendedor"
        → Activa "Ver saldo del cliente" en Clientes
        → Guardar → TODOS los vendedores ahora ven saldos
        
        O si solo quiere que Margarita lo vea (no Arnold):
        → Va a Configuración → Usuarios → Margarita
        → "Permisos adicionales" → activa solo para ella
```

#### Permisos a Nivel de Usuario (Overrides)

Además de los permisos del ROL, Javier puede agregar **permisos adicionales específicos** para un usuario individual sin cambiar el rol completo. Esto permite excepciones sin crear un rol nuevo para cada caso:

```
USUARIO: Margarita Morelos
ROL: Vendedor (permisos base del rol)

PERMISOS ADICIONALES (overrides):
+ Ver saldo de clientes asignados     [AGREGADO — no está en rol Vendedor]
+ Exportar cotizaciones a Excel        [AGREGADO — no está en rol Vendedor]
- Crear pedido sin aprobación          [REMOVIDO — aunque el rol lo permite]

Resultado: Margarita tiene los permisos de "Vendedor" + sus overrides personales
```

Esto da máxima flexibilidad: Javier no necesita crear un rol "Vendedor Senior" si solo quiere dar un permiso extra a una persona específica.

#### Catálogo Completo de Permisos Disponibles

**Estos son TODOS los permisos que Javier puede activar/desactivar para cada rol. El sistema los presenta organizados por módulo con checkboxes:**

**PRODUCTOS (📦):**
- Acceso al módulo
- Ver lista de productos
- Crear producto
- Editar producto
- Desactivar producto
- Importar desde Excel
- Exportar a Excel
- Ver costos de compra (campo sensible)
- Ver márgenes (campo sensible)
- Ver precios por nivel A-E (campo sensible)
- Ver proveedor del producto (campo sensible)
- Ver stock valorizado en $ (campo sensible)
- Ver solo cantidades de stock (alternativa al valorizado)

**COMPRAS E IMPORTACIÓN (🛒):**
- Acceso al módulo
- Crear orden de compra
- Editar orden de compra
- Aprobar orden de compra
- Registrar recepción de mercancía
- Gestionar proveedores (crear, editar)
- Ver costos de compra
- Ver gastos de importación (CIF)
- Exportar a Excel

**INVENTARIO (📊):**
- Acceso al módulo
- Ver stock (cantidades)
- Ver stock valorizado ($) (campo sensible)
- Solicitar ajuste de inventario
- Aprobar ajuste de inventario
- Ejecutar transferencia entre ubicaciones
- Iniciar conteo físico
- Aprobar conteo físico
- Ver historial de movimientos
- Exportar a Excel

**VENTAS B2B (💰):**
- Acceso al módulo
- Crear cotización
- Editar cotización
- Aprobar cotización
- Crear pedido
- Aprobar pedido
- Generar factura
- Solicitar anulación
- Aprobar anulación
- Ver costos en cotización (campo sensible)
- Ver margen en cotización (campo sensible)
- Ver comisiones propias
- Ver comisiones de otros vendedores (campo sensible)
- Ver indicador 🟢/🔴 de comisión
- Ver % exacto de comisión (campo sensible)
- Ver todas las cotizaciones/pedidos
- Ver solo cotizaciones/pedidos propios
- Dashboard de ventas completo
- Dashboard solo métricas propias
- Exportar a Excel

**CLIENTES (👥):**
- Acceso al módulo
- Ver directorio de clientes
- Crear cliente
- Editar datos básicos (nombre, contacto, dirección)
- Editar datos comerciales (nivel precio, crédito, condiciones)
- Desactivar/bloquear cliente
- Ver nivel de precio del cliente (campo sensible)
- Cambiar nivel de precio (acción sensible)
- Ver límite de crédito
- Configurar límite de crédito (acción sensible)
- Ver saldo/balance del cliente
- Ver costos y ganancia por cliente (campo sensible)
- Ver condiciones de pago
- Ver todos los clientes
- Ver solo clientes asignados
- Exportar a Excel

**CUENTAS POR COBRAR (💵):**
- Acceso al módulo
- Dashboard de CxC / morosidad
- Registrar cobro/pago
- Generar estado de cuenta
- Enviar estado de cuenta por email
- Solicitar anulación de transacción
- Aprobar anulación de transacción
- Ver aging / análisis de cartera
- Bloquear crédito de cliente
- Exportar a Excel

**CONTABILIDAD (📒):**
- Acceso al módulo
- Dashboard financiero
- Ver libro diario
- Crear asiento manual
- Editar asiento manual
- Ver plan de cuentas
- Editar plan de cuentas
- Ver estados financieros (P&L, Balance)
- Ejecutar conciliación bancaria
- Aprobar conciliación bancaria
- Solicitar cierre de período
- Aprobar cierre mensual
- Aprobar cierre anual (recomendado: solo Admin Supremo)
- Ver saldos bancarios
- Ver tesorería
- Ejecutar pagos
- Exportar reportes financieros

**CONFIGURACIÓN (⚙️):**
- Acceso al módulo
- Datos de la empresa (ver)
- Datos de la empresa (editar)
- Datos fiscales (editar) (recomendado: solo Admin Supremo)
- Gestionar usuarios (crear, editar, desactivar)
- Gestionar roles y permisos (recomendado: solo Admin Supremo)
- Parámetros comerciales (editar)
- Flujos de aprobación (configurar)
- Catálogos maestros (editar)
- Notificaciones (configurar)
- Ver log de auditoría
- Importar/exportar datos
- Configuración del sistema (recomendado: solo Admin Supremo)

#### Recomendaciones del Sistema (No Obligatorias)

Cuando Javier configura roles, el sistema puede mostrar **recomendaciones suaves** (no bloqueos) para proteger información sensible:

```
⚠️ Recomendación: El permiso "Ver costos de compra" expone los precios 
de costo de los productos. Generalmente se restringe a roles administrativos 
y de compras. ¿Desea activarlo para el rol "Vendedor"?
[Sí, activar] [No, mantener desactivado]
```

Estas recomendaciones aparecen SOLO para permisos marcados como "sensibles" (costos, márgenes, proveedores, datos financieros). Javier siempre tiene la última palabra — el sistema no bloquea nada, solo advierte.

#### Usuarios Iniciales del Sistema

El equipo actual de Evolution que necesitará usuarios en el setup inicial:

| # | Nombre | Email | Rol sugerido (template) | Notas |
|---|--------|-------|------------------------|-------|
| 1 | Javier Lange | javier@evolutionzl.com | **Admin Supremo** (fijo) | Dueño — acceso total |
| 2 | Estelia [apellido] | estelia@evolutionzl.com | Admin Supremo o Administrador | Javier decide su nivel de acceso |
| 3 | Jackie [apellido] | jackie@evolutionzl.com | Finanzas (template) | Javier ajusta permisos |
| 4 | Margarita Morelos | margarita@evolutionzl.com | Ventas (template) | Javier ajusta permisos |
| 5 | Arnold [apellido] | arnold@evolutionzl.com | Ventas (template) | Javier ajusta permisos |
| 6 | Celly [apellido] | celly@evolutionzl.com | Compras (template) | Javier ajusta permisos |
| 7 | Jesús [apellido] | jesus@evolutionzl.com | Almacén (template) | Javier ajusta permisos |
| 8 | Ariel [apellido] | ariel@evolutionzl.com | Logística (template) | Javier ajusta permisos |
| 9 | María [apellido] | maria@evolutionzl.com | Logística (template) | Javier ajusta permisos |

---

### 3.4 PARÁMETROS COMERCIALES — Configuración del Negocio

#### Niveles de Precio

**Configuración global (afecta todo el sistema de ventas):**

| Parámetro | Valor | Editable por | Descripción |
|-----------|-------|-------------|-------------|
| Cantidad de niveles | 5 (A, B, C, D, E) | Solo Admin | Estructura de niveles |
| Nombre Nivel A | Premium / VIP | Admin, Gerente | Etiqueta interna |
| Nombre Nivel B | Preferencial | Admin, Gerente | — |
| Nombre Nivel C | Estándar | Admin, Gerente | — |
| Nombre Nivel D | Volumen | Admin, Gerente | — |
| Nombre Nivel E | Mínimo | Admin, Gerente | Precio más bajo permitido |
| Nivel default para clientes nuevos | C (Estándar) | Admin, Gerente | Al crear un cliente sin nivel explícito |
| Permitir precio debajo de Nivel E | No (requiere aprobación) | Solo Admin | Protección de margen mínimo |

**Los precios por nivel se configuran en el módulo de Productos (Doc 02), no aquí.** Aquí solo se define la estructura y nombres de los niveles.

#### Comisiones

| Parámetro | Valor actual | Editable por | Descripción |
|-----------|-------------|-------------|-------------|
| Threshold de comisión | 10% margen | Admin, Gerente | Margen mínimo para que una venta comisione |
| Indicador visual | 🟢 ≥ 10% / 🔴 < 10% | Sistema | Colores del indicador en cotización |
| Mostrar % exacto al vendedor | No | Solo Admin | Si el vendedor ve "12.3%" o solo "🟢" |
| Período de liquidación | Mensual | Admin, Gerente | Cada cuánto se liquidan comisiones |

**% de comisión por vendedor se configura en la ficha de cada vendedor (Usuarios), no aquí.** Aquí solo van los parámetros globales del sistema de comisiones.

| Vendedor | % Comisión | Configura |
|----------|-----------|-----------|
| Margarita Morelos | [A definir con Javier] | Admin, Gerente |
| Arnold | [A definir con Javier] | Admin, Gerente |
| Javier Lange | 0% (es el dueño) | — |

#### Condiciones de Pago

**Opciones disponibles (catálogo configurable):**

| Código | Nombre | Días | Descripción |
|--------|--------|------|-------------|
| CONTADO | Contado | 0 | Pago inmediato |
| NET30 | Neto 30 días | 30 | Vencimiento a 30 días |
| NET60 | Neto 60 días | 60 | Vencimiento a 60 días |
| NET90 | Neto 90 días | 90 | Vencimiento a 90 días |

Gerencia puede agregar nuevas condiciones (NET15, NET45, etc.) desde esta configuración.

#### Impuestos

| Parámetro | Valor | Aplica a | Notas |
|-----------|-------|----------|-------|
| ITBMS (IVA panameño) | 7% | Ventas B2C locales | Zona Libre exenta para B2B |
| Exención Zona Libre | Activa | Ventas B2B | Facturas de Zona Franca sin impuesto |
| ITBMS en compras | Según proveedor | Compras locales | Crédito fiscal |

#### Numeración de Documentos

| Tipo de Documento | Prefijo | Secuencia actual | Formato ejemplo |
|-------------------|---------|-----------------|-----------------|
| Cotización | COT- | Auto-incremental | COT-2026-0001 |
| Pedido | PED- | Auto-incremental | PED-2026-0001 |
| Factura Zona Franca | FZL- | Auto-incremental | FZL-2026-0001 |
| Factura Fiscal | FF- | Auto-incremental | FF-2026-0001 |
| Recibo de Cobro | REC- | Auto-incremental | REC-2026-0001 |
| Nota de Crédito | NC- | Auto-incremental | NC-2026-0001 |
| Nota de Débito | ND- | Auto-incremental | ND-2026-0001 |
| Orden de Compra | OC- | Auto-incremental | OC-2026-0001 |
| Ajuste de Inventario | AJ- | Auto-incremental | AJ-2026-0001 |
| Transferencia | TR- | Auto-incremental | TR-2026-0001 |
| Asiento Contable | AC- | Auto-incremental | AC-2026-0001 |
| Cliente | CLI- | Auto-incremental | CLI-0001 |
| Producto | PRD- | Auto-incremental | PRD-0001 |

**Configuración:** Gerencia puede cambiar prefijos y el año en la secuencia. Las secuencias pueden reiniciarse anualmente o ser continuas.

---

### 3.5 FLUJOS DE APROBACIÓN — Configuración de Workflows

**Cada flujo es activable/desactivable y configurable:**

#### Flujo 1: Aprobación de Cotización

| Parámetro | Valor default | Configurable |
|-----------|--------------|-------------|
| Activo | Sí | Admin, Gerente |
| Requiere aprobación | Siempre / Solo si precio < Nivel E / Solo si monto > $X | Dropdown |
| Aprobador | Gerencia (Javier o Estelia) | Dropdown de roles |
| Notificación al aprobador | Sí (in-app + email) | Toggle |
| Tiempo máximo de respuesta | 24 horas (luego escala) | Input numérico |

#### Flujo 2: Aprobación de Pedido

| Parámetro | Valor default | Configurable |
|-----------|--------------|-------------|
| Activo | Sí | Admin, Gerente |
| Requiere aprobación | Siempre | Dropdown |
| Aprobador | Gerencia | Dropdown de roles |
| Validar stock al aprobar | Sí | Toggle |
| Validar crédito del cliente | Sí | Toggle |

#### Flujo 3: Aprobación de Ajustes de Inventario

| Parámetro | Valor default | Configurable |
|-----------|--------------|-------------|
| Activo | Sí | Admin, Gerente |
| Requiere aprobación | Siempre | No desactivable (regla de negocio) |
| Aprobador | Gerencia | Dropdown de roles |
| Motivo obligatorio | Sí | No desactivable |

#### Flujo 4: Aprobación de Anulaciones

| Parámetro | Valor default | Configurable |
|-----------|--------------|-------------|
| Activo | Sí | No desactivable (control financiero) |
| Aprobador estándar | Gerencia (Javier o Estelia) | Dropdown de roles |
| Umbral para aprobación de Javier | $5,000 | Input numérico |
| Motivos predefinidos | Error de registro, Duplicado, Devolución, Ajuste, Otro | Lista editable |
| Motivo obligatorio | Sí | No desactivable |

#### Flujo 5: Aprobación de Cierres Contables

| Parámetro | Valor default | Configurable |
|-----------|--------------|-------------|
| Cierre mensual — solicitante | Jackie (Contabilidad) | Rol |
| Cierre mensual — aprobador | Javier o Estelia | Rol |
| Cierre anual — aprobador | Solo Javier | No configurable |
| Checklist pre-cierre obligatorio | Sí | No desactivable |

#### Flujo 6: Excepciones de Precio

| Parámetro | Valor default | Configurable |
|-----------|--------------|-------------|
| Activo | Sí | Admin |
| Se activa cuando | Precio < Nivel E del producto | No configurable |
| Aprobador | Gerencia | Dropdown |
| Registro de motivo | Obligatorio | No desactivable |

---

### 3.6 CATÁLOGOS MAESTROS

**Todos los catálogos son administrables desde Configuración con operaciones estándar: Ver lista, Crear, Editar, Desactivar (nunca eliminar — mantiene integridad referencial).**

#### Países y Ciudades
- Fuente: ISO 3166 precargado (datos limpios — resuelve el problema de "F" como país)
- Editable: Gerencia puede agregar países/ciudades que falten
- Reemplaza: Registro de Áreas/Sub-Áreas de Dynamo (completamente corrupto)

#### Marcas
- Catálogo de marcas de productos comercializados
- Reemplaza: Registro de Marcas de Dynamo (solo 6 de cientos, JP CHENET como default)
- Se vincula automáticamente al crear/importar productos

#### Proveedores
- Catálogo maestro de proveedores (nombre, país, contacto, condiciones de pago)
- Reemplaza: datos de proveedor embebidos en productos y órdenes de compra
- Confidencial: vendedores NO ven este catálogo

#### Aranceles
- Códigos aduaneros (HS codes) para clasificación de productos
- Migrar desde: Catálogo de Aranceles de Dynamo (bien mantenido — 2208309000 whisky, etc.)
- Usado en: documentación de tráfico e importación

#### Bancos
- Los 11 bancos activos de Evolution (más nuevos que se agreguen)
- Cada banco con: código contable, nombre, cuenta bancaria, moneda, activo/inactivo
- Alimenta: conciliación bancaria, registro de cobros, tesorería

#### Tipos de Documento y Formas de Pago
- Catálogos auxiliares que alimentan dropdowns en todo el sistema
- Tipos: Factura ZL, Factura Fiscal, Cotización, Pedido, NC, ND, Recibo, etc.
- Formas: Transferencia, Cheque, Efectivo, Tarjeta, etc.

#### Motivos de Anulación
- Lista predefinida de razones para anular transacciones
- Obligatorio seleccionar uno al solicitar anulación
- Gerencia puede agregar nuevos motivos

---

### 3.7 NOTIFICACIONES Y ALERTAS

**Eventos que generan notificación:**

| Evento | Destinatario | Canal | Prioridad |
|--------|-------------|-------|-----------|
| Nueva cotización requiere aprobación | Gerencia | In-app + email | Alta |
| Nuevo pedido requiere aprobación | Gerencia | In-app + email | Alta |
| Solicitud de anulación | Gerencia (aprobador) | In-app + email | Alta |
| Cliente excede límite de crédito | Gerencia + Contabilidad | In-app | Alta |
| Factura vencida (primer aviso) | Contabilidad | In-app | Media |
| Factura vencida 30+ días | Gerencia + Contabilidad | In-app + email | Alta |
| Stock bajo mínimo | Compras | In-app | Media |
| Ajuste de inventario requiere aprobación | Gerencia | In-app | Media |
| Conciliación bancaria pendiente | Contabilidad | In-app | Baja (semanal) |
| Cierre mensual pendiente | Contabilidad + Gerencia | In-app | Media (mensual) |
| Nuevo cobro registrado | Gerencia | In-app | Baja |
| Cotización aprobada | Vendedor (solicitante) | In-app | Media |
| Cotización rechazada | Vendedor (solicitante) | In-app | Media |

**Configuración por usuario:**
- Cada usuario puede silenciar notificaciones de baja prioridad
- Las de alta prioridad no son silenciables (control financiero)
- Email configurable: inmediato / resumen diario / desactivado

---

### 3.8 AUDITORÍA Y SEGURIDAD

#### Log de Auditoría

**Cada acción en el sistema genera un registro de auditoría automático:**

| Campo | Descripción |
|-------|-------------|
| Fecha y hora | Timestamp exacto (con zona horaria) |
| Usuario | Quién ejecutó la acción |
| Módulo | En qué módulo (Ventas, Clientes, Inventario, etc.) |
| Acción | Qué hizo (Crear, Editar, Eliminar, Aprobar, Rechazar, Anular, Login, etc.) |
| Registro afectado | ID del documento/cliente/producto afectado |
| Cambios | Detalle de qué cambió (valor anterior → valor nuevo) |
| IP / Dispositivo | Desde dónde se conectó |

**Acciones que SIEMPRE se registran (no configurables):**
- Login / logout
- Creación de usuarios
- Cambio de roles o permisos
- Anulación de cualquier transacción (con motivo y aprobador)
- Cambio de precios en cotizaciones por debajo del nivel E
- Ajustes de inventario
- Cambios en datos financieros de clientes (crédito, nivel precio)
- Cierres contables
- Exportación masiva de datos

**Vista del log:** Solo Administrador y Gerente. Filtrable por fecha, usuario, módulo, tipo de acción. Exportable a Excel para auditorías externas.

#### Historial de Cambios por Registro

Cada ficha (cliente, producto, factura, etc.) tiene un tab o sección "Historial" que muestra todos los cambios realizados sobre ese registro: quién, cuándo, qué campo, valor anterior, valor nuevo. Esto reemplaza la total ausencia de audit trail en Dynamo.

#### Políticas de Contraseña

| Parámetro | Valor default | Configurable |
|-----------|--------------|-------------|
| Largo mínimo | 8 caracteres | Sí (Admin) |
| Requiere mayúscula + número | Sí | Sí |
| Expiración de contraseña | 90 días | Sí (0 = nunca) |
| Intentos fallidos antes de bloqueo | 5 | Sí |
| Tiempo de bloqueo | 30 minutos | Sí |
| Autenticación de dos factores (2FA) | Opcional | Sí (puede hacerse obligatorio) |

---

### 3.9 SISTEMA — Administración Técnica

#### Información de la Plataforma
- Versión del sistema
- Estado de los servicios
- Uso de almacenamiento
- Últimas actualizaciones

#### Importación / Exportación de Datos
- Importar clientes desde Excel (para migración inicial de Dynamo)
- Importar productos desde Excel
- Importar plan de cuentas desde Excel
- Exportar cualquier tabla a Excel/CSV
- Exportar backup completo (solo Admin)

#### Integraciones (Futuro)
- API REST para conectar con otros sistemas
- Webhooks para eventos (nueva factura, nuevo cobro, etc.)
- Integración con email (envío de facturas, estados de cuenta)
- Integración con servicios bancarios (cuando disponible en Panamá)

---

## 4. INTERFAZ DE CONFIGURACIÓN — UX

### Navegación

La Configuración se accede desde un ícono de engranaje (⚙️) en el sidebar principal o header. Internamente, la navegación es por secciones con tabs verticales a la izquierda:

```
⚙️ Configuración
├── 🏢 Mi Empresa
├── 👥 Usuarios y Roles
│   ├── Usuarios
│   └── Roles y Permisos
├── 💰 Parámetros Comerciales
│   ├── Niveles de Precio
│   ├── Comisiones
│   ├── Condiciones de Pago
│   ├── Impuestos
│   ├── Monedas
│   └── Numeración
├── ✅ Flujos de Aprobación
├── 📋 Catálogos
│   ├── Países/Ciudades
│   ├── Marcas
│   ├── Proveedores
│   ├── Aranceles
│   ├── Bancos
│   └── Tipos y Formas
├── 🔔 Notificaciones
├── 🔒 Auditoría
└── ⚡ Sistema
```

### Principios de UX

1. **Simplicidad:** Cada sección tiene una pantalla limpia con los parámetros relevantes. No hay menús anidados de 3+ niveles.

2. **Cambios con confirmación:** Todo cambio de configuración requiere un click de "Guardar" + confirmación. Los cambios de rol/permiso muestran un resumen de impacto antes de aplicar.

3. **Cambios con audit trail:** Todo cambio de configuración queda registrado en el log de auditoría.

4. **Valores default inteligentes:** El sistema viene preconfigurado con valores sensibles para una empresa como Evolution. Javier puede modificar lo que necesite.

5. **Ayuda contextual:** Cada parámetro tiene un tooltip explicando qué hace y cuál es el impacto de cambiarlo.

---

## 5. MIGRACIÓN DESDE DYNAMO

### Datos a migrar al módulo de Configuración:

| Dato | Fuente en Dynamo | Destino en EvolutionOS | Acción |
|------|-----------------|----------------------|--------|
| Usuarios | Pre-configurados por programador | Configuración → Usuarios | Crear manualmente (son <10) |
| Plan de cuentas | Catálogo de Cuentas (2.2) | Configuración → Catálogos | Importar Excel |
| Bancos | Control de Cheques (11 bancos) | Configuración → Catálogos → Bancos | Migrar los 11 activos |
| Aranceles | Catálogo de Aranceles (Doc 04) | Configuración → Catálogos | Importar Excel |
| Vendedores | Registro de Vendedores (5) | Configuración → Usuarios | Crear como usuarios con rol Vendedor |
| Áreas/Sub-Áreas | Registro corrupto | Configuración → Países/Ciudades | NO migrar — usar ISO 3166 limpio |
| Marcas | Registro de Marcas (6 de cientos) | Configuración → Marcas | NO migrar — reconstruir |
| Códigos de cliente | Inconsistentes (1006, A777, CL-411) | Auto-generados (CLI-XXXX) | Tabla de mapeo old→new |
| Numeración de facturas | Secuencial en Dynamo (4418+) | Nueva numeración (FZL-2026-XXXX) | Continuar desde último + 1 |

### Orden de configuración para go-live:

```
1. Crear empresa (Mi Empresa)
2. Configurar plan de cuentas (importar de Dynamo + ajustar)
3. Configurar bancos (11 activos)
4. Configurar parámetros comerciales (niveles, comisiones, impuestos)
5. Crear roles (7 predefinidos)
6. Crear usuarios (8-10 personas)
7. Configurar flujos de aprobación
8. Configurar catálogos (países, marcas, aranceles, proveedores)
9. Configurar numeración de documentos
10. Configurar notificaciones
11. Pruebas de permisos por rol
12. Go-live
```

---

## 6. PREGUNTAS PENDIENTES PARA JAVIER

| # | Pregunta | Por qué importa |
|---|----------|-----------------|
| 1 | ¿Quiénes son EXACTAMENTE los usuarios que necesitan acceso al sistema? Nombres, roles, emails. | Para crear la lista inicial de usuarios |
| 2 | ¿Estelia puede aprobar todo lo que Javier aprueba? ¿O hay cosas reservadas solo para Javier? | Define la diferencia entre Admin y Gerente |
| 3 | ¿Margarita y Arnold deben ver los mismos datos? ¿O hay diferencias entre vendedores? | Define si un solo rol "Vendedor" basta o necesitan variantes |
| 4 | ¿Los vendedores pueden ver el saldo/deuda de sus propios clientes? | Define el nivel de acceso a CxC para vendedores |
| 5 | ¿Quién más además de Jackie puede registrar cobros? ¿Estelia? | Define los permisos de CxC |
| 6 | ¿Quieren autenticación de dos factores (2FA) desde el inicio? | Define la política de seguridad |
| 7 | ¿El % de comisión es igual para todos los vendedores o diferente? ¿Cuánto? | Para configurar comisiones por vendedor |
| 8 | ¿Ariel y María (tráfico) necesitan acceso al sistema? ¿A qué partes? | Define si el rol Tráfico es necesario ahora o futuro |
| 9 | ¿Hay alguna persona externa (contador, auditor) que necesite acceso de solo lectura? | Define si se necesita un rol "Auditor Externo" |
| 10 | ¿Javier quiere recibir notificación de cada cotización/pedido o solo las que requieren su aprobación? | Configura las notificaciones del admin |

---

## FIN DEL DOCUMENTO 08

Este documento cubre la totalidad del módulo de Configuración y Administración del Sistema: gestión de usuarios y roles con permisos granulares hasta nivel de campo, parámetros comerciales configurables (niveles de precio, comisiones, impuestos, numeración), flujos de aprobación personalizables, catálogos maestros, notificaciones, y auditoría completa. Todo lo que Dynamo no tiene y que Evolution necesita para operar de forma autónoma sin depender de un programador externo.
