'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { User, AuthState, PermissionKey } from '@/lib/types/user';
import { MOCK_USERS, getUserByEmail } from '@/lib/mock-data/users';
import { hasPermission } from '@/lib/constants/roles';
import { api } from '@/lib/services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<boolean>;
  loginAsUser: (user: User) => void;
  logout: () => Promise<void>;
  checkPermission: (permission: PermissionKey) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'evolution_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from localStorage on mount and verify session
  useEffect(() => {
    const verifySession = async () => {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      const token = localStorage.getItem('evolution_auth_token');
      
      if (storedUser && token) {
        try {
          const user = JSON.parse(storedUser) as User;
          
          // Verificar con el servidor que la sesión sigue siendo válida
          const me = await api.me();
          
          if (me) {
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Sesión inválida en el servidor
            throw new Error('Invalid session');
          }
        } catch (error) {
          console.warn('Authentication verification failed:', error);
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem('evolution_auth_token');
          setState((prev) => ({ ...prev, user: null, isAuthenticated: false, isLoading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    verifySession();
  }, []);

  // Login with email/password (Real API)
  const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token, user } = data;

        // Guardar token y usuario
        localStorage.setItem('evolution_auth_token', access_token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Quick login as a specific user (for dev mode)
  const loginAsUser = useCallback((user: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    // En dev, establecemos un token dummy para que la cabecera exista
    localStorage.setItem('evolution_auth_token', 'mock-dev-token');
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Intentar cerrar sesión en el servidor
      await api.logout();
    } catch (error) {
      console.error('Logout error on server:', error);
    } finally {
      // Limpiar TODO el almacenamiento local para seguridad absoluta
      localStorage.clear();
      sessionStorage.clear();

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Usar window.location.replace para limpiar el historial de navegación
      // y forzar una recarga completa del estado de la aplicación
      window.location.replace('/login');
    }
  }, []);

  // Check if current user has a specific permission
  const checkPermission = useCallback(
    (permission: PermissionKey): boolean => {
      if (!state.user) return false;
      return hasPermission(state.user.role, permission);
    },
    [state.user]
  );
  
  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    try {
      const me = await api.me();
      if (me) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(me));
        setState((prev) => ({
          ...prev,
          user: me,
          isAuthenticated: true,
        }));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginAsUser,
        logout,
        checkPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export mock users for quick access dropdown
export { MOCK_USERS };
