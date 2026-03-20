'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Pencil, 
  Trash2, 
  Layers, 
  Tag, 
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  X
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  isActive: boolean;
  children?: Category[];
  _count?: {
    children?: number;
    products?: number;
    subproducts?: number;
  };
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({
    name: '',
    parentId: null,
    isActive: true,
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  };

  const handleCreateGroup = () => {
    setIsEditing(false);
    setCurrentCategory({ name: '', parentId: null, isActive: true });
    setIsModalOpen(true);
  };

  const handleCreateSubgroup = (parentId: string) => {
    setIsEditing(false);
    setCurrentCategory({ name: '', parentId: parentId, isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setIsEditing(true);
    setCurrentCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    
    try {
      await api.deleteCategory(id);
      toast.success('Categoría eliminada');
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar la categoría');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory.name) return;

    try {
      if (isEditing && currentCategory.id) {
        await api.updateCategory(currentCategory.id, {
          name: currentCategory.name,
          isActive: currentCategory.isActive,
        });
        toast.success('Categoría actualizada');
      } else {
        await api.createCategory({
          name: currentCategory.name,
          parentId: currentCategory.parentId,
          isActive: currentCategory.isActive,
        });
        toast.success('Categoría creada');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar categoría');
    }
  };

  const renderCategory = (category: Category) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expanded.has(category.id);

    return (
      <div key={category.id} className="w-full">
        <div className={cn(
          "group flex items-center justify-between py-3 px-4 rounded-xl border border-transparent transition-all",
          category.level === 1 
            ? "bg-white dark:bg-[#141414] border-gray-100 dark:border-white/5 mb-2 shadow-sm"
            : "ml-8 bg-gray-50/50 dark:bg-white/[0.02] border-gray-100/50 dark:border-white/[0.02] mb-1"
        )}>
          <div className="flex items-center gap-3">
            {category.level === 1 && (
              <button 
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            
            <div className={cn(
              "p-2 rounded-lg",
              category.isActive 
                ? (category.level === 1 ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")
                : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-600"
            )}>
              {category.level === 1 ? <Layers className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
            </div>

            <div>
              <p className={cn(
                "font-bold text-sm",
                !category.isActive && "text-gray-400 line-through"
              )}>{category.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                  {category.level === 1 ? 'Grupo' : 'Subgrupo'}
                </p>
                {category.level === 1 && category._count?.children !== undefined && (
                  <>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                      {category._count.children} subcategorías
                    </p>
                  </>
                )}
                {category.level === 2 && category._count?.subproducts !== undefined && (
                  <>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                      {category._count.subproducts} productos
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {category.level === 1 && (
              <button 
                onClick={() => handleCreateSubgroup(category.id)}
                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors"
                title="Añadir Subgrupo"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            <button 
              onClick={() => handleEdit(category)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleDelete(category.id)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="animate-in slide-in-from-top-1 duration-200">
            {category.children?.map(child => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Organización de Catálogo</span>
           </div>
           <h1 className="text-3xl font-black">Categorías y Grupos</h1>
           <p className="text-gray-500 text-sm mt-1">Gestiona la jerarquía de tus productos (Máximo 2 niveles).</p>
        </div>

        <button 
           onClick={handleCreateGroup}
           className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" />
          Nuevo Grupo
        </button>
      </div>

      <div className="bg-white/50 dark:bg-[#141414]/50 rounded-2xl border border-gray-200 dark:border-white/5 p-2 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Cargando categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
             <div className="h-16 w-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-gray-300" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white">No hay categorías</h3>
             <p className="text-sm text-gray-500 max-w-xs mt-1">Comienza creando un grupo para organizar tus productos.</p>
             <button onClick={handleCreateGroup} className="mt-6 text-blue-600 font-bold text-sm hover:underline">Crear mi primer grupo</button>
          </div>
        ) : (
          <div className="p-2">
            {categories.map(cat => renderCategory(cat))}
          </div>
        )}
      </div>

      {/* FULL SCREEN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-[#0A0A0A] animate-in slide-in-from-right duration-300 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md z-10">
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                {isEditing ? 'Editar' : 'Crear'} {currentCategory.parentId ? 'Subgrupo' : 'Grupo'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Configura los detalles de la categoría a continuación.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
            <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] px-1">Nombre de la Categoría</label>
                  <input 
                    autoFocus
                    required
                    value={currentCategory.name}
                    onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                    className="w-full h-16 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-black rounded-2xl px-6 text-xl outline-none transition-all font-bold placeholder:text-gray-300 dark:placeholder:text-gray-700 shadow-sm"
                    placeholder="Ej: BEBIDAS SPIRITUOSAS"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      currentCategory.isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"
                    )}>
                      {currentCategory.isActive ? <CheckCircle2 className="h-6 w-6" /> : <X className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-base">Estado de la categoría</p>
                      <p className="text-xs text-gray-500">Determina si los productos de esta categoría serán visibles.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                      {currentCategory.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentCategory({...currentCategory, isActive: !currentCategory.isActive})}
                      className={cn(
                        "h-8 w-14 rounded-full relative transition-colors shadow-inner",
                        currentCategory.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 h-6 w-6 bg-white rounded-full transition-all shadow-md",
                        currentCategory.isActive ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-bold text-blue-600 uppercase">Tip de Organización</span>
                  </div>
                  <p className="text-xs text-blue-700/80 dark:text-blue-300/60 leading-relaxed">
                    Usa nombres claros y concisos. Las categorías bien definidas ayudan a tus clientes a encontrar productos más rápido.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-600 uppercase">Recordatorio</span>
                  </div>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/60 leading-relaxed">
                    Al cambiar el estado a inactivo, todos los productos asociados dejarán de estar disponibles en el catálogo público.
                  </p>
                </div>
              </div>

              <div className="pt-10 flex flex-col md:flex-row items-center gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full md:w-auto px-8 h-14 rounded-2xl text-base font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-all order-2 md:order-1"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="w-full md:flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-black shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] order-1 md:order-2 flex items-center justify-center gap-2"
                >
                  {isEditing ? 'Guardar Cambios' : 'Finalizar y Crear Categoría'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
