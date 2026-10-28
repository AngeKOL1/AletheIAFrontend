import axios, { AxiosError, type AxiosResponse } from 'axios';
import type { z } from 'zod';
import type { ErrorType } from '../types/api';
import { useAuthStore } from '../store/authStore';
import { problemDetailEsquema } from './esquemas';

/** Tipos de error del backend + los que detecta el propio frontend. */
export type TipoError = ErrorType | 'NetworkError' | 'InvalidResponse';

/** Error normalizado: toda falla HTTP llega a la UI con esta forma. */
export class ApiError extends Error {
  readonly status: number;
  readonly errorType: TipoError;
  readonly title: string;

  constructor(params: {
    status: number;
    errorType: TipoError;
    title: string;
    detail: string;
  }) {
    super(params.detail);
    this.name = 'ApiError';
    this.status = params.status;
    this.errorType = params.errorType;
    this.title = params.title;
  }

  /** Mensaje legible para mostrar al participante. */
  get detail(): string {
    return this.message;
  }
}

/*
 * `esApiError` y `mensajeDeError` reciben lo que llega a un `catch`, que en
 * TypeScript siempre es `unknown`. Son el único punto donde se acepta ese tipo:
 * aquí se reduce a `ApiError` o a un mensaje genérico.
 */
export function esApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** Mensaje seguro para la UI a partir de cualquier error. */
export function mensajeDeError(e: unknown): string {
  if (esApiError(e)) return e.detail;
  return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el JWT en cada petición.
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Valida el cuerpo de una respuesta con su esquema. Uso: `.then(recibir(esquema))`.
 * Si el backend envía algo con otra forma, falla con un `ApiError` claro en lugar
 * de dejar pasar datos incorrectos a la interfaz.
 */
export function recibir<T>(esquema: z.ZodType<T>) {
  return (respuesta: AxiosResponse): T => {
    const resultado = esquema.safeParse(respuesta.data);
    if (resultado.success) return resultado.data;
    console.error(`Respuesta inválida de ${respuesta.config.url}:`, resultado.error.issues);
    throw new ApiError({
      status: respuesta.status,
      errorType: 'InvalidResponse',
      title: 'Respuesta inesperada',
      detail: 'El servidor envió datos con un formato inesperado. Inténtalo nuevamente más tarde.',
    });
  };
}

function normalizar(error: AxiosError): ApiError {
  if (!error.response) {
    return new ApiError({
      status: 0,
      errorType: 'NetworkError',
      title: 'Sin conexión',
      detail:
        error.code === 'ECONNABORTED'
          ? 'El servidor tardó demasiado en responder. Inténtalo nuevamente.'
          : 'No se pudo conectar con el servidor. Revisa tu conexión a internet.',
    });
  }

  const { status } = error.response;
  const problema = problemDetailEsquema.safeParse(error.response.data);
  if (problema.success) {
    const p = problema.data;
    return new ApiError({
      status: p.status,
      errorType: p.errorType,
      title: p.title,
      detail: p.detail || 'Ocurrió un error al procesar la solicitud.',
    });
  }

  // Respuestas sin ProblemDetail (p. ej. 401/403 emitidos por Spring Security).
  const porDefecto: Record<number, { errorType: ErrorType; detail: string }> = {
    401: { errorType: 'AuthError', detail: 'Tu sesión expiró. Vuelve a iniciar sesión.' },
    403: { errorType: 'AuthError', detail: 'No tienes permiso para realizar esta acción.' },
    404: { errorType: 'ModelNotFound', detail: 'No se encontró el recurso solicitado.' },
    409: { errorType: 'DataConflict', detail: 'La operación entra en conflicto con datos existentes.' },
  };
  const conocido = porDefecto[status] ?? {
    errorType: 'UnexpectedError' as const,
    detail: 'Ocurrió un error inesperado en el servidor.',
  };
  return new ApiError({ status, title: 'Error', ...conocido });
}

// Normaliza errores y cierra la sesión si el token ya no es válido.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = normalizar(error);
    const esEndpointAuth = error.config?.url?.startsWith('/api/auth/') ?? false;

    // En /api/auth un AuthError significa "credenciales incorrectas", no sesión vencida.
    if (!esEndpointAuth && (apiError.status === 401 || apiError.errorType === 'AuthError')) {
      useAuthStore.getState().expirarSesion();
    }
    return Promise.reject(apiError);
  },
);
