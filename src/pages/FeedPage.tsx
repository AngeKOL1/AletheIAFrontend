import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriasApi, noticiasApi, prediccionesApi } from '../api/services';
import { mensajeDeError } from '../api/client';
import { FASE_ACTUAL, RUTAS } from '../lib/constants';
import type { Categoria, NoticiaFeed } from '../types/api';
import { ItemFeed } from '../components/feed/ItemFeed';
import { BarraProgreso } from '../components/ui/BarraProgreso';
import { PantallaEstado } from '../components/ui/PantallaEstado';
import { Button } from '../components/ui/Button';
import { Marca } from '../components/layout/AuthLayout';

interface NoticiaPendiente {
  noticia: NoticiaFeed;
  /** Posición en el arreglo COMPLETO (1..N), no en el filtrado. */
  orden: number;
}

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; pendientes: NoticiaPendiente[]; total: number; categorias: Categoria[] };

const reducirMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function FeedPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [indice, setIndice] = useState(0);
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false);
  const [intento, setIntento] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const primerDesplazamiento = useRef(true);

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: 'cargando' });
    Promise.all([
      noticiasApi.feed(),
      prediccionesApi.misIdsRespondidos(FASE_ACTUAL),
      categoriasApi.listar(),
    ])
      .then(([feed, idsRespondidos, categorias]) => {
        if (cancelado) return;
        const respondidas = new Set(idsRespondidos);
        const pendientes = feed
          .map((noticia, i) => ({ noticia, orden: i + 1 }))
          .filter((p) => !respondidas.has(p.noticia.id));

        if (pendientes.length === 0) {
          navigate(RUTAS.cuestionario, { replace: true });
          return;
        }
        setIndice(0);
        setMostrarInstrucciones(pendientes.length === feed.length);
        setEstado({
          tipo: 'listo',
          pendientes,
          total: feed.length,
          categorias: [...categorias].sort((a, b) => a.id - b.id),
        });
      })
      .catch((e) => {
        if (!cancelado) setEstado({ tipo: 'error', mensaje: mensajeDeError(e) });
      });
    return () => {
      cancelado = true;
    };
  }, [navigate, intento]);

  // Avance programático: el usuario no puede desplazarse libremente entre noticias.
  useLayoutEffect(() => {
    const contenedor = contenedorRef.current;
    const seccion = contenedor?.children[indice] as HTMLElement | undefined;
    if (!contenedor || !seccion) return;
    const instantaneo = primerDesplazamiento.current || reducirMovimiento();
    contenedor.scrollTo({
      top: seccion.offsetTop - contenedor.offsetTop,
      behavior: instantaneo ? 'instant' : 'smooth',
    });
    primerDesplazamiento.current = false;
  }, [indice, estado.tipo]);

  const alResponder = useCallback(() => {
    if (estado.tipo !== 'listo') return;
    if (indice + 1 >= estado.pendientes.length) {
      navigate(RUTAS.cuestionario, { replace: true });
    } else {
      setIndice((i) => i + 1);
    }
  }, [estado, indice, navigate]);

  if (estado.tipo === 'cargando') return <PantallaEstado cargando mensaje="Preparando las noticias…" />;
  if (estado.tipo === 'error')
    return <PantallaEstado error={estado.mensaje} onReintentar={() => setIntento((n) => n + 1)} />;

  const { pendientes, total, categorias } = estado;
  const actual = pendientes[indice];
  const numeroVisible = actual ? actual.orden : total;

  return (
    <div className="flex h-dvh flex-col bg-papel">
      <header className="z-10 border-b border-borde bg-superficie px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2.5">
          <div className="hidden sm:block">
            <Marca />
          </div>
          <BarraProgreso actual={numeroVisible} total={total} />
        </div>
      </header>

      {/* overflow-hidden: el avance solo ocurre al responder. */}
      <div ref={contenedorRef} className="min-h-0 flex-1 snap-y snap-mandatory overflow-hidden">
        {pendientes.map((p, i) => (
          <ItemFeed
            key={p.noticia.id}
            noticia={p.noticia}
            ordenPresentacion={p.orden}
            categorias={categorias}
            activa={i === indice}
            cronometroHabilitado={!mostrarInstrucciones}
            onRespondida={alResponder}
          />
        ))}
      </div>

      {mostrarInstrucciones && (
        <Instrucciones total={total} onComenzar={() => setMostrarInstrucciones(false)} />
      )}
    </div>
  );
}

function Instrucciones({ total, onComenzar }: { total: number; onComenzar: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-instrucciones"
      className="fixed inset-0 z-20 flex items-end justify-center bg-tinta/40 sm:items-center sm:p-6"
    >
      <div className="w-full max-w-lg rounded-t-3xl bg-superficie px-6 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl">
        <h2 id="titulo-instrucciones" className="font-serif text-2xl font-semibold tracking-tight">
          Antes de empezar
        </h2>
        <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-tinta-suave">
          <li className="flex gap-3">
            <span className="font-semibold text-marca-700">1.</span>
            <span>Verás {total} noticias, una a la vez. Léelas con atención; puedes desplazarte dentro de cada una.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-marca-700">2.</span>
            <span>Elige si la noticia te parece <b className="text-tinta">verdadera, engañosa, no verificable o falsa</b>.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-marca-700">3.</span>
            <span>Luego indica qué tan seguro(a) estás de tu respuesta, del 1 al 5.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-marca-700">4.</span>
            <span>No hay respuestas buenas ni malas: responde según tu propio criterio. Una vez respondida, no podrás volver a la noticia.</span>
          </li>
        </ol>
        <Button anchoCompleto className="mt-6" onClick={onComenzar}>
          Comenzar
        </Button>
      </div>
    </div>
  );
}
