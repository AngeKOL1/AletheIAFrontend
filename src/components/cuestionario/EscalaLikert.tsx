import { useId } from 'react';
import type { OpcionEscala } from '../../lib/constants';

interface Props {
  nombre: string;
  opciones: OpcionEscala[];
  valor: string | undefined;
  onCambio: (valor: string) => void;
  etiquetaAccesible: string;
  invalido?: boolean;
}

/**
 * Escala tipo Likert accesible (radios nativos estilizados).
 * Genérica: recibe sus opciones, así sirve para 5, 7 u otras escalas.
 * Móvil: números con etiquetas en los extremos. Escritorio: etiqueta bajo cada opción.
 */
export function EscalaLikert({ nombre, opciones, valor, onCambio, etiquetaAccesible, invalido }: Props) {
  const idBase = useId();
  const seleccionada = opciones.find((o) => String(o.valor) === valor);

  return (
    <fieldset aria-invalid={invalido || undefined}>
      <legend className="sr-only">{etiquetaAccesible}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}>
        {opciones.map((o) => {
          const id = `${idBase}-${o.valor}`;
          const activo = String(o.valor) === valor;
          return (
            <div key={o.valor} className="flex flex-col items-center">
              <input
                type="radio"
                id={id}
                name={nombre}
                value={o.valor}
                checked={activo}
                onChange={() => onCambio(String(o.valor))}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                title={o.etiqueta}
                className={[
                  'grid min-h-12 w-full cursor-pointer place-items-center rounded-xl border text-[17px] font-semibold tabular-nums transition-colors',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-marca-500 peer-focus-visible:ring-offset-2',
                  activo
                    ? 'border-marca-700 bg-marca-700 text-white'
                    : 'border-borde-fuerte bg-superficie text-tinta hover:border-marca-500 hover:bg-marca-50',
                ].join(' ')}
              >
                {o.valor}
                <span className="sr-only">: {o.etiqueta}</span>
              </label>
              <span className="mt-1.5 hidden text-center text-xs leading-tight text-tinta-tenue sm:block">
                {o.etiqueta}
              </span>
            </div>
          );
        })}
      </div>
      {/* Etiquetas en móvil */}
      <div className="mt-1.5 flex justify-between gap-4 text-xs text-tinta-tenue sm:hidden">
        <span>{opciones[0]?.etiqueta}</span>
        <span className="text-right">{opciones[opciones.length - 1]?.etiqueta}</span>
      </div>
      <p className="mt-1 min-h-5 text-center text-sm font-medium text-marca-700 sm:hidden" aria-live="polite">
        {seleccionada ? seleccionada.etiqueta : ''}
      </p>
    </fieldset>
  );
}
