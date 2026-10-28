import axios, { AxiosError } from 'axios';
import type { ErrorType, ProblemDetail } from '../types/api';
import { useAuthStore } from '../store/authStore';

/** Error normalizado: toda falla HTTP llega a la UI con esta forma. */
export class ApiError extends Error {
  readonly status: number;
  readonly errorType: ErrorType | 'NetworkError';
  readonly title: string;

  constructor(params: {
    status: number;
    errorType: ErrorType | 'NetworkError';
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

function esProblemDetail(data: unknown): data is ProblemDetail {
  return typeof data === 'object' && data !== null && 'status' in data && 'detail' in data;
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

  const { status, data } = error.response;
  if (esProblemDetail(data)) {
    return new ApiError({
      status: data.status ?? status,
      errorType: data.errorType ?? 'UnexpectedError',
      title: data.title ?? 'Error',
      detail: data.detail || 'Ocurrió un error al procesar la solicitud.',
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
