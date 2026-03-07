'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { WorldMap } from '@/components/ui/world-map';

// Panama coordinates adjusted for dotted-map projection (moved outside component to avoid recreating)
const panamaCoords = { lat: -8, lng: -79.5 };

// Connection lines from Panama to countries per continent (static - never changes)
const MAP_DOTS = [
  // North America
  { start: panamaCoords, end: { lat: 49.0, lng: -74.0 } }, // New York, USA
  // South America
  { start: panamaCoords, end: { lat: 5.0, lng: -74.0 } }, // Colombia (Bogotá)
  { start: panamaCoords, end: { lat: -34.0, lng: -58.0 } }, // Argentina (Buenos Aires)
  // Europe
  { start: panamaCoords, end: { lat: 50.0, lng: -3.0 } }, // Spain
  { start: panamaCoords, end: { lat: 56.0, lng: 10.0 } }, // Northern Europe
  // Asia
  { start: panamaCoords, end: { lat: 37.0, lng: 127.0 } }, // South Korea (Seoul)
  { start: panamaCoords, end: { lat: 28.0, lng: 77.0 } }, // India (New Delhi)
  // Africa
  { start: panamaCoords, end: { lat: -25.0, lng: 28.0 } }, // South Africa (Pretoria)
  // Oceania
  { start: panamaCoords, end: { lat: -28.0, lng: 150.0 } }, // Australia
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const success = await login(email, password);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Correo electrónico no encontrado');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* World Map Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-[1600px] scale-125">
          <WorldMap dots={MAP_DOTS} lineColor="#3B82F6" />
        </div>
      </div>

      {/* Subtle gradient overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/40" />

      {/* Login Card */}
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
                className="mb-4 flex justify-center"
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
                className="text-xs text-gray-600"
              >
                Sistema de Gestión Comercial
              </motion.p>
            </div>

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-3"
            >
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

              <div className="mt-2 flex justify-center">
                <Button
                  type="submit"
                  className="w-3/4 rounded-full bg-gray-800 text-sm font-semibold text-white hover:bg-blue-600"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Iniciar Sesión
                </Button>
              </div>
            </motion.form>
          </div>

          {/* Footer with Tuinity Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/20 px-5 py-2 shadow-lg backdrop-blur-md"
          >
            <span className="text-xs text-gray-400">Powered by</span>
            <img
              src="/tuinity-logo.svg"
              alt="Tuinity"
              className="h-9 w-auto brightness-75 contrast-225"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
