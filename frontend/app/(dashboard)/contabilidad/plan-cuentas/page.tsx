'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { Search, Plus, Edit2, ToggleLeft, ToggleRight, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  ASSET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  LIABILITY: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  EQUITY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  REVENUE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  EXPENSE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Activo', LIABILITY: 'Pasivo', EQUITY: 'Capital', REVENUE: 'Ingreso', EXPENSE: 'Gasto'
};

export default function PlanCuentasPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAcc, setEditAcc] = useState<any>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ code: '', name: '', type: 'ASSET', parentId: '', isActive: true });

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.getAccounts();
      setAccounts(data);
    } catch { toast.error('Error cargando cuentas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAccounts(); }, []);

  const filtered = accounts.filter(a =>
    !search || a.code.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase())
  );

  // Build hierarchy
  const buildTree = (items: any[], parentId: string | null = null): any[] =>
    items.filter(a => a.parentAccountId === parentId)
         .map(a => ({ ...a, children: buildTree(items, a.id) }));

  const tree = buildTree(filtered.length < accounts.length ? filtered : accounts);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const openCreate = () => {
    setEditAcc(null);
    setForm({ code: '', name: '', type: 'ASSET', parentId: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (acc: any) => {
    setEditAcc(acc);
    setForm({ code: acc.code, name: acc.name, type: acc.type, parentId: acc.parentAccountId || '', isActive: acc.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editAcc) {
        await api.updateAccount(editAcc.id, { ...form });
        toast.success('Cuenta actualizada');
      } else {
        await api.createAccount({ ...form });
        toast.success('Cuenta creada');
      }
      setShowModal(false);
      loadAccounts();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleToggle = async (acc: any) => {
    try {
      await api.updateAccount(acc.id, { ...acc, isActive: !acc.isActive });
      toast.success(!acc.isActive ? 'Cuenta activada' : 'Cuenta desactivada');
      loadAccounts();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSeed = async () => {
    try {
      await api.seedAccountingCOA();
      toast.success('Plan de cuentas y mapeos inicializados');
      loadAccounts();
    } catch (e: any) { toast.error(e.message); }
  };

  const renderTree = (nodes: any[], depth = 0) =>
    nodes.map(node => (
      <div key={node.id}>
        <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${!node.isActive ? 'opacity-40' : ''}`}
             style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <button onClick={() => toggleExpand(node.id)} className="w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0">
            {node.children.length > 0 ? (expanded.has(node.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : <span className="w-3.5" />}
          </button>
          <span className="font-mono text-xs text-gray-400 w-20 flex-shrink-0">{node.code}</span>
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{node.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[node.type]}`}>{TYPE_LABELS[node.type]}</span>
          <button onClick={() => openEdit(node)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => handleToggle(node)} className="p-1.5 text-gray-400 hover:text-emerald-500 transition-colors">
            {node.isActive ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
        </div>
        {node.children.length > 0 && expanded.has(node.id) && renderTree(node.children, depth + 1)}
      </div>
    ));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan de Cuentas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Catálogo maestro de cuentas contables</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSeed} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
            <RefreshCw className="h-4 w-4" /> Inicializar
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
            <Plus className="h-4 w-4" /> Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Buscar por código o nombre..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Accounts table */}
      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span className="w-5" />
          <span className="w-20">Código</span>
          <span className="flex-1">Nombre</span>
          <span className="w-24">Tipo</span>
          <span className="w-16">Acciones</span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : (
          search ? (
            filtered.map(acc => (
              <div key={acc.id} className={`flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 ${!acc.isActive ? 'opacity-40' : ''}`}>
                <span className="w-5" />
                <span className="font-mono text-xs text-gray-400 w-20">{acc.code}</span>
                <span className="flex-1 text-sm font-medium">{acc.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[acc.type]}`}>{TYPE_LABELS[acc.type]}</span>
                <div className="flex gap-1 w-16">
                  <button onClick={() => openEdit(acc)} className="p-1.5 text-gray-400 hover:text-blue-500"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleToggle(acc)} className="p-1.5 text-gray-400 hover:text-emerald-500">
                    {acc.isActive ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))
          ) : renderTree(tree)
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold">{editAcc ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Código *</label>
                <input value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Ej: 1010.03" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Nombre de la cuenta" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Cuenta Padre (código, opcional)</label>
              <input value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Ej: 1010" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/10 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
