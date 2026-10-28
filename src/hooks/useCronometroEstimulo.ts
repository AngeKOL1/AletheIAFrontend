import { useCallback, useEffect, useRef, type RefObject } from 'react';

const UMBRAL_VISIBILIDAD = 0.6;

/**
 * Cronómetro de exposición al estímulo (una noticia).
 *
 * Corre solo mientras se cumplen TODAS estas condiciones:
 *  - `habilitado` es true (la tarjeta es la activa y no hay overlays),
 *  - al menos el 60% del elemento está visible en pantalla,
 *  - la pestaña está visible (si el participante cambia de app, se descuenta),
 *  - no fue pausado manualmente (p. ej. mientras responde la confianza).
 */
export function useCronometroEstimulo(
  objetivoRef: RefObject<HTMLElement | null>,
  habilitado: boolean,
) {
  const acumuladoMs = useRef(0);
  const corriendoDesde = useRef<number | null>(null);
  const visibleEnPantalla = useRef(false);
  const pausadoManual = useRef(false);
  const habilitadoRef = useRef(habilitado);
  habilitadoRef.current = habilitado;

  const evaluar = useCallback(() => {
    const debeCorrer =
      habilitadoRef.current &&
      visibleEnPantalla.current &&
      !pausadoManual.current &&
      document.visibilityState === 'visible';

    if (debeCorrer && corriendoDesde.current === null) {
      corriendoDesde.current = performance.now();
    } else if (!debeCorrer && corriendoDesde.current !== null) {
      acumuladoMs.current += performance.now() - corriendoDesde.current;
      corriendoDesde.current = null;
    }
  }, []);

  // Visibilidad del elemento en el viewport.
  useEffect(() => {
    const el = objetivoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        visibleEnPantalla.current = (entrada?.intersectionRatio ?? 0) >= UMBRAL_VISIBILIDAD;
        evaluar();
      },
      { threshold: [0, UMBRAL_VISIBILIDAD, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [objetivoRef, evaluar]);

  // Visibilidad de la pestaña.
  useEffect(() => {
    document.addEventListener('visibilitychange', evaluar);
    return () => document.removeEventListener('visibilitychange', evaluar);
  }, [evaluar]);

  useEffect(() => {
    evaluar();
  }, [habilitado, evaluar]);

  const pausar = useCallback(() => {
    pausadoManual.current = true;
    evaluar();
  }, [evaluar]);

  const reanudar = useCallback(() => {
    pausadoManual.current = false;
    evaluar();
  }, [evaluar]);

  const segundos = useCallback(() => {
    const enCurso =
      corriendoDesde.current !== null ? performance.now() - corriendoDesde.current : 0;
    return (acumuladoMs.current + enCurso) / 1000;
  }, []);

  return { pausar, reanudar, segundos };
}
