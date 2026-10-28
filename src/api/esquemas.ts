/**
 * Validación de todo lo que entra a la app desde fuera (backend y localStorage).
 *
 * Regla: los datos externos se validan aquí UNA vez. Los `null` del backend se
 * convierten en `''` (textos que se muestran) o en campos ausentes (`?`), de modo
 * que el resto del código trabaja con tipos sin `null`.
 *
 * Cada esquema se anota con su tipo de `types/api.ts`, así TypeScript avisa si
 * el esquema y el tipo dejan de coincidir.
 */
import { z } from 'zod';
import type {
  Categoria,
  EstadoParticipante,
  ItemCuestionario,
  LoginResponse,
  NoticiaFeed,
  ProblemDetail,
  SesionTest,
  UsuarioSesion,
} from '../types/api';

// ---------- Ayudantes ----------

/** Texto opcional del backend: `null`/ausente → `''`. */
const textoOpcional = z
  .string()
  .nullish()
  .transform((v) => v ?? '');

/** Número opcional del backend: `null` → ausente. */
const numeroOpcional = z
  .number()
  .nullish()
  .transform((v) => v ?? undefined);

/** Fecha/hora opcional del backend: `null` → ausente. */
const fechaOpcional = z
  .string()
  .nullish()
  .transform((v) => v ?? undefined);

const fase = z.enum(['PRE', 'POST']);

// ---------- Respuestas del backend ----------

export const loginResponseEsquema: z.ZodType<LoginResponse> = z.object({
  token: z.string().min(1),
  id: z.number(),
  nombres: z.string(),
  correo: z.string(),
  rol: z.string(),
});

export const estadoParticipanteEsquema: z.ZodType<EstadoParticipante> = z.object({
  prediccionesRespondidas: z.number(),
  totalNoticias: z.number(),
  cuestionarioCompletado: z.boolean(),
  sesionAbiertaId: numeroOpcional,
});

export const categoriaEsquema: z.ZodType<Categoria> = z.object({
  id: z.number(),
  nombre: z.enum(['VERDADERA', 'ENGANOSA', 'NO_VERIFICABLE', 'FALSA']),
});

export const noticiaFeedEsquema: z.ZodType<NoticiaFeed> = z.object({
  id: z.number(),
  titular: z.string(),
  epigrafe: textoOpcional,
  subtitulo: textoOpcional,
  entradilla: textoOpcional,
  cuerpo: textoOpcional,
  cierre: textoOpcional,
  img: textoOpcional,
  fuente: textoOpcional,
});

export const itemCuestionarioEsquema: z.ZodType<ItemCuestionario> = z.object({
  id: z.number(),
  contenido: z.string(),
  tipoRespuesta: z.string(),
  orden: z.number(),
});

export const sesionTestEsquema: z.ZodType<SesionTest> = z.object({
  id: z.number(),
  fase,
  horaInicio: z.string(),
  horaFin: fechaOpcional,
  titulo: z.string(),
});

export const listaIdsEsquema = z.array(z.number());
export const conteoEsquema = z.number();

/** Error RFC 7807. Un `errorType` desconocido cae en `UnexpectedError`. */
export const problemDetailEsquema: z.ZodType<ProblemDetail> = z.object({
  type: textoOpcional,
  title: z.string().nullish().transform((v) => v || 'Error'),
  status: z.number(),
  detail: z.string(),
  instance: textoOpcional,
  errorType: z
    .enum(['ValidationError', 'AuthError', 'ModelNotFound', 'DataConflict', 'InvalidState', 'UnexpectedError'])
    .catch('UnexpectedError'),
});

// ---------- Datos guardados en el navegador ----------

export const usuarioSesionEsquema: z.ZodType<UsuarioSesion> = z.object({
  id: z.number(),
  nombres: z.string(),
  correo: z.string(),
  rol: z.string(),
});

/** Sesión persistida por el store de autenticación. */
export const sesionGuardadaEsquema = z.object({
  token: z.string().min(1),
  usuario: usuarioSesionEsquema,
});

/** Payload del JWT: solo interesa la expiración (`exp`, en segundos). */
export const payloadJwtEsquema = z.object({ exp: z.number().optional() });

/** Borrador del cuestionario: id de ítem → respuesta. */
export const borradorCuestionarioEsquema = z.record(z.string().regex(/^\d+$/), z.string());

/** Estado de navegación que viaja hacia login/registro. */
export const estadoNavegacionEsquema = z.object({ desde: z.string().startsWith('/') });
