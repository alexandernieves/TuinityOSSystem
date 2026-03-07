'use client';

import { useState } from 'react';
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
  GitBranch,
  Plus,
  Edit,
  ArrowDown,
  Clock,
  AlertTriangle,
  Bell,
  UserCheck,
  Shield,
  User,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStore } from '@/hooks/use-store';
import {
  getApprovalFlowsData,
  subscribeApprovalFlows,
  addApprovalFlow,
  updateApprovalFlow,
} from '@/lib/mock-data/configuration';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/roles';
import type { ApprovalFlow, ApprovalStep } from '@/lib/types/configuration';

// Map of user IDs to display names for notifyAlways resolution
const USER_NAME_MAP: Record<string, string> = {
  'USR-001': 'Javier Lange',
  'USR-002': 'Astelvia Watts',
  'USR-003': 'Jakeira Chavez',
};

// Helper: get initials from a name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Cascade Step Card component
function CascadeStepCard({
  step,
  isLast,
  isSingleStep,
  nextStep,
  animationDelay,
}: {
  step: ApprovalStep;
  isLast: boolean;
  isSingleStep: boolean;
  nextStep?: ApprovalStep;
  animationDelay: number;
}) {
  const roleColor = ROLE_COLORS[step.approverRole];
  const displayName = step.approverUserName || step.approverLabel;
  const roleLabel = ROLE_LABELS[step.approverRole];

  return (
    <div className="flex flex-col items-stretch">
      {/* Step card */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animationDelay, duration: 0.3 }}
        className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 py-3"
      >
        {/* Avatar */}
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          roleColor.bg, roleColor.text
        )}>
          {getInitials(displayName)}
        </div>

        {/* Name and role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {displayName}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              roleColor.bg, roleColor.text
            )}>
              <Shield className="h-2.5 w-2.5" />
              {roleLabel}
            </span>
          </div>

          {/* Timeout and badges */}
          <div className="mt-1 flex items-center gap-3 flex-wrap">
            {step.timeoutHours && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-[#888888]">
                <Clock className="h-3 w-3" />
                {step.timeoutHours}h para responder
              </span>
            )}
            {step.isRequired && (
              <span className="flex items-center gap-1 text-[11px] text-red-500">
                <AlertTriangle className="h-3 w-3" />
                Requerido
              </span>
            )}
            {isSingleStep && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                <UserCheck className="h-3 w-3" />
                Aprobacion directa
              </span>
            )}
          </div>

          {/* Notify always */}
          {step.notifyAlways && step.notifyAlways.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Bell className="h-3 w-3 text-amber-500" />
              <span className="text-[11px] text-amber-600 dark:text-amber-400">
                Siempre notificado: {step.notifyAlways.map((uid) => USER_NAME_MAP[uid] || uid).join(', ')}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Escalation arrow between steps */}
      {!isLast && step.escalationTimeoutHours && nextStep && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay + 0.15, duration: 0.25 }}
          className="flex items-center gap-2 py-1.5 pl-4"
        >
          <div className="flex flex-col items-center">
            <div className="h-3 w-px bg-orange-300 dark:bg-orange-700" />
            <ArrowDown className="h-3.5 w-3.5 text-orange-500" />
          </div>
          <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
            Si no responde en {step.escalationTimeoutHours}h, escala a {nextStep.approverUserName || nextStep.approverLabel}
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default function AprobacionesPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();

  const canConfigure = checkPermission('canConfigureApprovalChains');

  const flows = useStore(subscribeApprovalFlows, getApprovalFlowsData);

  const [isOpen, setIsOpen] = useState(false);

  const [editingFlow, setEditingFlow] = useState<ApprovalFlow | null>(null);
  const [flowForm, setFlowForm] = useState({
    name: '',
    description: '',
    triggerCondition: '',
  });

  const handleToggleFlow = (flowId: string) => {
    if (!canConfigure) {
      toast.error('Sin permisos', { description: 'No tienes permisos para configurar flujos de aprobacion.' });
      return;
    }
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    const newActive = !flow.isActive;
    updateApprovalFlow(flowId, { isActive: newActive });
    toast.success(newActive ? 'Flujo activado' : 'Flujo desactivado', {
      id: `toggle-flow-${flowId}`,
      description: flow.name,
    });
  };

  const handleOpenModal = (flow?: ApprovalFlow) => {
    if (!canConfigure) {
      toast.error('Sin permisos', { description: 'No tienes permisos para configurar flujos de aprobacion.' });
      return;
    }
    if (flow) {
      setEditingFlow(flow);
      setFlowForm({
        name: flow.name,
        description: flow.description,
        triggerCondition: flow.triggerCondition,
      });
    } else {
      setEditingFlow(null);
      setFlowForm({ name: '', description: '', triggerCondition: '' });
    }
    setIsOpen(true);
  };

  const handleSaveFlow = () => {
    if (editingFlow) {
      updateApprovalFlow(editingFlow.id, { name: flowForm.name, description: flowForm.description, triggerCondition: flowForm.triggerCondition });
    } else {
      const newId = `AF-${String(flows.length + 1).padStart(3, '0')}`;
      addApprovalFlow({ id: newId, name: flowForm.name, description: flowForm.description, triggerCondition: flowForm.triggerCondition, isActive: true, steps: [] });
    }
    toast.success(editingFlow ? 'Flujo actualizado' : 'Flujo creado', {
      description: editingFlow
        ? `El flujo "${flowForm.name}" se ha actualizado.`
        : `El flujo "${flowForm.name}" se ha creado exitosamente.`,
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
          Volver a Configuracion
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
              <GitBranch className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Flujos de Aprobacion</h1>
              <p className="text-sm text-gray-500 dark:text-[#888888]">{flows.length} flujos configurados</p>
            </div>
          </div>
          {canConfigure && (
            <button
              onClick={() => handleOpenModal()}
              className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
            >
              <Plus className="h-4 w-4" />
              Nuevo Flujo
            </button>
          )}
        </div>
      </div>

      {/* Approval Flow Cards */}
      <div className="space-y-4">
        {flows.map((flow, index) => {
          const isSingleStep = flow.steps.length === 1;
          // Sort steps by order for cascade display
          const sortedSteps = [...flow.steps].sort((a, b) => a.order - b.order);

          return (
            <motion.div
              key={flow.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5"
            >
              {/* Flow Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{flow.name}</h3>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      flow.isActive
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-gray-500/10 text-gray-500'
                    )}>
                      {flow.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {isSingleStep && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                        Paso unico
                      </span>
                    )}
                    {!isSingleStep && (
                      <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                        {sortedSteps.length} pasos en cascada
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-[#888888]">{flow.description}</p>
                </div>
                {canConfigure && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={flow.isActive}
                      onCheckedChange={() => handleToggleFlow(flow.id)}
                    />
                    <button
                      onClick={() => handleOpenModal(flow)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-[#666666] transition-colors hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-600 dark:hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Trigger Condition */}
              <div className="mt-3 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                  {flow.triggerCondition}
                </span>
              </div>

              {/* Cascade Chain Visualization */}
              <div className="mt-4 space-y-0">
                {sortedSteps.map((step, stepIndex) => (
                  <CascadeStepCard
                    key={step.id}
                    step={step}
                    isLast={stepIndex === sortedSteps.length - 1}
                    isSingleStep={isSingleStep}
                    nextStep={sortedSteps[stepIndex + 1]}
                    animationDelay={index * 0.05 + stepIndex * 0.1}
                  />
                ))}
              </div>

              {/* Global Escalation Summary */}
              {flow.escalationTimeout && !isSingleStep && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 px-3 py-2">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs text-orange-700 dark:text-orange-400">
                    Escalamiento automatico despues de {flow.escalationTimeout}h sin respuesta
                    {flow.escalateTo && ` a ${ROLE_LABELS[flow.escalateTo as keyof typeof ROLE_LABELS] || flow.escalateTo}`}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Flow Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg" scrollable>
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
              <GitBranch className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingFlow ? 'Editar Flujo de Aprobacion' : 'Nuevo Flujo de Aprobacion'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#888888]">
                {editingFlow ? `Editando ${editingFlow.name}` : 'Definir un nuevo flujo de aprobacion'}
              </p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Flujo</label>
              <Input placeholder="Ej: Aprobacion de descuentos especiales" value={flowForm.name} onChange={(e) => setFlowForm({ ...flowForm, name: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripcion</label>
              <Input placeholder="Descripcion detallada del flujo" value={flowForm.description} onChange={(e) => setFlowForm({ ...flowForm, description: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Condicion de Activacion</label>
              <Input placeholder="Ej: Descuento > 15%" value={flowForm.triggerCondition} onChange={(e) => setFlowForm({ ...flowForm, triggerCondition: e.target.value })} variant="bordered" />
            </div>

            {/* Steps Preview in Modal */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Cadena de Aprobacion</h4>
              {editingFlow && editingFlow.steps.length > 0 ? (
                <div className="space-y-0 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-4">
                  {[...editingFlow.steps].sort((a, b) => a.order - b.order).map((step, idx, arr) => {
                    const roleColor = ROLE_COLORS[step.approverRole];
                    const displayName = step.approverUserName || step.approverLabel;
                    const isLastStep = idx === arr.length - 1;

                    return (
                      <div key={step.id}>
                        <div className="flex items-center gap-3 py-2">
                          <div className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                            roleColor.bg, roleColor.text
                          )}>
                            {getInitials(displayName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</span>
                              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', roleColor.bg, roleColor.text)}>
                                {ROLE_LABELS[step.approverRole]}
                              </span>
                              {step.isRequired && <span className="text-[10px] text-red-500">Requerido</span>}
                              {step.timeoutHours && <span className="text-[10px] text-gray-500 dark:text-[#888888]">Timeout: {step.timeoutHours}h</span>}
                            </div>
                          </div>
                        </div>
                        {!isLastStep && step.escalationTimeoutHours && (
                          <div className="flex items-center gap-2 py-1 pl-3">
                            <ArrowDown className="h-3 w-3 text-orange-500" />
                            <span className="text-[10px] text-orange-500">
                              Escala en {step.escalationTimeoutHours}h
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-6 text-center">
                  <User className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-[#888888]">Agrega pasos de aprobacion al flujo</p>
                  <button
                    onClick={() => toast.info('Constructor de pasos (mock)')}
                    className="mt-3 flex mx-auto items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar Paso
                  </button>
                </div>
              )}
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsOpen(false)}>Cancelar</Button>
          <Button color="primary" onPress={handleSaveFlow} className="bg-brand-600">
            {editingFlow ? 'Guardar Cambios' : 'Crear Flujo'}
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
