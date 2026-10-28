import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cuestionarioApi } from '../api/services';
import { esApiError, mensajeDeError } from '../api/client';
import {
  ESCALA_LIKERT_5,
  FASE_ACTUAL,
  INSTRUCCION_CUESTIONARIO,
  ITEMS_POR_PAGINA,
  RUTAS,
  TITULO_SESION_CUESTIONARIO,
} from '../lib/constants';
import type { ItemCuestionario, SesionTest } from '../types/api';
import { PreguntaCuestionario } from '../components/cuestionario/PreguntaCuestionario';
import { BarraProgreso } from '../components/ui/BarraProgreso';
import { PantallaEstado } from '../components/ui/PantallaEstado';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Marca } from '../components/layout/AuthLayout';

type Respuestas = Record<number, string>;

const claveBorrador = (sesionId: number) => `pretest-cuestionario-borrador-${sesionId}`;

function leerBorrador(sesionId: number): Respuestas {
  try {
    const crudo = localStorage.getItem(claveBorrador(sesionId));
    return crudo ? (JSON.parse(crudo) as Respuestas) : {};
  } catch {
    return {};
  }
}

function guardarBorrador(sesionId: number, r: Respuestas) {
  try {
    localStorage.setItem(claveBorrador(sesionId), JSON.stringify(r));
  } catch {
    /* almacenamiento no disponible: el borrador es solo una comodidad */
  }
}

function borrarBorrador(sesionId: number) {
  try {
    localStorage.removeItem(claveBorrador(sesionId));
  } catch {
    /* noop */
  }
}

