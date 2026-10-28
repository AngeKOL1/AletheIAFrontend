import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type Variante = 'primario' | 'secundario' | 'fantasma';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
  anchoCompleto?: boolean;
  children: ReactNode;
}

const estilos: Record<Variante, string> = {
  primario:
    'bg-marca-700 text-white hover:bg-marca-800 active:bg-marca-800 disabled:bg-marca-200 disabled:text-white',
  secundario:
    'bg-superficie text-tinta border border-borde-fuerte hover:bg-papel active:bg-papel disabled:text-tinta-tenue',
  fantasma: 'bg-transparent text-marca-700 hover:bg-marca-50 disabled:text-tinta-tenue',
};

export function Button({
  variante = 'primario',
  cargando = false,
  anchoCompleto = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...resto
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={[
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed',
        estilos[variante],
        anchoCompleto ? 'w-full' : '',
        className,
      ].join(' ')}
      {...resto}
    >
      {cargando && <Spinner tamano="sm" />}
      {children}
    </button>
  );
}
