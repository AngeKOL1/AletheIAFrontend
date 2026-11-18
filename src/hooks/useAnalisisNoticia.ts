import { useCallback, useEffect, useRef, useState } from 'react';
import { analisisApi } from '../api/services';
import { esApiError, mensajeDeError, type ApiError } from '../api/client';
import type { NoticiaFeed } from '../types/api';
import type { Analisis } from '../types/analisis';

/** Cada cuánto se consulta un análisis PENDIENTE (guía: ~5 s). */
const INTERVALO_CONSULTA_MS = 5000;
/** Espera por defecto si AletheIA está ocupado y no indica cuánto esperar. */
const ESPERA_SERVICIO_OCUPADO_SEG = 15;

/** Todo lo que puede mostrar el panel de análisis de una noticia. */
export type EstadoPanelAnalisis =
  /** Comprobando si el participante ya lo había solicitado (p. ej. tras recargar). */
  | { tipo: 'consultando' }
  | { tipo: 'sin-solicitar' }
  | { tipo: 'solicitando' }
  /** 503: AletheIA saturado; se reintenta solo al terminar la cuenta atrás. */
  | { tipo: 'servicio-ocupado'; segundos: number }
  /** No se pudo solicitar o consultar. */
  | { tipo: 'no-disponible'; mensaje: string; puedeReintentar: boolean }
  /** Hay un análisis (pendiente, completado o con error). */
  | { tipo: 'analisis'; analisis: Analisis; avisoConsulta?: string };

/** El backend analiza la unión de entradilla, cuerpo y cierre: sin ellos responde 400. */
export function tieneTextoAnalizable(noticia: NoticiaFeed): boolean {
  return [noticia.entradilla, noticia.cuerpo, noticia.cierre].some((t) => t.trim() !== '');
}

const SIN_TEXTO: EstadoPanelAnalisis = {
  tipo: 'no-disponible',
  mensaje: 'Esta noticia no tiene texto suficiente para analizarla con el sistema.',
  puedeReintentar: false,
};

/** Traduce un error al solicitar el análisis a lo que debe ver el participante (guía 6.2). */
function estadoPorError(e: ApiError): EstadoPanelAnalisis {
  switch (e.errorType) {
    case 'VerificationServiceBusy':
      return { tipo: 'servicio-ocupado', segundos: e.reintentarEnSegundos ?? ESPERA_SERVICIO_OCUPADO_SEG };
    case 'VerificationServiceError':
      return {
        tipo: 'no-disponible',
        mensaje: 'El servicio de verificación no está disponible en este momento. Inténtalo más tarde.',
        puedeReintentar: true,
      };
    case 'InvalidState':
      return {
        tipo: 'no-disponible',
        mensaje: 'El análisis anterior falló hace poco. Inténtalo de nuevo en unos segundos.',
        puedeReintentar: true,
      };
    // 400 (sin texto) y 422 (AletheIA rechazó la noticia): reintentar no cambia nada.
    case 'InvalidArgument':
    case 'ValidationError':
      return { tipo: 'no-disponible', mensaje: e.detail, puedeReintentar: false };
    default:
      return { tipo: 'no-disponible', mensaje: e.detail, puedeReintentar: true };
  }
}

/**
 * Análisis con AletheIA de una noticia: consulta si ya existe, lo solicita y,
 * mientras está PENDIENTE, lo consulta cada 5 s. Solo trabaja mientras
 * `habilitado` es true (la noticia es la activa del feed).
 */
export function useAnalisisNoticia(noticia: NoticiaFeed, habilitado: boolean) {
  const conTexto = tieneTextoAnalizable(noticia);
  const [estado, setEstado] = useState<EstadoPanelAnalisis>(conTexto ? { tipo: 'consultando' } : SIN_TEXTO);
  const consultaInicialHecha = useRef(false);
  const solicitando = useRef(false);

  // 1. Al activarse: ¿ya lo había solicitado? (404 = no).
  useEffect(() => {
    if (!habilitado || !conTexto || consultaInicialHecha.current) return;
    consultaInicialHecha.current = true;
    let cancelado = false;
    analisisApi
      .consultar(noticia.id)
      .then((analisis) => !cancelado && setEstado({ tipo: 'analisis', analisis }))
      .catch((e) => {
        if (cancelado) return;
        if (esApiError(e) && e.status === 404) setEstado({ tipo: 'sin-solicitar' });
        else setEstado({ tipo: 'no-disponible', mensaje: mensajeDeError(e), puedeReintentar: true });
      });
    return () => {
      cancelado = true;
      // Si se desmonta antes de responder, se vuelve a consultar al reactivarse.
      consultaInicialHecha.current = false;
    };
  }, [habilitado, conTexto, noticia.id]);

  const solicitar = useCallback(async () => {
    if (solicitando.current || !conTexto) return;
    solicitando.current = true;
    setEstado({ tipo: 'solicitando' });
    try {
      setEstado({ tipo: 'analisis', analisis: await analisisApi.solicitar(noticia.id) });
    } catch (e) {
      setEstado(
        esApiError(e)
          ? estadoPorError(e)
          : { tipo: 'no-disponible', mensaje: mensajeDeError(e), puedeReintentar: true },
      );
    } finally {
      solicitando.current = false;
    }
  }, [conTexto, noticia.id]);

  // 2. Mientras esté PENDIENTE: consultar cada 5 s. Se detiene al desmontar.
  const pendiente = estado.tipo === 'analisis' && estado.analisis.estado === 'PENDIENTE';
  useEffect(() => {
    if (!habilitado || !pendiente) return;
    let cancelado = false;
    const id = window.setInterval(async () => {
      try {
        const analisis = await analisisApi.consultar(noticia.id);
        if (!cancelado) setEstado({ tipo: 'analisis', analisis });
      } catch (e) {
        // Un fallo puntual de red no detiene la consulta: se avisa y se sigue intentando.
        if (!cancelado)
          setEstado((previo) =>
            previo.tipo === 'analisis' ? { ...previo, avisoConsulta: mensajeDeError(e) } : previo,
          );
      }
    }, INTERVALO_CONSULTA_MS);
    return () => {
      cancelado = true;
      window.clearInterval(id);
    };
  }, [habilitado, pendiente, noticia.id]);

  // 3. AletheIA ocupado: cuenta atrás y reintento automático.
  const segundosOcupado = estado.tipo === 'servicio-ocupado' ? estado.segundos : undefined;
  useEffect(() => {
    if (segundosOcupado === undefined || !habilitado) return;
    const id = window.setTimeout(() => {
      if (segundosOcupado <= 1) void solicitar();
      else setEstado({ tipo: 'servicio-ocupado', segundos: segundosOcupado - 1 });
    }, 1000);
    return () => window.clearTimeout(id);
  }, [segundosOcupado, habilitado, solicitar]);

  return { estado, solicitar };
}
