import { useEffect, useState, type ReactNode } from 'react';
import type { EstadoPanelAnalisis } from '../../hooks/useAnalisisNoticia';
import type {
  AfirmacionVista,
  Analisis,
  ErrorAnalisis,
  EvidenciaVista,
  InformeVista,
  ResultadoGlobal,
} from '../../types/analisis';
import { Spinner } from '../ui/Spinner';

/*
 * Presentación del análisis de AletheIA. Reglas de la guía (6.6):
 *  1. Veredicto global con su etiqueta.
 *  2. Sin veredicto → el motivo; nunca «no verificable».
 *  3. Un error nunca es un resultado: sin veredicto, solo el error.
 *  4. Limitaciones siempre que haya.
 *  5. Por afirmación: justificación y evidencias (url, fuente, fragmento) en pestaña nueva.
 *  6. Solidez de la evidencia como etiqueta: nunca porcentaje ni barra.
 *  7. Opiniones y predicciones sin veredicto.
 *  8. Texto plano (React escapa todo; nunca dangerouslySetInnerHTML).
 */

/* ------------------------------------------------------------------ */
/* Etiquetas legibles para los valores abiertos de AletheIA            */
/* ------------------------------------------------------------------ */

const ETIQUETAS: Record<string, string> = {
  // ubicación
  titular: 'Titular',
  cuerpo: 'Cuerpo',
  // tipo de afirmación
  factual: 'Factual',
  opinion: 'Opinión',
  prediccion: 'Predicción',
  // estado de afirmación
  no_procesada_por_limite: 'No procesada (límite de análisis)',
  error: 'Error al procesarla',
  // postura de la evidencia
  apoya: 'Apoya',
  contradice: 'Contradice',
  contexto_relevante: 'Contexto',
  no_relacionada: 'No relacionada',
  // estado del análisis pendiente
  en_cola: 'En cola',
  en_proceso: 'En proceso',
  // etapas y tipos de error
  extraccion: 'Extracción de afirmaciones',
  busqueda: 'Búsqueda de evidencias',
  verificacion: 'Verificación',
  error_etapa: 'Falló una etapa del análisis',
  error_interno: 'Error interno del servicio',
  tiempo_excedido: 'Se superó el tiempo máximo',
  informe_ausente: 'El servicio no entregó el informe',
  analisis_perdido: 'El servicio perdió el análisis',
};