export function QuestionnairePage() {
  const navigate = useNavigate();
  const [sesion, setSesion] = useState<SesionTest | null>(null);
  const [items, setItems] = useState<ItemCuestionario[]>([]);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [faltantes, setFaltantes] = useState<Set<number>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const loteEnviado = useRef(false);
  const topeRef = useRef<HTMLDivElement>(null);

  // Inicia (o recupera) la sesión y carga los ítems.
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setErrorCarga(null);
    Promise.all([
      cuestionarioApi.iniciarSesion(FASE_ACTUAL, TITULO_SESION_CUESTIONARIO),
      cuestionarioApi.items(),
    ])
      .then(([s, its]) => {
        if (cancelado) return;
        setSesion(s);
        setItems([...its].sort((a, b) => a.orden - b.orden));
        setRespuestas(leerBorrador(s.id));
        setCargando(false);
      })
      .catch((e) => {
        if (cancelado) return;
        // 409: la sesión ya fue finalizada → ya completó el pre test.
        if (esApiError(e) && e.status === 409) {
          navigate(RUTAS.completado, { replace: true });
          return;
        }
        setErrorCarga(mensajeDeError(e));
        setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [navigate, intento]);

  useEffect(() => {
    if (sesion) guardarBorrador(sesion.id, respuestas);
  }, [sesion, respuestas]);

  const totalPaginas = Math.max(1, Math.ceil(items.length / ITEMS_POR_PAGINA));
  const itemsPagina = useMemo(
    () => items.slice(pagina * ITEMS_POR_PAGINA, (pagina + 1) * ITEMS_POR_PAGINA),
    [items, pagina],
  );
  const respondidas = items.filter((it) => respuestas[it.id]?.trim()).length;
  const esUltimaPagina = pagina === totalPaginas - 1;

  const responder = (itemId: number, valor: string) => {
    setRespuestas((r) => ({ ...r, [itemId]: valor }));
    setFaltantes((f) => {
      if (!f.has(itemId)) return f;
      const n = new Set(f);
      n.delete(itemId);
      return n;
    });
  };

  /** Marca los ítems sin responder y lleva la vista al primero. */
  const validar = (lista: ItemCuestionario[]) => {
    const sinResponder = lista.filter((it) => !respuestas[it.id]?.trim()).map((it) => it.id);
    setFaltantes(new Set(sinResponder));
    const primero = sinResponder[0];
    if (primero !== undefined) {
      document.getElementById(`pregunta-${primero}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return false;
    }
    return true;
  };

  const siguiente = () => {
    if (!validar(itemsPagina)) return;
    setPagina((p) => p + 1);
    topeRef.current?.scrollIntoView({ block: 'start' });
  };

  const anterior = () => {
    setFaltantes(new Set());
    setPagina((p) => Math.max(0, p - 1));
    topeRef.current?.scrollIntoView({ block: 'start' });
  };

  const enviar = async () => {
    if (!sesion || enviando) return;
    if (!validar(itemsPagina)) return;
    // Validación global por si algún ítem de páginas anteriores quedó vacío.
    const sinResponder = items.findIndex((it) => !respuestas[it.id]?.trim());
    if (sinResponder !== -1) {
      setPagina(Math.floor(sinResponder / ITEMS_POR_PAGINA));
      setErrorEnvio('Hay ítems sin responder. Revisa los marcados en rojo.');
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);
    try {
      if (!loteEnviado.current) {
        try {
          await cuestionarioApi.enviarLote({
            sesionTestId: sesion.id,
            respuestas: items.map((it) => ({ itemCuestionarioId: it.id, respuesta: respuestas[it.id]! })),
          });
        } catch (e) {
          // 409 en el lote = ya se guardaron antes (reintento tras un corte).
          if (!(esApiError(e) && e.status === 409)) throw e;
        }
        loteEnviado.current = true;
      }
      try {
        await cuestionarioApi.finalizarSesion(sesion.id);
      } catch (e) {
        if (!(esApiError(e) && e.status === 409)) throw e;
      }
      borrarBorrador(sesion.id);
      navigate(RUTAS.completado, { replace: true });
    } catch (e) {
      setErrorEnvio(mensajeDeError(e));
      setEnviando(false);
    }
  };

  if (cargando) return <PantallaEstado cargando mensaje="Cargando el cuestionario…" />;
  if (errorCarga)
    return <PantallaEstado error={errorCarga} onReintentar={() => setIntento((n) => n + 1)} />;
  if (items.length === 0)
    return <PantallaEstado error="El cuestionario no tiene preguntas configuradas. Avisa al equipo de investigación." />;

  return (
    <div className="min-h-full bg-papel">
      <header className="sticky top-0 z-10 border-b border-borde bg-superficie/95 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2.5">
          <div className="hidden sm:block">
            <Marca />
          </div>
          <BarraProgreso actual={respondidas} total={items.length} etiqueta="Ítems respondidos" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div ref={topeRef} className="scroll-mt-32" />
        <p className="text-sm font-medium text-marca-600">
          Página {pagina + 1} de {totalPaginas}
        </p>
        <h1 className="mt-1 font-serif text-[26px] leading-tight font-semibold tracking-tight">
          Cuestionario de percepciones
        </h1>

        <section className="mt-4 rounded-2xl border border-borde bg-superficie p-4 sm:p-5">
          <p className="text-[15px] leading-relaxed text-tinta">{INSTRUCCION_CUESTIONARIO}</p>
          <dl className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {ESCALA_LIKERT_5.map((o) => (
              <div key={o.valor} className="flex items-center gap-2.5">
                <dt className="grid size-6 shrink-0 place-items-center rounded-md bg-marca-50 font-semibold tabular-nums text-marca-700">
                  {o.valor}
                </dt>
                <dd className="text-tinta-suave">{o.etiqueta}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-5 space-y-4">
          {itemsPagina.map((item, i) => (
            <PreguntaCuestionario
              key={item.id}
              item={item}
              numero={pagina * ITEMS_POR_PAGINA + i + 1}
              valor={respuestas[item.id]}
              onCambio={(v) => responder(item.id, v)}
              invalido={faltantes.has(item.id)}
            />
          ))}
        </div>

        {errorEnvio && <Alert className="mt-5">{errorEnvio}</Alert>}

        <div className="mt-6 flex gap-3">
          {pagina > 0 && (
            <Button variante="secundario" onClick={anterior} disabled={enviando} className="flex-1 sm:flex-none">
              Anterior
            </Button>
          )}
          {esUltimaPagina ? (
            <Button onClick={enviar} cargando={enviando} className="flex-1">
              Enviar respuestas
            </Button>
          ) : (
            <Button onClick={siguiente} className="flex-1">
              Siguiente
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
