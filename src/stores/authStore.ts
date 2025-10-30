import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthenticatedUser } from '@/services/auth/authService';

interface AuthState {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly user: AuthenticatedUser | null;
  readonly isAuthenticated: boolean;
  readonly setAccessToken: (token: string | null) => void;
  readonly setRefreshToken: (token: string | null) => void;
  readonly setUser: (user: AuthenticatedUser | null) => void;
  readonly authenticate: (session: { accessToken: string; refreshToken: string | null; user: AuthenticatedUser }) => void;
  readonly logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAccessToken: (token) => set((state) => ({
        accessToken: token,
        isAuthenticated: Boolean(token && state.user),
      })),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setUser: (user) => set((state) => ({
        user,
        isAuthenticated: Boolean(state.accessToken && user),
      })),
      authenticate: ({ accessToken, refreshToken, user }) => set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
      }),
      logout: () => set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'app-beat-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
