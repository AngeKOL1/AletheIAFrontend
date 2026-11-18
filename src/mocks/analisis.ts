/**
 * Datos FICTICIOS para revisar el panel de AletheIA sin backend (ruta /demo/analisis,
 * solo en desarrollo). Los informes pasan por `analisisEsquema`, igual que una
 * respuesta real, así que también comprueban la conversión de `null`.
 */
import { analisisEsquema } from '../api/esquemas';
import type { NoticiaFeed } from '../types/api';
import type { Analisis } from '../types/analisis';
import type { EstadoPanelAnalisis } from '../hooks/useAnalisisNoticia';

export const NOTICIA_DEMO: NoticiaFeed = {
  id: 9001,
  titular: 'Difunden que el agua potable de la ciudad estará cortada durante todo el mes',
  epigrafe: 'Servicios',
  subtitulo: 'Un mensaje viral asegura que el corte comenzará este lunes en todos los distritos',
  entradilla:
    'Un audio y una imagen con el supuesto logo de la empresa de agua circulan en grupos de mensajería desde el fin de semana.',
  cuerpo:
    'El mensaje indica que el servicio se suspenderá por “mantenimiento general” durante treinta días y recomienda almacenar agua de inmediato.\n\nLa imagen que acompaña el texto muestra un comunicado sin fecha ni firma, con un formato distinto al que usa habitualmente la empresa en sus canales oficiales.',
  cierre: 'Hasta el cierre de esta nota, la empresa no había publicado ningún comunicado al respecto en su web oficial.',
  img: 'https://picsum.photos/seed/agua-cajamarca/1200/675',
  fuente: 'Grupo de mensajería (reenviado)',
};

const base = {
  id: 1,
  noticiaId: NOTICIA_DEMO.id,
  creado: '2026-11-18T17:11:19.446567',
  actualizado: '2026-11-18T17:12:10.607632',
};

/** Respuesta "cruda" como la enviaría el backend (con null), validada con el esquema real. */
const desdeBackend = (crudo: object): Analisis => analisisEsquema.parse(crudo);

const COMPLETADO_FALSA = desdeBackend({
  ...base,
  estado: 'COMPLETADO',
  estadoDetalle: 'completado',
  error: null,
  informe: {
    veredictoGlobal: 'falsa',
    veredictoGlobalEtiqueta: 'falsa',
    motivoSinVeredicto: null,
    motivoSinVeredictoEtiqueta: null,
    justificacionGlobal:
      'Afirmación central falsa para la noticia: a1. Basta una afirmación central falsa para que la noticia sea falsa.',
    distorsionGlobal: {
      detectada: true,
      tipo: 'sensacionalismo',
      justificacion: 'El texto exagera la duración del corte y urge a actuar sin respaldo oficial.',
    },
    afirmaciones: [
      {
        id: 'a2',
        texto: 'Es mejor almacenar agua de inmediato antes de que sea tarde',
        ubicacion: 'cuerpo',
        tipo: 'opinion',
        central: false,
        estado: 'procesada',
        veredicto: null,
        veredictoEtiqueta: null,
        tipoProblema: null,
        solidezEvidencia: null,
        justificacion: 'Es una recomendación, no una afirmación verificable.',
        evidencias: [],
      },
      {
        id: 'a1',
        texto: 'El servicio de agua potable se suspenderá durante todo el mes en todos los distritos',
        ubicacion: 'titular',
        tipo: 'factual',
        central: true,
        estado: 'procesada',
        veredicto: 'falsa',
        veredictoEtiqueta: 'falsa',
        tipoProblema: 'error_factual',
        solidezEvidencia: 'alta',
        justificacion:
          'e1 indica que solo hay cortes programados de pocas horas en dos sectores. e2 desmiente el comunicado viral.',
        evidencias: [
          {
            url: 'https://www.example.org/comunicados/cortes-programados',
            dominio: 'example.org',
            titulo: 'Cortes programados de la semana',
            fuente: 'Empresa de agua (ejemplo)',
            fechaPublicacion: '2026-11-16',
            tipoFuente: 'primaria',
            postura: 'contradice',
            fragmentoRelevante: 'Los trabajos de mantenimiento afectarán a dos sectores durante un máximo de seis horas.',
          },
          {
            url: 'https://www.example.com/noticias/desmienten-corte-de-agua',
            dominio: 'example.com',
            titulo: 'Desmienten corte de agua de un mes',
            fuente: 'Diario regional (ejemplo)',
            fechaPublicacion: null,
            tipoFuente: 'secundaria',
            postura: 'contradice',
            fragmentoRelevante: 'La empresa calificó de falso el mensaje que circula en redes.',
          },
        ],
      },
      {
        id: 'a3',
        texto: 'Los vecinos tendrán problemas de abastecimiento durante las fiestas',
        ubicacion: 'cuerpo',
        tipo: 'prediccion',
        central: false,
        estado: 'procesada',
        veredicto: null,
        veredictoEtiqueta: null,
        tipoProblema: null,
        solidezEvidencia: null,
        justificacion: null,
        evidencias: null,
      },
      {
        id: 'a4',
        texto: 'La imagen pertenece a un comunicado oficial de la empresa',
        ubicacion: 'cuerpo',
        tipo: 'factual',
        central: false,
        estado: 'no_procesada_por_limite',
        veredicto: null,
        veredictoEtiqueta: null,
        tipoProblema: null,
        solidezEvidencia: 'nula',
        justificacion: null,
        evidencias: [],
      },
    ],
    limitaciones: ['Idioma analizado: «es». El sistema aún no se ha evaluado de forma fiable en ningún idioma.'],
    verificacionExternaRealizada: true,
    fechaAnalisis: '2026-11-18T22:11:19.495546Z',
  },
});

