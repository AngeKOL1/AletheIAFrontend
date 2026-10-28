import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LoginResponse, UsuarioSesion } from '../types/api';

interface AuthState {
  token: string | null;
  usuario: UsuarioSesion | null;
  /** true cuando el backend rechazó el token (vencido o inválido). */
  sesionExpirada: boolean;
  iniciarSesion: (respuesta: LoginResponse) => void;
  cerrarSesion: () => void;
  expirarSesion: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      sesionExpirada: false,
      iniciarSesion: ({ token, ...usuario }) =>
        set({ token, usuario, sesionExpirada: false }),
      cerrarSesion: () => set({ token: null, usuario: null, sesionExpirada: false }),
      expirarSesion: () => set({ token: null, usuario: null, sesionExpirada: true }),
    }),
    {
      name: 'pretest-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ token: s.token, usuario: s.usuario }),
    },
  ),
);

/** Decodifica el payload del JWT (sin validar firma) para revisar `exp`. */
export function tokenVencido(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    if (typeof exp !== 'number') return false;
    return exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
