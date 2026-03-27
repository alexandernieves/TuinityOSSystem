# DOCUMENTO 09 — MÓDULO: TRÁFICO Y DOCUMENTACIÓN

## Contexto
Este documento especifica el módulo de Tráfico y Documentación para la nueva plataforma de Evolution Zona Libre. Este módulo NO EXISTE en Dynamo — es completamente nuevo. En Dynamo, la funcionalidad de tráfico está fragmentada en pedazos dispersos entre Ventas (un submódulo de DMC que nunca se terminó), la Lista de Empaque (dentro del pipeline de ventas), y procesos completamente manuales fuera del sistema (Excel, plataforma gubernamental, documentos Word).

Este módulo es el **puente final entre la operación comercial y la entrega física de mercancía**. Sin documentación aduanal correcta, NADA sale de la Zona Libre de Colón. No importa que la cotización esté perfecta, que el pedido esté aprobado, que la factura esté emitida — si Ariel no genera el DMC, la mercancía no se mueve. Es así de simple.

**Prerequisito:** Leer Documentos 01 a 08 y el Documento Maestro antes de este documento. Especialmente las secciones 11 (La documentación de tráfico de Zona Libre) y 13 (La matriz de roles y permisos) del Doc 01, la sección 4.12 (Pre-llenado para DMC) del Doc 05, y el rol Logística del Doc 08.

---

## 1. QUÉ REEMPLAZA ESTE MÓDULO EN DYNAMO

### La realidad: No hay módulo de Tráfico en Dynamo

En Dynamo, no existe un módulo dedicado a tráfico. Lo que existe son fragmentos dispersos:

| Fragmento en Dynamo | Dónde está | Estado | Qué hace (o debería hacer) |
|---------------------|-----------|--------|---------------------------|
| DMC - Movimiento Comercial | Ventas → submódulo #9 | ❌ NUNCA TERMINADO — iniciado pero abandonado | Debía generar DMC desde facturas. Nunca se completó |
| Lista de Empaque | Ventas → submódulo #5 | Funciona (limitado) | Genera packing list, pero NO agrupado por arancelaria |
| Campo "Despacho" en pedidos | Ventas → Aprobación de Pedidos | Funciona | Indica tipo: SALIDA, TRASPASO — define qué tipo de DMC |
| Código arancelario en producto | Inventario → Ficha de producto | Funciona | Campo "Arancel" (ej: 2208309000). Obligatorio por ley |
| Datos del cliente | Clientes → Consulta | Funciona | Consignatario, país destino, datos fiscales |
| Datos de Evolution | Configuración (hardcoded) | Funciona | Embarcador, dirección en ZL, RUC |

**El resultado:** Ariel toma datos de 6 lugares diferentes en Dynamo, los copia manualmente a Excel, los reformatea, completa campos a mano, y los sube a la plataforma del gobierno. Un solo DMC toma 15-20 minutos. Si hay error o cambio, todo se repite desde cero.

**Total en Dynamo:** 0 pantallas dedicadas a tráfico (1 submódulo abandonado + procesos 100% manuales)

**En la nueva plataforma:** Un módulo completo de **TRÁFICO Y DOCUMENTACIÓN** que centraliza todo lo que Ariel y María necesitan para mover mercancía legal y eficientemente: DMC (entrada, salida, traspaso), Bill of Lading, Certificado de Libre Venta, seguimiento de embarques, y gestión documental completa. Todo pre-llenado automáticamente desde los datos que ya existen en el sistema.

---

## 2. LAS PERSONAS DE TRÁFICO — QUIÉN HACE QUÉ

### Ariel — Departamento de Tráfico (principal)
Entrevistado directamente durante la fase de discovery. Es quien ejecuta toda la documentación regulatoria de Zona Libre.

**Responsabilidades diarias:**
- Genera DMC de Salida para cada venta que sale de la Zona Libre
- Genera DMC de Entrada para cada importación que llega de proveedores internacionales
- Genera DMC de Traspaso para movimientos entre empresas relacionadas dentro de ZL (Evolution ↔ Mainz/Malta/Milano)
- Genera Bill of Lading (BL) para embarques marítimos
- Genera Certificado de Libre Venta cuando el destino lo requiere (ej: San Andrés, Colombia)
- Coordina con bodega la preparación física del despacho
- Coordina con el vendedor los detalles de cada embarque
- Interactúa con la plataforma gubernamental de Zona Libre para registrar movimientos

**Sus 7 dolores principales con el sistema actual (confirmados en entrevista):**

1. **DMC 100% manual — 15-20 minutos cada uno.** Toma datos de Dynamo, los pasa a Excel, reformatea, completa campos a mano, sube a plataforma del gobierno. Todo se duplica
2. **Lista de empaque desordenada.** Viene mezclada — no está agrupada por código arancelario, que es EXACTAMENTE como la necesita para el DMC. Tiene que reordenar manualmente cada vez
3. **Cambios post-factura destruyen TODO.** Cuando un cliente pide cambios después de que ya se facturó y se hizo la documentación: desaprobar → eliminar factura → hacer cambios → re-aprobar → re-facturar → anular DMC → hacer DMC nuevo desde cero. Horas de trabajo perdidas
4. **No puede trabajar en múltiples documentos simultáneamente.** Si tiene 3 embarques pendientes, tiene que terminar uno para empezar el siguiente
5. **No puede preparar con anticipación.** Sabe que un embarque grande viene la próxima semana pero no puede empezar el DMC hasta que la factura esté lista
6. **Datos recurrentes se re-ingresan cada vez.** El mismo consignatario, el mismo embarcador, el mismo booking — todo se teclea desde cero para cada documento
7. **Sin visibilidad de estado.** No sabe cuántos documentos tiene pendientes, cuáles ya están completos, cuáles tienen problemas

**Lo que necesita del nuevo sistema (los 7 requerimientos confirmados):**

1. Generación automática de DMC pre-llenado desde factura + lista de empaque
2. Lista de empaque agrupada por categoría arancelaria, no mezclada
3. BL pre-llenado reutilizando datos recurrentes del cliente (consignatario, embarcador, booking)
4. Certificado de Libre Venta automático cuando el destino lo requiere
5. Modificación post-aprobación sin destruir todo el pipeline — mecanismo de "enmiendas" que registre qué cambió y quién autorizó
6. Poder trabajar en múltiples documentos de tráfico simultáneamente
7. Preparación anticipada: empezar DMC con días de anticipación para embarques grandes

### María — Tráfico / Logística (apoyo)
No fue entrevistada por separado. Apoya a Ariel en tráfico y documentación de despacho. Necesita acceso al mismo módulo con los mismos permisos.

### Jackie — Contabilidad (conocimiento de tráfico)
Tiene conocimiento del área de tráfico según lo documentado. Puede necesitar acceso de consulta al módulo para verificación o auditoría.

---

## 3. LA DOCUMENTACIÓN REGULATORIA DE ZONA LIBRE — MARCO COMPLETO

La Zona Libre de Colón opera bajo regulaciones especiales del gobierno de Panamá. Toda mercancía que entra, sale, o se mueve dentro de la zona requiere documentación oficial. Sin esta documentación, la mercancía queda retenida.

### 3.1 DMC — Declaración de Movimiento Comercial

El DMC es el documento central de toda la operación de tráfico. Es el equivalente aduanal de una factura — sin DMC, la mercancía no se mueve legalmente.

**Tres tipos de DMC:**

| Tipo | Cuándo se usa | Origen → Destino | Documento base | Frecuencia estimada |
|------|--------------|-------------------|----------------|---------------------|
| **DMC de Salida** | Toda venta que sale de la Zona Libre | Evolution ZL → Cliente internacional | Factura de venta + Lista de empaque | Alta — cada venta B2B genera uno |
| **DMC de Entrada** | Toda importación que llega a la Zona Libre | Proveedor internacional → Evolution ZL | Orden de compra + Factura del proveedor | Media — cada contenedor que llega |
| **DMC de Traspaso** | Movimiento entre empresas dentro de ZL | Evolution ↔ Mainz / Malta / Milano | Documento interno de transferencia | Variable — según operaciones internas |

