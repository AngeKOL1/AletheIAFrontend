import type { ReactNode } from 'react';

interface Props {
  tipo?: 'error' | 'info' | 'exito';
  titulo?: string;
  children: ReactNode;
  className?: string;
}

const estilos = {
  error: 'bg-peligro-50 border-peligro-600/25 text-peligro-600',
  info: 'bg-marca-50 border-marca-200 text-marca-800',
  exito: 'bg-exito-50 border-exito-600/25 text-exito-600',
};

export function Alert({ tipo = 'error', titulo, children, className = '' }: Props) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${estilos[tipo]} ${className}`}
    >
      {titulo && <p className="mb-0.5 font-semibold">{titulo}</p>}
      <div>{children}</div>
    </div>
  );
}
