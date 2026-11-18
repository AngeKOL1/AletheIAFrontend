/**
 * Análisis de una noticia con AletheIA (vía `/api/analisis`).
 *
 * Sin `null`: `api/esquemas.ts` convierte la respuesta del backend a estas formas.
 * Las uniones discriminadas hacen cumplir las reglas de presentación de la guía:
 *  - Un análisis con ERROR/PERDIDO no tiene informe (un error nunca es un resultado).
 *  - "Sin veredicto" es un caso distinto de «no verificable».
 *  - Las afirmaciones que no son factuales no tienen veredicto.
 *
 * Los valores de texto de AletheIA (postura, tipo de fuente, etc.) son cadenas
 * abiertas: pueden llegar valores nuevos y se muestran tal cual.
 */

export type EstadoAnalisis = 'PENDIENTE' | 'COMPLETADO' | 'ERROR' | 'PERDIDO';

export interface EvidenciaVista {
  url: string;
  dominio: string;
  titulo: string;
  fuente: string;
  /** AAAA-MM-DD, o '' si no se conoce. */
  fechaPublicacion: string;
  /** primaria | secundaria | terciaria | '' */
  tipoFuente: string;
  /** apoya | contradice | contexto_relevante | no_relacionada | '' */
  postura: string;
  fragmentoRelevante: string;
}

/** Veredicto de una afirmación factual. */
export type VeredictoAfirmacion =
  | { tipo: 'veredicto'; valor: string; etiqueta: string }
  /** Afirmación factual que no llegó a tener veredicto (p. ej. no procesada). */
  | { tipo: 'sin-veredicto' };

export interface AfirmacionVista {
  id: string;
  texto: string;
  /** titular | cuerpo | '' */
  ubicacion: string;
  /** factual | opinion | prediccion | '' */
  tipo: string;
  central: boolean;
  /** procesada | no_procesada_por_limite | error | '' */
  estado: string;
  /** Solo las afirmaciones factuales tienen veredicto. */
  veredicto?: VeredictoAfirmacion;
  tipoProblema: string;
  /** alta | media | baja | nula | '' — es una etiqueta, NO un porcentaje. */
  solidezEvidencia: string;
  justificacion: string;
  evidencias: EvidenciaVista[];
}

/** Resultado global: o hay veredicto, o hay un motivo por el que no lo hay. */
export type ResultadoGlobal =
  | { tipo: 'veredicto'; valor: string; etiqueta: string }
  | { tipo: 'sin-veredicto'; motivo: string; motivoEtiqueta: string };

export interface DistorsionGlobal {
  detectada: boolean;
  tipo: string;
  justificacion: string;
}

export interface InformeVista {
  resultado: ResultadoGlobal;
  justificacionGlobal: string;
  distorsionGlobal?: DistorsionGlobal;
  afirmaciones: AfirmacionVista[];
  limitaciones: string[];
  /** Ausente si AletheIA no lo informa. */
  verificacionExternaRealizada?: boolean;
  /** ISO con zona UTC. */
  fechaAnalisis?: string;
}

export interface ErrorAnalisis {
  /** error_etapa | error_interno | tiempo_excedido | informe_ausente | analisis_perdido | '' */
  tipo: string;
  etapa: string;
  mensaje: string;
}

interface AnalisisBase {
  id: number;
  noticiaId: number;
  /** Hora local del servidor, sin zona. */
  creado: string;
  actualizado: string;
}

export type Analisis = AnalisisBase &
  (
    | { estado: 'PENDIENTE'; /** en_cola | en_proceso | '' */ estadoDetalle: string }
    | { estado: 'COMPLETADO'; informe: InformeVista }
    | { estado: 'ERROR' | 'PERDIDO'; error: ErrorAnalisis }
  );

export interface AnalisisResumen {
  analisisId: number;
  noticiaId: number;
  estado: EstadoAnalisis;
  actualizado: string;
}