**Datos que requiere un DMC (campos conocidos por la exploración):**

**Sección: Datos del movimiento**
| Campo | Origen del dato | Pre-llenable |
|-------|----------------|--------------|
| Tipo de movimiento | Salida / Entrada / Traspaso | ✓ Auto (del tipo de operación) |
| Número de DMC | Asignado por plataforma gubernamental | ✗ Se obtiene al registrar |
| Fecha | Fecha del despacho | ✓ Auto (fecha de factura o configurada) |
| Empresa origen | Evolution Zona Libre | ✓ Auto (datos de la empresa) |
| Empresa destino / Consignatario | Datos del cliente o empresa relacionada | ✓ Auto (del registro del cliente) |

**Sección: Datos del embarque**
| Campo | Origen del dato | Pre-llenable |
|-------|----------------|--------------|
| Embarcador | Evolution ZL (datos fijos) | ✓ Auto |
| Consignatario | Nombre y datos del cliente/comprador | ✓ Auto (del cliente) |
| País destino | País del cliente | ✓ Auto (del cliente) |
| Puerto de embarque | Puerto de la Zona Libre | ✓ Auto (configuración) |
| Puerto destino | Depende del cliente | ✓ Parcial (del historial del cliente) |
| Booking number | Número de reserva del naviero | ✗ Manual (cada embarque es diferente) |
| Nombre del barco/naviera | Datos del transporte | ✗ Manual (varía) |
| Fecha estimada de salida | Planificación | ✗ Manual |

**Sección: Detalle de mercancía (POR CÓDIGO ARANCELARIO)**
| Campo | Origen del dato | Pre-llenable |
|-------|----------------|--------------|
| Código arancelario | Ficha de producto | ✓ Auto |
| Descripción del grupo arancelario | Catálogo de aranceles | ✓ Auto |
| Cantidad de bultos | Lista de empaque | ✓ Auto |
| Cantidad de unidades (cajas) | Lista de empaque | ✓ Auto |
| Peso neto (kg) | Ficha de producto × cantidad | ✓ Auto-calculable |
| Peso bruto (kg) | Peso neto + embalaje | ✓ Auto-calculable (con factor) |
| Volumen (m³ o ft³) | Dimensiones de producto × cantidad | ✓ Auto-calculable |
| Valor FOB (USD) | Precio de la factura | ✓ Auto |

**Hallazgo crítico:** El DMC agrupa productos POR CÓDIGO ARANCELARIO, no por producto individual. Esto significa que si una factura tiene 5 whiskys diferentes, todos con el mismo arancel 2208309000, aparecen como UNA SOLA línea en el DMC con cantidades agregadas. Por eso Ariel necesita la lista de empaque agrupada por arancelaria — es el formato que el DMC exige.

### 3.2 BL — Bill of Lading

El Bill of Lading es el documento de transporte marítimo. Lo emite la naviera, pero Ariel necesita consolidar la información para solicitarlo.

**Datos que requiere el BL:**

| Campo | Origen del dato | Pre-llenable |
|-------|----------------|--------------|
| Shipper (embarcador) | Evolution ZL — datos fijos | ✓ Auto |
| Consignee (consignatario) | Datos del cliente | ✓ Auto (del registro del cliente) |
| Notify party | Quien recibe notificación de llegada | ✓ Parcial (generalmente el mismo consignatario) |
| Port of loading | Puerto de Zona Libre | ✓ Auto |
| Port of discharge | Puerto destino | ✓ Parcial (del historial del cliente) |
| Vessel name | Nombre del barco | ✗ Manual (varía por embarque) |
| Voyage number | Número de viaje | ✗ Manual |
| Booking number | Referencia de reserva | ✗ Manual (o del DMC si ya se llenó) |
| Description of goods | Descripción general de la mercancía | ✓ Auto (agrupado por arancelaria) |
| Number of packages | Total de bultos | ✓ Auto (de la lista de empaque) |
| Gross weight | Peso bruto total | ✓ Auto-calculable |
| Volume/Measurement | Volumen total | ✓ Auto-calculable |

**Dato importante:** Muchos campos del BL se repiten entre embarques al mismo cliente. El mismo consignatario, el mismo puerto destino, a veces la misma naviera. El sistema debe reutilizar estos datos recurrentes — es el requerimiento #3 de Ariel.

### 3.3 Certificado de Libre Venta

Requerido por ciertos destinos (confirmado: San Andrés, Colombia). Lo emite el Ministerio de Salud de Panamá para certificar que la mercancía es apta para consumo.

**Datos que requiere:**

| Campo | Origen del dato | Pre-llenable |
|-------|----------------|--------------|
| Empresa exportadora | Evolution ZL | ✓ Auto |
| Destino | País/región del cliente | ✓ Auto |
| Descripción de productos | Detalle de mercancía con registro sanitario | ✓ Parcial |
| Cantidad | Cantidades del embarque | ✓ Auto |
| Número de factura comercial | Factura de venta | ✓ Auto |
| Registro sanitario | Registro de cada producto ante MinSalud | ✗ Requiere catálogo |

