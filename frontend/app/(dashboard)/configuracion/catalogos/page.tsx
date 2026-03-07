'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Edit,
  Search,
  Package,
  Globe,
  Building2,
  Tag,
  Truck,
  FileText,
  Landmark,
  FileCheck,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useStore } from '@/hooks/use-store';
import {
  getMasterCatalogsData,
  subscribeMasterCatalogs,
  getCatalogItems,
  subscribeCatalogItems,
  addCatalogItem,
  updateCatalogItem,
} from '@/lib/mock-data/configuration';
import type { CatalogItem, MasterCatalog } from '@/lib/types/configuration';

const ICON_MAP: Record<string, React.ElementType> = {
  Globe,
  Building2,
  Tag,
  Package,
  Truck,
  FileText,
  Landmark,
  FileCheck,
  CreditCard,
  XCircle,
};

export default function CatalogosPage() {
  const router = useRouter();

  const masterCatalogs = useStore(subscribeMasterCatalogs, getMasterCatalogsData);
  // Subscribe to catalog items changes so the table re-renders
  useStore(subscribeCatalogItems, () => 0);

  const [isOpen, setIsOpen] = useState(false);

  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(masterCatalogs[0]?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');

  // Item modal state
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [itemForm, setItemForm] = useState({ code: '', name: '', description: '' });

  const selectedCatalog = masterCatalogs.find((c) => c.id === selectedCatalogId) || masterCatalogs[0];

  const catalogItems = useMemo(() => {
    const items = getCatalogItems(selectedCatalogId);
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [selectedCatalogId, searchQuery]);

  const handleOpenItemModal = (item?: CatalogItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({ code: item.code, name: item.name, description: item.description || '' });
    } else {
      setEditingItem(null);
      setItemForm({ code: '', name: '', description: '' });
    }
    setIsOpen(true);
  };

  const handleSaveItem = () => {
    if (editingItem) {
      updateCatalogItem(selectedCatalogId, editingItem.id, { code: itemForm.code, name: itemForm.name, description: itemForm.description });
    } else {
      const now = new Date().toISOString();
      const newId = `CI-NEW-${Date.now()}`;
      addCatalogItem(selectedCatalogId, { id: newId, code: itemForm.code, name: itemForm.name, description: itemForm.description, isActive: true, sortOrder: catalogItems.length + 1, createdAt: now, updatedAt: now });
    }
    toast.success(editingItem ? 'Item actualizado' : 'Item creado', {
      description: `"${itemForm.name}" en ${selectedCatalog.name}`,
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back link and header */}
      <div>
        <button
          onClick={() => router.push('/configuracion')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-[#888888] transition-colors hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Configuración
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
            <BookOpen className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Catálogos Maestros</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">{masterCatalogs.length} catálogos configurados</p>
          </div>
        </div>
      </div>

      {/* Tab navigation for catalogs */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-1 min-w-max">
          {masterCatalogs.map((catalog) => {
            const IconComponent = ICON_MAP[catalog.icon] || BookOpen;
            const isSelected = selectedCatalogId === catalog.id;
            return (
              <button
                key={catalog.id}
                onClick={() => {
                  setSelectedCatalogId(catalog.id);
                  setSearchQuery('');
                }}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-all',
                  isSelected
                    ? 'bg-white dark:bg-[#141414] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-[#888888] hover:text-gray-700 dark:hover:text-white'
                )}
              >
                <IconComponent className="h-3.5 w-3.5" />
                {catalog.name}
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                  isSelected
                    ? 'bg-brand-500/10 text-brand-600'
                    : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-500 dark:text-[#666666]'
                )}>
                  {catalog.itemCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Catalog Content */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5">
        {/* Catalog Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCatalog.name}</h2>
            <p className="text-sm text-gray-500 dark:text-[#888888]">{selectedCatalog.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              onClick={() => handleOpenItemModal()}
              className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
            >
              <Plus className="h-4 w-4" />
              Nuevo Item
            </button>
          </div>
        </div>

        {/* Catalog Items Table */}
        {catalogItems.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Descripción</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Activo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                  {catalogItems.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                    >
                      <td className="px-4 py-3">
                        <span className="rounded bg-gray-100 dark:bg-[#2a2a2a] px-2 py-0.5 font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{item.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500 dark:text-[#888888]">{item.description || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch defaultChecked={item.isActive} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenItemModal(item)}
                          className="flex mx-auto h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-[#666666] transition-colors hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-600 dark:hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] py-16">
            <BookOpen className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
            <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No hay items cargados</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-[#888888]">
              {searchQuery
                ? 'No se encontraron items con ese criterio de búsqueda'
                : `El catálogo "${selectedCatalog.name}" no tiene items cargados aún`}
            </p>
            {!searchQuery && (
              <button
                onClick={() => handleOpenItemModal()}
                className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
              >
                <Plus className="h-4 w-4" />
                Agregar Primer Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Item Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <BookOpen className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingItem ? 'Editar Item' : 'Nuevo Item'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#888888]">{selectedCatalog.name}</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Código</label>
              <Input placeholder="Ej: TRF" value={itemForm.code} onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <Input placeholder="Ej: Transferencia Bancaria" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción (opcional)</label>
              <Input placeholder="Descripción del item" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} variant="bordered" />
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsOpen(false)}>Cancelar</Button>
          <Button color="primary" onPress={handleSaveItem} className="bg-brand-600">
            {editingItem ? 'Guardar Cambios' : 'Crear Item'}
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
