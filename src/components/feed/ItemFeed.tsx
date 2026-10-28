import { useRef, useState } from 'react';
import type { Categoria, NoticiaFeed } from '../../types/api';
import { prediccionesApi } from '../../api/services';
import { esApiError, mensajeDeError } from '../../api/client';
import { FASE_ACTUAL } from '../../lib/constants';
import { useCronometroEstimulo } from '../../hooks/useCronometroEstimulo';
import { NoticiaCard } from './NoticiaCard';
import { PanelVeredicto } from './PanelVeredicto';

interface Props {
  noticia: NoticiaFeed;
  /** Posición real en el arreglo completo del feed (1..20). */
  ordenPresentacion: number;
  categorias: Categoria[];
  activa: boolean;
  /** false mientras hay overlays (instrucciones) encima del feed. */
  cronometroHabilitado: boolean;
  onRespondida: () => void;
}

/** Una "pantalla" del feed: noticia + panel de respuesta + medición. */
export function ItemFeed({
  noticia,
  ordenPresentacion,
  categorias,
  activa,
  cronometroHabilitado,
  onRespondida,
}: Props) {
  const seccionRef = useRef<HTMLElement>(null);
  const cronometro = useCronometroEstimulo(seccionRef, activa && cronometroHabilitado);
  const tiempoAlElegirSeg = useRef(0);

  const [seleccion, setSeleccion] = useState<Categoria>();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  const elegirVeredicto = (c: Categoria) => {
    // El tiempo de respuesta se mide hasta el veredicto; la confianza no cuenta.
    cronometro.pausar();
    tiempoAlElegirSeg.current = cronometro.segundos();
    setError(undefined);
    setSeleccion(c);
  };

  const cambiarVeredicto = () => {
    setSeleccion(undefined);
    setError(undefined);
    cronometro.reanudar();
  };

  const elegirConfianza = async (confianza: number) => {
    if (!seleccion || enviando) return;
    setEnviando(true);
    setError(undefined);
    try {
      await prediccionesApi.registrar({
        noticiaId: noticia.id,
        categoriaElegidaId: seleccion.id,
        fase: FASE_ACTUAL,
        ordenPresentacion,
        // El backend espera un entero; mínimo 1 s para evitar ceros por redondeo.
        tiempoRespuestaSeg: Math.max(1, Math.round(tiempoAlElegirSeg.current)),
        confianzaAutopercibida: confianza,
      });
      onRespondida();
    } catch (e) {
      // 409 = ya estaba registrada (p. ej. doble toque o reintento tras corte de red).
      if (esApiError(e) && e.status === 409) {
        onRespondida();
        return;
      }
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  };

  return (
    <section
      ref={seccionRef}
      inert={!activa}
      aria-hidden={!activa || undefined}
      aria-label={`Noticia ${ordenPresentacion}`}
      className="flex h-full snap-start snap-always flex-col"
    >
      {/* El texto se lee con scroll interno; el panel queda fijo abajo. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <NoticiaCard noticia={noticia} prioridadImagen={activa} />
      </div>
      <PanelVeredicto
        categorias={categorias}
        seleccion={seleccion}
        enviando={enviando}
        error={error}
        deshabilitado={!activa}
        onElegirVeredicto={elegirVeredicto}
        onElegirConfianza={elegirConfianza}
        onCambiarVeredicto={cambiarVeredicto}
      />
    </section>
  );
}