/** Etiqueta conocida, o el valor tal cual (más legible) si AletheIA envía uno nuevo. */
function legible(valor: string): string {
  if (ETIQUETAS[valor]) return ETIQUETAS[valor];
  const texto = valor.replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Color según el valor del veredicto (no según la etiqueta, que es solo texto). */
function tonoVeredicto(valor: string): { texto: string; fondo: string } {
  switch (valor) {
    case 'verdadera':
      return { texto: 'text-exito-600', fondo: 'bg-exito-50' };
    case 'falsa':
      return { texto: 'text-peligro-600', fondo: 'bg-peligro-50' };
    case 'enganosa':
      return { texto: 'text-aviso-600', fondo: 'bg-aviso-50' };
    default:
      return { texto: 'text-tinta-suave', fondo: 'bg-papel' };
  }
}

function tonoPostura(postura: string): string {
  if (postura === 'apoya') return 'bg-exito-50 text-exito-600';
  if (postura === 'contradice') return 'bg-peligro-50 text-peligro-600';
  return 'bg-papel text-tinta-suave';
}

function formatoFecha(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime())
    ? iso
    : fecha.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

function Icono({ children, className = 'size-4' }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICONO_LUPA = (
  <>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5 5" />
  </>
);

function Chip({ children, className = 'bg-papel text-tinta-suave' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-borde bg-superficie p-5 ${className}`}>{children}</section>;
}

function BotonAnalizar({
  texto,
  onClick,
  cargando = false,
}: {
  texto: string;
  onClick: () => void;
  cargando?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-marca-700 px-5 text-[15px] font-semibold text-white hover:bg-marca-800 disabled:opacity-60"
    >
      {cargando ? <Spinner tamano="sm" /> : <Icono>{ICONO_LUPA}</Icono>}
      {texto}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Estados previos al informe                                          */
/* ------------------------------------------------------------------ */

function Presentacion({ accion, conAviso = true }: { accion: ReactNode; conAviso?: boolean }) {
  return (
    <div className="flex flex-col items-center px-2 py-8 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-marca-50 text-marca-700">
        <Icono className="size-6">{ICONO_LUPA}</Icono>
      </span>
      <h3 className="mt-4 font-serif text-xl font-semibold tracking-tight">Verificación con AletheIA</h3>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-tinta-suave">
        El sistema identifica las afirmaciones de la noticia y las contrasta con fuentes externas.
      </p>
      <div className="mt-6">{accion}</div>
      {conAviso && (
        <p className="mt-4 max-w-xs text-xs leading-relaxed text-tinta-tenue">
          Tarda de 1 a 3 minutos. Puedes seguir leyendo mientras tanto. El análisis es un apoyo: la decisión final es tuya.
        </p>
      )}
    </div>
  );
}

/** Tiempo transcurrido desde que el panel vio el análisis pendiente (reloj del navegador). */
function useSegundosDesdeMontaje(): number {
  const [inicio] = useState(() => Date.now());
  const [ahora, setAhora] = useState(inicio);
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return Math.floor((ahora - inicio) / 1000);
}

function Pendiente({ detalle, aviso }: { detalle: string; aviso?: string }) {
  const segundos = useSegundosDesdeMontaje();
  const mm = Math.floor(segundos / 60);
  const ss = String(segundos % 60).padStart(2, '0');
  return (
    <div className="px-1 py-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-marca-50 text-marca-700">
          <Spinner tamano="sm" />
        </span>
        <div>
          <p className="font-semibold text-tinta">AletheIA está analizando la noticia</p>
          <p className="text-sm text-tinta-tenue">
            {detalle ? `${legible(detalle)} · ` : ''}
            <span className="tabular-nums">
              {mm}:{ss}
            </span>
          </p>
        </div>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-borde">
        <div className="h-full w-1/3 animate-[deslizar_1.6s_ease-in-out_infinite] rounded-full bg-marca-500" />
      </div>
      <p className="mt-5 text-sm leading-relaxed text-tinta-suave">
        Suele tardar de 1 a 3 minutos. Puedes seguir leyendo la noticia: el resultado aparecerá aquí.
      </p>
      {aviso && <p className="mt-3 text-xs text-aviso-600">Problema al consultar el estado ({aviso}). Seguimos intentando.</p>}
    </div>
  );
}

function ErrorDelAnalisis({ error, perdido, onReintentar }: { error: ErrorAnalisis; perdido: boolean; onReintentar: () => void }) {
  return (
    <div className="py-6">
      <Tarjeta className="border-peligro-600/25">
        <p className="font-semibold text-peligro-600">
          {perdido ? 'El análisis se perdió' : 'El análisis no se pudo completar'}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-tinta-suave">
          {error.tipo ? legible(error.tipo) : 'Ocurrió un problema en el servicio de verificación.'}
          {error.etapa ? ` (etapa: ${legible(error.etapa)})` : ''}.
        </p>
        {error.mensaje && <p className="mt-2 text-sm text-tinta-tenue">{error.mensaje}</p>}
        <p className="mt-3 text-sm text-tinta-suave">No hay resultado para esta noticia. Puedes volver a intentarlo.</p>
        <div className="mt-4">
          <BotonAnalizar texto="Volver a intentar" onClick={onReintentar} />
        </div>
      </Tarjeta>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Informe                                                             */
/* ------------------------------------------------------------------ */

function Resultado({ resultado }: { resultado: ResultadoGlobal }) {
  if (resultado.tipo === 'sin-veredicto') {
    // Regla 2: mostrar el motivo, nunca «no verificable».
    return (
      <>
        <p className="mt-3 font-serif text-[26px] leading-tight font-semibold tracking-tight text-tinta">
          Sin veredicto
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-tinta-suave">{capitalizar(resultado.motivoEtiqueta)}</p>
      </>
    );
  }
  const tono = tonoVeredicto(resultado.valor);
  return (
    <p className="mt-3 font-serif text-[26px] leading-tight font-semibold tracking-tight">
      La noticia es <span className={tono.texto}>{resultado.etiqueta}</span>
    </p>
  );
}

function Evidencia({ evidencia }: { evidencia: EvidenciaVista }) {
  const nombreFuente = evidencia.fuente || evidencia.dominio || evidencia.url;
  return (
    <li className="rounded-xl border border-borde bg-papel/60 p-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {evidencia.postura && <Chip className={tonoPostura(evidencia.postura)}>{legible(evidencia.postura)}</Chip>}
        {evidencia.tipoFuente && <Chip>Fuente {evidencia.tipoFuente}</Chip>}
      </div>
      <a
        href={evidencia.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-sm font-semibold break-words text-marca-700 hover:underline"
      >
        {evidencia.titulo || nombreFuente}
        <span className="sr-only"> (se abre en una pestaña nueva)</span>
      </a>
      <p className="mt-0.5 text-xs text-tinta-tenue">
        {nombreFuente}
        {evidencia.fechaPublicacion ? ` · ${evidencia.fechaPublicacion}` : ''}
      </p>
      {evidencia.fragmentoRelevante && (
        <blockquote className="mt-2.5 border-l-2 border-borde-fuerte pl-3 text-sm leading-relaxed text-tinta-suave italic">
          «{evidencia.fragmentoRelevante}»
        </blockquote>
      )}
    </li>
  );
}

function EtiquetaAfirmacion({ afirmacion }: { afirmacion: AfirmacionVista }) {
  // Regla 7: opiniones y predicciones sin veredicto.
  if (!afirmacion.veredicto) return <Chip>{afirmacion.tipo ? legible(afirmacion.tipo) : 'Sin tipo'}</Chip>;
  if (afirmacion.veredicto.tipo === 'sin-veredicto') return <Chip>Sin veredicto</Chip>;
  const tono = tonoVeredicto(afirmacion.veredicto.valor);
  return <Chip className={`${tono.fondo} ${tono.texto}`}>{capitalizar(afirmacion.veredicto.etiqueta)}</Chip>;
}

function Afirmacion({ afirmacion }: { afirmacion: AfirmacionVista }) {
  const { evidencias } = afirmacion;
  return (
    <li className="rounded-2xl border border-borde bg-superficie p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <EtiquetaAfirmacion afirmacion={afirmacion} />
        {afirmacion.central && <Chip className="bg-marca-50 text-marca-700">Central</Chip>}
        {afirmacion.ubicacion && <Chip>{legible(afirmacion.ubicacion)}</Chip>}
      </div>

      <p className="mt-3 font-serif text-[17px] leading-snug text-tinta">“{afirmacion.texto}”</p>

      {afirmacion.estado && afirmacion.estado !== 'procesada' && (
        <p className="mt-2 text-xs font-medium text-aviso-600">{legible(afirmacion.estado)}</p>
      )}

      {(afirmacion.solidezEvidencia || afirmacion.tipoProblema) && (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
          {/* Regla 6: la solidez es una etiqueta, no una probabilidad. */}
          {afirmacion.solidezEvidencia && (
            <div className="flex gap-1">
              <dt className="text-tinta-tenue">Solidez de la evidencia:</dt>
              <dd className="font-semibold text-tinta">{legible(afirmacion.solidezEvidencia)}</dd>
            </div>
          )}
          {afirmacion.tipoProblema && afirmacion.tipoProblema !== 'ninguno' && (
            <div className="flex gap-1">
              <dt className="text-tinta-tenue">Problema:</dt>
              <dd className="font-semibold text-tinta">{legible(afirmacion.tipoProblema)}</dd>
            </div>
          )}
        </dl>
      )}

      {afirmacion.justificacion && (
        <p className="mt-3 text-sm leading-relaxed text-tinta-suave">{afirmacion.justificacion}</p>
      )}

      {evidencias.length > 0 && (
        <details className="group mt-4" open={afirmacion.central}>
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-marca-700 select-none">
            <Icono className="size-4 transition-transform group-open:rotate-90">
              <path d="m9 6 6 6-6 6" />
            </Icono>
            Evidencias ({evidencias.length})
          </summary>
          <ul className="mt-3 space-y-2.5">
            {evidencias.map((ev) => (
              <Evidencia key={ev.url} evidencia={ev} />
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}

function Informe({ informe }: { informe: InformeVista }) {
  // Las afirmaciones centrales primero: son las que definen el veredicto.
  const afirmaciones = [...informe.afirmaciones].sort((a, b) => Number(b.central) - Number(a.central));
  const distorsion = informe.distorsionGlobal?.detectada ? informe.distorsionGlobal : undefined;

  return (
    <div className="space-y-4 pb-2">
      <Tarjeta>
        <p className="text-xs font-semibold tracking-[0.12em] text-tinta-tenue uppercase">Resultado de AletheIA</p>
        <Resultado resultado={informe.resultado} />
        {informe.justificacionGlobal && (
          <p className="mt-3 text-[15px] leading-relaxed text-tinta-suave">{informe.justificacionGlobal}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {informe.verificacionExternaRealizada !== undefined && (
            <Chip>
              {informe.verificacionExternaRealizada ? 'Contrastado con fuentes externas' : 'Sin verificación externa'}
            </Chip>
          )}
          {informe.fechaAnalisis && <Chip>{formatoFecha(informe.fechaAnalisis)}</Chip>}
        </div>
      </Tarjeta>

      {distorsion && (
        <Tarjeta className="border-aviso-600/25 bg-aviso-50">
          <p className="text-sm font-semibold text-aviso-600">
            Distorsión detectada{distorsion.tipo ? `: ${legible(distorsion.tipo)}` : ''}
          </p>
          {distorsion.justificacion && (
            <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">{distorsion.justificacion}</p>
          )}
        </Tarjeta>
      )}

      {/* Regla 4: limitaciones siempre que haya. */}
      {informe.limitaciones.length > 0 && (
        <Tarjeta className="bg-papel">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-tinta">
            <Icono>
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 11v5m0-8h.01" />
            </Icono>
            Limitaciones del análisis
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-tinta-suave">
            {informe.limitaciones.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Tarjeta>
      )}

      {afirmaciones.length > 0 && (
        <div>
          <h4 className="px-1 text-sm font-semibold text-tinta">Afirmaciones analizadas ({afirmaciones.length})</h4>
          <ul className="mt-3 space-y-3">
            {afirmaciones.map((a) => (
              <Afirmacion key={a.id} afirmacion={a} />
            ))}
          </ul>
        </div>
      )}

      <p className="px-1 text-xs leading-relaxed text-tinta-tenue">
        AletheIA puede equivocarse. Contrasta la información y decide con tu propio criterio.
      </p>
    </div>
  );
}

function VistaAnalisis({
  analisis,
  aviso,
  onSolicitar,
}: {
  analisis: Analisis;
  aviso?: string;
  onSolicitar: () => void;
}) {
  switch (analisis.estado) {
    case 'PENDIENTE':
      return <Pendiente detalle={analisis.estadoDetalle} aviso={aviso} />;
    case 'COMPLETADO':
      return <Informe informe={analisis.informe} />;
    default:
      // Regla 3: con ERROR/PERDIDO no hay veredicto, solo el error.
      return <ErrorDelAnalisis error={analisis.error} perdido={analisis.estado === 'PERDIDO'} onReintentar={onSolicitar} />;
  }
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function PanelAnalisis({ estado, onSolicitar }: { estado: EstadoPanelAnalisis; onSolicitar: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md">
      {estado.tipo === 'consultando' && (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-tinta-suave" role="status">
          <Spinner tamano="sm" /> Consultando el análisis…
        </p>
      )}
      {estado.tipo === 'sin-solicitar' && (
        <Presentacion accion={<BotonAnalizar texto="Analizar con AletheIA" onClick={onSolicitar} />} />
      )}
      {estado.tipo === 'solicitando' && (
        <Presentacion accion={<BotonAnalizar texto="Solicitando…" onClick={onSolicitar} cargando />} />
      )}
      {estado.tipo === 'servicio-ocupado' && (
        <Presentacion
          accion={
            <p className="rounded-xl bg-aviso-50 px-4 py-3 text-sm text-aviso-600" role="status">
              AletheIA está atendiendo muchos análisis. Reintentaremos en{' '}
              <span className="font-semibold tabular-nums">{estado.segundos} s</span>.
            </p>
          }
        />
      )}
      {estado.tipo === 'no-disponible' && (
        <Presentacion
          // Si no se puede analizar (p. ej. noticia sin texto), no se promete un tiempo de espera.
          conAviso={estado.puedeReintentar}
          accion={
            <div className="flex flex-col items-center gap-4">
              <p className="rounded-xl bg-papel px-4 py-3 text-sm leading-relaxed text-tinta-suave">{estado.mensaje}</p>
              {estado.puedeReintentar && <BotonAnalizar texto="Volver a intentar" onClick={onSolicitar} />}
            </div>
          }
        />
      )}
      {estado.tipo === 'analisis' && (
        <VistaAnalisis analisis={estado.analisis} aviso={estado.avisoConsulta} onSolicitar={onSolicitar} />
      )}
    </div>
  );
}