**Pregunta pendiente (del Doc 01, pregunta #11):** ¿Cuáles son EXACTAMENTE los destinos que requieren Certificado de Libre Venta? Confirmado San Andrés (Colombia). ¿Cuáles otros? Esto define la lógica automática de cuándo el sistema solicita este documento.

### 3.4 Otros Documentos Potenciales

Basado en la operación de comercio internacional de Zona Libre, estos documentos adicionales podrían ser necesarios (pendiente confirmar con Ariel):

| Documento | Posible uso | Prioridad |
|-----------|------------|-----------|
| Factura comercial (copia para tráfico) | Acompaña al DMC como soporte | Alta — probablemente ya se hace |
| Packing list oficial (para aduana) | Versión formal de la lista de empaque | Alta |
| Certificado de origen | Requerido por ciertos destinos/productos | Media |
| Permisos especiales de alcohol | Licencias de exportación de licores | Pendiente verificar |
| Documentación fitosanitaria | Para productos alimenticios (Pringles, etc.) | Baja — pocos productos aplican |

---

## 4. FLUJOS DE TRABAJO DE TRÁFICO — CÓMO OPERA HOY vs. CÓMO DEBE OPERAR

### 4.1 Flujo Actual (manual, fuera del sistema)

```
VENDEDOR genera factura en Dynamo
        ↓
ARIEL abre Dynamo, busca la factura
        ↓
ARIEL abre la lista de empaque (NO agrupada por arancelaria)
        ↓
ARIEL copia datos a Excel: productos, cantidades, pesos
        ↓
ARIEL reordena manualmente por código arancelario
        ↓
ARIEL agrega datos que NO están en Dynamo:
   - Booking number, barco, naviera
   - Consignatario (lo saca del registro del cliente)
   - Puerto destino
   - Peso bruto (calcula manualmente)
        ↓
ARIEL abre la plataforma gubernamental de ZL
        ↓
ARIEL transcribe TODOS los datos del Excel a la plataforma
        ↓
DMC generado (15-20 minutos desde que empezó)
        ↓
Si hay error → corregir en plataforma o anular y rehacer
Si el cliente pide cambio → TODO se destruye y se repite
```

**Tiempo por DMC:** 15-20 minutos
**Si hay cambio post-factura:** Hasta 1-2 horas (desaprobar + eliminar + cambiar + re-aprobar + re-facturar + anular DMC + rehacer DMC)

### 4.2 Flujo Nuevo (automatizado en EvolutionOS)

```
VENDEDOR genera factura → Sistema notifica a TRÁFICO automáticamente
        ↓
ARIEL abre módulo de Tráfico → ve factura en cola "Pendiente documentación"
        ↓
Click "Generar DMC" → Sistema pre-llena AUTOMÁTICAMENTE:
   ✓ Productos agrupados por código arancelario (de la factura + ficha de producto)
   ✓ Cantidades agregadas por grupo arancelario (de la lista de empaque)
   ✓ Pesos netos y brutos por grupo (de la ficha del producto × cantidad)
   ✓ Cubicaje por grupo (de las dimensiones del producto × cantidad)
   ✓ Datos del consignatario (del registro del cliente)
   ✓ Datos del embarcador (de la configuración de la empresa)
   ✓ Número de factura y fecha (de la factura)
   ✓ País destino (del registro del cliente)
   ✓ Puerto destino (del historial del cliente o manual)
        ↓
ARIEL solo completa los datos variables:
   → Booking number
   → Nombre del barco / naviera
   → Fecha estimada de salida
   → Ajustes menores si aplica
        ↓
Click "Guardar" → DMC queda registrado en el sistema
        ↓
ARIEL puede exportar/copiar datos formateados para la plataforma gubernamental
        ↓
DMC completado (2-3 minutos vs. 15-20)
```

**Tiempo por DMC:** 2-3 minutos (reducción del 85%)
**Si hay cambio post-factura:** Sistema notifica a Tráfico → Ariel ve qué cambió → ajusta solo los campos afectados → no se destruye nada

### 4.3 Flujo de DMC de Entrada (Importaciones)

```
CELLY registra recepción de mercancía (Módulo de Compras)
        ↓
Sistema detecta que es mercancía entrando a ZL → crea borrador de DMC de Entrada
        ↓
ARIEL abre Tráfico → ve recepción en cola "Pendiente DMC Entrada"
        ↓
Sistema pre-llena:
   ✓ Proveedor como remitente (de la orden de compra)
   ✓ Evolution como destinatario (configuración)
   ✓ Productos por arancelaria (de la factura del proveedor)
   ✓ Cantidades, pesos, volúmenes
   ✓ Número de factura del proveedor
        ↓
ARIEL completa datos de transporte y registra en plataforma gubernamental
```

### 4.4 Flujo de DMC de Traspaso (entre empresas de ZL)

```
Se crea transferencia interna: Evolution → Mainz / Malta / Milano (o viceversa)
        ↓
Sistema detecta que es movimiento entre empresas de ZL → crea borrador DMC Traspaso
        ↓
ARIEL abre Tráfico → ve en cola "Pendiente DMC Traspaso"
        ↓
Sistema pre-llena:
   ✓ Empresa origen y destino
   ✓ Productos por arancelaria
   ✓ Cantidades, pesos, volúmenes
        ↓
ARIEL completa y registra
```

**Pregunta pendiente (del Doc 01, pregunta #8):** ¿Mainz, Malta y Milano son subsidiarias, empresas relacionadas, o simplemente clientes? La respuesta define si los traspasos son internos (sin valor comercial) o tienen valor declarado. Esto afecta el formato del DMC de Traspaso.

### 4.5 Flujo de Bill of Lading

```
DMC de Salida generado
        ↓
ARIEL abre "Generar BL" desde el mismo embarque
        ↓
Sistema pre-llena:
   ✓ Shipper: Evolution ZL (configuración)
   ✓ Consignee: del registro del cliente
   ✓ Port of loading: ZL (configuración)
   ✓ Port of discharge: del historial del cliente
   ✓ Description of goods: del DMC (ya agrupado por arancelaria)
   ✓ Number of packages: del empaque
   ✓ Weights & measures: calculados
        ↓
ARIEL completa:
   → Vessel name, Voyage number
   → Booking number (si no se llenó en el DMC)
   → Ajustes
        ↓
BL registrado en el sistema → listo para enviar a naviera
```

### 4.6 Flujo de Certificado de Libre Venta

```
DMC de Salida generado para destino que lo requiere (ej: San Andrés, Colombia)
        ↓
Sistema detecta automáticamente que el destino requiere Certificado
        ↓
Alerta a ARIEL: "Este embarque requiere Certificado de Libre Venta"
        ↓
Sistema pre-llena formulario con datos del embarque
        ↓
ARIEL verifica registros sanitarios de los productos
        ↓
Certificado registrado → adjunto al expediente del embarque
```

---

## 5. ESPECIFICACIÓN DE LA NUEVA PLATAFORMA — MÓDULO TRÁFICO Y DOCUMENTACIÓN

### 5.1 Arquitectura del Módulo

```
TRÁFICO Y DOCUMENTACIÓN
├── Dashboard de Tráfico (vista principal)
│   ├── KPIs de tráfico
│   ├── Cola de trabajo (pendientes)
│   └── Acciones rápidas
│
├── Expedientes de Embarque
│   ├── Lista de embarques (con estados)
│   ├── Detalle de embarque (ficha completa)
│   ├── Documentos asociados
│   └── Timeline/historial
│
├── DMC — Declaración de Movimiento Comercial
│   ├── DMC de Salida (desde factura de venta)
│   ├── DMC de Entrada (desde recepción de compra)
│   ├── DMC de Traspaso (desde transferencia entre empresas ZL)
│   └── Consulta/búsqueda de DMC emitidos
│
├── Bill of Lading
│   ├── Crear BL (desde DMC o embarque)
│   ├── Templates de BL por cliente/ruta
│   └── Consulta de BL emitidos
│
├── Certificados
│   ├── Certificado de Libre Venta
│   ├── Otros certificados (según necesidad)
│   └── Catálogo de requisitos por destino
│
├── Transferencias entre Bodegas
│   ├── Transferencias internas (Evolution B2B ↔ B2C)
│   ├── Traspasos entre empresas ZL (Evolution ↔ Mainz/Malta/Milano)
│   └── Historial de transferencias
│
└── Configuración de Tráfico
    ├── Datos del embarcador (Evolution)
    ├── Puertos frecuentes
    ├── Navieras frecuentes
    ├── Requisitos por destino
    └── Templates de documentos
```

### 5.2 Dashboard de Tráfico — Vista Principal

**Para quién:** Ariel, María (rol Logística)

**KPIs en la parte superior (stat cards):**

| KPI | Qué muestra | Cálculo |
|-----|------------|---------|
| Pendientes hoy | Embarques sin documentación completa | Count de embarques donde status ≠ "Completo" |
| DMC pendientes | DMC que faltan generar | Count de facturas/recepciones sin DMC asociado |
| Embarques en tránsito | Mercancía que ya salió pero no ha llegado | Count de embarques con status "En tránsito" |
| Completados esta semana | Embarques con toda la documentación lista | Count semanal de status = "Completo" |

**Cola de trabajo (tabla principal):**

La tabla muestra TODOS los ítems que requieren acción de tráfico, ordenados por urgencia:

| Columna | Descripción |
|---------|-------------|
| Prioridad | 🔴 Urgente / 🟡 Normal / 🟢 Anticipado |
| Tipo | Salida / Entrada / Traspaso / Transferencia |
| Referencia | Número de factura, OC, o transferencia |
| Cliente/Proveedor | Nombre de la contraparte |
| Destino/Origen | País o empresa |
| Productos | Cantidad de líneas/ítems |
| Documentos | Iconos de estado: ✅ DMC / ⏳ BL / ❌ Cert |
| Fecha estimada | Fecha planificada de despacho |
| Status | Borrador / En proceso / Completo / Problema |
| Acciones | Botones contextuales |

**Filtros rápidos (badges tipo toggle):**
- Todo | Pendientes | En proceso | Completados
- Salidas | Entradas | Traspasos | Transferencias
- Esta semana | Este mes | Rango personalizado

**Acciones rápidas desde el dashboard:**
- Desde cualquier fila: click directo a "Generar DMC" / "Ver expediente" / "Generar BL"
- La fila se expande al hacer click para mostrar resumen sin abrir ficha completa

### 5.3 Expediente de Embarque — Concepto Central

**El Expediente de Embarque es la entidad central del módulo de Tráfico.** Agrupa TODOS los documentos y datos relacionados con un movimiento de mercancía.

Un expediente se crea automáticamente cuando:
- Se genera una factura de venta B2B → Expediente de Salida
- Se registra una recepción de compra → Expediente de Entrada
- Se crea una transferencia entre empresas ZL → Expediente de Traspaso
- Se crea una transferencia interna de bodega → Expediente de Transferencia

**Ficha del Expediente de Embarque:**

**Header:**
| Campo | Origen | Ejemplo |
|-------|--------|---------|
| Número de expediente | Auto-generado | EXP-2026-0247 |
| Tipo | Auto (del origen) | SALIDA |
| Status | Auto/manual | EN PROCESO |
| Fecha de creación | Auto | 06/02/2026 |
| Fecha estimada despacho | Del pedido o manual | 15/02/2026 |
| Documento origen | Factura, OC, o transferencia | FAC-004378 |
| Contraparte | Cliente o proveedor | INVERSIONES SIMEON 333, C.A. |
| País destino/origen | Del registro de la contraparte | Venezuela |

**Tabs del expediente:**

```
[Resumen] [Mercancía] [Documentos] [Logística] [Timeline]
```

**Tab Resumen:**
- Datos principales del embarque (read-only, heredados del documento origen)
- Totales: bultos, peso bruto, peso neto, volumen
- Status de cada documento requerido: ✅ / ⏳ / ❌
- Alertas: "Falta BL", "Destino requiere Certificado de Libre Venta", etc.

**Tab Mercancía:**
- Detalle de productos del embarque
- **Dos vistas toggle:** "Por producto" (cada línea individual) y "Por arancelaria" (agrupado por código arancelario — esta es la vista que Ariel necesita para el DMC)
- Columnas: código arancelario, descripción, cantidad (cajas), peso neto, peso bruto, volumen, valor FOB

**Tab Documentos:**
- Lista de todos los documentos generados para este embarque
- Cada documento clickeable para abrir su detalle
- Botones: "+ Generar DMC" / "+ Generar BL" / "+ Generar Certificado"
- Estado de cada documento: Borrador / Completado / Enviado / Anulado
- Opción de adjuntar documentos externos (PDFs escaneados, confirmaciones de naviera, etc.)

**Tab Logística:**
- Datos del transporte: naviera, barco, booking, ETD, ETA
- Puerto de embarque (default: Zona Libre de Colón)
- Puerto de descarga
- Datos del contenedor si aplica (número, tipo, sello)
- Notas de despacho

**Tab Timeline:**
- Historial cronológico de TODAS las acciones sobre este embarque
- Quién hizo qué, cuándo: "Factura generada por Margarita" → "DMC creado por Ariel" → "BL completado por Ariel" → "Embarque marcado como despachado"
- Incluye enmiendas y cambios

### 5.4 DMC de Salida — Especificación Completa

**Trigger:** Se crea cuando se genera una factura de venta B2B (notificación automática a Tráfico).

**Flujo en pantalla:**

**Paso 1 — Datos generales (pre-llenados):**

| Campo | Valor | Origen | Editable |
|-------|-------|--------|----------|
| Tipo de movimiento | SALIDA | Auto | No |
| Factura asociada | FAC-004378 | Auto | No |
| Fecha de factura | 06/02/2026 | Auto | No |
| Embarcador | EVOLUTION ZONA LIBRE S.A. | Config empresa | No |
| RUC embarcador | [RUC de Evolution] | Config empresa | No |
| Dirección embarcador | [Dirección en ZL] | Config empresa | No |
| Consignatario | INVERSIONES SIMEON 333, C.A. | Registro del cliente | Sí (override) |
| ID consignatario | J-501904235 | Registro del cliente | Sí |
| País destino | VENEZUELA | Registro del cliente | Sí (override) |
| Puerto destino | [Del historial o manual] | Historial/manual | Sí |
| Fecha estimada despacho | 15/02/2026 | Del pedido | Sí |

**Paso 2 — Datos de transporte (parcialmente pre-llenados):**

| Campo | Valor | Pre-llenado | Notas |
|-------|-------|-------------|-------|
| Modalidad de transporte | Marítimo / Aéreo / Terrestre | Del historial del cliente | Override manual |
| Naviera / Transportista | [nombre] | Del historial si recurrente | Manual primera vez |
| Nombre del buque/vuelo | [nombre] | No | Siempre manual |
| Número de viaje | [número] | No | Siempre manual |
| Booking number | [referencia] | No | Siempre manual |
| Contenedor número | [código] | No | Si aplica |
| Tipo de contenedor | 20ft / 40ft / etc. | No | Si aplica |
| Sello del contenedor | [número] | No | Si aplica |

**Paso 3 — Detalle de mercancía (100% pre-llenado, agrupado por arancelaria):**

El sistema toma TODAS las líneas de la factura, las agrupa por código arancelario, y presenta:

| Código Arancelario | Descripción | Cant. Bultos | Cant. Cajas | Peso Neto (kg) | Peso Bruto (kg) | Volumen (m³) | Valor FOB (USD) |
|--------------------|-------------|-------------|-------------|----------------|-----------------|-------------|-----------------|
| 2208309000 | Whisky | 45 | 180 | 3,114.00 | 3,425.40 | 12.60 | $73,800.00 |
| 2208601000 | Vodka | 12 | 60 | 1,020.00 | 1,122.00 | 3.60 | $15,600.00 |
| 2208909000 | Tequila | 8 | 30 | 510.00 | 561.00 | 2.10 | $22,905.00 |

**Cómo se calculan:**
- **Cant. Bultos:** Se calcula de la lista de empaque (agrupado)
- **Cant. Cajas:** Suma de cantidades de la factura por grupo arancelario
- **Peso Neto:** Suma de (Kilos × Bulto del producto ÷ Qty × Bulto × cantidad facturada) por grupo
- **Peso Bruto:** Peso neto × factor de embalaje (configurable, default 1.10 = 10% extra)
- **Volumen:** Suma de (M³ del producto × cantidad facturada) por grupo
- **Valor FOB:** Suma de (precio × cantidad) de la factura por grupo

**Todos los valores son editables por Ariel** en caso de que necesite hacer ajustes manuales. El sistema marca con ⚠️ cualquier valor que fue modificado respecto al cálculo automático.

**Paso 4 — Totales y validación:**

| Total | Valor calculado |
|-------|----------------|
| Total bultos | Suma de todos los grupos |
| Total cajas | Suma de todos los grupos |
| Peso neto total (kg) | Suma de todos los grupos |
| Peso bruto total (kg) | Suma de todos los grupos |
| Volumen total (m³) | Suma de todos los grupos |
| Volumen total (ft³) | m³ × 35.3147 (conversión automática) |
| Valor FOB total (USD) | Suma de todos los grupos |

**Validaciones antes de guardar:**
- ✅ Todos los productos tienen código arancelario asignado (si falta alguno → error bloqueante con link a la ficha del producto)
- ✅ Los totales cuadran con la factura
- ✅ El consignatario tiene todos los datos requeridos
- ✅ Los campos obligatorios están completos

**Acciones disponibles:**
- **Guardar como borrador** — Se puede editar después. Status: BORRADOR
- **Marcar como completado** — DMC listo para registrar en plataforma gubernamental. Status: COMPLETADO
- **Exportar** — Genera un formato (Excel/PDF/CSV) con los datos listos para copiar a la plataforma gubernamental
- **Copiar al portapapeles** — Un click copia los datos formateados listos para pegar
- **Anular** — Marca el DMC como anulado (requiere motivo). Status: ANULADO. Genera automáticamente borrador de nuevo DMC si se necesita rehacer

### 5.5 DMC de Entrada — Especificación

**Trigger:** Se crea cuando se confirma recepción de mercancía en el módulo de Compras.

Estructura similar al DMC de Salida con estas diferencias:

| Diferencia | DMC Salida | DMC Entrada |
|-----------|-----------|-------------|
| Remitente | Evolution | Proveedor internacional |
| Destinatario | Cliente | Evolution |
| Documento base | Factura de venta | Factura del proveedor / OC |
| Valores | Precio de venta (FOB) | Costo de compra (FOB) |
| Frecuencia | Cada venta B2B | Cada contenedor recibido |

**Datos del proveedor se toman del registro del proveedor** (módulo de Compras/Productos): nombre, país, identificación.

**Los datos de la mercancía se toman de la orden de compra/factura del proveedor:** productos, cantidades, aranceles, valores.

### 5.6 DMC de Traspaso — Especificación

**Trigger:** Se crea cuando se registra una transferencia de mercancía entre empresas de la Zona Libre.

| Campo | Valor |
|-------|-------|
| Tipo | TRASPASO |
| Empresa origen | Evolution ZL (o la empresa que envía) |
| Empresa destino | Mainz / Malta / Milano (o la que recibe) |
| Valor | Valor de transferencia (puede o no ser comercial — depende de respuesta pendiente) |

**Las empresas relacionadas (Mainz, Malta, Milano) deben estar registradas como entidades en el sistema** con sus propios datos fiscales, dirección en ZL, RUC. Esto se configura en el módulo de Configuración.

### 5.7 Bill of Lading — Especificación

**Trigger:** Se puede crear desde el Expediente de Embarque una vez que existe el DMC de Salida.

**Datos pre-llenados (del DMC + configuración):**

| Sección | Campos | Pre-llenado |
|---------|--------|-------------|
| Shipper | Nombre, dirección, contacto de Evolution | ✓ 100% auto (configuración) |
| Consignee | Nombre, dirección, contacto del cliente | ✓ 100% auto (registro cliente) |
| Notify Party | Por defecto = Consignee | ✓ Con override manual |
| Vessel/Voyage | Del DMC (si ya se completó) | ✓ Si DMC existe |
| Port of Loading | Zona Libre de Colón | ✓ Auto |
| Port of Discharge | Del DMC o historial del cliente | ✓ Parcial |
| Goods Description | Agrupado por arancelaria (del DMC) | ✓ 100% auto |
| Packages/Weight/Volume | Totales del DMC | ✓ 100% auto |

**Templates de BL por cliente:** Si el cliente BRAND DISTRIBUIDOR CURACAO siempre usa la misma naviera, el mismo puerto, el mismo formato — el sistema guarda esos datos como template y los pre-llena la próxima vez.

**Acciones:**
- Guardar borrador
- Completar
- Exportar (PDF formateado tipo BL estándar)
- Enviar a naviera (futuro — integración email)

### 5.8 Certificado de Libre Venta — Especificación

**Trigger automático:** Al crear DMC de Salida, el sistema verifica si el país destino requiere Certificado de Libre Venta (según catálogo de requisitos por destino configurado en la sección de Configuración de Tráfico).

**Si el destino lo requiere:**
- 🔔 Alerta a Ariel: "Este embarque a [destino] requiere Certificado de Libre Venta"
- Se crea automáticamente un borrador del certificado dentro del Expediente de Embarque
- Ariel completa los datos adicionales (registros sanitarios, etc.)

**Si no se ha configurado aún si el destino lo requiere:**
- ⚠️ Pregunta a Ariel: "¿El destino [país] requiere Certificado de Libre Venta?" con opciones Sí/No/No sé
- Si Ariel marca Sí: se agrega el destino al catálogo para futuros embarques

### 5.9 Transferencias entre Bodegas — Vista desde Tráfico

**Nota:** La funcionalidad de crear transferencias vive en el módulo de Inventario (Doc 04). Aquí en Tráfico solo se ve la parte documental.

**Dos tipos de transferencias que Tráfico ve:**

**A. Transferencias internas (Evolution B2B → B2C):**
- Movimiento de mercancía de bodega mayorista a tienda minorista
- NO requiere DMC (es dentro de la misma empresa, misma ubicación)
- Tráfico solo ve para coordinación logística — no genera documentos aduanales
- El costo de transferencia es inflado respecto al costo real (margen interno B2B→B2C)

**B. Traspasos entre empresas ZL (Evolution ↔ Mainz/Malta/Milano):**
- Movimiento entre entidades legales diferentes dentro de la Zona Libre
- SÍ requiere DMC de Traspaso
- Tráfico genera toda la documentación
- Flujo: se crea en Inventario → aparece en cola de Tráfico → Ariel genera DMC de Traspaso

**Regla heredada de Dynamo (mantener):** La persona que crea una transferencia entre bodegas NO puede ser la misma que la confirma en destino. Separación de funciones.

---

## 6. INTEGRACIÓN CON OTROS MÓDULOS — CÓMO TRÁFICO SE CONECTA CON TODO

### 6.1 Tráfico ← Ventas B2B (Doc 05)

| Evento en Ventas | Efecto en Tráfico |
|-----------------|-------------------|
| Factura emitida | → Se crea Expediente de Embarque automáticamente → Aparece en cola de Tráfico |
| Factura anulada | → Expediente se marca como "Cancelado" → DMC asociado se marca para anulación |
| Enmienda a pedido/factura | → Notificación a Tráfico → Si ya hay DMC, se marca "Requiere actualización" (NO se destruye) |
| Lista de empaque preparada | → Datos de empaque disponibles para el DMC |
| Bodega confirma preparación | → Status del expediente cambia a "Mercancía lista" |
| Campo "Despacho" del pedido | → Define tipo de DMC: SALIDA = DMC Salida, TRASPASO = DMC Traspaso |
| Fecha estimada de despacho | → Se hereda al Expediente de Embarque para planificación |

### 6.2 Tráfico ← Compras/Importación (Doc 03)

| Evento en Compras | Efecto en Tráfico |
|-------------------|-------------------|
| Recepción de mercancía confirmada | → Se crea Expediente de Entrada → Aparece en cola "Pendiente DMC Entrada" |
| Nueva orden de compra (con ETA) | → Tráfico ve en vista "Próximas llegadas" para preparación anticipada |

### 6.3 Tráfico ← Inventario (Doc 04)

| Evento en Inventario | Efecto en Tráfico |
|---------------------|-------------------|
| Transferencia entre empresas ZL creada | → Se crea Expediente de Traspaso → Aparece en cola "Pendiente DMC Traspaso" |
| Transferencia interna (B2B→B2C) | → Solo visible en Tráfico para coordinación, sin documentación aduanal |
| Ajuste de inventario que afecte mercancía en expediente activo | → Alerta a Tráfico |

### 6.4 Tráfico ← Clientes (Doc 06)

| Dato del cliente | Uso en Tráfico |
|-----------------|----------------|
| Nombre / razón social | Consignatario en DMC y BL |
| Identificación / RUC | ID del consignatario |
| País | País destino → define requisitos documentales |
| Dirección | Dirección del consignatario |
| Representante legal | Contacto en documentos |
| Historial de puertos destino | Pre-llenado de puerto destino |
| Historial de navieras usadas | Pre-llenado de naviera en BL |

### 6.5 Tráfico ← Productos (Doc 02)

| Dato del producto | Uso en Tráfico |
|------------------|----------------|
| Código arancelario (OBLIGATORIO) | Agrupación de mercancía en DMC |
| Descripción | Descripción de bienes en documentos |
| Kilos × Bulto | Cálculo de peso neto y bruto |
| Dimensiones (L×A×A) / M³ / Ft³ | Cálculo de volumen/cubicaje |
| Qty × Bulto / Qty × Paleta | Cálculo de bultos |

### 6.6 Tráfico ← Configuración (Doc 08)

| Configuración | Uso en Tráfico |
|--------------|----------------|
| Datos de la empresa (Evolution) | Embarcador en todos los documentos |
| Bodegas registradas | Origen/destino de transferencias |
| Empresas relacionadas ZL (Mainz, Malta, Milano) | Contraparte en DMC de Traspaso |
| Catálogo de requisitos por destino | Auto-detección de certificados requeridos |
| Puertos frecuentes | Dropdown en formularios de transporte |
| Navieras frecuentes | Dropdown en formularios de transporte |
| Factor de peso bruto (default 1.10) | Cálculo de peso bruto = neto × factor |
| Secuencias de numeración de expedientes | EXP-YYYY-NNNN |

### 6.7 Tráfico → Contabilidad (Doc 07)

| Evento en Tráfico | Efecto contable |
|-------------------|----------------|
| DMC de Salida completado | → Potencial asiento de gastos de exportación si aplica |
| DMC de Entrada completado | → Gastos aduanales se asocian al costo CIF de la importación |
| Gastos de tráfico registrados | → Asiento automático: DB Gastos de Exportación / CR CxP o Bancos |

---

## 7. REGLAS DE NEGOCIO DEL MÓDULO DE TRÁFICO

### Regla T-01: Sin código arancelario, la mercancía no se mueve
Si un producto en una factura NO tiene código arancelario asignado en su ficha, el DMC NO se puede generar. El sistema bloquea la generación y muestra error específico: "El producto [nombre] no tiene código arancelario. Asigne el arancel en la ficha del producto antes de generar documentación de tráfico." Con link directo a la ficha del producto para que se corrija.

### Regla T-02: Un expediente, múltiples documentos
Cada expediente de embarque puede tener múltiples documentos asociados (DMC + BL + Certificados). Todos los documentos del mismo embarque se vinculan al mismo expediente. No pueden existir documentos "huérfanos" sin expediente.

### Regla T-03: DMC obligatorio para salida de ZL
Toda factura de venta B2B genera automáticamente un expediente que requiere DMC de Salida. No se puede marcar un embarque como "despachado" sin DMC completado. Esto es un reflejo de la realidad regulatoria: sin DMC, la mercancía queda retenida.

### Regla T-04: Enmiendas, no destrucción
Si un pedido o factura cambia después de que se generó documentación de tráfico, el sistema NO destruye el DMC existente. En cambio:
- Notifica a Tráfico que hubo un cambio
- Muestra exactamente qué cambió (diff visual)
- Ariel decide si actualizar el DMC existente o anularlo y crear uno nuevo
- Todo cambio queda registrado en el timeline del expediente

### Regla T-05: Preparación anticipada
Ariel puede crear borradores de DMC ANTES de que la factura esté lista, basándose en pedidos aprobados. Cuando la factura se emita, el borrador se actualiza automáticamente con los datos definitivos. Esto permite que Ariel trabaje con anticipación en embarques grandes.

### Regla T-06: Múltiples documentos simultáneos
El módulo debe permitir tener múltiples expedientes abiertos simultáneamente. Ariel debe poder trabajar en el DMC del cliente A, cambiar al BL del cliente B, y volver al DMC del cliente A sin perder progreso.

### Regla T-07: Reutilización de datos recurrentes
Para clientes frecuentes (ej: BRAND DISTRIBUIDOR CURACAO que compra todo el lote cada vez), el sistema guarda y reutiliza:
- Puerto destino habitual
- Naviera habitual
- Consignatario (si varía del titular del cliente)
- Notify party habitual
- Cualquier dato de transporte recurrente

### Regla T-08: Tráfico NO ve información financiera
Siguiendo la matriz de permisos del Doc 01:
- Ariel y María **NUNCA ven:** Costos de producto, proveedores, márgenes de utilidad, precios de venta (excepto lo necesario para documentos — valor FOB en DMC)
- **SÍ ven:** Descripción de productos, cantidades, pesos, volúmenes, códigos arancelarios, datos de clientes necesarios para documentación, stock (para documentación)

**Excepción controlada:** El valor FOB que aparece en el DMC ES un dato financiero, pero es requerido por regulación. Se muestra SOLO dentro del contexto del DMC, no en otras vistas del módulo.

### Regla T-09: Anulación de DMC requiere motivo
No se puede anular un DMC sin registrar el motivo. Los motivos comunes son:
- Cambio en la factura
- Error en datos del consignatario
- Cambio en la composición del embarque
- Cancelación del despacho
- Otro (texto libre)

### Regla T-10: Trazabilidad completa
Desde cualquier DMC se puede navegar a: la factura que lo originó → el pedido → la cotización → el cliente. Y viceversa: desde cualquier factura en Ventas se puede ver el status de documentación de tráfico. La cadena de trazabilidad nunca se rompe.

---

## 8. VISIBILIDAD Y PERMISOS — QUIÉN VE QUÉ EN TRÁFICO

### Matriz de acceso al módulo

| Funcionalidad | Logística (Ariel/María) | Admin (Javier/Estelia) | Ventas (Margarita/Arnold) | Compras (Celly) | Finanzas (Jackie) |
|--------------|------------------------|----------------------|--------------------------|-----------------|-------------------|
| Dashboard de Tráfico | ✓ Completo | ✓ Completo | ✗ No accede | ✗ No accede | ✓ Solo lectura |
| Ver expedientes | ✓ | ✓ | Solo los suyos (sus clientes) | Solo entradas | ✓ Solo lectura |
| Crear/editar DMC | ✓ | ✓ | ✗ | ✗ | ✗ |
| Crear/editar BL | ✓ | ✓ | ✗ | ✗ | ✗ |
| Crear certificados | ✓ | ✓ | ✗ | ✗ | ✗ |
| Anular documentos | ✓ (con motivo) | ✓ | ✗ | ✗ | ✗ |
| Ver valores FOB en DMC | ✓ (regulatorio) | ✓ | ✗ | ✗ | ✓ |
| Ver costos/márgenes | ✗ NUNCA | ✓ | ✗ NUNCA | ✗ (solo en su módulo) | ✓ |
| Configurar tráfico | ✗ | ✓ Solo Javier | ✗ | ✗ | ✗ |
| Ver timeline completo | ✓ | ✓ | Solo su parte | Solo su parte | ✓ |

### Visibilidad desde otros módulos

**Desde Ventas B2B:** El vendedor ve un badge/indicador de status de tráfico en sus pedidos y facturas: "⏳ Pendiente documentación" / "📋 DMC en proceso" / "✅ Documentación completa" / "🚢 Despachado". No puede ver detalles del DMC ni del BL.

**Desde Compras:** Celly ve un indicador de DMC de Entrada para sus recepciones: "⏳ Pendiente DMC Entrada" / "✅ DMC Entrada completado".

**Desde el Dashboard principal:** KPI de "Embarques pendientes de documentación" visible para Javier/Estelia.

---

## 9. INTERFAZ — WIREFRAMES CONCEPTUALES

### 9.1 Dashboard de Tráfico

```
┌─────────────────────────────────────────────────────────────────┐
│  TRÁFICO Y DOCUMENTACIÓN                                        │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Pendientes   │ DMC por      │ En Tránsito  │ Completados       │
│ hoy          │ generar      │              │ esta semana       │
│     7        │     4        │     3        │     12            │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│                                                                 │
│ [Todo] [Pendientes] [En proceso] [Completados]                 │
│ [Salidas] [Entradas] [Traspasos] [Transferencias]              │
│                                                                 │
│ 🔍 Buscar por cliente, factura, DMC...          [Filtros ▾]    │
│                                                                 │
│ ┌──┬────────┬──────────┬──────────────────┬────────┬─────────┐ │
│ │🔴│FAC-4378│SIMEON 333│Venezuela         │⏳DMC ❌BL│Hoy     │ │
│ │🔴│FAC-4391│BRAND DIST│Curazao           │⏳DMC    │Hoy     │ │
│ │🟡│OC-3570 │GLOBAL BR.│Entrada - Holanda │⏳DMC    │Mañana  │ │
│ │🟡│TR-0089 │→ MAINZ   │Traspaso - ZL     │⏳DMC    │Mar 4   │ │
│ │🟢│FAC-4395│DINORA SAS│Colombia          │Borrador │Mar 10  │ │
│ │✅│FAC-4370│G&S CONSTR│Curazao           │✅✅✅   │Feb 25  │ │
│ └──┴────────┴──────────┴──────────────────┴────────┴─────────┘ │
│                                                                 │
│                                          Mostrando 1-6 de 23   │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Expediente de Embarque — Detalle

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver a Tráfico                                            │
│                                                                 │
│  EXP-2026-0247  │  SALIDA  │  🟡 EN PROCESO                   │
│  FAC-004378     │  INVERSIONES SIMEON 333, C.A.  │  Venezuela  │
│                                                                 │
│  Fecha: 06/02/2026    Despacho est.: 15/02/2026               │
│                                                                 │
│  Documentos requeridos:                                         │
│  ✅ Factura    ⏳ DMC de Salida    ❌ Bill of Lading            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Resumen] [Mercancía] [Documentos] [Logística] [Timeline]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MERCANCÍA — Vista: [Por producto ○] [Por arancelaria ●]       │
│                                                                 │
│  ┌──────────┬──────────────┬──────┬────────┬────────┬────────┐ │
│  │ Arancel  │ Descripción  │ Cajas│Peso Net│Peso Bru│Vol (m³)│ │
│  ├──────────┼──────────────┼──────┼────────┼────────┼────────┤ │
│  │2208309000│ Whisky       │  180 │3,114kg │3,425kg │  12.60 │ │
│  │2208601000│ Vodka        │   60 │1,020kg │1,122kg │   3.60 │ │
│  │2208909000│ Tequila      │   30 │  510kg │  561kg │   2.10 │ │
│  ├──────────┼──────────────┼──────┼────────┼────────┼────────┤ │
│  │ TOTALES  │              │  270 │4,644kg │5,108kg │  18.30 │ │
│  └──────────┴──────────────┴──────┴────────┴────────┴────────┘ │
│                                                                 │
│  [+ Generar DMC de Salida]  [+ Generar BL]                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Formulario DMC de Salida

```
┌─────────────────────────────────────────────────────────────────┐
│  DMC DE SALIDA — EXP-2026-0247                                  │
│  Status: BORRADOR                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── DATOS GENERALES ──────────────────────────────────────────  │
│                                                                 │
│  Factura: FAC-004378        Fecha: 06/02/2026                  │
│                                                                 │
│  EMBARCADOR                      CONSIGNATARIO                  │
│  ┌──────────────────────┐        ┌──────────────────────┐      │
│  │ EVOLUTION ZONA LIBRE │        │ INVERSIONES SIMEON   │      │
│  │ S.A.                 │        │ 333, C.A.            │      │
│  │ Zona Libre de Colón  │        │ J-501904235          │      │
│  │ Parcela XX, Calle XX │        │ Venezuela            │      │
│  │ 🔒 Datos de config.  │        │ ✏️ Editable          │      │
│  └──────────────────────┘        └──────────────────────┘      │
│                                                                 │
│  ── TRANSPORTE ───────────────────────────────────────────────  │
│                                                                 │
│  Modalidad: [Marítimo ▾]    Puerto embarque: [ZL Colón 🔒]    │
│  Naviera:   [____________]  Puerto destino:  [La Guaira ▾]    │
│  Buque:     [____________]  Booking:         [____________]    │
│  Viaje:     [____________]  Contenedor:      [____________]    │
│  ETD:       [__/__/____]    Sello:           [____________]    │
│                                                                 │
│  ── MERCANCÍA (por código arancelario) ───────────────────────  │
│                                                                 │
│  ┌──────────┬──────────┬─────┬───────┬───────┬───────┬───────┐ │
│  │ Arancel  │ Desc.    │Cajas│P.Neto │P.Bruto│Vol m³ │FOB USD│ │
│  ├──────────┼──────────┼─────┼───────┼───────┼───────┼───────┤ │
│  │2208309000│ Whisky   │ 180 │3,114  │3,425  │ 12.60 │73,800 │ │
│  │2208601000│ Vodka    │  60 │1,020  │1,122  │  3.60 │15,600 │ │
│  │2208909000│ Tequila  │  30 │  510  │  561  │  2.10 │22,905 │ │
│  ├──────────┼──────────┼─────┼───────┼───────┼───────┼───────┤ │
│  │ TOTAL    │          │ 270 │4,644  │5,108  │ 18.30 │112,305│ │
│  └──────────┴──────────┴─────┴───────┴───────┴───────┴───────┘ │
│                                                                 │
│  ── NOTAS ────────────────────────────────────────────────────  │
│  [________________________________________________________]    │
│                                                                 │
│  [Guardar borrador]  [Completar ✓]  [Exportar ↗]  [Cancelar]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. CONFIGURACIÓN ESPECÍFICA DE TRÁFICO

Estos parámetros se configuran en Configuración → Tráfico (acceso solo para Javier/Estelia):

### 10.1 Datos del Embarcador (Evolution)

| Parámetro | Valor actual | Uso |
|-----------|-------------|-----|
| Razón social | EVOLUTION ZONA LIBRE S.A. | DMC, BL — campo embarcador |
| RUC | [Por confirmar] | DMC — identificación |
| Dirección en ZL | [Por confirmar parcela/calle] | DMC, BL — dirección |
| Teléfono | [Por confirmar] | BL — contacto |
| Contacto | [Por confirmar] | BL — persona de contacto |
| Puerto de embarque default | Zona Libre de Colón | DMC, BL — puerto origen |

### 10.2 Empresas Relacionadas en ZL

| Empresa | Relación | RUC | Dirección en ZL |
|---------|---------|-----|-----------------|
| Mainz | [Pendiente confirmar] | [Pendiente] | [Pendiente] |
| Malta | [Pendiente confirmar] | [Pendiente] | [Pendiente] |
| Milano | [Pendiente confirmar] | [Pendiente] | [Pendiente] |

### 10.3 Requisitos Documentales por Destino

| País Destino | DMC Salida | BL | Cert. Libre Venta | Otros |
|-------------|-----------|-----|-------------------|-------|
| Venezuela | ✓ Obligatorio | ✓ Si marítimo | ✗ No requerido | — |
| Curazao | ✓ Obligatorio | ✓ Si marítimo | ✗ No requerido | — |
| Colombia | ✓ Obligatorio | ✓ Si marítimo | ✓ Requerido (San Andrés) | — |
| [Otros destinos] | ✓ Obligatorio | Depende | [Pendiente mapear] | — |

**Esta tabla es configurable por Javier.** Cuando se agrega un nuevo destino, el sistema pregunta qué documentos requiere.

### 10.4 Catálogos de Tráfico

| Catálogo | Ejemplos | Para qué |
|----------|----------|----------|
| Puertos | Zona Libre de Colón, La Guaira, Willemstad, Cartagena, San Andrés | Dropdown en formularios |
| Navieras | [Las que Evolution usa frecuentemente] | Dropdown + historial |
| Modalidades de transporte | Marítimo, Aéreo, Terrestre, Multimodal | Dropdown |
| Tipos de contenedor | 20ft Standard, 40ft Standard, 40ft High Cube, Reefer | Dropdown |
| Motivos de anulación | Cambio en factura, Error datos, Cambio composición, Cancelación, Otro | Dropdown al anular |

### 10.5 Parámetros de Cálculo

| Parámetro | Default | Configurable | Descripción |
|-----------|---------|-------------|-------------|
| Factor peso bruto | 1.10 | ✓ Global y por producto | Peso bruto = peso neto × factor (10% extra por embalaje) |
| Unidad de peso | kg | ✓ | kg o lbs |
| Unidad de volumen | m³ | ✓ | m³ o ft³ (el sistema muestra ambos) |
| Moneda en documentos | USD | ✓ | USD es el estándar en ZL |

### 10.6 Secuencias de Numeración

| Documento | Formato | Ejemplo |
|-----------|---------|---------|
| Expediente de embarque | EXP-YYYY-NNNN | EXP-2026-0247 |
| DMC de salida (interno) | DMS-YYYY-NNNN | DMS-2026-0089 |
| DMC de entrada (interno) | DME-YYYY-NNNN | DME-2026-0034 |
| DMC de traspaso (interno) | DMT-YYYY-NNNN | DMT-2026-0012 |
| Bill of Lading (interno) | BL-YYYY-NNNN | BL-2026-0067 |

**Nota:** Estos son los números internos de referencia en EvolutionOS. El número oficial del DMC lo asigna la plataforma gubernamental y se registra como campo adicional después de que Ariel lo obtiene.

---

## 11. PROBLEMAS CRÍTICOS QUE ESTE MÓDULO RESUELVE

| # | Problema actual | Impacto | Solución en EvolutionOS |
|---|----------------|---------|------------------------|
| 1 | DMC 100% manual (15-20 min cada uno) | Horas perdidas por día, errores de transcripción | Pre-llenado automático → 2-3 minutos por DMC |
| 2 | Lista de empaque no agrupada por arancelaria | Ariel reordena manualmente cada vez | Agrupación automática por código arancelario |
| 3 | Cambios post-factura destruyen todo | Horas de retrabajo: desaprobar → eliminar → rehacer TODO | Enmiendas que actualizan sin destruir. Notificación a Tráfico |
| 4 | No puede trabajar en múltiples documentos | Cuello de botella cuando hay varios embarques | Módulo multi-tab / multi-expediente simultáneo |
| 5 | No puede preparar con anticipación | Emergencias de última hora | Borradores desde pedidos aprobados antes de factura |
| 6 | Datos recurrentes se re-ingresan cada vez | Tiempo perdido, errores | Templates por cliente/ruta que se reutilizan |
| 7 | Sin visibilidad de estado | No sabe qué tiene pendiente ni qué está completo | Dashboard con cola de trabajo, KPIs, status en tiempo real |
| 8 | Tráfico fragmentado en múltiples módulos | No hay un lugar centralizado para todo | Módulo dedicado que agrupa toda la funcionalidad |
| 9 | Submódulo de DMC en Dynamo nunca terminado | Funcionalidad core prometida pero no entregada | Módulo completo desde cero, diseñado para las necesidades reales de Ariel |
| 10 | Sin trazabilidad documental | No se sabe qué documentos tiene cada embarque | Expediente de embarque que vincula todo: factura + DMC + BL + certificados |

---

## 12. CONSOLIDACIÓN DYNAMO → NUEVA PLATAFORMA

| Funcionalidad actual (dispersa) | Dónde está en Dynamo | Estado | Destino en EvolutionOS |
|--------------------------------|---------------------|--------|----------------------|
| DMC - Movimiento Comercial | Ventas → submódulo #9 | ❌ NUNCA TERMINADO | → Tráfico: DMC (Salida/Entrada/Traspaso) |
| Lista de Empaque | Ventas → Lista de Empaque | Funciona (sin agrupar) | → Ventas B2B (generación) + Tráfico (consumo agrupado) |
| Campo "Despacho" en pedidos | Ventas → Aprobación Pedidos | Funciona | → Ventas B2B (campo) + Tráfico (tipo de DMC) |
| Código arancelario | Inventario → Ficha producto | Funciona | → Productos (campo) + Tráfico (agrupación DMC) |
| Datos del cliente para docs | Clientes → Consulta | Funciona | → Clientes (datos) + Tráfico (consignatario) |
| Bill of Lading | NO existe en Dynamo | ❌ NO EXISTE | → Tráfico: BL (NUEVO) |
| Certificado de Libre Venta | NO existe en Dynamo | ❌ NO EXISTE | → Tráfico: Certificados (NUEVO) |
| Transferencias entre bodegas | Inventario → Transferencia | ROTO en Dynamo | → Inventario (crear) + Tráfico (documentación) |
| Traspasos entre empresas ZL | Proceso manual fuera del sistema | ❌ NO EXISTE | → Tráfico: DMC de Traspaso (NUEVO) |
| Seguimiento de embarques | NO existe en Dynamo | ❌ NO EXISTE | → Tráfico: Expedientes (NUEVO) |
| Templates de documentos | NO existe en Dynamo | ❌ NO EXISTE | → Tráfico: Templates por cliente (NUEVO) |

**Resumen:** De las 11 funcionalidades que el módulo de Tráfico necesita, solo 3 existen parcialmente en Dynamo (y una de ellas está rota). Las otras 8 son completamente nuevas. Este es el módulo con mayor porcentaje de funcionalidad nueva de toda la plataforma.

---

## 13. PREGUNTAS PENDIENTES

| # | Pregunta | Por qué importa | Preguntar a |
|---|---------|-----------------|-------------|
| 1 | ¿Mainz, Malta y Milano son subsidiarias, empresas relacionadas, o clientes frecuentes? | Define si los traspasos DMC son internos (sin valor) o comerciales (con valor declarado) | Javier |
| 2 | ¿Cuáles son TODOS los destinos que requieren Certificado de Libre Venta? | Define la lógica automática de detección de certificados | Ariel |
| 3 | ¿Cuáles son los puertos destino más frecuentes? | Alimenta el catálogo de puertos | Ariel |
| 4 | ¿Cuáles navieras usa Evolution con más frecuencia? | Alimenta el catálogo de navieras | Ariel |
| 5 | ¿Existe un formato específico de DMC del gobierno o es formulario web? | Define si el export es Excel, PDF, o datos para copiar/pegar | Ariel |
| 6 | ¿Se necesitan permisos especiales para exportar alcohol? | Puede requerir documentos adicionales | Ariel / Javier |
| 7 | ¿Los productos no alcohólicos (Pringles, Ciclon) requieren documentación fitosanitaria diferente? | Puede cambiar el flujo para ciertos productos | Ariel |
| 8 | ¿Cuál es el RUC, dirección exacta y datos completos de Evolution en ZL? | Campos fijos del embarcador en todos los documentos | Javier |
| 9 | ¿Cuáles son los datos fiscales de Mainz, Malta y Milano? | Necesarios para DMC de Traspaso | Javier |
| 10 | ¿Jackie necesita acceso completo a Tráfico o solo consulta? | Define permisos del rol Finanzas en este módulo | Jackie / Javier |
| 11 | ¿Hay documentos adicionales que Ariel genera que no se han mencionado? | Puede haber documentación que no hemos capturado | Ariel |
| 12 | ¿El factor de peso bruto (10% sobre neto) es correcto como default? | Afecta cálculos automáticos | Ariel / Bodega |
| 13 | ¿Se quiere integración directa con la plataforma gubernamental en el futuro (Phase C)? | Define si se prepara la arquitectura para API gubernamental | Javier |

---

## 14. PRIORIDAD DE IMPLEMENTACIÓN DENTRO DEL MÓDULO

### Fase 1 — Núcleo (Prioridad máxima, parte de la Fase 1 general del proyecto)
- Dashboard de Tráfico con cola de trabajo
- Expediente de Embarque (estructura básica)
- DMC de Salida con pre-llenado automático desde factura
- Lista de empaque agrupada por arancelaria (mejora en módulo de Ventas)
- Notificación automática Ventas → Tráfico al generar factura
- Exportación de datos para plataforma gubernamental

### Fase 2 — Completar operación (Fase 2 general)
- DMC de Entrada (desde recepciones de compra)
- DMC de Traspaso (entre empresas ZL)
- Bill of Lading con pre-llenado
- Templates por cliente/ruta
- Certificado de Libre Venta
- Catálogo de requisitos por destino
- Preparación anticipada (borradores desde pedidos)

### Fase 3 — Avanzado (Fase 2-3 general)
- Tracking de embarques con ETD/ETA
- Integración con navieras (si hay APIs disponibles)
- Reportes de tráfico (tiempos promedio, volumen por destino, etc.)
- Posible integración directa con plataforma gubernamental (Phase C — IA)

---

## FIN DEL DOCUMENTO 09

Este documento cubre la totalidad del módulo de Tráfico y Documentación: desde la documentación regulatoria que rige la operación en la Zona Libre de Colón, hasta la especificación detallada de cada tipo de documento (DMC, BL, Certificados), los flujos de trabajo actuales vs. los nuevos, la integración con todos los demás módulos, las reglas de negocio, los permisos, la configuración, y las preguntas pendientes.

**Documentos relacionados:**
- **Documento 01:** Introducción completa — sección 11 (documentación de tráfico) y perfil de Ariel
- **Documento 02:** Productos — campo de código arancelario (base del DMC)
- **Documento 03:** Compras — recepciones que generan DMC de Entrada
- **Documento 04:** Inventario — transferencias que generan DMC de Traspaso
- **Documento 05:** Ventas B2B — pipeline que alimenta Tráfico, lista de empaque, sección 4.12 (pre-llenado DMC)
- **Documento 06:** Clientes — datos del consignatario
- **Documento 07:** Contabilidad — asientos de gastos de tráfico
- **Documento 08:** Configuración — rol Logística, parámetros de tráfico
- **Documento Maestro:** Arquitectura del sistema — cadenas de eventos que incluyen tráfico
