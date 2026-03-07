'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronRight,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Briefcase,
  Store,
  Users,
  Receipt,
  Calculator,
  Landmark,
  Ship,
  BarChart3,
  Settings,
  History,
  FilePlus,
  CircleDollarSign,
  ClipboardEdit,
  UserPlus,
  FileText,
  Zap,
  Keyboard,
  Command,
  CornerDownLeft,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchItemType = 'page' | 'product' | 'client' | 'action';

interface SearchItem {
  id: string;
  type: SearchItemType;
  title: string;
  subtitle?: string;
  icon?: string;
  href: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Briefcase,
  Store,
  Users,
  Receipt,
  Calculator,
  Landmark,
  Ship,
  BarChart3,
  Settings,
  History,
  FilePlus,
  CircleDollarSign,
  ClipboardEdit,
  UserPlus,
  FileText,
  Zap,
  Keyboard,
};

const CATEGORY_ICON: Record<SearchItemType, React.ComponentType<{ className?: string }>> = {
  page: FileText,
  product: Package,
  client: Users,
  action: Zap,
};

const CATEGORY_LABEL: Record<SearchItemType, string> = {
  page: 'Páginas',
  product: 'Productos',
  client: 'Clientes',
  action: 'Acciones Rápidas',
};

// ---------------------------------------------------------------------------
// Mock searchable data
// ---------------------------------------------------------------------------

const SEARCH_ITEMS: SearchItem[] = [
  // Páginas
  { id: 'nav-1', type: 'page', title: 'Dashboard', subtitle: 'Página principal', icon: 'LayoutDashboard', href: '/dashboard' },
  { id: 'nav-2', type: 'page', title: 'Productos', subtitle: 'Catálogo de productos', icon: 'Package', href: '/productos' },
  { id: 'nav-3', type: 'page', title: 'Compras', subtitle: 'Órdenes de compra', icon: 'ShoppingCart', href: '/compras' },
  { id: 'nav-4', type: 'page', title: 'Inventario', subtitle: 'Gestión de inventario', icon: 'Warehouse', href: '/inventario' },
  { id: 'nav-5', type: 'page', title: 'Ventas B2B', subtitle: 'Pedidos y cotizaciones', icon: 'Briefcase', href: '/ventas' },
  { id: 'nav-6', type: 'page', title: 'Punto de Venta', subtitle: 'POS', icon: 'Store', href: '/ventas/pos' },
  { id: 'nav-7', type: 'page', title: 'Clientes', subtitle: 'Directorio de clientes', icon: 'Users', href: '/clientes' },
  { id: 'nav-8', type: 'page', title: 'Cuentas por Cobrar', subtitle: 'CxC y cobros', icon: 'Receipt', href: '/clientes/cxc' },
  { id: 'nav-9', type: 'page', title: 'Contabilidad', subtitle: 'Módulo contable', icon: 'Calculator', href: '/contabilidad' },
  { id: 'nav-10', type: 'page', title: 'Tesorería', subtitle: 'Bancos y flujo de caja', icon: 'Landmark', href: '/contabilidad/tesoreria' },
  { id: 'nav-11', type: 'page', title: 'Tráfico', subtitle: 'Logística y embarques', icon: 'Ship', href: '/trafico' },
  { id: 'nav-12', type: 'page', title: 'Reportes', subtitle: 'Análisis y reportes', icon: 'BarChart3', href: '/reportes' },
  { id: 'nav-13', type: 'page', title: 'Configuración', subtitle: 'Ajustes del sistema', icon: 'Settings', href: '/configuracion' },
  { id: 'nav-14', type: 'page', title: 'Historial', subtitle: 'Log de actividad', icon: 'History', href: '/historial' },
  // Productos
  { id: 'prod-1', type: 'product', title: 'WHISKY BLACK & WHITE 24X375ML', subtitle: 'EVL-00001 · WHISKY', href: '/productos?search=EVL-00001' },
  { id: 'prod-2', type: 'product', title: 'WHISKY JOHNNIE WALKER RED 12X750ML', subtitle: 'EVL-00002 · WHISKY', href: '/productos?search=EVL-00002' },
  { id: 'prod-3', type: 'product', title: 'RON BACARDI SUPERIOR 12X750ML', subtitle: 'EVL-00005 · RON', href: '/productos?search=EVL-00005' },
  { id: 'prod-4', type: 'product', title: 'VODKA GREY GOOSE 6X750ML', subtitle: 'EVL-00008 · VODKA', href: '/productos?search=EVL-00008' },
  { id: 'prod-5', type: 'product', title: 'TEQUILA JOSE CUERVO GOLD 12X750ML', subtitle: 'EVL-00010 · TEQUILA', href: '/productos?search=EVL-00010' },
  // Clientes
  { id: 'cli-1', type: 'client', title: 'MARIA DEL MAR PEREZ SV', subtitle: 'CLI-00007 · El Salvador', href: '/clientes/CLI-00007' },
  { id: 'cli-2', type: 'client', title: 'CORPORACION FAVORITA EC', subtitle: 'CLI-00009 · Ecuador', href: '/clientes/CLI-00009' },
  { id: 'cli-3', type: 'client', title: 'WORLD DUTY FREE GROUP', subtitle: 'CLI-00012 · Panamá', href: '/clientes/CLI-00012' },
  { id: 'cli-4', type: 'client', title: 'CASA VERGARA PA', subtitle: 'CLI-00015 · Panamá', href: '/clientes/CLI-00015' },
  // Acciones rápidas
  { id: 'act-1', type: 'action', title: 'Nueva Cotización', subtitle: 'Crear cotización B2B', icon: 'FilePlus', href: '/ventas?action=new-quote' },
  { id: 'act-2', type: 'action', title: 'Registrar Cobro', subtitle: 'Cuentas por cobrar', icon: 'CircleDollarSign', href: '/clientes/cxc/cobro' },
  { id: 'act-3', type: 'action', title: 'Nuevo Ajuste', subtitle: 'Ajuste de inventario', icon: 'ClipboardEdit', href: '/inventario/ajustes/nuevo' },
  { id: 'act-4', type: 'action', title: 'Nuevo Cliente', subtitle: 'Registrar cliente', icon: 'UserPlus', href: '/clientes/nuevo' },
  { id: 'act-5', type: 'action', title: 'Atajos de Teclado', subtitle: 'Ver todos los atajos · Ctrl+/', icon: 'Keyboard', href: '__shortcuts__' },
];

