'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { loadSession, saveSession } from '@/lib/auth-storage';
import { toast } from 'sonner';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  userId: string;
};

// --- HELPER COMPONENTS ---

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

interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <div className={`animate-element ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

const testimonials: Testimonial[] = [
  {
    avatarSrc: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    name: 'María García',
    handle: '@maria_ceo',
    text: 'Esta plataforma transformó completamente nuestra forma de trabajar.',
  },
  {
    avatarSrc: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    name: 'Carlos Ruiz',
    handle: '@carlos_dev',
    text: 'La mejor herramienta que hemos usado. Altamente recomendada.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Prefetch dashboard para navegación instantánea
    router.prefetch('/dashboard');
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Autenticando...');

    const formData = new FormData(event.currentTarget);
    const formSlug = String(formData.get('tenantSlug') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const tenantSlug = formSlug || String(searchParams.get('tenant') ?? '').trim();

    if (!tenantSlug) {
      toast.error('Por favor ingresa el nombre de la empresa', { id: toastId });
      setLoading(false);
      return;
    }

    try {
      const response = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password, tenantSlug },
        tenantSlug, // Explicitly pass tenantSlug for the header
      });

      saveSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        tenantId: response.tenantId,
        tenantSlug: tenantSlug,
        userId: response.userId,
      });

      toast.success('¡Bienvenido de vuelta!', { id: toastId });
      router.push('/dashboard');
    } catch (error: unknown) {
      // No logueamos el error en consola para evitar el overlay de desarrollo
      // console.error(error); 
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error(message, { id: toastId });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
            <span className="font-light text-foreground">Bienvenido</span>
          </h1>
          <p className="animate-element animate-delay-200 text-muted-foreground">
            Accede a tu cuenta y continúa tu trabajo con nosotros
          </p>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="animate-element animate-delay-300">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Empresa</label>
              <GlassInputWrapper>
                <input
                  name="tenantSlug"
                  type="text"
                  placeholder="ej. apple"
                  defaultValue={String(searchParams.get('tenant') ?? '')}
                  required
                  className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                />
              </GlassInputWrapper>
            </div>

            <div className="animate-element animate-delay-400">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Correo Electrónico</label>
              <GlassInputWrapper>
                <input
                  name="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  required
                  autoComplete="email"
                  className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                />
              </GlassInputWrapper>
            </div>

            <div className="animate-element animate-delay-500">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Contraseña</label>
              <GlassInputWrapper>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
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
            </div>

            <div className="animate-element animate-delay-600 flex items-center justify-between text-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                <span className="text-foreground/90">Mantener sesión iniciada</span>
              </label>
              <a href="#" className="hover:underline text-blue-600 transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="animate-element animate-delay-700 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="animate-element animate-delay-800 relative flex items-center justify-center">
            <span className="w-full border-t border-border"></span>
            <span className="px-4 text-sm text-muted-foreground bg-background absolute">O continúa con</span>
          </div>

          <button
            onClick={() => toast.info('Google Sign-In próximamente')}
            className="animate-element animate-delay-900 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <p className="animate-element animate-delay-1000 text-center text-sm text-muted-foreground">
            ¿Nuevo en nuestra plataforma?{' '}
            <a href="/register" className="text-blue-600 hover:underline transition-colors">
              Crear Cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
