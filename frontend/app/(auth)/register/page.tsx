'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { WorldMap } from '@/components/ui/world-map';
import { toast } from 'sonner';

const panamaCoords = { lat: -8, lng: -79.5 };
const MAP_DOTS = [
  { start: panamaCoords, end: { lat: 49.0, lng: -74.0 } },
  { start: panamaCoords, end: { lat: 5.0, lng: -74.0 } },
  { start: panamaCoords, end: { lat: -34.0, lng: -58.0 } },
  { start: panamaCoords, end: { lat: 50.0, lng: -3.0 } },
  { start: panamaCoords, end: { lat: 56.0, lng: 10.0 } },
  { start: panamaCoords, end: { lat: 37.0, lng: 127.0 } },
  { start: panamaCoords, end: { lat: 28.0, lng: 77.0 } },
  { start: panamaCoords, end: { lat: -25.0, lng: 28.0 } },
  { start: panamaCoords, end: { lat: -28.0, lng: 150.0 } },
];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        toast.success('Registro completado', {
          description: 'Tu cuenta está pendiente de validación.'
        });
        router.push('/pending-validation');
      } else {
        const data = await response.json();
        setError(data.message || 'Error al registrarte');
        toast.error('Error de registro', {
          description: data.message || 'Error al procesar tu registro.'
        });
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      toast.error('Error de servidor', {
        description: 'Imposible conectar con el servidor.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* World Map Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-[1600px] scale-125">
          <WorldMap dots={MAP_DOTS} lineColor="#3B82F6" />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/40" />

      {/* Register Card */}
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Glassmorphism Card */}
          <div className="rounded-2xl border border-white/30 bg-white/20 px-6 pb-6 pt-8 shadow-xl backdrop-blur-md">
            {/* Logo */}
            <div className="mb-6 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mb-4 flex gap-2 w-full justify-center items-center flex-col"
              >
                  <img
                  src="https://res.cloudinary.com/db3espoei/image/upload/v1771993730/Logo_Evolution_ZL__1_-cropped_onzamv.svg"
                  alt="Evolution Zona Libre"
                  className="h-12 w-auto"
                />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm font-semibold text-gray-800"
              >
                Crear una cuenta nueva
              </motion.p>
            </div>

            {/* Register Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-800">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="h-10 w-full rounded-lg border-2 border-white/40 bg-white/60 pl-10 pr-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 backdrop-blur-sm focus:border-blue-500 focus:bg-white/80"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-800">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@evolutionzl.com"
                    className="h-10 w-full rounded-lg border-2 border-white/40 bg-white/60 pl-10 pr-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 backdrop-blur-sm focus:border-blue-500 focus:bg-white/80"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-800">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-lg border-2 border-white/40 bg-white/60 pl-10 pr-10 text-sm text-gray-800 outline-none placeholder:text-gray-400 backdrop-blur-sm focus:border-blue-500 focus:bg-white/80"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500"
                >
                  {error}
                </motion.p>
              )}

              <div className="mt-4 flex flex-col items-center justify-center gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Registrarme
                </Button>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </button>
              </div>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
