import type { EstadoParticipante, NombreCategoria } from '../types/api';

export const FASE_ACTUAL = 'PRE' as const;
export const TITULO_SESION_CUESTIONARIO = 'Cuestionario Pre';
export const APP_NOMBRE = 'Estudio sobre noticias en línea';

/** Si es true, el posttest solo se habilita tras completar el pretest. */
export const POSTTEST_REQUIERE_PRETEST = true;

export const RUTAS = {
  registro: '/registro',
  login: '/login',
  /** Home pública: explica el estudio y da acceso a pretest y posttest. */
  inicio: '/',
  /** Entrada al pretest: redirige a feed / cuestionario / completado. */
  pretest: '/pretest',
  /** Comprobación de noticias con IA (fase POST). */
  posttest: '/posttest',
  feed: '/feed',
  cuestionario: '/cuestionario',
  completado: '/completado',
} as const;

/** Decide a qué pantalla debe ir el participante según su progreso. */
export function rutaSegunEstado(estado: EstadoParticipante): string {
  if (estado.cuestionarioCompletado) return RUTAS.completado;
  if (estado.prediccionesRespondidas < estado.totalNoticias) return RUTAS.feed;
  return RUTAS.cuestionario;
}

/** Etiquetas visibles de las categorías de veredicto. */
export const ETIQUETA_CATEGORIA: Record<NombreCategoria, string> = {
  VERDADERA: 'Verdadera',
  ENGANOSA: 'Engañosa',
  NO_VERIFICABLE: 'No verificable',
  FALSA: 'Falsa',
};

export interface OpcionEscala {
  valor: number;
  etiqueta: string;
}

/** Escala del instrumento validado (cuestionario de percepciones). */
export const ESCALA_LIKERT_5: OpcionEscala[] = [
  { valor: 1, etiqueta: 'Muy en desacuerdo' },
  { valor: 2, etiqueta: 'En desacuerdo' },
  { valor: 3, etiqueta: 'Ni de acuerdo ni en desacuerdo' },
  { valor: 4, etiqueta: 'De acuerdo' },
  { valor: 5, etiqueta: 'Muy de acuerdo' },
];

export const INSTRUCCION_CUESTIONARIO =
  'Marque con una (X) la valoración que corresponda en cada ítem, según la siguiente escala:';

/** Escala de confianza autopercibida tras cada veredicto. */
export const ESCALA_CONFIANZA: OpcionEscala[] = [
  { valor: 1, etiqueta: 'Nada seguro(a)' },
  { valor: 2, etiqueta: 'Poco seguro(a)' },
  { valor: 3, etiqueta: 'Medianamente seguro(a)' },
  { valor: 4, etiqueta: 'Bastante seguro(a)' },
  { valor: 5, etiqueta: 'Totalmente seguro(a)' },
];

export const ITEMS_POR_PAGINA = 5;

// ---------- Opciones del registro (ajustar a los valores que espera el backend) ----------

export const OPCIONES_GENERO = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo'];

export const OPCIONES_NIVEL_EDUCATIVO = [
  'Secundaria completa',
  'Técnico superior',
  'Universitario en curso',
  'Universitario completo',
  'Posgrado',
];

export const OPCIONES_FRECUENCIA_NOTICIAS = [
  'Varias veces al día',
  'Una vez al día',
  'Varias veces por semana',
  'Una vez por semana',
  'Casi nunca',
];

export const EDAD_MINIMA = 18;
export const EDAD_MAXIMA = 99;
