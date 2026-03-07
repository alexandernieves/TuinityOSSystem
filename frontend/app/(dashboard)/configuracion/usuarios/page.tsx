"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalBody,
  CustomModalFooter,
} from "@/components/ui/custom-modal";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Users,
  Shield,
  Plus,
  Edit,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronRight,
  Lock,
  Search,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/lib/contexts/auth-context";
import { api } from "@/lib/services/api";
import {
  getRoleTemplatesData,
  subscribeRoleTemplates,
  getActiveSessionsData,
  subscribeActiveSessions,
} from "@/lib/mock-data/configuration";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import type { User, UserRole } from "@/lib/types/user";
import type { RoleTemplate } from "@/lib/types/configuration";

const TABS = [
  { id: "usuarios", label: "Usuarios" },
  { id: "roles", label: "Roles y Permisos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function UsuariosPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canManageRoles = checkPermission("canManageRoles");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const roleTemplates = useStore(subscribeRoleTemplates, getRoleTemplatesData);
  const activeSessions = useStore(
    subscribeActiveSessions,
    getActiveSessionsData,
  );

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<TabId>("usuarios");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  // User modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "vendedor" as UserRole,
    password: "",
  });

  // Users with active status (mock)
  const [userStatuses, setUserStatuses] = useState<Record<string, boolean>>({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
      // Actualizar estados locales de on/off
      const userStatusesMap = data.reduce((acc: any, curr: any) => {
        acc[curr.id] = curr.isActive;
        return acc;
      }, {});
      setUserStatuses(userStatusesMap);
    } catch (err: any) {
      toast.error("Error al cargar", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q)
    );
  });

  const getLastSession = (userId: string) => {
    return activeSessions.find((s) => s.userId === userId);
  };

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        role: user.role,
        password: "",
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: "", email: "", role: "vendedor", password: "" });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, userForm);
        toast.success("Usuario actualizado", {
          description: `El usuario "${userForm.name}" se ha actualizado.`,
        });
      } else {
        await api.createUser(userForm);
        toast.success("Usuario creado", {
          description: `El usuario "${userForm.name}" se ha creado exitosamente.`,
        });
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    }
  };

  const handleToggleUser = async (userId: string) => {
    try {
      const newStatus = !userStatuses[userId];
      await api.toggleUserActive(userId, newStatus);
      setUserStatuses((prev) => ({ ...prev, [userId]: newStatus }));
      toast.success(newStatus ? "Usuario activado" : "Usuario desactivado");
      // fetchUsers() opcional aqui
    } catch (err: any) {
      toast.error("Error al actualizar", { description: err.message });
    }
  };

  const handleSaveRole = () => {
    toast.success("Plantilla de rol creada");
    setIsRoleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back link and header */}
      <div>
        <button
          onClick={() => router.push("/configuracion")}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-[#888888] transition-colors hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Configuración
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
            <Users className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Usuarios y Roles
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">
              Gestión de usuarios, plantillas de roles y permisos
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-white dark:bg-[#141414] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-[#888888] hover:text-gray-700 dark:hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "usuarios" && (
          <motion.div
            key="usuarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Search and actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <button
                onClick={() => handleOpenUserModal()}
                className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
              >
                <Plus className="h-4 w-4" />
                Nuevo Usuario
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Correo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Última Sesión
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {filteredUsers.map((user, index) => {
                      const session = getLastSession(user.id);
                      const isActive = userStatuses[user.id];
                      const roleColor = ROLE_COLORS[user.role];

                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400">
                                {user.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2) || "U"}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                                roleColor?.bg || "bg-gray-100",
                                roleColor?.text || "text-gray-800",
                              )}
                            >
                              {ROLE_LABELS[user.role] || user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {session ? (
                              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-[#888888]">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(session.lastActivity).toLocaleString(
                                  "es-PA",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-[#666666]">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => handleToggleUser(user.id)}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleOpenUserModal(user)}
                              className="flex mx-auto h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-[#666666] transition-colors hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-600 dark:hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "roles" && (
          <motion.div
            key="roles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-[#888888]">
                {roleTemplates.length} plantillas de rol configuradas
              </p>
              {canManageRoles && (
                <button
                  onClick={() => setIsRoleModalOpen(true)}
                  className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Plantilla
                </button>
              )}
            </div>

            {/* Roles List */}
            <div className="space-y-3">
              {roleTemplates.map((role, index) => {
                const isExpanded = expandedRole === role.id;
                const roleColor = ROLE_COLORS[role.baseRole];

                return (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] overflow-hidden"
                  >
                    {/* Role Header */}
                    <button
                      onClick={() =>
                        setExpandedRole(isExpanded ? null : role.id)
                      }
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            role.isSystemRole
                              ? "bg-amber-50 dark:bg-amber-950"
                              : "bg-gray-50 dark:bg-[#1a1a1a]",
                          )}
                        >
                          {role.isSystemRole ? (
                            <Lock className="h-5 w-5 text-amber-600" />
                          ) : (
                            <Shield className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {role.name}
                            </h3>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                roleColor.bg,
                                roleColor.text,
                              )}
                            >
                              {ROLE_LABELS[role.baseRole]}
                            </span>
                            {role.isSystemRole && (
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                                Sistema
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-[#888888]">
                            {role.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-gray-100 dark:bg-[#2a2a2a] px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-[#888888]">
                          {role.userCount}{" "}
                          {role.userCount === 1 ? "usuario" : "usuarios"}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-gray-400 transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </div>
                    </button>

                    {/* Expanded Permissions */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-gray-200 dark:border-[#2a2a2a] p-4">
                            <div className="space-y-4">
                              {role.permissions.map((group) => (
                                <div
                                  key={group.module}
                                  className="rounded-lg border border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-4"
                                >
                                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Shield className="h-4 w-4 text-gray-400" />
                                    {group.moduleLabel}
                                  </h4>
                                  <div className="space-y-3">
                                    {group.permissions.map((perm) => (
                                      <div
                                        key={perm.key}
                                        className="flex items-center justify-between"
                                      >
                                        <div>
                                          <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {perm.label}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-[#666666]">
                                            {perm.description}
                                          </p>
                                        </div>
                                        <Switch
                                          checked={perm.enabled}
                                          disabled={role.isSystemRole}
                                          onCheckedChange={() => {
                                            if (!role.isSystemRole) {
                                              toast.info(
                                                "Permiso actualizado (mock)",
                                                {
                                                  id: `toggle-perm-${perm.key}`,
                                                },
                                              );
                                            }
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <CustomModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        size="md"
      >
        <CustomModalHeader onClose={() => setIsUserModalOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#888888]">
                {editingUser
                  ? `Editando ${editingUser.name}`
                  : "Crear un nuevo usuario del sistema"}
              </p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre Completo
              </label>
              <Input
                placeholder="Ej: Juan Pérez"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
                variant="bordered"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo Electrónico
              </label>
              <Input
                placeholder="juan@evolutionzl.com"
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                variant="bordered"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rol
              </label>
              <Select
                selectedKeys={[userForm.role]}
                onChange={(e) =>
                  setUserForm({ ...userForm, role: e.target.value as UserRole })
                }
                variant="bordered"
                aria-label="Rol"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
              </label>
              <Input
                placeholder="********"
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                variant="bordered"
              />
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsUserModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSaveUser}
            className="bg-brand-600"
          >
            {editingUser ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </CustomModalFooter>
      </CustomModal>

      {/* Role Template Modal */}
      <CustomModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        size="md"
      >
        <CustomModalHeader onClose={() => setIsRoleModalOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
              <Shield className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nueva Plantilla de Rol
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#888888]">
                Definir un nuevo rol con permisos personalizados
              </p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Rol
              </label>
              <Input
                placeholder="Ej: Supervisor de Ventas"
                variant="bordered"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <Input
                placeholder="Descripción del rol y sus responsabilidades"
                variant="bordered"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rol Base
              </label>
              <Select
                variant="bordered"
                defaultSelectedKeys={["vendedor"]}
                aria-label="Rol Base"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsRoleModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSaveRole}
            className="bg-brand-600"
          >
            Crear Plantilla
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
