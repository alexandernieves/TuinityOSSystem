'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import {
  ArrowLeft,
  ClipboardList,
  Scan,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  Camera,
  X,
  Plus,
  Minus,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { getCountSessionById, updateCountSession, subscribeCountSessions, getCountSessionsData } from '@/lib/mock-data/inventory';
import { MOCK_PRODUCTS } from '@/lib/mock-data/products';
import { useStore } from '@/hooks/use-store';
import { CountLine } from '@/lib/types/inventory';

export default function ConteoSessionPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  // Reactive store subscription
  const countSessions = useStore(subscribeCountSessions, getCountSessionsData);

  const session = getCountSessionById(params.id as string);
  const [lines, setLines] = useState<CountLine[]>([]);
  const [search, setSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualSearchOpen, setIsManualSearchOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<CountLine | null>(null);
  const [countedQty, setCountedQty] = useState<number>(0);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (session) {
      setLines(session.lines);
    }
  }, [session]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Error de cámara', {
        description: 'No se pudo acceder a la cámara. Usa la búsqueda manual.',
      });
      setIsScannerOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isScannerOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScannerOpen, startCamera, stopCamera]);

  if (!session) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <ClipboardList className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-900">Sesión no encontrada</p>
        <p className="text-sm text-gray-500">La sesión {params.id} no existe</p>
        <Button variant="light" onPress={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const isCompleted = session.status === 'completado';
  const countedCount = lines.filter((l) => l.countedQty !== undefined).length;
  const progress = (countedCount / lines.length) * 100;
  const differencesCount = lines.filter(
    (l) => l.difference !== undefined && l.difference !== 0
  ).length;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectProduct = (line: CountLine) => {
    setSelectedLine(line);
    setCountedQty(line.countedQty ?? line.systemQty);
  };

  const handleSaveCount = () => {
    if (!selectedLine) return;

    const updatedLines = lines.map((l) => {
      if (l.id === selectedLine.id) {
        return {
          ...l,
          countedQty,
          difference: countedQty - l.systemQty,
          scannedAt: new Date().toISOString(),
          countedBy: user?.name || 'Usuario',
        };
      }
      return l;
    });

    setLines(updatedLines);

    // Persist progress to store
    const newCountedCount = updatedLines.filter((l) => l.countedQty !== undefined).length;
    const newDifferencesCount = updatedLines.filter((l) => l.difference !== undefined && l.difference !== 0).length;
    updateCountSession(session.id, {
      lines: updatedLines,
      countedProducts: newCountedCount,
      productsWithDifference: newDifferencesCount,
    });

    setSelectedLine(null);

    const diff = countedQty - selectedLine.systemQty;
    if (diff === 0) {
      toast.success('Conteo registrado', {
        description: `${selectedLine.productReference} coincide con el sistema.`,
      });
    } else {
      toast.warning('Diferencia detectada', {
        description: `${selectedLine.productReference}: ${diff > 0 ? '+' : ''}${diff} unidades.`,
      });
    }
  };

  const handleSimulateScan = () => {
    // Simulate finding a product by barcode
    const unscannedLines = lines.filter((l) => l.countedQty === undefined);
    if (unscannedLines.length > 0) {
      const line = unscannedLines[0];
      setIsScannerOpen(false);
      handleSelectProduct(line);
      toast.success('Producto encontrado', {
        description: line.productDescription,
      });
    } else {
      toast.info('Todos los productos han sido contados');
      setIsScannerOpen(false);
    }
  };

  const handleManualSearch = (productId: string) => {
    const line = lines.find((l) => l.productId === productId);
    if (line) {
      setIsManualSearchOpen(false);
      handleSelectProduct(line);
    }
  };

  const handleCompleteSession = () => {
    updateCountSession(session.id, {
      status: 'completado',
      lines,
      countedProducts: countedCount,
      productsWithDifference: differencesCount,
      completedAt: new Date().toISOString(),
      completedBy: user?.id || 'USR-000',
      completedByName: user?.name || 'Usuario',
      adjustmentsGenerated: differencesCount,
    });

    toast.success('Sesión completada', {
      description: `${differencesCount} diferencias detectadas. Se generarán ajustes automáticos.`,
    });
    setIsCompleteModalOpen(false);
    router.push('/inventario/conteo');
  };

  const filteredLines = search
    ? lines.filter(
        (l) =>
          l.productDescription.toLowerCase().includes(search.toLowerCase()) ||
          l.productReference.toLowerCase().includes(search.toLowerCase())
      )
    : lines;

  // Products for manual search (not in session)
  const searchableProducts = MOCK_PRODUCTS.filter((p) =>
    lines.some((l) => l.productId === p.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
              <ClipboardList className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">{session.id}</h1>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  )}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completado
                    </>
                  ) : (
                    <>
                      <Package className="h-3.5 w-3.5" />
                      En Progreso
                    </>
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {session.warehouseName}
                {session.zone && ` • ${session.zone}`}
              </p>
            </div>
          </div>
        </div>

        {!isCompleted && (
          <div className="flex gap-3">
            <Button
              variant="bordered"
              startContent={<Search className="h-4 w-4" />}
              onPress={() => setIsManualSearchOpen(true)}
            >
              Buscar
            </Button>
            <Button
              color="primary"
              startContent={<Scan className="h-4 w-4" />}
              onPress={() => setIsScannerOpen(true)}
              className="bg-brand-600"
            >
              Escanear
            </Button>
          </div>
        )}
      </div>

      {/* Progress Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Progreso del conteo</p>
            <p className="text-2xl font-bold text-gray-900">
              {countedCount} / {lines.length}
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Coinciden</p>
              <p className="text-xl font-semibold text-green-600">
                {lines.filter((l) => l.difference === 0).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Diferencias</p>
              <p className={cn('text-xl font-semibold', differencesCount > 0 ? 'text-amber-600' : 'text-gray-400')}>
                {differencesCount}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-xl font-semibold text-blue-600">
                {lines.length - countedCount}
              </p>
            </div>
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              progress === 100 ? 'bg-green-500' : 'bg-brand-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {!isCompleted && progress === 100 && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">
                Todos los productos han sido contados
              </p>
            </div>
            <Button
              color="success"
              onPress={() => setIsCompleteModalOpen(true)}
            >
              Finalizar Sesión
            </Button>
          </div>
        )}
      </div>

      {/* Products List */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
          <div className="w-64">
            <Input
              placeholder="Filtrar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              variant="bordered"
              size="sm"
              classNames={{ inputWrapper: 'bg-white' }}
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredLines.map((line) => {
            const isCounted = line.countedQty !== undefined;
            const hasDifference = line.difference !== undefined && line.difference !== 0;

            return (
              <div
                key={line.id}
                className={cn(
                  'flex items-center justify-between p-4 transition-colors',
                  !isCompleted && 'cursor-pointer hover:bg-gray-50',
                  isCounted && !hasDifference && 'bg-green-50/50',
                  hasDifference && 'bg-amber-50/50'
                )}
                onClick={() => !isCompleted && handleSelectProduct(line)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      isCounted
                        ? hasDifference
                          ? 'bg-amber-100'
                          : 'bg-green-100'
                        : 'bg-gray-100'
                    )}
                  >
                    {isCounted ? (
                      hasDifference ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )
                    ) : (
                      <Package className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {line.productDescription}
                    </p>
                    <p className="text-xs text-gray-500">{line.productReference}</p>
                    {line.barcode && (
                      <p className="font-mono text-xs text-gray-400">{line.barcode}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Sistema</p>
                    <p className="text-lg font-semibold text-gray-900">{line.systemQty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Contado</p>
                    <p
                      className={cn(
                        'text-lg font-semibold',
                        isCounted
                          ? hasDifference
                            ? 'text-amber-600'
                            : 'text-green-600'
                          : 'text-gray-300'
                      )}
                    >
                      {line.countedQty ?? '—'}
                    </p>
                  </div>
                  {isCounted && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Diferencia</p>
                      <p
                        className={cn(
                          'text-lg font-semibold',
                          line.difference === 0
                            ? 'text-green-600'
                            : line.difference! > 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                        )}
                      >
                        {line.difference === 0
                          ? '✓'
                          : line.difference! > 0
                          ? `+${line.difference}`
                          : line.difference}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scanner Modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        size="full"
        classNames={{ base: 'bg-black' }}
      >
        <ModalContent>
          <div className="relative flex h-screen flex-col">
            {/* Header */}
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
              <button
                onClick={() => setIsScannerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-lg font-medium text-white">Escanear Código</p>
              <div className="w-10" />
            </div>

            {/* Camera View */}
            <div className="relative flex-1">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Scan Frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-64 w-64">
                  <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-white" />
                  <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-white" />
                  <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white" />
                  <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white" />
                  {/* Scan line animation */}
                  <div className="animate-scan absolute left-0 right-0 top-1/2 h-0.5 bg-brand-500" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="mb-4 text-center text-sm text-white/80">
                Apunta la cámara al código de barras del producto
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="bordered"
                  className="border-white/30 text-white"
                  onPress={() => {
                    setIsScannerOpen(false);
                    setIsManualSearchOpen(true);
                  }}
                >
                  Buscar Manual
                </Button>
                <Button
                  color="primary"
                  className="bg-brand-600"
                  onPress={handleSimulateScan}
                >
                  Simular Escaneo
                </Button>
              </div>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Manual Search Modal */}
      <Modal
        isOpen={isManualSearchOpen}
        onClose={() => setIsManualSearchOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>Buscar Producto</ModalHeader>
          <ModalBody>
            <Input
              placeholder="Buscar por nombre o referencia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              variant="bordered"
              autoFocus
            />
            <div className="mt-4 max-h-96 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
              {searchableProducts
                .filter(
                  (p) =>
                    p.description.toLowerCase().includes(search.toLowerCase()) ||
                    p.reference.toLowerCase().includes(search.toLowerCase())
                )
                .map((product) => {
                  const line = lines.find((l) => l.productId === product.id);
                  const isCounted = line?.countedQty !== undefined;

                  return (
                    <div
                      key={product.id}
                      className="flex cursor-pointer items-center justify-between p-3 hover:bg-gray-50"
                      onClick={() => handleManualSearch(product.id)}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.description}
                        </p>
                        <p className="text-xs text-gray-500">{product.reference}</p>
                      </div>
                      {isCounted && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  );
                })}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Count Input Modal */}
      <Modal
        isOpen={!!selectedLine}
        onClose={() => setSelectedLine(null)}
        size="md"
      >
        <ModalContent>
          {selectedLine && (
            <>
              <ModalHeader className="border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ingresar Conteo</h3>
                  <p className="text-sm text-gray-500">{selectedLine.productDescription}</p>
                </div>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="mb-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Stock en sistema</p>
                  <p className="text-3xl font-bold text-gray-900">{selectedLine.systemQty}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Cantidad contada
                  </label>
                  <div className="flex items-center gap-4">
                    <Button
                      isIconOnly
                      variant="bordered"
                      onPress={() => setCountedQty(Math.max(0, countedQty - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={countedQty.toString()}
                      onChange={(e) => setCountedQty(parseInt(e.target.value) || 0)}
                      variant="bordered"
                      size="lg"
                      classNames={{
                        input: 'text-center text-2xl font-bold',
                        inputWrapper: 'bg-white',
                      }}
                    />
                    <Button
                      isIconOnly
                      variant="bordered"
                      onPress={() => setCountedQty(countedQty + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {countedQty !== selectedLine.systemQty && (
                  <div
                    className={cn(
                      'mt-4 rounded-lg p-3',
                      countedQty > selectedLine.systemQty
                        ? 'bg-blue-50'
                        : 'bg-red-50'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-medium',
                        countedQty > selectedLine.systemQty
                          ? 'text-blue-700'
                          : 'text-red-700'
                      )}
                    >
                      Diferencia: {countedQty > selectedLine.systemQty ? '+' : ''}
                      {countedQty - selectedLine.systemQty} unidades
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-center">
                  <Button
                    variant="light"
                    startContent={<RotateCcw className="h-4 w-4" />}
                    onPress={() => setCountedQty(selectedLine.systemQty)}
                  >
                    Usar valor del sistema
                  </Button>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-gray-200">
                <Button variant="light" onPress={() => setSelectedLine(null)}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleSaveCount}
                  className="bg-brand-600"
                >
                  Guardar Conteo
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Complete Session Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Finalizar Sesión</h3>
                <p className="text-sm text-gray-500">Resumen del conteo</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Total Contados</p>
                  <p className="text-2xl font-bold text-gray-900">{countedCount}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Coinciden</p>
                  <p className="text-2xl font-bold text-green-600">
                    {lines.filter((l) => l.difference === 0).length}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Diferencias</p>
                  <p className="text-2xl font-bold text-amber-600">{differencesCount}</p>
                </div>
              </div>

              {differencesCount > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-900">
                      Se generarán ajustes automáticos
                    </p>
                  </div>
                  <p className="text-xs text-amber-700">
                    Las {differencesCount} diferencias detectadas crearán ajustes de inventario
                    pendientes de aprobación.
                  </p>
                </div>
              )}

              {differencesCount > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Producto
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                          Sistema
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                          Contado
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                          Dif.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lines
                        .filter((l) => l.difference !== undefined && l.difference !== 0)
                        .map((line) => (
                          <tr key={line.id}>
                            <td className="px-3 py-2">
                              <p className="text-xs font-medium text-gray-900">
                                {line.productReference}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-right text-xs text-gray-600">
                              {line.systemQty}
                            </td>
                            <td className="px-3 py-2 text-right text-xs text-gray-600">
                              {line.countedQty}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  line.difference! > 0 ? 'text-blue-600' : 'text-red-600'
                                )}
                              >
                                {line.difference! > 0 ? '+' : ''}
                                {line.difference}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200">
            <Button variant="light" onPress={() => setIsCompleteModalOpen(false)}>
              Continuar Contando
            </Button>
            <Button
              color="success"
              startContent={<CheckCircle2 className="h-4 w-4" />}
              onPress={handleCompleteSession}
            >
              Finalizar y Generar Ajustes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100px);
          }
          50% {
            transform: translateY(100px);
          }
          100% {
            transform: translateY(-100px);
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
