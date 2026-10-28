import { Link } from 'react-router-dom';
import { Marca } from '../components/layout/AuthLayout';
import { RUTAS } from '../lib/constants';

/** Marcador temporal de la fase de comprobación con IA (se diseñará a continuación). */
export function PosttestPage() {
  return (
    <div className="flex min-h-full flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <div className="mx-auto w-full max-w-md">
        <Marca />
      </div>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 text-center">
        <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-tight">
          Comprobación con IA
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-tinta-suave">
          Esta sección estará disponible muy pronto.
        </p>
        <Link
          to={RUTAS.inicio}
          className="mx-auto mt-8 inline-flex min-h-12 items-center rounded-xl border border-borde-fuerte bg-superficie px-5 text-[15px] font-semibold text-tinta hover:bg-papel"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
