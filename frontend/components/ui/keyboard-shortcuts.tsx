'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import {
  Keyboard,
  Search,
  PanelLeftClose,
  Moon,
  Bell,
  FilePlus,
  ShoppingCart,
  Users,
  Package,
  ClipboardEdit,
  CircleDollarSign,
  X,
  Home,
  BarChart3,
  Calculator,
  Warehouse,
  Briefcase,
  History,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShortcutDef {
  keys: string[];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'sistema' | 'acciones' | 'navegacion';
}

// ---------------------------------------------------------------------------
// Shortcut definitions
// ---------------------------------------------------------------------------

const SHORTCUTS: ShortcutDef[] = [
  // Sistema
  { keys: ['Ctrl', 'K'], label: 'Buscar', icon: Search, category: 'sistema' },
  { keys: ['Ctrl', '/'], label: 'Atajos de teclado', icon: Keyboard, category: 'sistema' },
  { keys: ['Ctrl', 'B'], label: 'Colapsar barra lateral', icon: PanelLeftClose, category: 'sistema' },
  { keys: ['Ctrl', 'J'], label: 'Alternar modo oscuro', icon: Moon, category: 'sistema' },
  { keys: ['Ctrl', 'Shift', 'N'], label: 'Notificaciones', icon: Bell, category: 'sistema' },
  // Acciones rápidas
  { keys: ['Ctrl', 'Shift', 'V'], label: 'Nueva cotización', icon: FilePlus, category: 'acciones' },
  { keys: ['Ctrl', 'Shift', 'C'], label: 'Nuevo cliente', icon: Users, category: 'acciones' },
  { keys: ['Ctrl', 'Shift', 'P'], label: 'Nuevo producto', icon: Package, category: 'acciones' },
  { keys: ['Ctrl', 'Shift', 'A'], label: 'Nuevo ajuste inventario', icon: ClipboardEdit, category: 'acciones' },
  { keys: ['Ctrl', 'Shift', 'O'], label: 'Nueva orden de compra', icon: ShoppingCart, category: 'acciones' },
  { keys: ['Ctrl', 'Shift', 'R'], label: 'Registrar cobro', icon: CircleDollarSign, category: 'acciones' },
  // Navegación rápida
  { keys: ['Alt', 'H'], label: 'Dashboard', icon: Home, category: 'navegacion' },
  { keys: ['Alt', 'V'], label: 'Ventas B2B', icon: Briefcase, category: 'navegacion' },
  { keys: ['Alt', 'C'], label: 'Clientes', icon: Users, category: 'navegacion' },
  { keys: ['Alt', 'I'], label: 'Inventario', icon: Warehouse, category: 'navegacion' },
  { keys: ['Alt', 'P'], label: 'Productos', icon: Package, category: 'navegacion' },
  { keys: ['Alt', 'T'], label: 'Contabilidad', icon: Calculator, category: 'navegacion' },
  { keys: ['Alt', 'R'], label: 'Reportes', icon: BarChart3, category: 'navegacion' },
  { keys: ['Alt', 'L'], label: 'Historial', icon: History, category: 'navegacion' },
];

const CATEGORY_LABELS: Record<string, string> = {
  sistema: 'Sistema',
  acciones: 'Acciones Rápidas',
  navegacion: 'Navegación',
};

