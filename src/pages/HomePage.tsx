import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { participanteApi } from '../api/services';
import { mensajeDeError } from '../api/client';
import { tokenVencido, useAuthStore } from '../store/authStore';
import { Marca } from '../components/layout/AuthLayout';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import type { EstadoNavegacion } from '../components/routing/Guardias';
import { POSTTEST_REQUIERE_PRETEST, RUTAS } from '../lib/constants';
import type { EstadoParticipante } from '../types/api';

/* =========================================================================
 * Contenido del estudio
 * ========================================================================= */

const INDICADORES = [
  {
    titulo: 'Tasa de acierto',
    texto: 'De las noticias que el periodista marca como falsas, cuántas lo son realmente.',
    icono: 'diana',
  },
  {
    titulo: 'Tiempo de verificación',
    texto: 'Cuánto tarda en llegar a un dictamen sobre cada noticia.',
    icono: 'reloj',
  },
  {
    titulo: 'Clasificación de noticias',
    texto: 'Si ubica bien cada noticia en su tema o nivel de riesgo.',
    icono: 'capas',
  },
] as const;

const LOGROS = [
  {
    titulo: 'Acierten más',
    texto: 'Que menos noticias verdaderas se marquen como falsas por error.',
    icono: 'diana',
  },
  {
    titulo: 'Verifiquen en menos tiempo',
    texto: 'Que puedan revisar más contenido sin descuidar la calidad.',
    icono: 'reloj',
  },
  {
    titulo: 'Clasifiquen mejor',
    texto: 'Que identifiquen con más precisión el tema y el riesgo de cada noticia.',
    icono: 'capas',
  },
] as const;

const OPINION = ['Facilidad de uso', 'Funciones que responden a sus necesidades', 'Rapidez y estabilidad'];

/* =========================================================================
 * Íconos (trazo, heredan currentColor)
 * ========================================================================= */

type NombreIcono =
  | 'diana'
  | 'reloj'
  | 'capas'
  | 'texto'
  | 'imagen'
  | 'video'
  | 'encuesta'
  | 'ia'
  | 'flecha'
  | 'candado'
  | 'check';

const TRAZOS: Record<NombreIcono, ReactNode> = {
  diana: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  capas: <path d="m12 3.5 8.5 4.5L12 12.5 3.5 8 12 3.5Zm-8.5 8.5L12 16.5l8.5-4.5M3.5 16 12 20.5l8.5-4.5" />,
  texto: <path d="M5 6.5h14M5 10.5h14M5 14.5h14M5 18.5h9" />,
  imagen: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m20.5 15.5-4.5-4.5-8.5 8" />
    </>
  ),
  video: (
    <>
      <rect x="3.5" y="6" width="12" height="12" rx="2.5" />
      <path d="m15.5 10.5 5-3v9l-5-3" />
    </>
  ),
  encuesta: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
      <path d="M8.5 8.5h7M8.5 12.5h7M8.5 16.5h4" />
    </>
  ),
  ia: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5M10.5 7.5v1.2M10.5 12.3v1.2M7.5 10.5h1.2M12.3 10.5h1.2" />
    </>
  ),
  flecha: <path d="M5 12h13m-5-5.5 5.5 5.5-5.5 5.5" />,
  candado: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
};

function Icono({ nombre, className = 'size-6' }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {TRAZOS[nombre]}
    </svg>
  );
}

/* =========================================================================
 * Piezas de UI
 * ========================================================================= */

function Seccion({
  id,
  eyebrow,
  titulo,
  intro,
  children,
  className = '',
}: {
  id?: string;
  eyebrow: string;
  titulo: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-16 sm:py-24 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.14em] text-marca-600 uppercase">{eyebrow}</p>
        <h2 className="mt-3 max-w-3xl font-serif text-[28px] leading-tight font-semibold tracking-tight text-tinta sm:text-[40px]">
          {titulo}
        </h2>
        {intro && <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-tinta-suave sm:text-[17px]">{intro}</p>}
        <div className="mt-10 sm:mt-14">{children}</div>
      </div>
    </section>
  );
}

