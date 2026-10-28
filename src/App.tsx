import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { RutaProtegida, RutaPublica, GuardiaFlujo, GuardiaPosttest } from './components/routing/Guardias';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { FeedPage } from './pages/FeedPage';
import { QuestionnairePage } from './pages/QuestionnairePage';
import { CompletedPage } from './pages/CompletedPage';
import { HomePage } from './pages/HomePage';
import { PosttestPage } from './pages/PosttestPage';
import { RUTAS } from './lib/constants';

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
  {
    // Entrada al pretest: decide feed / cuestionario / completado.
    path: RUTAS.pretest,
    element: (
      <RutaProtegida>
        <GuardiaFlujo />
      </RutaProtegida>
    ),
  },
  {
    path: RUTAS.posttest,
    element: (
      <RutaProtegida>
        <GuardiaPosttest>
          <PosttestPage />
        </GuardiaPosttest>
      </RutaProtegida>
    ),
  },
  {
    path: RUTAS.feed,
    element: (
      <RutaProtegida>
        <GuardiaFlujo paso="feed">
          <FeedPage />
        </GuardiaFlujo>
      </RutaProtegida>
    ),
  },
  {
    path: RUTAS.cuestionario,
    element: (
      <RutaProtegida>
        <GuardiaFlujo paso="cuestionario">
          <QuestionnairePage />
        </GuardiaFlujo>
      </RutaProtegida>
    ),
  },
  {
    path: RUTAS.completado,
    element: (
      <RutaProtegida>
        <GuardiaFlujo paso="completado">
          <CompletedPage />
        </GuardiaFlujo>
      </RutaProtegida>
    ),
  },
  { path: '*', element: <Navigate to={RUTAS.inicio} replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
