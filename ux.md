🎨 PALETA DE COLORES
/* Azul Principal (Botones, Enlaces, Activos) */
#2563EB - Color primario
#1D4ED8 - Hover primario
#38BDF8 - Acentos

/* Fondos */
#FFFFFF - Fondo blanco
#F7F9FC - Fondo secundario (panels, headers tabla)

/* Bordes */
#E2E8F0 - Borde estándar

/* Textos */
#0F172A - Texto principal (títulos)
#475569 - Texto secundario (body)
#94A3B8 - Texto muted (placeholders, labels)

/* Estados */
#16A34A - Verde (éxito/activo/óptimo)
#F59E0B - Naranja (advertencia/bajo)
#DC2626 - Rojo (error/crítico)

/* Backgrounds de estado (opacity 10%) */
rgba(22, 163, 74, 0.1)   - Verde claro
rgba(245, 158, 11, 0.1)  - Naranja claro
rgba(220, 38, 38, 0.1)   - Rojo claro
rgba(37, 99, 235, 0.1)   - Azul claro
🔘 BOTONES
Primario (Acciones principales)
<button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
  <Plus className="w-4 h-4" />
  <span>Texto</span>
</button>
Secundario (Exportar, Filtros)
<button className="flex items-center gap-2 px-4 py-2 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#0F172A]">
  <Download className="w-4 h-4" />
  <span>Texto</span>
</button>
Destructivo (Eliminar, Cancelar crítico)
<button className="flex items-center gap-2 px-4 py-2 text-sm text-[#DC2626] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#FEF2F2] transition-colors">
  <Trash2 className="w-4 h-4" />
  <span>Eliminar</span>
</button>
Icono solo (Acciones en tabla)
<button className="p-1.5 text-[#2563EB] hover:bg-[#2563EB]/10 rounded transition-colors" title="Ver">
  <Eye className="w-4 h-4" />
