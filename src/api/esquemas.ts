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
import type {
  AfirmacionVista,
  Analisis,
  AnalisisResumen,
  EvidenciaVista,
  InformeVista,
} from '../types/analisis';

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
const rol = z.enum(['PARTICIPANTE', 'INVESTIGADOR']);

/** Booleano opcional: `null` → ausente. */
const booleanoOpcional = z
  .boolean()
  .nullish()
  .transform((v) => v ?? undefined);

// ---------- Respuestas del backend ----------

export const loginResponseEsquema: z.ZodType<LoginResponse> = z.object({
  token: z.string().min(1),
  id: z.number(),
  nombres: z.string(),
  correo: z.string(),
  rol,
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
  tipoRespuesta: z.enum(['likert_5', 'texto']),
  orden: z.number(),
  dimension: z.enum([
    'TASA_ACIERTO',
    'TIEMPO_VERIFICACION',
    'CLASIFICACION_NOTICIAS',
    'USABILIDAD',
    'FUNCIONALIDAD',
    'RENDIMIENTO',
  ]),
  faseAplicacion: z.enum(['PRE_POST', 'SOLO_POST']),
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
    .enum([
      'ValidationError',
      'InvalidArgument',
      'AuthError',
      'AccessDenied',
      'ModelNotFound',
      'InvalidState',
      'DataConflict',
      'VerificationServiceError',
      'VerificationServiceBusy',
      'UnexpectedError',
    ])
    .catch('UnexpectedError'),
  campos: z
    .record(z.string(), z.string())
    .nullish()
    .transform((v) => v ?? {}),
  reintentarEnSegundos: numeroOpcional,
});

// ---------- Análisis con AletheIA ----------

const evidenciaEsquema: z.ZodType<EvidenciaVista> = z.object({
  url: z.string(),
  dominio: textoOpcional,
  titulo: textoOpcional,
  fuente: textoOpcional,
  fechaPublicacion: textoOpcional,
  tipoFuente: textoOpcional,
  postura: textoOpcional,
  fragmentoRelevante: textoOpcional,
});

const afirmacionEsquema: z.ZodType<AfirmacionVista> = z
  .object({
    id: z.string(),
    texto: z.string(),
    ubicacion: textoOpcional,
    tipo: textoOpcional,
    central: z.boolean().nullish(),
    estado: textoOpcional,
    veredicto: z.string().nullish(),
    veredictoEtiqueta: z.string().nullish(),
    tipoProblema: textoOpcional,
    solidezEvidencia: textoOpcional,
    justificacion: textoOpcional,
    evidencias: z
      .array(evidenciaEsquema)
      .nullish()
      .transform((v) => v ?? []),
  })
  .transform(({ veredicto, veredictoEtiqueta, central, ...resto }): AfirmacionVista => {
    const base = { ...resto, central: central ?? false };
    // Opiniones y predicciones no tienen veredicto (regla 7).
    if (resto.tipo !== 'factual') return base;
    return {
      ...base,
      veredicto: veredicto
        ? { tipo: 'veredicto', valor: veredicto, etiqueta: veredictoEtiqueta || veredicto }
        : { tipo: 'sin-veredicto' },
    };
  });

const informeEsquema: z.ZodType<InformeVista> = z
  .object({
    veredictoGlobal: z.string().nullish(),
    veredictoGlobalEtiqueta: z.string().nullish(),
    motivoSinVeredicto: z.string().nullish(),
    motivoSinVeredictoEtiqueta: z.string().nullish(),
    justificacionGlobal: textoOpcional,
    distorsionGlobal: z
      .object({ detectada: z.boolean().nullish(), tipo: textoOpcional, justificacion: textoOpcional })
      .nullish(),
    afirmaciones: z
      .array(afirmacionEsquema)
      .nullish()
      .transform((v) => v ?? []),
    limitaciones: z
      .array(z.string())
      .nullish()
      .transform((v) => v ?? []),
    verificacionExternaRealizada: booleanoOpcional,
    fechaAnalisis: fechaOpcional,
  })
  .transform((i): InformeVista => ({
    // Reglas 1 y 2: veredicto con su etiqueta, o el motivo por el que no hay veredicto.
    resultado: i.veredictoGlobal
      ? { tipo: 'veredicto', valor: i.veredictoGlobal, etiqueta: i.veredictoGlobalEtiqueta || i.veredictoGlobal }
      : {
          tipo: 'sin-veredicto',
          motivo: i.motivoSinVeredicto ?? '',
          motivoEtiqueta: i.motivoSinVeredictoEtiqueta || 'El sistema no pudo emitir un veredicto.',
        },
    justificacionGlobal: i.justificacionGlobal,
    distorsionGlobal: i.distorsionGlobal
      ? {
          detectada: i.distorsionGlobal.detectada ?? false,
          tipo: i.distorsionGlobal.tipo,
          justificacion: i.distorsionGlobal.justificacion,
        }
      : undefined,
    afirmaciones: i.afirmaciones,
    limitaciones: i.limitaciones,
    verificacionExternaRealizada: i.verificacionExternaRealizada,
    fechaAnalisis: i.fechaAnalisis,
  }));

const estadoAnalisis = z.enum(['PENDIENTE', 'COMPLETADO', 'ERROR', 'PERDIDO']);

export const analisisEsquema: z.ZodType<Analisis> = z
  .object({
    id: z.number(),
    noticiaId: z.number(),
    estado: estadoAnalisis,
    estadoDetalle: textoOpcional,
    creado: z.string(),
    actualizado: z.string(),
    informe: informeEsquema.nullish(),
    error: z.object({ tipo: textoOpcional, etapa: textoOpcional, mensaje: textoOpcional }).nullish(),
  })
  .transform((a, ctx): Analisis => {
    const base = { id: a.id, noticiaId: a.noticiaId, creado: a.creado, actualizado: a.actualizado };
    switch (a.estado) {
      case 'PENDIENTE':
        return { ...base, estado: 'PENDIENTE', estadoDetalle: a.estadoDetalle };
      case 'COMPLETADO':
        if (!a.informe) {
          ctx.addIssue({ code: 'custom', message: 'Análisis COMPLETADO sin informe' });
          return z.NEVER;
        }
        return { ...base, estado: 'COMPLETADO', informe: a.informe };
      default:
        // Regla 3: un error nunca es un resultado; se descarta cualquier informe.
        return {
          ...base,
          estado: a.estado,
          error: a.error ?? { tipo: '', etapa: '', mensaje: '' },
        };
    }
  });

export const analisisResumenEsquema: z.ZodType<AnalisisResumen> = z.object({
  analisisId: z.number(),
  noticiaId: z.number(),
  estado: estadoAnalisis,
  actualizado: z.string(),
});

// ---------- Datos guardados en el navegador ----------

export const usuarioSesionEsquema: z.ZodType<UsuarioSesion> = z.object({
  id: z.number(),
  nombres: z.string(),
  correo: z.string(),
  rol,
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
