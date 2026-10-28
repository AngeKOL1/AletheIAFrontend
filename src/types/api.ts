/**
 * Tipos de los DTOs expuestos por el backend Spring Boot.
 * Mantener sincronizado con los records/clases DTO de Java.
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

export interface RegisterResponse {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  edad: number | null;
  genero: string | null;
  nivelEducativo: string | null;
  frecuenciaConsumoNoticias: string | null;
  fechaRegistro: string;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

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
  sesionAbiertaId: number | null;
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
 */
export interface NoticiaFeed {
  id: number;
  titular: string;
  epigrafe: string | null;
  subtitulo: string | null;
  entradilla: string | null;
  cuerpo: string | null;
  cierre: string | null;
  img: string;
  fuente: string | null;
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

export interface PrediccionManualResponse extends PrediccionManualRequest {
  id: number;
  [extra: string]: unknown;
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
  horaFin: string | null;
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
