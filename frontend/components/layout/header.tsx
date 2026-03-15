'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from '@heroui/react';
import {
  Search,
  Bell,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CommandPalette } from '@/components/ui/command-palette';
import { NotificationsPanel } from '@/components/ui/notifications-panel';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Global Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for toggle-notifications event (from Ctrl+Shift+N shortcut)
  useEffect(() => {
    const handler = () => setIsNotificationsOpen((prev) => !prev);
    window.addEventListener('toggle-notifications', handler);
    return () => window.removeEventListener('toggle-notifications', handler);
  }, []);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);
    const toastId = toast.loading('Cerrando sesión...', {
      description: 'Por favor, espera un momento.'
    });

    try {
      await logout();
      toast.success('Sesión cerrada exitosamente', { id: toastId });
      router.push('/login');
    } catch {
      toast.error('Error al cerrar sesión', { id: toastId });
    }
  };

  return (
    <>
      <header
        className="bg-[#1a1a1a] h-[48px] flex items-center justify-between px-4 shrink-0 transition-all duration-200"
      >
        {/* Left - Logo */}
        <div className="flex items-center gap-3 flex-1">
          <img
            src="https://res.cloudinary.com/db3espoei/image/upload/v1771993730/Logo_Evolution_ZL__1_-cropped_onzamv.svg"
            alt="Evolution ZL"
            className="h-7 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Center - Search Bar */}
        <div className="hidden md:flex flex-[2] justify-center px-4">
          <div className="w-full max-w-[500px] relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888] group-focus-within:text-[#ccc]" />
            <input
              onClick={() => setIsCommandPaletteOpen(true)}
              readOnly
              placeholder="Buscar..."
              className="w-full pl-9 pr-20 py-[6px] rounded-lg bg-[#303030] border border-[#444] text-[13px] text-white placeholder:text-[#888] focus:outline-none focus:border-[#666] transition-colors cursor-pointer"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="rounded bg-[#333] px-1.5 py-0.5 text-[10px] font-medium text-[#888] border border-[#444]">
                ⌘
              </kbd>
              <kbd className="rounded bg-[#333] px-1.5 py-0.5 text-[10px] font-medium text-[#888] border border-[#444]">
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 flex-1 justify-end">



          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button
            ref={bellRef}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#2a2a2a] hover:text-white"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
          </button>

          {/* User Avatar */}
          {user && (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#2a2a2a]">
                  <Avatar
                    name={user.name}
                    src={user.avatar}
                    size="sm"
                    classNames={{
                      base: 'h-7 w-7 bg-emerald-600 text-white text-xs',
                    }}
                  />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="User menu"
                classNames={{
                  base: 'bg-white border border-gray-200 shadow-lg',
                }}
              >
                <DropdownItem
                  key="profile"
                  startContent={<User className="h-4 w-4" />}
                  onPress={() => router.push('/perfil')}
                >
                  Mi Perfil
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  startContent={<Settings className="h-4 w-4" />}
                  onPress={() => router.push('/configuracion')}
                >
                  Configuración
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  startContent={<LogOut className="h-4 w-4" />}
                  className="text-danger"
                  color="danger"
                  onPress={handleLogoutClick}
                >
                  Cerrar Sesión
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <CustomModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
        <CustomModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Cerrar Sesión</h3>
              <p className="text-sm text-text-muted">¿Estás seguro que deseas salir?</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody>
          <p className="text-sm text-text-secondary py-2">
            No recibirás más notificaciones en el sistema hasta que vuelvas a iniciar sesión.
          </p>
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            variant="ghost"
            onClick={() => setIsLogoutModalOpen(false)}
            className="h-10 px-6 font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmLogout}
            className="h-10 px-6 font-semibold bg-danger hover:bg-danger/90 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.3)]"
          >
            Sí, cerrar sesión
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </>
  );
}
