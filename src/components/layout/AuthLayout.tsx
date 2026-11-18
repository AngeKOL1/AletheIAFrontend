import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP_NOMBRE, RUTAS } from '../../lib/constants';

/** Logo + nombre del estudio. `textoClassName` permite ocultar el nombre en pantallas angostas. */
export function Marca({ textoClassName = '' }: { textoClassName?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-marca-700" aria-hidden>
        <svg viewBox="0 0 32 32" className="size-5">
          <path d="M8 10h16M8 16h16M8 22h10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className={`text-[15px] font-semibold tracking-tight whitespace-nowrap text-tinta ${textoClassName}`}>
        {APP_NOMBRE}
      </span>
    </div>
  );
}

/** Layout para login y registro: tarjeta centrada, cómoda en móvil. */
export function AuthLayout({
  titulo,
  subtitulo,
  children,
  pie,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <div className="min-h-full px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-8">
          <Link to={RUTAS.inicio} className="inline-block rounded-lg" aria-label="Ir al inicio">
            <Marca />
          </Link>
        </header>
        <main>
          <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-tight text-tinta sm:text-3xl">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="mt-2 text-[15px] leading-relaxed text-tinta-suave">{subtitulo}</p>
          )}
          <div className="mt-7 rounded-2xl border border-borde bg-superficie p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-7">
            {children}
          </div>
          {pie && <div className="mt-6 text-center text-sm text-tinta-suave">{pie}</div>}
        </main>
      </div>
    </div>
  );
}
