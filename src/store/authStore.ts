import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LoginResponse, UsuarioSesion } from '../types/api';
import { payloadJwtEsquema, sesionGuardadaEsquema } from '../api/esquemas';

interface AuthState {
  /** Ausente cuando no hay sesión. */
  token?: string;
  usuario?: UsuarioSesion;
  /** true cuando el backend rechazó el token (vencido o inválido). */
  sesionExpirada: boolean;
  iniciarSesion: (respuesta: LoginResponse) => void;
  cerrarSesion: () => void;
  expirarSesion: () => void;
}

const sinSesion = { token: undefined, usuario: undefined };

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      sesionExpirada: false,
      iniciarSesion: ({ token, ...usuario }) => set({ token, usuario, sesionExpirada: false }),
      cerrarSesion: () => set({ ...sinSesion, sesionExpirada: false }),
      expirarSesion: () => set({ ...sinSesion, sesionExpirada: true }),
    }),
    {
      name: 'pretest-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ token: s.token, usuario: s.usuario }),
      // Lo leído de localStorage se valida: si está corrupto o incompleto, no hay sesión.
      merge: (guardado, actual) => {
        const sesion = sesionGuardadaEsquema.safeParse(guardado);
        return sesion.success ? { ...actual, ...sesion.data } : actual;
      },
    },
  ),
);

/** Decodifica el payload del JWT (sin validar firma) para revisar `exp`. */
export function tokenVencido(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = payloadJwtEsquema.parse(JSON.parse(json));
    if (exp === undefined) return false;
    return exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
