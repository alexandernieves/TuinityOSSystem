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
import { toast } from 'sonner';

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

  // Verify session from localStorage on mount
  useEffect(() => {
    const verifySession = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const token = localStorage.getItem('evolution_auth_token');

      if (stored && token) {
        try {
          console.log('[AUTH] Verifying stored session...');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const user = await response.json();
            console.log(`[AUTH] Session valid: ${user.email}`);
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            console.warn(`[AUTH] Session invalid or expired (${response.status}). Clearing...`);
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('evolution_auth_token');
            setState((prev) => ({ ...prev, user: null, isAuthenticated: false, isLoading: false }));
          }
        } catch (error) {
          console.error('[AUTH] Background session verification failed:', error);
          setState((prev) => ({ ...prev, isLoading: false }));
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
    console.log(`[AUTH] Login attempt for: ${email}`);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token, user } = data;

        console.log(`[AUTH] Login success for ${email}. Session: ${user.sessionId}`);

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
      
      console.warn(`[AUTH] Login failed: ${response.status} for ${email}`);
      // Clear potentially stale state
      setState((prev) => ({ ...prev, user: null, isAuthenticated: false, isLoading: false }));
      return false;
    } catch (error) {
      console.error('[AUTH] Login exception:', error);
      setState((prev) => ({ ...prev, user: null, isAuthenticated: false, isLoading: false }));
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

  // Logout with toast and proper cleanup
  const logout = useCallback(async () => {
    // Show loading toast
    const toastId = toast.loading('Cerrando sesión', {
      description: 'Por favor, espere un momento...',
    });

    try {
      const token = localStorage.getItem('evolution_auth_token');
      // Extract sessionId from current user state if available
      const sessionId = state.user?.sessionId;

      if (token && sessionId) {
        // Attempt to call backend logout
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }).catch(err => console.error('Silent API logout failure:', err));
      }

      // Short delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      // Clear local storage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('evolution_auth_token');

      // Update state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast.success('Sesión cerrada', {
        id: toastId,
        description: 'Vuelva pronto.',
      });

    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error al cerrar sesión', { id: toastId });
    }
  }, [state.user?.sessionId]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('evolution_auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        const user = await response.json();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        setState((prev) => ({
          ...prev,
          user,
          isAuthenticated: true,
        }));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
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