type TonoEtiqueta = 'neutro' | 'progreso' | 'exito' | 'bloqueado';

const TONOS: Record<TonoEtiqueta, string> = {
  neutro: 'bg-papel text-tinta-suave border-borde',
  progreso: 'bg-marca-50 text-marca-700 border-marca-100',
  exito: 'bg-exito-50 text-exito-600 border-exito-600/20',
  bloqueado: 'bg-papel text-tinta-tenue border-borde',
};

function Etiqueta({ tono, children }: { tono: TonoEtiqueta; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}

/** Tarjeta de acceso a una fase. Sin sesión, el enlace lleva al login y luego vuelve. */
function TarjetaAcceso({
  to,
  numero,
  icono,
  titulo,
  descripcion,
  etiqueta,
  accion,
  destacada,
  deshabilitada,
}: {
  to: string;
  deshabilitada?: boolean;
  numero: string;
  icono: NombreIcono;
  titulo: string;
  descripcion: string;
  etiqueta: ReactNode;
  accion: string;
  destacada?: boolean;
}) {
  const clases = `group flex h-full flex-col rounded-2xl border p-6 transition-[border-color,box-shadow,transform] sm:p-8 ${
    deshabilitada
      ? 'border-borde bg-superficie/70'
      : destacada
        ? 'border-marca-700 bg-marca-700 text-white shadow-[0_12px_32px_rgba(23,46,87,0.25)] hover:-translate-y-0.5 hover:bg-marca-800'
        : 'border-borde bg-superficie shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-marca-200 hover:shadow-[0_8px_24px_rgba(23,46,87,0.08)]'
  }`;

  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid size-12 place-items-center rounded-xl ${
            destacada ? 'bg-white/12 text-white' : 'bg-marca-50 text-marca-700'
          }`}
        >
          <Icono nombre={icono} />
        </span>
        <span className={`text-xs font-semibold tracking-[0.14em] uppercase ${destacada ? 'text-marca-100' : 'text-tinta-tenue'}`}>
          {numero}
        </span>
      </div>
      <h3 className="mt-6 font-serif text-[24px] leading-snug font-semibold tracking-tight">{titulo}</h3>
      <p className={`mt-2 flex-1 text-[15px] leading-relaxed ${destacada ? 'text-marca-100' : 'text-tinta-suave'}`}>
        {descripcion}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        {etiqueta}
        {!deshabilitada && (
          <span className={`inline-flex items-center gap-1.5 text-[15px] font-semibold ${destacada ? 'text-white' : 'text-marca-700'}`}>
            {accion}
            <Icono nombre="flecha" className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </>
  );

  if (deshabilitada)
    return (
      <div className={clases} aria-disabled="true">
        {contenido}
      </div>
    );
  return (
    <Link to={to} className={clases}>
      {contenido}
    </Link>
  );
}

/** Ilustración del hero: una noticia analizada en tres formatos. Ejemplo ficticio. */
function TarjetaAnalisis() {
  const formatos: { nombre: NombreIcono; etiqueta: string; valor: number }[] = [
    { nombre: 'texto', etiqueta: 'Texto', valor: 82 },
    { nombre: 'imagen', etiqueta: 'Imagen', valor: 64 },
    { nombre: 'video', etiqueta: 'Video', valor: 71 },
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden>
      <div className="absolute -inset-6 rounded-[28px] bg-marca-500/25 blur-2xl" />
      <div className="relative rounded-2xl border border-white/10 bg-white p-5 text-tinta shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-tinta-tenue uppercase">Noticia en revisión</span>
          <span className="flex gap-1">
            <span className="size-2 rounded-full bg-borde-fuerte" />
            <span className="size-2 rounded-full bg-borde-fuerte" />
            <span className="size-2 rounded-full bg-borde-fuerte" />
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-11/12 rounded-full bg-tinta/85" />
          <div className="h-3 w-3/4 rounded-full bg-tinta/85" />
        </div>
        <div className="mt-4 aspect-[16/8] rounded-xl bg-[linear-gradient(135deg,var(--color-marca-100),var(--color-marca-50))]" />
        <div className="mt-5 space-y-3">
          {formatos.map((f) => (
            <div key={f.nombre} className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-marca-50 text-marca-700">
                <Icono nombre={f.nombre} className="size-4" />
              </span>
              <span className="w-14 text-xs font-semibold text-tinta-suave">{f.etiqueta}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-papel">
                <span className="block h-full rounded-full bg-marca-500" style={{ width: `${f.valor}%` }} />
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl border border-borde bg-papel px-3.5 py-3">
          <span className="text-xs font-semibold text-tinta-suave">Estimación del sistema</span>
          <span className="rounded-full bg-tinta px-2.5 py-1 text-xs font-semibold text-white">¿Verdadera o falsa?</span>
        </div>
      </div>
      <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-medium text-white backdrop-blur">
        <Icono nombre="check" className="size-4 text-white" />
        El periodista decide el dictamen final
      </div>
    </div>
  );
}

/* =========================================================================
 * Estado del participante (solo con sesión)
 * ========================================================================= */

type EstadoCarga =
  | { tipo: 'sin-sesion' }
  | { tipo: 'cargando' }
  | { tipo: 'ok'; pre: EstadoParticipante }
  | { tipo: 'error'; mensaje: string };

function resumenPretest(pre: EstadoParticipante): { texto: string; tono: TonoEtiqueta; accion: string } {
  if (pre.cuestionarioCompletado) return { texto: 'Completado', tono: 'exito', accion: 'Ver estado' };
  if (pre.prediccionesRespondidas === 0) return { texto: 'Pendiente', tono: 'neutro', accion: 'Comenzar' };
  if (pre.prediccionesRespondidas < pre.totalNoticias)
    return {
      texto: `En curso · ${pre.prediccionesRespondidas}/${pre.totalNoticias}`,
      tono: 'progreso',
      accion: 'Continuar',
    };
  return { texto: 'Falta el cuestionario', tono: 'progreso', accion: 'Continuar' };
}

/* =========================================================================
 * Página
 * ========================================================================= */

export function HomePage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const usuario = useAuthStore((s) => s.usuario);
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const conSesion = !!token && !tokenVencido(token);

  const [estado, setEstado] = useState<EstadoCarga>({ tipo: conSesion ? 'cargando' : 'sin-sesion' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!conSesion) {
      setEstado({ tipo: 'sin-sesion' });
      return;
    }
    let cancelado = false;
    setEstado({ tipo: 'cargando' });
    participanteApi
      .estado('PRE')
      .then((pre) => !cancelado && setEstado({ tipo: 'ok', pre }))
      .catch((e) => !cancelado && setEstado({ tipo: 'error', mensaje: mensajeDeError(e) }));
    return () => {
      cancelado = true;
    };
  }, [conSesion, intento]);

  const salir = () => {
    cerrarSesion();
    navigate(RUTAS.inicio, { replace: true });
  };

  const primerNombre = usuario?.nombres?.split(' ')[0];
  const pretestCompleto = estado.tipo === 'ok' && estado.pre.cuestionarioCompletado;
  const resumenPre = estado.tipo === 'ok' ? resumenPretest(estado.pre) : undefined;

  // ---- Etiquetas de las tarjetas de acceso
  const etiquetaPre =
    estado.tipo === 'sin-sesion' ? (
      <Etiqueta tono="progreso">Requiere iniciar sesión</Etiqueta>
    ) : estado.tipo === 'cargando' ? (
      <Etiqueta tono="progreso">
        <Spinner tamano="sm" className="size-3 border-[1.5px]" /> Consultando…
      </Etiqueta>
    ) : resumenPre ? (
      <Etiqueta tono={resumenPre.tono}>{resumenPre.texto}</Etiqueta>
    ) : (
      <Etiqueta tono="neutro">Estado no disponible</Etiqueta>
    );

  const posttestBloqueado = POSTTEST_REQUIERE_PRETEST && !pretestCompleto;
  const etiquetaPost = posttestBloqueado ? (
    <Etiqueta tono="bloqueado">
      <Icono nombre="candado" className="size-3.5" />
      Se habilita al completar el pretest
    </Etiqueta>
  ) : (
    <Etiqueta tono="progreso">Disponible</Etiqueta>
  );

  const accionPre = !conSesion ? 'Iniciar sesión' : (resumenPre?.accion ?? 'Ingresar');
  const accionPost = !conSesion ? 'Iniciar sesión' : 'Ingresar';

  // Crear cuenta desde la Home lleva directo al pretest al terminar.
  const estadoRegistro: EstadoNavegacion = { desde: RUTAS.pretest };

  return (
    <div className="min-h-full bg-papel">
      {/* ---------------- Encabezado ---------------- */}
      <header className="sticky top-0 z-30 border-b border-borde/70 bg-papel/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link to={RUTAS.inicio} className="rounded-lg" aria-label="Inicio">
            <Marca />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-tinta-suave md:flex" aria-label="Secciones">
            <a href="#objetivo" className="hover:text-tinta">Objetivo</a>
            <a href="#como-funciona" className="hover:text-tinta">Cómo funciona</a>
            <a href="#que-medimos" className="hover:text-tinta">Qué medimos</a>
            <a href="#participa" className="hover:text-tinta">Participa</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {conSesion ? (
              <>
                <span className="hidden text-sm text-tinta-suave sm:inline">
                  Hola, <span className="font-semibold text-tinta">{primerNombre}</span>
                </span>
                <button
                  type="button"
                  onClick={salir}
                  className="min-h-10 rounded-xl px-3 text-sm font-semibold whitespace-nowrap text-marca-700 hover:bg-marca-50"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to={RUTAS.login}
                  className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap text-marca-700 hover:bg-marca-50"
                >
                  Ingresar
                </Link>
                <Link
                  to={RUTAS.registro}
                  state={estadoRegistro}
                  className="hidden min-h-10 items-center rounded-xl bg-marca-700 px-4 text-sm font-semibold whitespace-nowrap text-white hover:bg-marca-800 sm:inline-flex"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ---------------- Hero ---------------- */}
        <section
          id="objetivo"
          className="relative scroll-mt-16 overflow-hidden bg-marca-800 px-4 text-white"
        >
          {/* Retícula decorativa */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse at 30% 40%, #000 30%, transparent 75%)',
            }}
            aria-hidden
          />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold tracking-wide text-marca-100">
                <span className="size-1.5 rounded-full bg-marca-200" />
                Investigación · Periodismo regional · Cajamarca
              </p>
              <h1 className="mt-6 font-serif text-[34px] leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:text-[56px]">
                ¿Puede la inteligencia artificial ayudar a detectar noticias falsas{' '}
                <span className="text-marca-200 italic">mejor y más rápido?</span>
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-marca-100">
                Queremos determinar si un sistema de inteligencia artificial puede ayudar a los periodistas de
                Cajamarca a detectar noticias falsas mejor y más rápido.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#participa"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-marca-800 hover:bg-marca-50"
                >
                  Participar en el estudio
                  <Icono nombre="flecha" className="size-4" />
                </a>
                <a
                  href="#como-funciona"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 text-[15px] font-semibold text-white hover:bg-white/10"
                >
                  Cómo funciona
                </a>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/15 pt-8">
                {[
                  ['15', 'periodistas de medios locales'],
                  ['2', 'fases: pretest y postest'],
                  ['3', 'formatos: texto, imagen y video'],
                ].map(([n, t]) => (
                  <div key={t}>
                    <dt className="sr-only">{t}</dt>
                    <dd className="font-serif text-4xl font-semibold">{n}</dd>
                    <dd className="mt-1 text-[13px] leading-snug text-marca-100">{t}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <TarjetaAnalisis />
          </div>
        </section>

        {/* ---------------- El sistema ---------------- */}
        <Seccion
          eyebrow="La herramienta"
          titulo="Un sistema de clasificación basado en Machine Learning"
          intro="El sistema analiza noticias en texto, imagen y video y estima si son verdaderas o falsas. Después medimos cómo cambia el trabajo de verificación de los periodistas cuando lo usan."
        >
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              {
                paso: '01',
                icono: 'capas' as const,
                titulo: 'Recibe la noticia',
                texto: 'En cualquiera de sus formatos: texto, imagen o video.',
                chips: ['Texto', 'Imagen', 'Video'],
              },
              {
                paso: '02',
                icono: 'ia' as const,
                titulo: 'La analiza',
                texto: 'Un modelo de Machine Learning examina el contenido.',
              },
              {
                paso: '03',
                icono: 'check' as const,
                titulo: 'Estima su veracidad',
                texto: 'Indica si es probablemente verdadera o falsa para apoyar al periodista.',
              },
            ].map((p) => (
              <li key={p.paso} className="relative rounded-2xl border border-borde bg-superficie p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-marca-50 text-marca-700">
                    <Icono nombre={p.icono} />
                  </span>
                  <span className="font-serif text-3xl font-semibold text-borde-fuerte">{p.paso}</span>
                </div>
                <h3 className="mt-5 text-[17px] font-semibold text-tinta">{p.titulo}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-tinta-suave">{p.texto}</p>
                {p.chips && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.chips.map((c) => (
                      <span key={c} className="rounded-full bg-papel px-2.5 py-1 text-xs font-semibold text-tinta-suave">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Seccion>

        {/* ---------------- Cómo funciona ---------------- */}
        <Seccion
          id="como-funciona"
          eyebrow="Cómo funciona"
          titulo="Dos fases, los mismos periodistas"
          intro="Primero medimos cómo verifican hoy. Luego, con noticias equivalentes, medimos cómo verifican con el apoyo del sistema y comparamos."
          className="border-y border-borde bg-superficie"
        >
          <div className="relative grid gap-5 lg:grid-cols-2 lg:gap-8">
            {/* Conector entre fases (escritorio) */}
            <div
              className="absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
              aria-hidden
            >
              <span className="grid size-12 place-items-center rounded-full border border-borde bg-superficie text-marca-700 shadow-sm">
                <Icono nombre="flecha" className="size-5" />
              </span>
            </div>

            <article className="flex flex-col rounded-2xl border border-borde bg-papel p-6 sm:p-9">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-superficie text-marca-700 ring-1 ring-borde">
                  <Icono nombre="encuesta" />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-tinta-tenue uppercase">Fase 1</p>
                  <h3 className="font-serif text-[26px] leading-tight font-semibold">Pretest</h3>
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-marca-600">El punto de partida</p>

              <h4 className="mt-7 text-sm font-semibold text-tinta">¿Qué hacemos?</h4>
              <p className="mt-1.5 text-[15px] leading-relaxed text-tinta-suave">
                Antes de presentar el sistema, un grupo de <strong className="text-tinta">15 periodistas</strong> de
                medios locales de Cajamarca revisa un conjunto de noticias. Lo hacen como trabajan normalmente:
                contrastan fuentes, revisan imágenes y escuchan audios o videos por su cuenta.
              </p>

              <h4 className="mt-6 text-sm font-semibold text-tinta">¿Para qué?</h4>
              <p className="mt-1.5 text-[15px] leading-relaxed text-tinta-suave">
                Para conocer el nivel actual de detección de noticias falsas. Registramos la tasa de acierto, el tiempo
                de verificación y la clasificación de noticias.
              </p>

              <div className="mt-auto pt-8">
                <div className="rounded-xl border border-marca-100 bg-marca-50 px-4 py-3.5">
                  <p className="text-xs font-semibold tracking-[0.14em] text-marca-600 uppercase">Resultado</p>
                  <p className="mt-1 text-[15px] font-semibold text-marca-800">
                    La línea base: la referencia contra la que comparamos después.
                  </p>
                </div>
              </div>
            </article>

            <article className="flex flex-col rounded-2xl border border-marca-700 bg-marca-700 p-6 text-white sm:p-9">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-white/12 text-white">
                  <Icono nombre="ia" />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-marca-200 uppercase">Fase 2</p>
                  <h3 className="font-serif text-[26px] leading-tight font-semibold">Postest</h3>
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-marca-200">El trabajo con el sistema</p>

              <h4 className="mt-7 text-sm font-semibold">¿Qué hacemos?</h4>
              <p className="mt-1.5 text-[15px] leading-relaxed text-marca-100">
                Los mismos periodistas revisan un nuevo grupo de noticias, equivalente al primero, pero esta vez{' '}
                <strong className="text-white">con el apoyo del sistema</strong>.
              </p>

              <h4 className="mt-6 text-sm font-semibold">¿Para qué?</h4>
              <ul className="mt-2 space-y-2.5 text-[15px] leading-relaxed text-marca-100">
                <li className="flex gap-2.5">
                  <Icono nombre="check" className="mt-1 size-4 shrink-0 text-marca-200" />
                  Medir otra vez la tasa de acierto, el tiempo de verificación y la clasificación de noticias, y
                  compararlos con el pretest.
                </li>
                <li className="flex gap-2.5">
                  <Icono nombre="check" className="mt-1 size-4 shrink-0 text-marca-200" />
                  Conocer la opinión de los periodistas sobre el sistema.
                </li>
              </ul>

              <div className="mt-auto pt-8">
                <div className="rounded-xl border border-white/15 bg-white/8 px-4 py-3.5">
                  <p className="text-xs font-semibold tracking-[0.14em] text-marca-200 uppercase">Resultado</p>
                  <p className="mt-1 text-[15px] font-semibold">
                    La comparación con la línea base y la valoración del sistema.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </Seccion>

        {/* ---------------- Qué medimos ---------------- */}
        <Seccion
          id="que-medimos"
          eyebrow="Qué medimos"
          titulo="Tres indicadores, medidos en ambas fases"
          intro="Los mismos tres aspectos se registran en el pretest y en el postest, para comparar el antes y el después."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {INDICADORES.map((ind, i) => (
              <div key={ind.titulo} className="rounded-2xl border border-borde bg-superficie p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-marca-50 text-marca-700">
                    <Icono nombre={ind.icono} />
                  </span>
                  <span className="text-xs font-semibold text-tinta-tenue">Indicador {i + 1}</span>
                </div>
                <h3 className="mt-5 text-[17px] font-semibold text-tinta">{ind.titulo}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-tinta-suave">{ind.texto}</p>
                <div className="mt-5 flex gap-2">
                  <span className="rounded-full bg-papel px-2.5 py-1 text-xs font-semibold text-tinta-suave">Pretest</span>
                  <span className="rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700">Postest</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-5 rounded-2xl border border-dashed border-borde-fuerte bg-superficie/60 p-6 sm:flex-row sm:items-center sm:p-7">
            <div className="sm:w-64 sm:shrink-0">
              <span className="rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700">
                Solo en postest
              </span>
              <h3 className="mt-3 text-[17px] font-semibold text-tinta">Opinión sobre el sistema</h3>
            </div>
            <ul className="grid flex-1 gap-3 sm:grid-cols-3">
              {OPINION.map((o) => (
                <li key={o} className="flex items-start gap-2 text-[15px] leading-snug text-tinta-suave">
                  <Icono nombre="check" className="mt-0.5 size-4 shrink-0 text-marca-600" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </Seccion>

        {/* ---------------- Qué queremos lograr ---------------- */}
        <Seccion
          eyebrow="Qué queremos lograr"
          titulo="Demostrar con datos que el sistema mejora la detección de noticias falsas"
          intro="En concreto, esperamos que los periodistas de los medios de Cajamarca:"
          className="border-y border-borde bg-superficie"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {LOGROS.map((l) => (
              <div key={l.titulo} className="rounded-2xl bg-papel p-6 sm:p-7">
                <span className="grid size-11 place-items-center rounded-xl bg-marca-700 text-white">
                  <Icono nombre={l.icono} />
                </span>
                <h3 className="mt-5 font-serif text-[22px] leading-snug font-semibold text-tinta">{l.titulo}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-tinta-suave">{l.texto}</p>
              </div>
            ))}
          </div>

          <blockquote className="mt-12 border-l-4 border-marca-500 pl-5 sm:mt-16 sm:pl-8">
            <p className="max-w-3xl font-serif text-[22px] leading-snug text-tinta sm:text-[28px]">
              En pocas palabras, queremos darle al periodismo regional una herramienta práctica para que la
              información que llega a la ciudadanía sea más confiable.
            </p>
          </blockquote>
        </Seccion>

        {/* ---------------- Participa ---------------- */}
        <Seccion
          id="participa"
          eyebrow="Participa"
          titulo={conSesion && primerNombre ? `${primerNombre}, elige por dónde continuar` : 'Accede a cada fase del estudio'}
          intro={
            conSesion
              ? 'Empieza por el pretest. Al completarlo se habilita la comprobación de noticias con IA.'
              : 'Para participar necesitas una cuenta. Inicia sesión o regístrate y te llevaremos a la fase que elijas.'
          }
        >
          {estado.tipo === 'error' && (
            <Alert className="mb-6 max-w-2xl">
              {estado.mensaje}{' '}
              <button
                type="button"
                className="font-semibold underline underline-offset-2"
                onClick={() => setIntento((n) => n + 1)}
              >
                Reintentar
              </button>
            </Alert>
          )}

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <TarjetaAcceso
              to={RUTAS.pretest}
              destacada={!pretestCompleto}
              numero="Fase 1"
              icono="encuesta"
              titulo="Pretest"
              descripcion="Revisa un conjunto de noticias como lo harías normalmente, indica tu dictamen sobre cada una y responde un breve cuestionario."
              etiqueta={etiquetaPre}
              accion={accionPre}
            />
            <TarjetaAcceso
              to={RUTAS.posttest}
              destacada={pretestCompleto}
              deshabilitada={conSesion && posttestBloqueado}
              numero="Fase 2"
              icono="ia"
              titulo="Comprobación con IA"
              descripcion="Revisa un nuevo grupo de noticias con el apoyo del sistema y comparte tu opinión sobre la herramienta."
              etiqueta={etiquetaPost}
              accion={accionPost}
            />
          </div>

          {!conSesion && (
            <p className="mt-6 text-center text-sm text-tinta-suave">
              ¿Aún no tienes cuenta?{' '}
              <Link to={RUTAS.registro} state={estadoRegistro} className="font-semibold text-marca-700 hover:underline">
                Regístrate para participar
              </Link>
            </p>
          )}
        </Seccion>
      </main>

      <footer className="border-t border-borde px-4 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 text-sm text-tinta-tenue sm:flex-row sm:items-center">
          <Marca />
          <p>Investigación sobre detección de noticias falsas en medios de Cajamarca.</p>
        </div>
      </footer>
    </div>
  );
}
