'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-blue-500 focus-within:bg-blue-500/10">
    {children}
  </div>
);

export default function RegisterTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validatePassword(password: string): string | null {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[a-z]/.test(password)) return 'Debe contener al menos una letra minúscula';
    if (!/[A-Z]/.test(password)) return 'Debe contener al menos una letra mayúscula';
    if (!/\d/.test(password)) return 'Debe contener al menos un número';
    if (!/[@$!%*?&]/.test(password)) return 'Debe contener al menos un carácter especial (@$!%*?&)';
    return null;
  }

  function validateSlug(slug: string): string | null {
    if (slug.length < 2) return 'El slug debe tener al menos 2 caracteres';
    if (!/^[a-z0-9-]+$/.test(slug)) return 'Solo minúsculas, números y guiones';
    if (slug.startsWith('-') || slug.endsWith('-')) return 'No puede empezar ni terminar con guión';
    return null;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Validando datos...');

    const formData = new FormData(event.currentTarget);
    const slug = String(formData.get('tenantSlug') ?? '').trim();
    const password = String(formData.get('adminPassword') ?? '');
    const companyName = String(formData.get('companyName') ?? '').trim();
    const branchName = String(formData.get('branchName') ?? '').trim();
    const branchCode = String(formData.get('branchCode') ?? '').trim();
    const adminEmail = String(formData.get('adminEmail') ?? '').trim();

    // Validaciones básicas
    if (!companyName) {
      toast.error('El nombre de la empresa es requerido', { id: toastId });
      setLoading(false);
      return;
    }

    if (!branchName) {
      toast.error('El nombre de la sucursal es requerido', { id: toastId });
      setLoading(false);
      return;
    }

    if (!branchCode) {
      toast.error('El código de sucursal es requerido', { id: toastId });
      setLoading(false);
      return;
    }

    if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      toast.error('Ingresa un email válido', { id: toastId });
      setLoading(false);
      return;
    }

    const slugError = validateSlug(slug);
    if (slugError) {
      toast.error(slugError, { id: toastId });
      setLoading(false);
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      toast.error(pwdError, { id: toastId });
      setLoading(false);
      return;
    }

    toast.loading('Creando empresa...', { id: toastId });

    const payload = {
      companyName,
      tenantSlug: slug,
      branchName,
      branchCode,
      adminEmail,
      adminPassword: password,
    };

    try {
      await api('/auth/register-tenant', {
        method: 'POST',
        body: payload,
        tenantSlug: slug,
      });

      toast.success(`¡Empresa "${companyName}" creada exitosamente!`, {
        id: toastId,
        duration: 4000,
      });

      // Redirigir al login después de 1.5 segundos
      setTimeout(() => {
        router.push(`/login?tenant=${slug}`);
      }, 1500);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(message, { id: toastId });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
              <span className="font-light text-foreground">Crear Empresa</span>
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground mt-2">
              Crea un tenant con su sucursal principal y usuario admin
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Empresa</label>
                <GlassInputWrapper>
                  <input
                    name="companyName"
                    type="text"
                    placeholder="Dynamo Solutions"
                    required
                    maxLength={100}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Tenant Slug</label>
                <GlassInputWrapper>
                  <input
                    name="tenantSlug"
                    type="text"
                    placeholder="demo"
                    required
                    maxLength={50}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                  />
                </GlassInputWrapper>
                <p className="text-xs text-muted-foreground mt-1 ml-2">Solo minúsculas, números y guiones</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Sucursal</label>
                <GlassInputWrapper>
                  <input
                    name="branchName"
                    type="text"
                    placeholder="Principal"
                    required
                    maxLength={100}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Código Sucursal</label>
                <GlassInputWrapper>
                  <input
                    name="branchCode"
                    type="text"
                    placeholder="MAIN"
                    required
                    maxLength={20}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                  />
                </GlassInputWrapper>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Email Admin</label>
                <GlassInputWrapper>
                  <input
                    name="adminEmail"
                    type="email"
                    placeholder="admin@demo.com"
                    required
                    maxLength={255}
                    autoComplete="email"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Password Admin</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Admin123*"
                      required
                      maxLength={100}
                      autoComplete="new-password"
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
                <p className="text-xs text-muted-foreground mt-1 ml-2">
                  Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 especial
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando empresa...' : 'Crear Empresa'}
            </button>
          </form>

          <div className="animate-element animate-delay-700 relative flex items-center justify-center">
            <span className="w-full border-t border-border"></span>
            <span className="px-4 text-sm text-muted-foreground bg-background absolute">O continúa con</span>
          </div>

          <button
            onClick={() => toast.info('Google Sign-Up próximamente')}
            className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <a href="/login" className="text-blue-600 hover:underline transition-colors">
              Iniciar Sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
