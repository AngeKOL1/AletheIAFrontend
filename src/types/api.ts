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
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

/** Roles conocidos; se acepta cualquier otro que envíe el backend. */
export type Rol = 'PARTICIPANTE' | 'ADMIN' | (string & {});

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

export type TipoRespuesta = 'likert_5' | (string & {});

export interface ItemCuestionario {
  id: number;
  contenido: string;
  tipoRespuesta: TipoRespuesta;
  orden: number;
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
  | 'AuthError'
  | 'ModelNotFound'
  | 'DataConflict'
  | 'InvalidState'
  | 'UnexpectedError';

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errorType: ErrorType;
}
