/**
 * Tipos de los DTOs expuestos por el backend Spring Boot.
 * Mantener sincronizado con los records/clases DTO de Java.
 *
 * Sin `null`: los datos del backend se validan en `api/esquemas.ts`, que
 * convierte `null` en `''` (textos visibles) o en campos ausentes (`?`).
 */

export type Fase = 'PRE' | 'POST';

// ---------- Autenticación ----------

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  edad?: number;
  genero?: string;
  nivelEducativo?: string;
  frecuenciaConsumoNoticias?: string;
  medioComunicacion?: string;
  cargo?: string;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export type Rol = 'PARTICIPANTE' | 'INVESTIGADOR';

export interface LoginResponse {
  token: string;
  id: number;
  nombres: string;
  correo: string;
  rol: Rol;
}

/** Datos del usuario guardados en sesión (sin el token). */
export type UsuarioSesion = Omit<LoginResponse, 'token'>;

// ---------- Estado del participante ----------

export interface EstadoParticipante {
  prediccionesRespondidas: number;
  totalNoticias: number;
  cuestionarioCompletado: boolean;
  /** Ausente si el participante no tiene una sesión de cuestionario abierta. */
  sesionAbiertaId?: number;
}

// ---------- Categorías ----------

export type NombreCategoria = 'VERDADERA' | 'ENGANOSA' | 'NO_VERIFICABLE' | 'FALSA';

export interface Categoria {
  id: number;
  nombre: NombreCategoria;
}

// ---------- Feed de noticias ----------

/**
 * Noticia tal como la entrega el feed del pre test.
 * IMPORTANTE: no contiene (ni debe contener) la categoría real / ground truth.
 * Los textos opcionales llegan como `''` cuando el backend no los tiene.
 */
export interface NoticiaFeed {
  id: number;
  titular: string;
  epigrafe: string;
  subtitulo: string;
  entradilla: string;
  cuerpo: string;
  cierre: string;
  img: string;
  fuente: string;
}

// ---------- Predicciones manuales ----------

export interface PrediccionManualRequest {
  noticiaId: number;
  categoriaElegidaId: number;
  fase: Fase;
  ordenPresentacion: number;
  tiempoRespuestaSeg: number;
  confianzaAutopercibida: number;
}

// ---------- Cuestionario ----------

export type TipoRespuesta = 'likert_5' | 'texto';

/** Dimensión del estudio que mide cada ítem. */
export type Dimension =
  | 'TASA_ACIERTO'
  | 'TIEMPO_VERIFICACION'
  | 'CLASIFICACION_NOTICIAS'
  | 'USABILIDAD'
  | 'FUNCIONALIDAD'
  | 'RENDIMIENTO';

/** PRE_POST: se aplica en ambas fases; SOLO_POST: solo en el post test (sobre el sistema). */
export type FaseAplicacion = 'PRE_POST' | 'SOLO_POST';

export interface ItemCuestionario {
  id: number;
  contenido: string;
  tipoRespuesta: TipoRespuesta;
  orden: number;
  dimension: Dimension;
  faseAplicacion: FaseAplicacion;
}

export interface SesionTest {
  id: number;
  fase: Fase;
  horaInicio: string;
  /** Ausente mientras la sesión sigue abierta. */
  horaFin?: string;
  titulo: string;
}

export interface RespuestaItem {
  itemCuestionarioId: number;
  respuesta: string;
}

export interface RespuestasLoteRequest {
  sesionTestId: number;
  respuestas: RespuestaItem[];
}

// ---------- Errores (RFC 7807) ----------

export type ErrorType =
  | 'ValidationError'
  | 'InvalidArgument'
  | 'AuthError'
  | 'AccessDenied'
  | 'ModelNotFound'
  | 'InvalidState'
  | 'DataConflict'
  | 'VerificationServiceError'
  | 'VerificationServiceBusy'
  | 'UnexpectedError';

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errorType: ErrorType;
  /** Errores de validación por campo (solo en 400 de validación). Vacío si no hay. */
  campos: Record<string, string>;
  /** Solo en 503 de AletheIA ocupado. */
  reintentarEnSegundos?: number;
}
