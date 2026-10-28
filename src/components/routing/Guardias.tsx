import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, type Location } from 'react-router-dom';
import { tokenVencido, useAuthStore } from '../../store/authStore';
import { participanteApi } from '../../api/services';
import { estadoNavegacionEsquema } from '../../api/esquemas';
import { mensajeDeError } from '../../api/client';
import { FASE_ACTUAL, POSTTEST_REQUIERE_PRETEST, RUTAS, rutaSegunEstado } from '../../lib/constants';
import { PantallaEstado } from '../ui/PantallaEstado';

/** Estado que viaja hacia login/registro para volver a la fase elegida. */
export interface EstadoNavegacion {
  desde?: string;
}

/** Ruta a la que se vuelve tras iniciar sesión (por defecto, la Home). */
export function destinoTrasLogin(location: Location): string {
  const estado = estadoNavegacionEsquema.safeParse(location.state);
  if (!estado.success) return RUTAS.inicio;
  const { desde } = estado.data;
  return desde === RUTAS.login || desde === RUTAS.registro ? RUTAS.inicio : desde;
}

/** Exige sesión iniciada; si el token venció, lo invalida y manda al login. */
export function RutaProtegida({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const expirarSesion = useAuthStore((s) => s.expirarSesion);
  const vencido = token ? tokenVencido(token) : false;
  const location = useLocation();

  useEffect(() => {
    if (vencido) expirarSesion();
  }, [vencido, expirarSesion]);

  if (!token || vencido)
    return <Navigate to={RUTAS.login} replace state={{ desde: location.pathname } satisfies EstadoNavegacion} />;
  return <>{children}</>;
}

/** Solo para visitantes sin sesión (login/registro). */
export function RutaPublica({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (token && !tokenVencido(token)) return <Navigate to={destinoTrasLogin(location)} replace />;
  return <>{children}</>;
}

type Paso = 'feed' | 'cuestionario' | 'completado';

type EstadoGuardia =
  | { tipo: 'cargando' }
  | { tipo: 'ok' }
  | { tipo: 'redirigir'; a: string }
  | { tipo: 'error'; mensaje: string };

/**
 * Consulta el estado del participante y garantiza que solo pueda ver
 * la pantalla que le corresponde (no volver al feed, no repetir, etc.).
 * Si `paso` es undefined, simplemente redirige a donde corresponda.
 */
export function GuardiaFlujo({ paso, children }: { paso?: Paso; children?: ReactNode }) {
  const [estado, setEstado] = useState<EstadoGuardia>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: 'cargando' });
    participanteApi
      .estado(FASE_ACTUAL)
      .then((e) => {
        if (cancelado) return;
        const destino = rutaSegunEstado(e);
        if (!paso || destino !== RUTAS[paso]) setEstado({ tipo: 'redirigir', a: destino });
        else setEstado({ tipo: 'ok' });
      })
      .catch((err) => {
        if (!cancelado) setEstado({ tipo: 'error', mensaje: mensajeDeError(err) });
      });
    return () => {
      cancelado = true;
    };
  }, [paso, intento, location.key]);

  if (estado.tipo === 'cargando') return <PantallaEstado cargando mensaje="Verificando tu progreso…" />;
  if (estado.tipo === 'error')
    return <PantallaEstado error={estado.mensaje} onReintentar={() => setIntento((n) => n + 1)} />;
  if (estado.tipo === 'redirigir') return <Navigate to={estado.a} replace />;
  return <>{children}</>;
}

/** El posttest solo se abre cuando el pretest está completo (si así está configurado). */
export function GuardiaPosttest({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoGuardia>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!POSTTEST_REQUIERE_PRETEST) {
      setEstado({ tipo: 'ok' });
      return;
    }
    let cancelado = false;
    setEstado({ tipo: 'cargando' });
    participanteApi
      .estado('PRE')
      .then((e) => {
        if (cancelado) return;
        setEstado(e.cuestionarioCompletado ? { tipo: 'ok' } : { tipo: 'redirigir', a: RUTAS.inicio });
      })
      .catch((err) => {
        if (!cancelado) setEstado({ tipo: 'error', mensaje: mensajeDeError(err) });
      });
    return () => {
      cancelado = true;
    };
  }, [intento]);

  if (estado.tipo === 'cargando') return <PantallaEstado cargando mensaje="Verificando tu progreso…" />;
  if (estado.tipo === 'error')
    return <PantallaEstado error={estado.mensaje} onReintentar={() => setIntento((n) => n + 1)} />;
  if (estado.tipo === 'redirigir') return <Navigate to={estado.a} replace />;
  return <>{children}</>;
}
