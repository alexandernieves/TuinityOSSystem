# Plan de Implementación: Integración Contable de Compras y Ajustes

Este plan detalla los cambios necesarios para que las operaciones de almacén (Recepciones y Ajustes) impacten automáticamente el Libro Diario, completando el ciclo contable del ERP.

## Cambios Propuestos

### 📦 Módulo de Compras (Purchase Orders)
#### [MODIFY] [purchase-orders.service.ts](file:///Users/alexandernieves/Desktop/tuinity/backend/src/purchase-orders/purchase-orders.service.ts)
- Inyectar el `AccountingService`.
- En el método `receive`, después de actualizar el stock y el costo promedio, generar un asiento contable:
    - **Debito:** Cuenta de Inventarios (1030.01).
    - **Credito:** Cuenta de Proveedores (2010.01).
- Manejar la descripción dinámica incluyendo el número de OC y el nombre del Proveedor.

### ⚙️ Módulo de Ajustes (Adjustments)
#### [MODIFY] [adjustments.service.ts](file:///Users/alexandernieves/Desktop/tuinity/backend/src/adjustments/adjustments.service.ts)
- Inyectar el `AccountingService`.
- Al aprobar un ajuste de tipo "Merma" o "Rotura":
    - **Debito:** Cuenta de Gastos Administrativos / Pérdida (5020).
    - **Credito:** Cuenta de Inventarios (1030.01).

### 🖥️ Módulo de Dashboard
#### [MODIFY] [analytics.service.ts](file:///Users/alexandernieves/Desktop/tuinity/backend/src/analytics/analytics.service.ts)
- Refinar los cálculos de `monthRevenue`, `totalCXC` y `totalCXP` para asegurar que sumen datos de la base de datos real en lugar de promedios estáticos.

---

## Plan de Verificación

### Pruebas Automatizadas
1. **Test de Recepción de Compra:**
    - Usar `curl` para crear y recibir una OC.
    - Verificar vía API que se creó el asiento en `/accounting/entries`.
2. **Test de Ajuste de Inventario:**
    - Crear un ajuste de merma.
    - Aprobar el ajuste y verificar el impacto contable.

### Verificación Manual con Navegador
1. Crear una **Orden de Compra** en el frontend (`/compras/nueva`).
2. **Recibir** la mercancía en el detalle de la OC.
3. Navegar a **Contabilidad -> Libro Diario** y confirmar que el asiento de "Compra a Proveedor" aparece con los montos correctos.
4. Repetir el proceso con un **Ajuste de Salida** en el módulo de Inventario.
