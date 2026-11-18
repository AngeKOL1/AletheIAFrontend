import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Marca } from './AuthLayout';
import { RUTAS } from '../../lib/constants';
import type { EstadoNavegacion } from '../routing/Guardias';

const SECCIONES = [
  { id: 'objetivo', texto: 'Objetivo' },
  { id: 'como-funciona', texto: 'Cómo funciona' },
  { id: 'que-medimos', texto: 'Qué medimos' },
  { id: 'participa', texto: 'Participa' },
] as const;

type IdSeccion = (typeof SECCIONES)[number]['id'];

/** Sección de la Home que está en pantalla, para resaltarla en la navegación. */
function useSeccionActiva(): IdSeccion | undefined {
  const [activa, setActiva] = useState<IdSeccion>();
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas.find((e) => e.isIntersecting);
        const seccion = SECCIONES.find((s) => s.id === visible?.target.id);
        if (seccion) setActiva(seccion.id);
      },
      // Cuenta como activa la sección que cruza la franja central de la pantalla.
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const { id } of SECCIONES) {
      const elemento = document.getElementById(id);
      if (elemento) observador.observe(elemento);
    }
    return () => observador.disconnect();
  }, []);
  return activa;
}

const BOTON_CONTORNO =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-borde-fuerte bg-superficie px-4 text-sm font-semibold whitespace-nowrap text-tinta shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-marca-200 hover:bg-marca-50 hover:text-marca-800';
// Sin clase de display: cada uso decide si es `inline-flex` o se oculta en móvil.
const BOTON_RELLENO =
  'min-h-10 items-center justify-center rounded-xl bg-marca-700 px-4 text-sm font-semibold whitespace-nowrap text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-colors hover:bg-marca-800';

function IconoMenu({ abierto }: { abierto: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      {abierto ? <path d="m5 5 10 10M15 5 5 15" /> : <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />}
    </svg>
  );
}

/**
 * Encabezado de la Home.
 * - Escritorio (lg): secciones como grupo de pestañas, con la actual resaltada.
 * - Tablet y móvil: las secciones pasan a un botón "Menú" con panel desplegable.
 * Los botones de cuenta tienen estilos distintos (contorno / relleno) para no
 * confundirse con los enlaces de sección.
 */
export function EncabezadoInicio({
  conSesion,
  primerNombre,
  onSalir,
}: {
  conSesion: boolean;
  primerNombre: string | undefined;
  onSalir: () => void;
}) {
  const activa = useSeccionActiva();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const idMenu = useId();
  const contenedorRef = useRef<HTMLDivElement>(null);
  // Crear cuenta desde la Home lleva directo al pretest al terminar.
  const estadoRegistro: EstadoNavegacion = { desde: RUTAS.pretest };

  // Cerrar el menú con Escape o al tocar fuera de él.
  useEffect(() => {
    if (!menuAbierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAbierto(false);
    const alTocar = (e: PointerEvent) => {
      if (e.target instanceof Node && !contenedorRef.current?.contains(e.target)) setMenuAbierto(false);
    };
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alTocar);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alTocar);
    };
  }, [menuAbierto]);

  return (
    <header className="sticky top-0 z-30 border-b border-borde/70 bg-papel/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div ref={contenedorRef} className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link to={RUTAS.inicio} className="shrink-0 rounded-lg" aria-label="Inicio">
          <Marca textoClassName="hidden sm:inline" />
        </Link>

        {/* Escritorio: grupo de pestañas */}
        <nav aria-label="Secciones" className="hidden lg:block">
          <ul className="flex items-center gap-1 rounded-full border border-borde bg-superficie/80 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {SECCIONES.map((s) => {
              const esActiva = activa === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    aria-current={esActiva ? 'location' : undefined}
                    className={`block rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                      esActiva ? 'bg-marca-700 text-white' : 'text-tinta-suave hover:bg-papel hover:text-tinta'
                    }`}
                  >
                    {s.texto}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {conSesion ? (
            <>
              <span className="hidden items-center gap-2 text-sm text-tinta-suave md:inline-flex">
                <span
                  className="grid size-8 place-items-center rounded-full bg-marca-50 text-sm font-semibold text-marca-700"
                  aria-hidden
                >
                  {primerNombre?.charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold whitespace-nowrap text-tinta">{primerNombre}</span>
              </span>
              <button type="button" onClick={onSalir} className={BOTON_CONTORNO}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to={RUTAS.login} className={BOTON_CONTORNO}>
                Ingresar
              </Link>
              <Link to={RUTAS.registro} state={estadoRegistro} className={`${BOTON_RELLENO} hidden sm:inline-flex`}>
                Crear cuenta
              </Link>
            </>
          )}

          {/* Tablet y móvil: botón de menú */}
          <button
            type="button"
            aria-expanded={menuAbierto}
            aria-controls={idMenu}
            onClick={() => setMenuAbierto((v) => !v)}
            className={`${BOTON_CONTORNO} px-3 lg:hidden`}
          >
            <IconoMenu abierto={menuAbierto} />
            <span className="hidden sm:inline">Menú</span>
            <span className="sr-only sm:hidden">Menú de secciones</span>
          </button>
        </div>

        {menuAbierto && (
          <nav
            id={idMenu}
            aria-label="Secciones"
            className="absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-2xl border border-borde bg-superficie p-2 shadow-[0_12px_32px_rgba(23,46,87,0.14)] lg:hidden"
          >
            <ul className="space-y-1">
              {SECCIONES.map((s) => {
                const esActiva = activa === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={() => setMenuAbierto(false)}
                      aria-current={esActiva ? 'location' : undefined}
                      className={`flex min-h-12 items-center justify-between rounded-xl px-4 text-[15px] font-semibold ${
                        esActiva ? 'bg-marca-50 text-marca-800' : 'text-tinta hover:bg-papel'
                      }`}
                    >
                      {s.texto}
                      {esActiva && <span className="size-2 rounded-full bg-marca-600" aria-hidden />}
                    </a>
                  </li>
                );
              })}
            </ul>
            {!conSesion && (
              <div className="mt-2 border-t border-borde px-2 pt-3 pb-1 sm:hidden">
                <Link
                  to={RUTAS.registro}
                  state={estadoRegistro}
                  onClick={() => setMenuAbierto(false)}
                  className={`${BOTON_RELLENO} flex min-h-12 w-full`}
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
