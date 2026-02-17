# Estrategia de Implementación Frontend
## Basado en doc.md - Documento Maestro Evolution

### 🎯 Objetivo
Crear interfaces frontend para los módulos B2B críticos, siguiendo la prioridad del documento maestro.

---

## 📋 Prioridades según doc.md

### Fase 1 — Núcleo B2B (Crítico)
1. **Catálogo de Productos** ⭐ MÁS URGENTE
2. **Compras e Importación** ⭐ Dolor #1 de Celly
3. **Control de Inventario**
4. **Ventas B2B** (Pipeline completo)
5. **Tráfico y Documentación** ⭐ Dolor #1 de Ariel
6. **Clientes (básico)**

### Fase 2 — Completar operación
7. Punto de Venta B2C
8. Reportes y Analítica
9. Contabilidad

---

## 🏗️ Arquitectura Frontend Propuesta

### Problema Actual
- `dashboard/page.tsx` tiene **2437 líneas**
- Mezcla lógica de negocio, UI y estado
- Difícil de mantener y extender

### Solución: Componentes Modulares

```
frontend/src/
├── app/
│   └── dashboard/
│       ├── page.tsx (solo layout y routing)
│       ├── productos/
│       │   ├── page.tsx (lista de productos)
│       │   ├── nuevo/page.tsx (crear producto)
│       │   ├── [id]/page.tsx (editar producto)
│       │   └── importar/page.tsx (importación masiva)
│       ├── compras/
│       │   ├── page.tsx (lista de compras)
│       │   ├── nueva/page.tsx (nueva orden)
│       │   └── importar/page.tsx (importar desde Excel)
│       ├── inventario/
│       │   ├── page.tsx (consulta de stock)
│       │   ├── ajustes/page.tsx (ajustes de inventario)
│       │   └── transferencias/page.tsx
│       ├── ventas/
│       │   ├── cotizaciones/page.tsx
│       │   ├── pedidos/page.tsx
│       │   └── facturas/page.tsx
│       ├── trafico/
│       │   ├── page.tsx (monitor de despachos)
│       │   ├── dmc/page.tsx (generación DMC)
│       │   └── documentos/page.tsx
│       └── clientes/
│           ├── page.tsx (lista)
│           └── [id]/page.tsx (detalle)
│
└── components/
    ├── productos/
    │   ├── ProductCard.tsx
    │   ├── ProductForm.tsx
    │   ├── ProductSearch.tsx
    │   └── ProductImportWizard.tsx
    ├── compras/
    │   ├── PurchaseOrderForm.tsx
    │   └── ExcelImporter.tsx
    ├── inventario/
    │   ├── StockTable.tsx
    │   └── AdjustmentForm.tsx
    └── shared/
        ├── DataTable.tsx
        ├── SearchBar.tsx
        └── FileUploader.tsx
```

---

## 🚀 Plan de Implementación

### Sprint 1: Productos (Semana 1-2)
**Objetivo:** Resolver el problema de catálogo sucio y duplicados

**Páginas a crear:**
1. `/dashboard/productos` - Lista con búsqueda inteligente
2. `/dashboard/productos/nuevo` - Formulario completo
3. `/dashboard/productos/importar` - Importación masiva Excel
4. `/dashboard/productos/[id]` - Editar producto

**Características clave (del doc.md):**
- ✅ Descripción como identificador primario
- ✅ Detección de duplicados
- ✅ Importación masiva
- ✅ 5 niveles de precio
- ✅ Datos arancelarios obligatorios
- ✅ Multilingüe (ES/EN/PT)

### Sprint 2: Compras (Semana 3-4)
**Objetivo:** Eliminar el dolor #1 de Celly - carga manual

**Páginas a crear:**
1. `/dashboard/compras` - Lista de órdenes
2. `/dashboard/compras/nueva` - Nueva orden
3. `/dashboard/compras/importar` - **CRÍTICO** - Importar desde Excel del proveedor

**Características clave:**
- ✅ Importación masiva desde archivos variables
- ✅ Cálculo FOB → CIF automático
- ✅ Costo promedio ponderado
- ✅ Recepción parcial

