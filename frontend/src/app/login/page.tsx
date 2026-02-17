'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  Package,
  Building,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { loadSession, saveSession } from '@/lib/auth-storage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import clsx from 'clsx';

// Type definitions
type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  userId: string;
};

type AuthMode = 'login' | 'register';
type RegisterStep = 1 | 2 | 3;

// --- Helper Components (Stability outside to prevent re-animation on Parent state change) ---

const FeatureItem = ({ title, desc, delay }: { title: string, desc: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: "spring", stiffness: 50 }}
    className="flex items-start gap-6 group"
  >
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 group-hover:bg-[#D4AF37]/20 group-hover:border-[#D4AF37]/40 group-hover:scale-110">
      <div className="h-3 w-3 rounded-full bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.6)]"></div>
    </div>
    <div>
      <h3 className="font-bold text-white text-lg tracking-wide group-hover:text-[#D4AF37] transition-colors">{title}</h3>
      <p className="mt-1 text-base text-white/40 leading-snug font-medium">{desc}</p>
    </div>
  </motion.div>
);

const BrandingSide = ({ mode }: { mode: AuthMode }) => (
  <div className="flex h-full flex-col justify-center px-16 text-white relative">
    <motion.div
      key={`branding-content-${mode}`}
      animate={{
        x: mode === 'login' ? [0, 10, 0] : [0, -10, 0],
        opacity: 1
      }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="max-w-md"
    >
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="text-5xl font-bold tracking-tight leading-[1.1]"
      >
        {mode === 'login' ? (
          <>Gestión Empresarial<br /><span className="text-[#D4AF37]">de Clase Mundial</span></>
        ) : (
          <>Únete a la <span className="text-[#D4AF37]">Evolución Digital</span><br />de tu Negocio</>
        )}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-xl text-white/60 leading-relaxed font-light"
      >
        {mode === 'login' ?
          "Control total de inventario, ventas, finanzas y operaciones en una sola plataforma." :
          "La plataforma ERP diseñada para la Zona Libre, optimizando cada proceso de tu empresa."
        }
      </motion.p>

      <div className="mt-16 space-y-8">
        <FeatureItem delay={0.4} title="Ecosistema Integrado" desc="Ventas, Inventario y Logística sincronizados." />
        <FeatureItem delay={0.5} title="Inteligencia B2B" desc="Reportes avanzados y analítica predictiva." />
        <FeatureItem delay={0.6} title="ADN de Zona Libre" desc="Documentación y procesos 100% compatibles." />
      </div>
    </motion.div>
  </div>
);

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') as AuthMode) || 'login';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login Form State
  const [loginData, setLoginData] = useState({
    tenantSlug: '',
    email: '',
    password: '',
  });

  // Register Form State
  const [regStep, setRegStep] = useState<RegisterStep>(1);
  const [companyData, setCompanyData] = useState({
    businessName: '',
    businessType: '',
    taxId: '',
    address: '',
    city: '',
    country: 'Panamá',
  });
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  // Update URL without reloading to reflect mode
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.pushState({}, '', url);
  }, [mode]);

  // --- Handlers ---

  async function onLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Autenticando...');
    const tenantSlug = loginData.tenantSlug.trim() || String(searchParams.get('tenant') ?? '').trim();

    if (!tenantSlug) {
      toast.error('Por favor ingresa el nombre de la empresa', { id: toastId });
      setLoading(false);
      return;
    }

    try {
      const response = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: {
          tenantSlug,
          email: loginData.email.trim(),
          password: loginData.password,
        },
      });

      saveSession({ ...response, tenantSlug });
      toast.success('¡Bienvenido!', { id: toastId });
      setRedirecting(true);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión', { id: toastId });
      setLoading(false);
    }
  }

  async function onRegister() {
    if (adminData.password !== adminData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Creando cuenta empresarial...');
    try {
      await api('/auth/register-tenant', {
        method: 'POST',
        body: {
          ...companyData,
          ...adminData,
          tenantSlug: companyData.businessName.toLowerCase().replace(/\s+/g, '-'),
        },
      });
      toast.success('¡Solicitud enviada con éxito!', { id: toastId });
      setRegStep(3);
    } catch (e: any) {
      toast.error(e.message || 'Error al procesar el registro', { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#F4F7F6]">
      {/* Container that flips */}
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 60,
          damping: 15,
          mass: 1.5
        }}
        className={clsx(
          "flex w-full",
          mode === 'login' ? "flex-row" : "flex-row-reverse"
        )}
      >
        {/* Form Area */}
        <div className="flex w-full items-center justify-center px-6 lg:w-1/2 lg:px-12 bg-[#F4F7F6] relative z-20">
          <div className="w-full max-w-md py-12">
            {/* Logo */}
            <motion.div
              layout
              className="mb-14 flex items-center gap-5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A2B3C] shadow-2xl border border-white/5 ring-4 ring-[#1A2B3C]/5">
                <Package className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-[#1A2B3C] leading-none">Tuinity<span className="text-[#D4AF37]">OS</span></h1>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.3em] text-[#5A6C7D]">Enterprise Edition</p>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.div
                  key="login-card"
                  layout
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                  className="overflow-hidden rounded-3xl border border-[#E1E8ED] bg-white shadow-2xl transition-shadow duration-300"
                >
                  <div className="bg-[#1A2B3C] p-8">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Bienvenido</h2>
                    <p className="mt-1 text-sm text-white/50">Ingresa tus credenciales premium</p>
                  </div>

                  <form onSubmit={onLogin} className="space-y-6 p-8">
                    <Input
                      label="Empresa"
                      placeholder="nombre-empresa"
                      value={loginData.tenantSlug}
                      onChange={(e) => setLoginData({ ...loginData, tenantSlug: e.target.value })}
                      required
                      disabled={loading || redirecting}
                    />
                    <Input
                      label="Correo Electrónico"
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      disabled={loading || redirecting}
                    />
                    <Input
                      label="Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      disabled={loading || redirecting}
                      rightIcon={
                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      }
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full h-14 text-lg shadow-lg shadow-[#1A2B3C]/10"
                      disabled={loading || redirecting}
                      isLoading={loading || redirecting}
                    >
                      {redirecting ? 'Accediendo...' : 'Iniciar Sesión'}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register-card"
                  layout
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                  className="overflow-hidden rounded-3xl border border-[#E1E8ED] bg-white shadow-2xl transition-shadow duration-300"
                >
                  <div className="bg-[#1A2B3C] p-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Registro Maestro</h2>
                      <p className="mt-1 text-xs text-white/50">Configuración de cuenta corporativa</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(s => (
                        <div key={s} className={clsx("h-1.5 w-4 rounded-full transition-all", regStep === s ? "bg-[#D4AF37] w-8" : "bg-white/20")} />
                      ))}
                    </div>
                  </div>

                  <div className="p-8">
                    {regStep === 1 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <Input label="Razón Social *" placeholder="Ej. Corporación X" value={companyData.businessName} onChange={e => setCompanyData({ ...companyData, businessName: e.target.value })} />
                        <Input label="RUC / Tax ID *" placeholder="ID Fiscal" value={companyData.taxId} onChange={e => setCompanyData({ ...companyData, taxId: e.target.value })} />
                        <Input label="Dirección *" placeholder="Calle, Ave., Edificio" value={companyData.address} onChange={e => setCompanyData({ ...companyData, address: e.target.value })} />
                        <Button className="w-full mt-6 h-14 text-lg" onClick={() => setRegStep(2)} rightIcon={<ChevronRight className="h-5 w-5" />}>Continuar</Button>
                      </div>
                    )}

                    {regStep === 2 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="grid grid-cols-2 gap-6">
                          <Input label="Nombre *" placeholder="Juan" value={adminData.firstName} onChange={e => setAdminData({ ...adminData, firstName: e.target.value })} />
                          <Input label="Apellido *" placeholder="Pérez" value={adminData.lastName} onChange={e => setAdminData({ ...adminData, lastName: e.target.value })} />
                        </div>
                        <Input label="Email Profesional *" type="email" placeholder="jperez@empresa.com" value={adminData.email} onChange={e => setAdminData({ ...adminData, email: e.target.value })} />
                        <Input label="Contraseña *" type="password" placeholder="••••••••" value={adminData.password} onChange={e => setAdminData({ ...adminData, password: e.target.value })} />
                        <div className="flex gap-6 pt-2">
                          <Button variant="secondary" className="px-8" onClick={() => setRegStep(1)} leftIcon={<ChevronLeft className="h-5 w-5" />}>Atrás</Button>
                          <Button className="flex-1 h-14 text-lg" onClick={onRegister} isLoading={loading}>Crear Cuenta</Button>
                        </div>
                      </div>
                    )}

                    {regStep === 3 && (
                      <div className="py-12 text-center animate-in zoom-in duration-500">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#2D8A4E]/10 mb-6">
                          <Check className="h-10 w-10 text-[#2D8A4E]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1A2B3C]">Solicitud Enviada</h3>
                        <p className="mt-3 text-base text-[#5A6C7D] leading-relaxed">Tu registro requiere aprobación de RRHH.<br />Te avisaremos por email institucional.</p>
                        <Button variant="secondary" className="mt-10 w-full h-14" onClick={() => setMode('login')}>Regresar al Login</Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Switch Mode Action */}
            <div className="mt-10 text-center">
              <p className="text-base text-[#5A6C7D]">
                {mode === 'login' ? (
                  <>¿No tienes cuenta? <button onClick={() => setMode('register')} className="font-black text-[#1A2B3C] hover:underline decoration-[#D4AF37] decoration-2 underline-offset-8">Regístrate aquí</button></>
                ) : (
                  <>¿Ya tienes cuenta? <button onClick={() => setMode('login')} className="font-black text-[#1A2B3C] hover:underline decoration-[#D4AF37] decoration-2 underline-offset-8">Inicia sesión aquí</button></>
                )}
              </p>
              <p className="mt-6 text-sm text-[#5A6C7D]/60 hover:text-[#1A2B3C] transition-colors cursor-pointer font-bold uppercase tracking-widest">¿Necesitas ayuda? Contacta con soporte técnico</p>
            </div>
          </div>
        </div>

        {/* Branding Area (Blue) */}
        <div className="hidden lg:flex lg:w-1/2 lg:bg-[#1A2B3C] items-center relative overflow-hidden">
          {/* Decorative background stripes */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 h-full w-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:150px_150px] animate-pulse" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <BrandingSide mode={mode} />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F4F7F6]"><Loader2 className="h-8 w-8 animate-spin text-[#1A2B3C]" /></div>}>
      <AuthPageContent />
    </Suspense>
  );
}
