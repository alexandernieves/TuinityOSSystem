'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
} from '@heroui/react';
import {
  Plus,
  Search,
  ClipboardList,
  MoreHorizontal,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Warehouse,
  Package,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { MOCK_COUNT_SESSIONS, subscribeCountSessions, getCountSessionsData } from '@/lib/mock-data/inventory';
import { useStore } from '@/hooks/use-store';
import { CountSessionStatus } from '@/lib/types/inventory';

type TabFilter = 'all' | 'en_progreso' | 'completado';

export default function ConteoPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canCreateCount = checkPermission('canCreateCountSessions');

  // Reactive store subscription
  const countSessions = useStore(subscribeCountSessions, getCountSessionsData);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    {
      key: 'all',
      label: 'Todos',
      count: countSessions.length,
    },
    {
      key: 'en_progreso',
      label: 'En Progreso',
      count: countSessions.filter((s) => s.status === 'en_progreso').length,
    },
    {
      key: 'completado',
      label: 'Completados',
      count: countSessions.filter((s) => s.status === 'completado').length,
    },
  ];

  const filteredSessions = useMemo(() => {
    return countSessions.filter((session) => {
      // Tab filter
      if (activeTab !== 'all' && session.status !== activeTab) return false;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          session.id.toLowerCase().includes(searchLower) ||
          session.warehouseName.toLowerCase().includes(searchLower) ||
          session.zone?.toLowerCase().includes(searchLower) ||
          session.createdByName.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [countSessions, activeTab, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: CountSessionStatus) => {
    switch (status) {
      case 'en_progreso':
        return 'bg-blue-100 text-blue-700';
      case 'completado':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: CountSessionStatus) => {
    switch (status) {
      case 'en_progreso':
        return 'En Progreso';
      case 'completado':
        return 'Completado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: CountSessionStatus) => {
    switch (status) {
      case 'en_progreso':
        return <Clock className="h-3.5 w-3.5" />;
      case 'completado':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <ClipboardList className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Conteo Físico</h1>
            <p className="text-sm text-gray-500">Sesiones de verificación de inventario</p>
          </div>
        </div>
        {canCreateCount && (
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => router.push('/inventario/conteo/nuevo')}
            className="bg-brand-600"
          >
            Nueva Sesión
          </Button>
        )}
      </div>

      {/* Filters Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    activeTab === tab.key
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full md:w-80">
            <Input
              placeholder="Buscar sesiones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              variant="bordered"
              classNames={{ inputWrapper: 'bg-white' }}
            />
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => {
            const progress = (session.countedProducts / session.totalProducts) * 100;

            return (
              <div
                key={session.id}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-brand-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{session.id}</h3>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          getStatusColor(session.status)
                        )}
                      >
                        {getStatusIcon(session.status)}
                        {getStatusLabel(session.status)}
                      </span>
                    </div>
                    {session.zone && (
                      <p className="mt-1 text-sm text-gray-500">{session.zone}</p>
                    )}
                  </div>
                  <Dropdown>
                    <DropdownTrigger>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Acciones">
                      <DropdownItem
                        key="view"
                        startContent={<Eye className="h-4 w-4" />}
                        onPress={() => router.push(`/inventario/conteo/${session.id}`)}
                      >
                        Ver Sesión
                      </DropdownItem>
                      {session.status === 'en_progreso' ? (
                        <DropdownItem
                          key="continue"
                          startContent={<ClipboardList className="h-4 w-4" />}
                          onPress={() => router.push(`/inventario/conteo/${session.id}`)}
                        >
                          Continuar Conteo
                        </DropdownItem>
                      ) : null}
                      <DropdownItem
                        key="delete"
                        startContent={<Trash2 className="h-4 w-4" />}
                        className="text-danger"
                        color="danger"
                      >
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progreso</span>
                    <span className="font-medium text-gray-900">
                      {session.countedProducts} / {session.totalProducts}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        progress === 100 ? 'bg-green-500' : 'bg-brand-500'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Contados</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {session.countedProducts}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={cn(
                          'h-4 w-4',
                          session.productsWithDifference > 0 ? 'text-amber-500' : 'text-gray-400'
                        )}
                      />
                      <span className="text-xs text-gray-500">Diferencias</span>
                    </div>
                    <p
                      className={cn(
                        'mt-1 text-lg font-semibold',
                        session.productsWithDifference > 0 ? 'text-amber-600' : 'text-gray-900'
                      )}
                    >
                      {session.productsWithDifference}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Warehouse className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{session.warehouseName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{session.createdByName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formatDate(session.createdAt)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  <Button
                    variant={session.status === 'en_progreso' ? 'solid' : 'bordered'}
                    color={session.status === 'en_progreso' ? 'primary' : 'default'}
                    className={cn(
                      'w-full',
                      session.status === 'en_progreso' && 'bg-brand-600'
                    )}
                    onPress={() => router.push(`/inventario/conteo/${session.id}`)}
                  >
                    {session.status === 'en_progreso' ? 'Continuar Conteo' : 'Ver Detalles'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16">
          <ClipboardList className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-1 text-lg font-medium text-gray-900">Sin sesiones de conteo</h3>
          <p className="mb-6 text-sm text-gray-500">
            {search
              ? 'No se encontraron sesiones con los filtros aplicados'
              : 'Crea una nueva sesión para comenzar a contar'}
          </p>
          {canCreateCount && !search && (
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => router.push('/inventario/conteo/nuevo')}
              className="bg-brand-600"
            >
              Nueva Sesión
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
