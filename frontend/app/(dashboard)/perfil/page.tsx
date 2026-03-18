"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, User, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { api } from "@/lib/services/api";

export default function PerfilPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await api.uploadUserAvatar(user.id, file);
      toast.success("Foto de perfil actualizada");
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      toast.error("Error al subir imagen");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-gray-700 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Mi Perfil</h1>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Gestiona tu información personal y foto de perfil</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Avatar */}
        <div className="md:col-span-1">
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Avatar className="h-32 w-32 text-2xl ring-4 ring-blue-500/10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => document.getElementById('avatar-input')?.click()}
                  className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                >
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                </button>
                <input 
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wider mt-1">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="md:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] overflow-hidden">
            <div className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-6 py-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Información Personal</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" /> Nombre Completo
                  </label>
                  <Input 
                    value={user.name}
                    readOnly
                    className="bg-gray-50 dark:bg-[#1a1a1a]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" /> Correo Electrónico
                  </label>
                  <Input 
                    value={user.email}
                    readOnly
                    className="bg-gray-50 dark:bg-[#1a1a1a]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" /> Rol en el Sistema
                </label>
                <div className="flex h-10 items-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-3 text-sm text-gray-600 dark:text-gray-400">
                  {user.role}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                <p className="text-xs text-gray-500 dark:text-[#888888]">
                  La información de tu cuenta es gestionada por el administrador. Ponte en contacto si necesitas realizar cambios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
