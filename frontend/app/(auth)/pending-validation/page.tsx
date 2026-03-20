'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function PendingValidationPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center border border-gray-100"
      >
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="h-20 w-20 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center"
          >
            <ShieldAlert className="h-10 w-10" />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-gray-800 mb-2"
        >
          Validación Pendiente
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-600 mb-8 leading-relaxed"
        >
          Tu cuenta ha sido creada exitosamente. Sin embargo, requiere aprobación de un administrador antes de que puedas acceder al sistema. Te notificaremos cuando tu acceso sea concedido.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => router.push('/login')}
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Inicio
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
