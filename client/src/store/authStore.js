import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password, rememberMe });
          const { user, accessToken, isTemporaryPassword } = res.data.data;
          set({ user, accessToken, isAuthenticated: true, isLoading: false });
          return { success: true, isTemporaryPassword };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Login failed. Please try again.',
          };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          /* ignore */
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      fetchCurrentUser: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.data.user, isAuthenticated: true });
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      hasRole: (roles) => {
        const u = get().user;
        if (!u) return false;
        return Array.isArray(roles) ? roles.includes(u.role) : u.role === roles;
      },
    }),
    {
      name: 'kat-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
