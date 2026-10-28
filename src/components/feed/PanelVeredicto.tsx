import type { Categoria } from '../../types/api';
import { ESCALA_CONFIANZA, ETIQUETA_CATEGORIA } from '../../lib/constants';
import { Spinner } from '../ui/Spinner';

interface Props {
  categorias: Categoria[];
  seleccion: Categoria | null;
  enviando: boolean;
  error: string | null;
  deshabilitado: boolean;
  onElegirVeredicto: (c: Categoria) => void;
  onElegirConfianza: (valor: number) => void;
  onCambiarVeredicto: () => void;
}

/**
 * Panel inferior: paso 1 = veredicto (4 botones), paso 2 = confianza (1–5).
 * Los 4 veredictos tienen el MISMO estilo a propósito: colores como verde/rojo
 * podrían inducir respuestas (efecto de priming).
 */
export function PanelVeredicto({
  categorias,
  seleccion,
  enviando,
  error,
  deshabilitado,
  onElegirVeredicto,
  onElegirConfianza,
  onCambiarVeredicto,
}: Props) {
  return (
    <div className="border-t border-borde bg-superficie/95 px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-superficie/85">
      <div className="mx-auto w-full max-w-2xl">
        {!seleccion ? (
          <>
            <p className="mb-2.5 text-sm font-medium text-tinta-suave">
              ¿Cómo calificarías esta noticia?
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => onElegirVeredicto(c)}
                  className="min-h-12 rounded-xl border border-borde-fuerte bg-superficie px-3 text-[15px] font-semibold text-tinta transition-colors hover:border-marca-500 hover:bg-marca-50 active:bg-marca-100 disabled:opacity-50"
                >
                  {ETIQUETA_CATEGORIA[c.nombre] ?? c.nombre}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <p className="text-sm text-tinta-suave">
                Elegiste{' '}
                <span className="font-semibold text-tinta">
                  {ETIQUETA_CATEGORIA[seleccion.nombre] ?? seleccion.nombre}
                </span>
                . ¿Qué tan seguro(a) estás?
              </p>
              <button
                type="button"
                onClick={onCambiarVeredicto}
                disabled={enviando}
                className="shrink-0 text-sm font-medium text-marca-600 underline-offset-2 hover:underline disabled:opacity-50"
              >
                Cambiar
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2" role="group" aria-label="Nivel de seguridad de 1 a 5">
              {ESCALA_CONFIANZA.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  disabled={enviando}
                  onClick={() => onElegirConfianza(o.valor)}
                  aria-label={`${o.valor}: ${o.etiqueta}`}
                  title={o.etiqueta}
                  className="min-h-12 rounded-xl border border-borde-fuerte bg-superficie text-[17px] font-semibold tabular-nums text-tinta transition-colors hover:border-marca-500 hover:bg-marca-50 active:bg-marca-100 disabled:opacity-50"
                >
                  {o.valor}
                </button>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-tinta-tenue">
              <span>{ESCALA_CONFIANZA[0]?.etiqueta}</span>
              <span>{ESCALA_CONFIANZA[ESCALA_CONFIANZA.length - 1]?.etiqueta}</span>
            </div>
          </div>
        )}

        {enviando && (
          <p className="mt-2.5 flex items-center gap-2 text-sm text-tinta-suave">
            <Spinner tamano="sm" /> Guardando respuesta…
          </p>
        )}
        {error && !enviando && (
          <p role="alert" className="mt-2.5 text-sm text-peligro-600">
            {error} Toca nuevamente tu nivel de seguridad para reintentar.
          </p>
        )}
      </div>
    </div>
  );
}
