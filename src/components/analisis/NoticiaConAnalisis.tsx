import { useState, type ReactNode } from 'react';
import type { NoticiaFeed } from '../../types/api';
import { useAnalisisNoticia, type EstadoPanelAnalisis } from '../../hooks/useAnalisisNoticia';
import { NoticiaCard } from '../feed/NoticiaCard';
import { PanelAnalisis } from './PanelAnalisis';

type Vista = 'noticia' | 'analisis';

/** Resumen del panel para la pestaña móvil y el atajo bajo la noticia. */
function resumen(estado: EstadoPanelAnalisis): 'inicial' | 'en-curso' | 'listo' {
  if (estado.tipo !== 'analisis') return estado.tipo === 'solicitando' ? 'en-curso' : 'inicial';
  return estado.analisis.estado === 'PENDIENTE' ? 'en-curso' : 'listo';
}

/**
 * Disposición del post test: la noticia y el análisis de AletheIA.
 * - Escritorio (lg): noticia a la izquierda, análisis a la derecha.
 * - Móvil: pestañas "Noticia" / "Análisis".
 * Es puramente visual: recibe el estado del análisis ya resuelto.
 */
export function DisposicionNoticiaAnalisis({
  noticia,
  prioridadImagen,
  estado,
  onSolicitar,
}: {
  noticia: NoticiaFeed;
  prioridadImagen: boolean;
  estado: EstadoPanelAnalisis;
  onSolicitar: () => void;
}) {
  const [vista, setVista] = useState<Vista>('noticia');
  const fase = resumen(estado);
  const puedeSolicitar = estado.tipo === 'sin-solicitar';

  const pestanas: [Vista, string, ReactNode][] = [
    ['noticia', 'Noticia', undefined],
    [
      'analisis',
      'Análisis',
      fase === 'en-curso' ? (
        <span className="size-1.5 animate-pulse rounded-full bg-aviso-600" aria-label="(en curso)" />
      ) : fase === 'listo' ? (
        <span className="size-1.5 rounded-full bg-marca-600" aria-label="(listo)" />
      ) : undefined,
    ],
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-borde bg-superficie px-4 lg:hidden" role="tablist" aria-label="Contenido">
        <div className="mx-auto grid max-w-2xl grid-cols-2">
          {pestanas.map(([valor, texto, indicador]) => (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={vista === valor}
              onClick={() => setVista(valor)}
              className={`relative flex min-h-11 items-center justify-center gap-2 text-sm font-semibold ${
                vista === valor ? 'text-marca-700' : 'text-tinta-tenue'
              }`}
            >
              {texto}
              {indicador}
              {vista === valor && <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-marca-700" />}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className={`h-full overflow-y-auto overscroll-contain ${vista === 'noticia' ? 'block' : 'hidden'} lg:block`}>
          <NoticiaCard noticia={noticia} prioridadImagen={prioridadImagen} />
          {/* Atajo al análisis desde la noticia (móvil). */}
          <div className="px-5 pb-6 lg:hidden">
            <button
              type="button"
              onClick={() => {
                if (puedeSolicitar) onSolicitar();
                setVista('analisis');
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-marca-200 bg-marca-50 px-4 py-3.5 text-left"
            >
              <span>
                <span className="block text-sm font-semibold text-marca-800">
                  {puedeSolicitar ? 'Analizar con AletheIA' : fase === 'en-curso' ? 'Ver avance del análisis' : 'Ver análisis'}
                </span>
                <span className="block text-xs text-marca-700">Apoyo del sistema para verificar esta noticia</span>
              </span>
              <svg viewBox="0 0 20 20" className="size-5 text-marca-700" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 10h11m-4-4.5L15.5 10 11 14.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <aside
          aria-label="Análisis de AletheIA"
          className={`h-full overflow-y-auto overscroll-contain bg-papel px-4 pt-4 pb-6 lg:border-l lg:border-borde lg:px-6 lg:pt-6 ${
            vista === 'analisis' ? 'block' : 'hidden'
          } lg:block`}
        >
          <PanelAnalisis estado={estado} onSolicitar={onSolicitar} />
        </aside>
      </div>
    </div>
  );
}

/** Noticia + análisis conectado al backend. Solo consulta mientras la noticia está activa. */
export function NoticiaConAnalisis({ noticia, activa }: { noticia: NoticiaFeed; activa: boolean }) {
  const { estado, solicitar } = useAnalisisNoticia(noticia, activa);
  return (
    <DisposicionNoticiaAnalisis
      noticia={noticia}
      prioridadImagen={activa}
      estado={estado}
      onSolicitar={() => void solicitar()}
    />
  );
}
