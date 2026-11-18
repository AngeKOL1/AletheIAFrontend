import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, type RouteObject } from 'react-router-dom';
import { RutaProtegida, RutaPublica, GuardiaFlujo, GuardiaPosttest } from './components/routing/Guardias';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { FeedPage } from './pages/FeedPage';
import { QuestionnairePage } from './pages/QuestionnairePage';
import { CompletedPage } from './pages/CompletedPage';
import { HomePage } from './pages/HomePage';
import { RUTAS } from './lib/constants';
import { FASES, ProveedorFase } from './lib/fases';
import type { Fase } from './types/api';

/**
 * Rutas de una fase: entrada + feed + cuestionario + completado.
 * Todas exigen sesión y pasan por GuardiaFlujo, que consulta el progreso
 * en ESA fase. `envoltura` añade requisitos propios de la fase.
 */
function rutasDeFase(fase: Fase, envoltura: (contenido: ReactNode) => ReactNode): RouteObject[] {
  const { rutas } = FASES[fase];
  const proteger = (contenido: ReactNode) => (
    <RutaProtegida>
      <ProveedorFase fase={fase}>{envoltura(contenido)}</ProveedorFase>
    </RutaProtegida>
  );
  return [
    { path: rutas.entrada, element: proteger(<GuardiaFlujo />) },
    { path: rutas.feed, element: proteger(<GuardiaFlujo paso="feed"><FeedPage /></GuardiaFlujo>) },
    {
      path: rutas.cuestionario,
      element: proteger(<GuardiaFlujo paso="cuestionario"><QuestionnairePage /></GuardiaFlujo>),
    },
    {
      path: rutas.completado,
      element: proteger(<GuardiaFlujo paso="completado"><CompletedPage /></GuardiaFlujo>),
    },
  ];
}

const router = createBrowserRouter([
  // Home pública: cualquiera la ve; el login se pide al entrar a una fase.
  { path: RUTAS.inicio, element: <HomePage /> },
  { path: '/inicio', element: <Navigate to={RUTAS.inicio} replace /> },
  {
    path: RUTAS.registro,
    element: (
      <RutaPublica>
        <RegisterPage />
      </RutaPublica>
    ),
  },
  {
    path: RUTAS.login,
    element: (
      <RutaPublica>
        <LoginPage />
      </RutaPublica>
    ),
  },

  ...rutasDeFase('PRE', (contenido) => contenido),
  // El post test exige haber completado el pretest (ver POSTTEST_REQUIERE_PRETEST).
  ...rutasDeFase('POST', (contenido) => <GuardiaPosttest>{contenido}</GuardiaPosttest>),

  // Solo en desarrollo: revisar el panel de AletheIA con informes de ejemplo, sin backend.
  // Carga diferida: en el build de producción esta rama y la demo no existen.
  ...(import.meta.env.DEV
    ? [
        {
          path: '/demo/analisis',
          lazy: async () => ({ Component: (await import('./pages/DemoAnalisisPage')).DemoAnalisisPage }),
        },
      ]
    : []),

  // Rutas antiguas del pretest (antes de separar por fase).
  { path: '/feed', element: <Navigate to={FASES.PRE.rutas.feed} replace /> },
  { path: '/cuestionario', element: <Navigate to={FASES.PRE.rutas.cuestionario} replace /> },
  { path: '/completado', element: <Navigate to={FASES.PRE.rutas.completado} replace /> },
  { path: '*', element: <Navigate to={RUTAS.inicio} replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