### Sprint 3: Inventario (Semana 5)
**Objetivo:** Stock unificado B2B + B2C

**Páginas a crear:**
1. `/dashboard/inventario` - Consulta en tiempo real
2. `/dashboard/inventario/ajustes` - Con aprobación obligatoria
3. `/dashboard/inventario/transferencias` - B2B ↔ B2C

**Características clave:**
- ✅ Bloqueo de disponibilidad negativa
- ✅ Conversión caja ↔ botella
- ✅ Alertas de stock mínimo

### Sprint 4: Ventas B2B (Semana 6-7)
**Objetivo:** Pipeline completo con aprobaciones

**Páginas a crear:**
1. `/dashboard/ventas/cotizaciones` - Con último precio vendido
2. `/dashboard/ventas/pedidos` - Con reserva de inventario
3. `/dashboard/ventas/facturas` - Generación final

**Características clave:**
- ✅ Mostrar último precio vendido (Margarita)
- ✅ Motor de precios flexible
- ✅ Cotizaciones con imágenes ligeras
- ✅ Enmiendas post-aprobación (Ariel)

### Sprint 5: Tráfico (Semana 8)
**Objetivo:** Eliminar el dolor #1 de Ariel - DMC manual

**Páginas a crear:**
1. `/dashboard/trafico` - Monitor de despachos
2. `/dashboard/trafico/dmc` - Generación automática
3. `/dashboard/trafico/documentos` - BL, certificados

**Características clave:**
- ✅ DMC pre-llenado desde factura
- ✅ Lista de empaque por categoría arancelaria
- ✅ BL reutilizando datos del cliente
- ✅ Preparación anticipada

---

## 🎨 Principios de Diseño

### 1. Control de Acceso (CRÍTICO según doc.md)
```typescript
// Problema #5: "Costos visibles para todos"
// VENDEDORES NO DEBEN VER COSTOS

const ProductCard = ({ product, userRole }) => {
  const canSeeCosts = ['OWNER', 'ADMIN', 'WAREHOUSE'].includes(userRole);
  
  return (
    <div>
      <h3>{product.description}</h3>
      <p>Precio A: ${product.price_a}</p>
      {canSeeCosts && <p>Costo: ${product.cost}</p>}
      {canSeeCosts && <p>Margen: {calculateMargin(product)}%</p>}
    </div>
  );
};
```

### 2. Importación Masiva como Estándar
Toda tabla debe tener botón "Importar desde Excel"

### 3. Acciones, no solo consultas
Cada vista que muestra un problema debe permitir resolverlo desde ahí

### 4. Una sola base de datos
B2B y B2C comparten todo - el backend ya lo hace, el frontend debe reflejarlo

---

## 📊 Métricas de Éxito

### Problemas del doc.md que resolveremos:

| # | Problema | Solución Frontend |
|---|----------|-------------------|
| 1 | Crear Factura no funciona | POS B2C nuevo (Sprint 6) |
| 3 | DMC completamente manual | Generación automática (Sprint 5) |
| 5 | Costos visibles para todos | Control de acceso por rol |
| 7 | Carga manual prod. por prod. | Importación masiva (Sprint 2) |
| 11 | No se ve último precio vendido | Mostrar en cotizaciones (Sprint 4) |
| 12 | Lista empaque no agrupada | Agrupar por arancelaria (Sprint 5) |
| 13 | Sin métricas ni estadísticas | Dashboards (Sprint 7) |

---

## 🔄 Siguiente Paso Inmediato

**Crear el módulo de Productos** porque:
1. Es la base de todo (doc.md: "Todo depende de un catálogo confiable")
2. El backend ya está 100% listo
3. Es independiente - no depende de otros módulos
4. Resuelve el problema de duplicados de Celly

**Archivos a crear:**
1. `frontend/src/app/dashboard/productos/page.tsx`
2. `frontend/src/components/productos/ProductsTable.tsx`
3. `frontend/src/components/productos/ProductForm.tsx`
4. `frontend/src/components/productos/ProductImporter.tsx`

¿Procedo con la creación del módulo de Productos?
