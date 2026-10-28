import type { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { Button } from './Button';

/** Estado de pantalla completa: cargando o error con reintento. */
export function PantallaEstado({
  cargando,
  error,
  onReintentar,
  mensaje = 'Cargando…',
}: {
  cargando?: boolean;
  error?: string;
  onReintentar?: () => void;
  mensaje?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      {cargando && (
        <>
          <Spinner tamano="lg" className="text-marca-600" />
          <p className="text-sm text-tinta-suave">{mensaje}</p>
        </>
      )}
      {!cargando && error && (
        <>
          <p className="max-w-sm text-[15px] leading-relaxed text-tinta-suave">{error}</p>
          {onReintentar && (
            <Button variante="secundario" onClick={onReintentar}>
              Reintentar
            </Button>
          )}
        </>
      )}
    </div>
  );
}
