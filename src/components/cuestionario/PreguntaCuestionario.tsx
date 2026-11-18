import type { ComponentType } from 'react';
import type { ItemCuestionario, TipoRespuesta } from '../../types/api';
import { ESCALA_LIKERT_5 } from '../../lib/constants';
import { EscalaLikert } from './EscalaLikert';

export interface PropsRespuesta {
  item: ItemCuestionario;
  valor: string | undefined;
  onCambio: (valor: string) => void;
  invalido: boolean;
}

function RespuestaLikert5({ item, valor, onCambio, invalido }: PropsRespuesta) {
  return (
    <EscalaLikert
      nombre={`item-${item.id}`}
      opciones={ESCALA_LIKERT_5}
      valor={valor}
      onCambio={onCambio}
      etiquetaAccesible={item.contenido}
      invalido={invalido}
    />
  );
}

function RespuestaTextoLibre({ item, valor, onCambio, invalido }: PropsRespuesta) {
  return (
    <textarea
      aria-label={item.contenido}
      value={valor ?? ''}
      onChange={(e) => onCambio(e.target.value)}
      rows={3}
      className={`block w-full rounded-xl border bg-superficie px-4 py-3 text-[16px] focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30 focus:outline-none ${invalido ? 'border-peligro-600' : 'border-borde-fuerte'}`}
    />
  );
}

/**
 * Registro de tipos de respuesta. Para soportar un tipo nuevo (p. ej. "likert_7"),
 * crea su componente y agrégalo aquí; el resto del cuestionario no cambia.
 */
const RENDERIZADORES: Record<TipoRespuesta, ComponentType<PropsRespuesta>> = {
  likert_5: RespuestaLikert5,
  texto: RespuestaTextoLibre,
};

export function PreguntaCuestionario(props: PropsRespuesta & { numero: number }) {
  const { item, numero, invalido } = props;
  const Renderizador = RENDERIZADORES[item.tipoRespuesta];

  return (
    <div
      id={`pregunta-${item.id}`}
      className={`scroll-mt-28 rounded-2xl border bg-superficie p-4 sm:p-5 ${invalido ? 'border-peligro-600/60 ring-1 ring-peligro-600/30' : 'border-borde'}`}
    >
      <p className="mb-4 text-[16px] leading-relaxed text-tinta">
        <span className="mr-2 font-semibold tabular-nums text-marca-700">{numero}.</span>
        {item.contenido}
      </p>
      <Renderizador {...props} />
      {invalido && <p className="mt-2 text-sm text-peligro-600">Responde este ítem para continuar.</p>}
    </div>
  );
}
