'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  User,
  MapPin,
  CreditCard,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { getClientById, getUniqueCountries, updateClient } from '@/lib/mock-data/clients';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import type { PriceLevel, PaymentTerms } from '@/lib/types/client';

interface ContactForm {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
}

interface AddressForm {
  id: string;
  label: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

const PRICE_LEVELS: PriceLevel[] = ['A', 'B', 'C', 'D', 'E'];
const TAX_ID_TYPES = ['RUC', 'NIT', 'EIN', 'VAT', 'CNPJ', 'RTN', 'CRIB', 'Cedula'];

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const { checkPermission } = useAuth();
  const canManageClients = checkPermission('canManageClients');

  const client = getClientById(clientId);
  const countries = getUniqueCountries();

  const [isSaving, setIsSaving] = useState(false);
  const [paymentType, setPaymentType] = useState<'contado' | 'credito'>('contado');

  // General data
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxIdType, setTaxIdType] = useState('RUC');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Commercial
  const [priceLevel, setPriceLevel] = useState<PriceLevel | ''>('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('contado');
  const [creditLimit, setCreditLimit] = useState('');
  const [notes, setNotes] = useState('');

  // Contacts
  const [contacts, setContacts] = useState<ContactForm[]>([]);

  // Shipping Addresses
  const [addresses, setAddresses] = useState<AddressForm[]>([]);

  // Load client data
  useEffect(() => {
    if (client) {
      setName(client.name);
      setTradeName(client.tradeName || '');
      setTaxId(client.taxId);
      setTaxIdType(client.taxIdType || 'RUC');
      setCountry(client.country);
      setCity(client.city || '');
      setAddress(client.address || '');
      setPriceLevel(client.priceLevel);
      setPaymentTerms(client.paymentTerms);
      setCreditLimit(client.creditLimit > 0 ? String(client.creditLimit) : '');
      setNotes(client.notes || '');
      setPaymentType(client.paymentTerms === 'contado' ? 'contado' : 'credito');

      setContacts(
        client.contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          role: c.role || '',
          isPrimary: c.isPrimary,
        }))
      );

      setAddresses(
        client.shippingAddresses.map((a) => ({
          id: a.id,
          label: a.label,
          address: a.address,
          city: a.city,
          country: a.country,
          postalCode: a.postalCode || '',
          isDefault: a.isDefault,
        }))
      );
    }
  }, [client]);

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      { id: String(Date.now()), name: '', email: '', phone: '', role: '', isPrimary: false },
    ]);
  };

  const removeContact = (id: string) => {
    if (contacts.length <= 1) return;
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const updateContact = (id: string, field: keyof ContactForm, value: string | boolean) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addAddress = () => {
    setAddresses((prev) => [
      ...prev,
      { id: String(Date.now()), label: '', address: '', city: '', country: '', postalCode: '', isDefault: false },
    ]);
  };

  const removeAddress = (id: string) => {
    if (addresses.length <= 1) return;
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAddress = (id: string, field: keyof AddressForm, value: string | boolean) => {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Campo requerido', { description: 'El nombre del cliente es obligatorio.' });
      return;
    }
    if (!taxId.trim()) {
      toast.error('Campo requerido', { description: 'El RUC / Tax ID es obligatorio.' });
      return;
    }
    if (!country) {
      toast.error('Campo requerido', { description: 'El pais es obligatorio.' });
      return;
    }
    if (!priceLevel) {
      toast.error('Campo requerido', { description: 'El nivel de precio es obligatorio.' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      updateClient(clientId, {
        name: name.trim(),
        tradeName: tradeName.trim() || undefined,
        taxId: taxId.trim(),
        taxIdType,
        country,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        priceLevel: priceLevel as PriceLevel,
        creditLimit: creditLimit ? Number(creditLimit) : 0,
        creditAvailable: creditLimit
          ? Number(creditLimit) - (client?.creditUsed ?? 0)
          : 0,
        paymentTerms,
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          role: c.role || undefined,
          isPrimary: c.isPrimary,
        })),
        shippingAddresses: addresses.map((a) => ({
          id: a.id,
          label: a.label,
          address: a.address,
          city: a.city,
          country: a.country || country,
          postalCode: a.postalCode || undefined,
          isDefault: a.isDefault,
        })),
        notes: notes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Cliente actualizado exitosamente', {
        description: `Los datos de ${name} han sido actualizados.`,
      });
      setIsSaving(false);
      router.push(`/clientes/${clientId}`);
    }, 800);
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Cliente no encontrado</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-[#888888]">El cliente con ID {clientId} no existe.</p>
        <Button color="primary" onPress={() => router.push('/clientes')} className="bg-brand-700">
          Volver a Clientes
        </Button>
      </div>
    );
  }

  if (!canManageClients) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Acceso restringido</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para editar clientes.</p>
        <Button color="primary" onPress={() => router.push(`/clientes/${clientId}`)} className="bg-brand-700">
          Volver al Cliente
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/clientes/${clientId}`)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Editar Cliente</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">
              <span className="font-mono font-medium text-gray-900 dark:text-white">{clientId}</span>
              {' '}- {client.name}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="flat"
            onPress={() => router.push(`/clientes/${clientId}`)}
            isDisabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            startContent={<Save className="h-4 w-4" />}
            onPress={handleSave}
            isLoading={isSaving}
            className="bg-brand-700"
          >
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Section: Datos Generales */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Datos Generales</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Codigo
              </label>
              <Input
                value={clientId}
                variant="bordered"
                isReadOnly
                classNames={{ input: 'font-mono text-gray-400 dark:text-[#666666]' }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre / Razon Social <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="EMPRESA S.A."
                variant="bordered"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre Comercial
              </label>
              <Input
                placeholder="Nombre de fantasia"
                variant="bordered"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                RUC / Tax ID <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="000-000000-0-000000"
                variant="bordered"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de Documento
              </label>
              <Select
                placeholder="Seleccionar..."
                variant="bordered"
                selectedKeys={[taxIdType]}
                onSelectionChange={(keys) => setTaxIdType(Array.from(keys)[0] as string)}
              >
                {TAX_ID_TYPES.map((t) => (
                  <SelectItem key={t}>{t}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pais <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Seleccionar pais..."
                variant="bordered"
                selectedKeys={country ? [country] : []}
                onSelectionChange={(keys) => setCountry(Array.from(keys)[0] as string)}
              >
                {countries.map((c) => (
                  <SelectItem key={c}>{c}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ciudad
              </label>
              <Input
                placeholder="Ciudad"
                variant="bordered"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Direccion
              </label>
              <Input
                placeholder="Direccion completa"
                variant="bordered"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Contactos */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
              <User className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contactos</h2>
          </div>
          <button
            onClick={addContact}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar Contacto
          </button>
        </div>
        <div className="space-y-4">
          {contacts.map((contact, idx) => (
            <div key={contact.id} className="rounded-lg border border-gray-100 dark:border-[#2a2a2a] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Contacto {idx + 1}
                  </span>
                  {contact.isPrimary && (
                    <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600">PRINCIPAL</span>
                  )}
                </div>
                {contacts.length > 1 && (
                  <button
                    onClick={() => removeContact(contact.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="Nombre"
                  placeholder="Nombre del contacto"
                  variant="bordered"
                  size="sm"
                  value={contact.name}
                  onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                />
                <Input
                  label="Cargo"
                  placeholder="Gerente, Director..."
                  variant="bordered"
                  size="sm"
                  value={contact.role}
                  onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                />
                <Input
                  label="Email"
                  placeholder="email@empresa.com"
                  type="email"
                  variant="bordered"
                  size="sm"
                  value={contact.email}
                  onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                />
                <Input
                  label="Telefono"
                  placeholder="+507 000-0000"
                  variant="bordered"
                  size="sm"
                  value={contact.phone}
                  onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Direcciones de Envio */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Direcciones de Envio</h2>
          </div>
          <button
            onClick={addAddress}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar Direccion
          </button>
        </div>
        <div className="space-y-4">
          {addresses.map((addr, idx) => (
            <div key={addr.id} className="rounded-lg border border-gray-100 dark:border-[#2a2a2a] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Direccion {idx + 1}
                  </span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">PREDETERMINADA</span>
                  )}
                </div>
                {addresses.length > 1 && (
                  <button
                    onClick={() => removeAddress(addr.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Input
                  label="Etiqueta"
                  placeholder="Principal, Bodega..."
                  variant="bordered"
                  size="sm"
                  value={addr.label}
                  onChange={(e) => updateAddress(addr.id, 'label', e.target.value)}
                />
                <Input
                  label="Direccion"
                  placeholder="Direccion completa"
                  variant="bordered"
                  size="sm"
                  value={addr.address}
                  onChange={(e) => updateAddress(addr.id, 'address', e.target.value)}
                  className="lg:col-span-2"
                />
                <Input
                  label="Ciudad"
                  placeholder="Ciudad"
                  variant="bordered"
                  size="sm"
                  value={addr.city}
                  onChange={(e) => updateAddress(addr.id, 'city', e.target.value)}
                />
                <Input
                  label="Codigo Postal"
                  placeholder="00000"
                  variant="bordered"
                  size="sm"
                  value={addr.postalCode}
                  onChange={(e) => updateAddress(addr.id, 'postalCode', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Configuracion Comercial */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
            <CreditCard className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configuracion Comercial</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nivel de Precio <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Seleccionar nivel..."
                variant="bordered"
                selectedKeys={priceLevel ? [priceLevel] : []}
                onSelectionChange={(keys) => setPriceLevel(Array.from(keys)[0] as PriceLevel)}
              >
                {PRICE_LEVELS.map((l) => (
                  <SelectItem key={l}>Nivel {l}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de Pago
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPaymentType('contado');
                    setPaymentTerms('contado');
                    setCreditLimit('');
                  }}
                  className={cn(
                    'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                    paymentType === 'contado'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                      : 'border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-gray-300'
                  )}
                >
                  Contado
                </button>
                <button
                  onClick={() => {
                    setPaymentType('credito');
                    setPaymentTerms('credito_30');
                  }}
                  className={cn(
                    'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                    paymentType === 'credito'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                      : 'border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-gray-300'
                  )}
                >
                  Credito
                </button>
              </div>
            </div>
          </div>

          {paymentType === 'credito' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Terminos de Credito
                </label>
                <Select
                  placeholder="Seleccionar..."
                  variant="bordered"
                  selectedKeys={[paymentTerms]}
                  onSelectionChange={(keys) => setPaymentTerms(Array.from(keys)[0] as PaymentTerms)}
                >
                  <SelectItem key="credito_15">Credito 15 dias</SelectItem>
                  <SelectItem key="credito_30">Credito 30 dias</SelectItem>
                  <SelectItem key="credito_45">Credito 45 dias</SelectItem>
                  <SelectItem key="credito_60">Credito 60 dias</SelectItem>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Limite de Credito (USD)
                </label>
                <Input
                  placeholder="0.00"
                  type="number"
                  variant="bordered"
                  startContent={<span className="text-gray-400">$</span>}
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notas Internas
            </label>
            <textarea
              placeholder="Observaciones sobre el cliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button
          variant="flat"
          onPress={() => router.push(`/clientes/${clientId}`)}
          isDisabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          color="primary"
          startContent={<Save className="h-4 w-4" />}
          onPress={handleSave}
          isLoading={isSaving}
          className="bg-brand-700"
        >
          Guardar Cambios
        </Button>
      </div>
    </motion.div>
  );
}