const COMPLETADO_SIN_VEREDICTO = desdeBackend({
  ...base,
  estado: 'COMPLETADO',
  estadoDetalle: 'completado',
  error: null,
  informe: {
    veredictoGlobal: null,
    veredictoGlobalEtiqueta: null,
    motivoSinVeredicto: 'sin_afirmaciones_factuales',
    motivoSinVeredictoEtiqueta: 'la noticia no contiene afirmaciones factuales que se puedan contrastar',
    justificacionGlobal: null,
    distorsionGlobal: null,
    afirmaciones: [],
    limitaciones: [
      'Idioma analizado: «es». El sistema aún no se ha evaluado de forma fiable en ningún idioma.',
      'No se encontraron fuentes externas sobre el tema.',
    ],
    verificacionExternaRealizada: false,
    fechaAnalisis: '2026-11-18T22:11:19.495546Z',
  },
});

const PENDIENTE = desdeBackend({ ...base, estado: 'PENDIENTE', estadoDetalle: 'en_proceso', informe: null, error: null });

const CON_ERROR = desdeBackend({
  ...base,
  estado: 'ERROR',
  estadoDetalle: 'error',
  informe: null,
  error: { tipo: 'error_etapa', etapa: 'extraccion', mensaje: 'No se pudieron extraer afirmaciones del texto.' },
});

const PERDIDO = desdeBackend({
  ...base,
  estado: 'PERDIDO',
  estadoDetalle: null,
  informe: null,
  error: { tipo: 'analisis_perdido', etapa: null, mensaje: null },
});

/** Todos los estados que puede mostrar el panel, para la página de demostración. */
export const ESTADOS_DEMO: { nombre: string; estado: EstadoPanelAnalisis }[] = [
  { nombre: 'Sin solicitar', estado: { tipo: 'sin-solicitar' } },
  { nombre: 'Pendiente', estado: { tipo: 'analisis', analisis: PENDIENTE } },
  { nombre: 'Completado: falsa', estado: { tipo: 'analisis', analisis: COMPLETADO_FALSA } },
  { nombre: 'Sin veredicto', estado: { tipo: 'analisis', analisis: COMPLETADO_SIN_VEREDICTO } },
  { nombre: 'Error', estado: { tipo: 'analisis', analisis: CON_ERROR } },
  { nombre: 'Perdido', estado: { tipo: 'analisis', analisis: PERDIDO } },
  { nombre: 'Servicio ocupado', estado: { tipo: 'servicio-ocupado', segundos: 12 } },
  {
    nombre: 'Noticia sin texto',
    estado: {
      tipo: 'no-disponible',
      mensaje: 'Esta noticia no tiene texto suficiente para analizarla con el sistema.',
      puedeReintentar: false,
    },
  },
];