// Order in which categories appear
const CATEGORY_ORDER: SearchItemType[] = ['action', 'page', 'product', 'client'];
const MAX_PER_CATEGORY = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getItemIcon(item: SearchItem): React.ComponentType<{ className?: string }> {
  if (item.icon && ICON_MAP[item.icon]) {
    return ICON_MAP[item.icon];
  }
  return CATEGORY_ICON[item.type];
}

function groupByType(items: SearchItem[]): Map<SearchItemType, SearchItem[]> {
  const groups = new Map<SearchItemType, SearchItem[]>();
  for (const item of items) {
    const list = groups.get(item.type) ?? [];
    if (list.length < MAX_PER_CATEGORY) {
      list.push(item);
    }
    groups.set(item.type, list);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ---- Filtered & grouped results ----
  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (trimmed === '') {
      // Show "Acciones Rápidas" and "Páginas" when search is empty
      return SEARCH_ITEMS.filter((item) => item.type === 'action' || item.type === 'page');
    }

    return SEARCH_ITEMS.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(trimmed);
      const subtitleMatch = item.subtitle?.toLowerCase().includes(trimmed) ?? false;
      return titleMatch || subtitleMatch;
    });
  }, [query]);

  const grouped = useMemo(() => groupByType(filteredItems), [filteredItems]);

  // Flat list for keyboard navigation (ordered by category)
  const flatItems = useMemo(() => {
    const result: SearchItem[] = [];
    for (const type of CATEGORY_ORDER) {
      const items = grouped.get(type);
      if (items) {
        result.push(...items);
      }
    }
    return result;
  }, [grouped]);

  // ---- Reset state when opening/closing ----
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input on next tick so the animation has started
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // ---- Reset selection when results change ----
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems]);

  // ---- Scroll selected item into view ----
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // ---- Navigate to item ----
  const navigateTo = useCallback(
    (item: SearchItem) => {
      onClose();
      if (item.href === '__shortcuts__') {
        // Open keyboard shortcuts help modal
        setTimeout(() => window.dispatchEvent(new CustomEvent('open-shortcuts-help')), 100);
      } else {
        router.push(item.href);
      }
    },
    [onClose, router],
  );

  // ---- Keyboard handler ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatItems.length);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const item = flatItems[selectedIndex];
          if (item) {
            navigateTo(item);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onClose();
          break;
        }
      }
    },
    [flatItems, selectedIndex, navigateTo, onClose],
  );

  // ---- Global Ctrl+K listener ----
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle handled externally; we just close if open
        if (isOpen) {
          onClose();
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // ---- Render helpers ----
  function renderGroup(type: SearchItemType) {
    const items = grouped.get(type);
    if (!items || items.length === 0) return null;

    const CategoryIcon = CATEGORY_ICON[type];

    return (
      <div key={type}>
        {/* Section header */}
        <div className="px-4 py-1.5 flex items-center gap-2">
          <CategoryIcon className="h-3.5 w-3.5 text-[#666]" />
          <span className="text-xs font-semibold text-[#666] uppercase tracking-wider">
            {CATEGORY_LABEL[type]}
          </span>
        </div>

        {/* Items */}
        {items.map((item) => {
          const globalIdx = flatItems.indexOf(item);
          const isSelected = globalIdx === selectedIndex;
          const Icon = getItemIcon(item);

          return (
            <button
              key={item.id}
              data-selected={isSelected}
              onClick={() => navigateTo(item)}
              onMouseEnter={() => setSelectedIndex(globalIdx)}
              className={cn(
                'w-full px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors',
                isSelected
                  ? 'bg-[#1a1a1a] border-l-2 border-brand-500'
                  : 'border-l-2 border-transparent hover:bg-[#1a1a1a]',
              )}
            >
              <Icon className="h-4 w-4 text-[#666] shrink-0" />
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-sm text-white truncate w-full text-left">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-[#888] truncate w-full text-left">
                    {item.subtitle}
                  </span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-[#444] shrink-0" />
            </button>
          );
        })}
      </div>
    );
  }

  // ---- Main render ----
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden max-w-xl w-full mx-4"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-[#2a2a2a]">
              <Search className="h-5 w-5 text-[#666] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en Evolution OS..."
                className="bg-transparent text-white text-lg py-4 w-full outline-none placeholder:text-[#666]"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-xs text-[#666] border border-[#333] rounded px-1.5 py-0.5 hover:text-white hover:border-[#555] transition-colors shrink-0"
                >
                  Esc
                </button>
              )}
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
              {flatItems.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-[#666]">Sin resultados</p>
                  <p className="text-xs text-[#444] mt-1">
                    Intenta con otro término de búsqueda
                  </p>
                </div>
              ) : (
                CATEGORY_ORDER.map((type) => renderGroup(type))
              )}
            </div>

            {/* Footer with keyboard hints */}
            <div className="border-t border-[#2a2a2a] px-4 py-2 flex items-center gap-4 text-xs text-[#666]">
              <span className="flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" />
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" />
                Abrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono text-[10px] border border-[#333] rounded px-1 py-0.5">
                  Esc
                </kbd>
                Cerrar
              </span>
              <span className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1 opacity-60">
                  <Keyboard className="h-3 w-3" />
                  <kbd className="font-mono text-[10px] border border-[#333] rounded px-1 py-0.5">
                    Ctrl /
                  </kbd>
                </span>
                <span className="flex items-center gap-1">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
