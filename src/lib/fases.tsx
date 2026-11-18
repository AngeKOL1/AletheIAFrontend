import { createContext, useContext, type ReactNode } from 'react';
import type { EstadoParticipante, Fase } from '../types/api';
import { RUTAS } from './constants';

/**
 * Configuración de cada fase del estudio. El pretest y el post test comparten
 * pantallas (feed, cuestionario, completado); lo que cambia es la fase que se
 * envía al backend y las rutas. La fase la decide la URL, no una constante.
 */
export interface ConfigFase {
  fase: Fase;
  nombre: string;
  /** Título de la sesión del cuestionario en el backend. */
  tituloSesion: string;
  rutas: {
    /** Entrada: redirige a feed / cuestionario / completado según el progreso. */
    entrada: string;
    feed: string;
    cuestionario: string;
    completado: string;
  };
}

const rutasDe = (base: string) => ({
  entrada: base,
  feed: `${base}/noticias`,
  cuestionario: `${base}/cuestionario`,
  completado: `${base}/completado`,
});

export const FASES: Record<Fase, ConfigFase> = {
  PRE: {
    fase: 'PRE',
    nombre: 'Pretest',
    tituloSesion: 'Cuestionario Pre',
    rutas: rutasDe(RUTAS.pretest),
  },
  POST: {
    fase: 'POST',
    nombre: 'Postest',
    tituloSesion: 'Cuestionario Post',
    rutas: rutasDe(RUTAS.posttest),
  },
};

/** Decide a qué pantalla de la fase debe ir el participante según su progreso. */
export function rutaSegunEstado(estado: EstadoParticipante, config: ConfigFase): string {
  if (estado.cuestionarioCompletado) return config.rutas.completado;
  if (estado.prediccionesRespondidas < estado.totalNoticias) return config.rutas.feed;
  return config.rutas.cuestionario;
}

const ContextoFase = createContext<ConfigFase>(FASES.PRE);

/** Define la fase de todas las pantallas que envuelve. */
export function ProveedorFase({ fase, children }: { fase: Fase; children: ReactNode }) {
  return <ContextoFase.Provider value={FASES[fase]}>{children}</ContextoFase.Provider>;
}

/** Fase de la pantalla actual. */
export function useFase(): ConfigFase {
  return useContext(ContextoFase);
}
