'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  DollarSign,
  FileCheck,
  Plus,
  Edit,
  Image,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useStore } from '@/hooks/use-store';
import {
  getCompanyInfoData,
  subscribeCompanyInfo,
  updateCompanyInfo,
  getBranchesData,
  subscribeBranches,
  addBranch,
  updateBranch,
} from '@/lib/mock-data/configuration';
import type { Branch } from '@/lib/types/configuration';

const BRANCH_TYPES: Record<Branch['type'], string> = {
  oficina: 'Oficina',
  bodega: 'Bodega',
  tienda: 'Tienda',
  zona_libre: 'Zona Libre',
};

export default function EmpresaPage() {
  const router = useRouter();

  const companyInfo = useStore(subscribeCompanyInfo, getCompanyInfoData);
  const branches = useStore(subscribeBranches, getBranchesData);

  const [isOpen, setIsOpen] = useState(false);

  // Company form state
  const [company, setCompany] = useState({ ...companyInfo });

  // Branch modal state
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    type: 'oficina' as Branch['type'],
    address: '',
    city: '',
    country: 'Panamá',
    phone: '',
    manager: '',
  });

  const handleSave = () => {
    updateCompanyInfo(company);
    toast.success('Empresa actualizada', {
      description: 'Los datos de la empresa se han guardado correctamente.',
    });
  };

  const handleOpenBranchModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({
        name: branch.name,
        code: branch.code,
        type: branch.type,
        address: branch.address,
        city: branch.city,
        country: branch.country,
        phone: branch.phone || '',
        manager: branch.manager || '',
      });
    } else {
      setEditingBranch(null);
      setBranchForm({
        name: '',
        code: '',
        type: 'oficina',
        address: '',
        city: '',
        country: 'Panamá',
        phone: '',
        manager: '',
      });
    }
    setIsOpen(true);
  };

  const handleSaveBranch = () => {
    if (editingBranch) {
      updateBranch(editingBranch.id, { ...branchForm });
    } else {
      const newId = `BR-${String(branches.length + 1).padStart(3, '0')}`;
      addBranch({ id: newId, ...branchForm, isActive: true, isHeadquarters: false });
    }
    toast.success(editingBranch ? 'Sucursal actualizada' : 'Sucursal creada', {
      description: editingBranch
        ? `La sucursal "${branchForm.name}" se ha actualizado.`
        : `La sucursal "${branchForm.name}" se ha creado exitosamente.`,
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Mi Empresa</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Datos legales, fiscal y sucursales</p>
          </div>
        </div>
      </div>

      {/* Company Info Form */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Información General</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Legal Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Razón Social</label>
            <input
              type="text"
              value={company.legalName}
              onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Trade Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Nombre Comercial</label>
            <input
              type="text"
              value={company.tradeName}
              onChange={(e) => setCompany({ ...company, tradeName: e.target.value })}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* RUC */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">RUC</label>
            <input
              type="text"
              value={company.taxId}
              onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Legal Representative */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Representante Legal</label>
            <input
              type="text"
              value={company.legalRepresentative}
              onChange={(e) => setCompany({ ...company, legalRepresentative: e.target.value })}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Dirección</label>
            <input
              type="text"
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* City */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Ciudad</label>
            <input
              type="text"
              value={company.city}
              onChange={(e) => setCompany({ ...company, city: e.target.value })}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Country */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">País</label>
            <input
              type="text"
              value={company.country}
              onChange={(e) => setCompany({ ...company, country: e.target.value })}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Sitio Web</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={company.website || ''}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Currency (Read only) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Moneda</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={`${company.currency} - Dólar Estadounidense`}
                readOnly
                className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] pl-9 pr-3 text-sm text-gray-500 dark:text-[#666666] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Zona Horaria</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={company.timezone}
                onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="mt-6 border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-[#888888]">Logo de la Empresa</label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-2">
              {company.logo ? (
                <img src={company.logo} alt="Logo" className="h-full w-auto object-contain dark:invert" />
              ) : (
                <Image className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-[#888888]">
              <p className="font-medium text-gray-700 dark:text-gray-300">Logo actual</p>
              <p className="mt-1 text-xs break-all">{company.logo || 'Sin logo configurado'}</p>
            </div>
          </div>
        </div>

        {/* Electronic Invoicing */}
        <div className="mt-6 border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Facturación Electrónica (FE)</p>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-[#888888]">Integración con DGI para emisión de comprobantes electrónicos</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">Próximamente</span>
              <Switch checked={company.electronicInvoicing} disabled />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="flex h-10 items-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            <Save className="h-4 w-4" />
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Branches Section */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sucursales</h2>
            <p className="text-sm text-gray-500 dark:text-[#888888]">{branches.length} sucursales registradas</p>
          </div>
          <button
            onClick={() => handleOpenBranchModal()}
            className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" />
            Nueva Sucursal
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Ciudad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Encargado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {branches.map((branch, index) => (
                  <motion.tr
                    key={branch.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{branch.name}</span>
                        {branch.isHeadquarters && (
                          <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-500">Principal</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 dark:bg-[#2a2a2a] px-2 py-0.5 font-mono text-xs text-gray-700 dark:text-gray-300">{branch.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{BRANCH_TYPES[branch.type]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {branch.city}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{branch.manager || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        branch.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-gray-500/10 text-gray-500'
                      )}>
                        {branch.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenBranchModal(branch)}
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
      </div>

      {/* Branch Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg" scrollable>
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#888888]">
                {editingBranch ? `Editando ${editingBranch.name}` : 'Registrar una nueva sucursal'}
              </p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <Input placeholder="Ej: Bodega Norte" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Código</label>
              <Input placeholder="Ej: BOD-N" value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
              <Select selectedKeys={[branchForm.type]} onChange={(e) => setBranchForm({ ...branchForm, type: e.target.value as Branch['type'] })} variant="bordered" aria-label="Tipo">
                {Object.entries(BRANCH_TYPES).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ciudad</label>
              <Input placeholder="Ej: Ciudad de Panamá" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
              <Input placeholder="Dirección completa" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
              <Input placeholder="+507 000-0000" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Encargado</label>
              <Input placeholder="Nombre del encargado" value={branchForm.manager} onChange={(e) => setBranchForm({ ...branchForm, manager: e.target.value })} variant="bordered" />
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsOpen(false)}>Cancelar</Button>
          <Button color="primary" onPress={handleSaveBranch} className="bg-brand-600">
            {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