</button>
📊 TABLAS
Estructura base
<div className="overflow-x-auto">
  <table className="w-full">
    <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
      <tr>
        <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">
          Columna
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-[#E2E8F0]">
      <tr className="hover:bg-[#F7F9FC] transition-colors cursor-pointer">
        <td className="px-4 py-3">Contenido</td>
      </tr>
    </tbody>
  </table>
</div>
Columna con icono + texto
<td className="px-4 py-3">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-[#F7F9FC] flex items-center justify-center text-xl">
      📦
    </div>
    <div>
      <p className="text-sm font-medium text-[#0F172A]">Título</p>
      <p className="text-xs text-[#94A3B8]">Subtítulo</p>
    </div>
  </div>
</td>
Columna de código/referencia
<td className="px-4 py-3">
  <span className="inline-flex items-center px-2 py-1 rounded bg-[#F7F9FC] text-xs font-mono text-[#475569]">
    REF-001
  </span>
</td>
Columna de precio
<td className="px-4 py-3 text-right">
  <p className="text-sm font-semibold text-[#0F172A]">$250.00</p>
  <p className="text-xs text-[#94A3B8]">Costo: $180.00</p>
</td>
Badges de estado
/* Verde (Activo/Óptimo) */
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-medium">
  <CheckCircle className="w-3 h-3" />
  Activo
</span>

/* Naranja (Advertencia) */
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-medium">
  <AlertTriangle className="w-3 h-3" />
  Advertencia
</span>

/* Rojo (Crítico) */
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-xs font-medium">
  <AlertTriangle className="w-3 h-3" />
  Crítico
</span>
Columna de acciones
<td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
  <div className="flex items-center justify-center gap-2">
    <button className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded transition-colors" title="Editar">
      <Edit className="w-4 h-4" />
    </button>
    <button className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 rounded transition-colors" title="Eliminar">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
</td>
🔲 MODALES
Estructura completa
{showModal && (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" 
    onClick={closeModal}
  >
    <div 
      className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
        <h2 className="text-xl font-semibold text-[#0F172A]">Título</h2>
        <button onClick={closeModal} className="p-2 hover:bg-[#F7F9FC] rounded-lg transition-colors">
          <X className="w-5 h-5 text-[#475569]" />
        </button>
      </div>
      
      {/* TABS (Opcional) */}
      <div className="flex border-b border-[#E2E8F0]">
        <button className="px-6 py-3 text-sm font-medium text-[#2563EB] border-b-2 border-[#2563EB]">
          Tab Activo
        </button>
        <button className="px-6 py-3 text-sm font-medium text-[#94A3B8] hover:text-[#475569]">
          Tab Inactivo
        </button>
      </div>
      
      {/* CONTENIDO */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        {/* Sección de formulario */}
        <div className="bg-[#F7F9FC] p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#2563EB]" />
            SECCIÓN
          </h3>
          <div className="space-y-3">
            {/* Campos aquí */}
          </div>
        </div>
      </div>
      
      {/* FOOTER */}
      <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E2E8F0] bg-[#F7F9FC]">
        <button className="px-4 py-2 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569]">
          Cancelar
        </button>
        <button className="px-4 py-2 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
          Guardar
        </button>
      </div>
    </div>
  </div>
)}
📝 CAMPOS DE FORMULARIO
Input text
<div>
  <label className="block text-xs font-medium text-[#475569] mb-1.5">Label</label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm"
    placeholder="Placeholder..."
  />
</div>
Select
<div>
  <label className="block text-xs font-medium text-[#475569] mb-1.5">Label</label>
  <div className="relative">
    <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm appearance-none">
      <option>Opción</option>
    </select>
    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
  </div>
</div>
Textarea
<div>
  <label className="block text-xs font-medium text-[#475569] mb-1.5">Label</label>
  <textarea
    rows={3}
    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm resize-none"
  />
</div>
📊 STATS CARDS (KPIs)
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-white rounded-lg p-4 border border-[#E2E8F0] shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-[#475569]">Label KPI</p>
        <p className="text-2xl font-semibold text-[#0F172A] mt-1">1,248</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
        <Package className="w-5 h-5 text-[#2563EB]" />
      </div>
    </div>
  </div>
</div>
Colores de iconos:

Azul #2563EB: Totales, general
Verde #16A34A: Éxito, positivo
Naranja #F59E0B: Advertencia
Rojo #DC2626: Crítico, urgente
🔍 BÚSQUEDA Y FILTROS
Input de búsqueda
<div className="flex-1 relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
  <input
    type="text"
    placeholder="Buscar por..."
    className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm"
  />
</div>
Panel de filtros
<div className="p-4 bg-[#F7F9FC] border-b border-[#E2E8F0]">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {/* Filtros aquí */}
  </div>
</div>
Badges de filtros activos
<span className="inline-flex items-center gap-1 px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] text-xs rounded-md">
  Filtro Activo
  <X className="w-3 h-3 cursor-pointer" onClick={remover} />
</span>
📄 PAGINACIÓN
<div className="px-4 py-3 bg-[#F7F9FC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
  <p className="text-sm text-[#475569]">Página {current} de {total}</p>
  <div className="flex items-center gap-2">
    <button disabled={current === 1} className="p-2 border border-[#E2E8F0] rounded-lg hover:bg-white disabled:opacity-50">
      <ChevronLeft className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 rounded-lg text-sm font-medium bg-[#2563EB] text-white">1</button>
    <button className="w-8 h-8 rounded-lg text-sm font-medium bg-white text-[#475569] border border-[#E2E8F0]">2</button>
    <button disabled={current === total} className="p-2 border border-[#E2E8F0] rounded-lg hover:bg-white disabled:opacity-50">
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
</div>
📐 ESPACIADO Y TAMAÑOS
/* Contenedor principal */
padding: p-4 sm:p-6
space-y: space-y-6 (gap vertical entre secciones)

/* Cards y paneles */
padding: p-4
border-radius: rounded-lg
border: border border-[#E2E8F0]

/* Títulos */
H1: text-2xl font-semibold text-[#0F172A]
H2: text-xl font-semibold text-[#0F172A]
H3: text-sm font-semibold text-[#0F172A]

/* Textos */
Body: text-sm text-[#475569]
Small: text-xs text-[#94A3B8]
Labels: text-xs font-medium text-[#475569]

/* Iconos */
Pequeño: w-4 h-4
Medio: w-5 h-5
Grande: w-8 h-8
✅ CHECKLIST RÁPIDO
✅ Azul primario: #2563EB
✅ Hover: hover:bg-... + transition-colors
✅ Tabla header: bg-[#F7F9FC]
✅ Filas: hover:bg-[#F7F9FC] + cursor-pointer
✅ Badges: rounded-full para estados
✅ Borders: #E2E8F0
✅ Focus: focus:ring-2 focus:ring-[#2563EB]
✅ Modal overlay: bg-black/50
✅ Grid responsive: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
✅ Items por página: 8