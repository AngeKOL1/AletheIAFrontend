interface Props {
  actual: number;
  total: number;
  etiqueta?: string;
}

/** Barra de progreso discreta con contador "7/20". */
export function BarraProgreso({ actual, total, etiqueta = 'Noticia' }: Props) {
  const porcentaje = total > 0 ? Math.min(100, (actual / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-borde"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={actual}
        aria-label={`${etiqueta} ${actual} de ${total}`}
      >
        <div className="h-full rounded-full bg-marca-600" style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="min-w-12 text-right text-sm font-semibold tabular-nums text-tinta">
        {actual}
        <span className="font-normal text-tinta-tenue">/{total}</span>
      </span>
    </div>
  );
}