const CATEGORY_ORDER = ['sistema', 'acciones', 'navegacion'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KeyboardShortcuts() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toggleCollapsed } = useSidebar();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleShortcut = useCallback(
    (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const key = e.key.toLowerCase();

      // Don't trigger in input fields (except Escape and Ctrl combos)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput && !ctrl && key !== 'escape') return;

      // ── Sistema ──────────────────────────────────────────

      // Ctrl+/ → Help
      if (ctrl && !shift && !alt && e.key === '/') {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      // Ctrl+B → Toggle sidebar
      if (ctrl && !shift && !alt && key === 'b') {
        e.preventDefault();
        toggleCollapsed();
        return;
      }

      // Ctrl+J → Toggle theme
      if (ctrl && !shift && !alt && key === 'j') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
        return;
      }

      // Ctrl+Shift+N → Toggle notifications
      if (ctrl && shift && !alt && key === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-notifications'));
        return;
      }

      // ── Acciones Rápidas ─────────────────────────────────

      // Ctrl+Shift+V → Nueva cotización
      if (ctrl && shift && !alt && key === 'v') {
        e.preventDefault();
        router.push('/ventas/nueva');
        return;
      }

      // Ctrl+Shift+C → Nuevo cliente
      if (ctrl && shift && !alt && key === 'c') {
        e.preventDefault();
        router.push('/clientes/nuevo');
        return;
      }

      // Ctrl+Shift+P → Nuevo producto
      if (ctrl && shift && !alt && key === 'p') {
        e.preventDefault();
        router.push('/productos/nuevo');
        return;
      }

      // Ctrl+Shift+A → Nuevo ajuste inventario
      if (ctrl && shift && !alt && key === 'a') {
        e.preventDefault();
        router.push('/inventario/ajustes/nuevo');
        return;
      }

      // Ctrl+Shift+O → Nueva orden de compra
      if (ctrl && shift && !alt && key === 'o') {
        e.preventDefault();
        router.push('/compras?action=new');
        return;
      }

      // Ctrl+Shift+R → Registrar cobro
      if (ctrl && shift && !alt && key === 'r') {
        e.preventDefault();
        router.push('/clientes/cxc/cobro');
        return;
      }

      // ── Navegación Rápida (Alt+Letra) ────────────────────

      if (alt && !ctrl && !shift) {
        const navMap: Record<string, string> = {
          h: '/dashboard',
          v: '/ventas',
          c: '/clientes',
          i: '/inventario',
          p: '/productos',
          t: '/contabilidad',
          r: '/reportes',
          l: '/historial',
        };

        if (navMap[key]) {
          e.preventDefault();
          router.push(navMap[key]);
          return;
        }
      }

      // Escape → Close help modal
      if (key === 'escape' && isHelpOpen) {
        setIsHelpOpen(false);
        return;
      }
    },
    [router, theme, setTheme, toggleCollapsed, isHelpOpen],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [handleShortcut]);

  // External trigger to open help (e.g. from command palette)
  useEffect(() => {
    const handler = () => setIsHelpOpen(true);
    window.addEventListener('open-shortcuts-help', handler);
    return () => window.removeEventListener('open-shortcuts-help', handler);
  }, []);

  return (
    <AnimatePresence>
      {isHelpOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setIsHelpOpen(false)}
        >
          <motion.div
            className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-[#2a2a2a] bg-white shadow-2xl dark:bg-[#141414]"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10">
                  <Keyboard className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Atajos de Teclado
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-[#888]">
                    Navega rápido con el teclado
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-[#666] dark:hover:bg-[#2a2a2a] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-4">
              {CATEGORY_ORDER.map((cat) => {
                const items = SHORTCUTS.filter((s) => s.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#666]">
                      {CATEGORY_LABELS[cat]}
                    </h3>
                    <div className="space-y-0.5">
                      {items.map((shortcut) => {
                        const Icon = shortcut.icon;
                        return (
                          <div
                            key={shortcut.label}
                            className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-gray-400 dark:text-[#666]" />
                              <span className="text-sm text-gray-700 dark:text-[#ccc]">
                                {shortcut.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((k, i) => (
                                <kbd
                                  key={i}
                                  className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-gray-300 bg-gray-100 px-1.5 text-[11px] font-medium text-gray-500 dark:border-[#333] dark:bg-[#2a2a2a] dark:text-[#999]"
                                >
                                  {k}
                                </kbd>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-[#2a2a2a]">
              <span className="text-xs text-gray-400 dark:text-[#666]">
                Presiona{' '}
                <kbd className="mx-1 inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 bg-gray-100 px-1 text-[10px] font-medium text-gray-500 dark:border-[#333] dark:bg-[#2a2a2a] dark:text-[#999]">
                  Esc
                </kbd>{' '}
                para cerrar
              </span>
              <span className="text-xs text-gray-300 dark:text-[#444]">
                Evolution OS
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
