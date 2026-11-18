import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Marca } from '../components/layout/AuthLayout';
import { RUTAS } from '../lib/constants';
import { useFase } from '../lib/fases';

export function CompletedPage() {
  const navigate = useNavigate();
  const { fase } = useFase();
  const usuario = useAuthStore((s) => s.usuario);
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);

  const salir = () => {
    cerrarSesion();
    navigate(RUTAS.login, { replace: true });
  };

  return (
    <div className="flex min-h-full flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <div className="mx-auto w-full max-w-md">
        <Marca />
      </div>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-exito-50" aria-hidden>
          <svg viewBox="0 0 24 24" className="size-8 text-exito-600" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="mt-6 font-serif text-[28px] leading-tight font-semibold tracking-tight">
          ¡Gracias{usuario?.nombres ? `, ${usuario.nombres.split(' ')[0]}` : ''}!
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-tinta-suave">
          Completaste el {fase === 'PRE' ? 'pretest' : 'postest'}. Tus respuestas quedaron registradas
          correctamente. Tu participación es muy valiosa para esta investigación.
        </p>
        <p className="mt-3 text-sm text-tinta-tenue">
          {fase === 'PRE'
            ? 'Desde el inicio puedes continuar con la comprobación de noticias con IA.'
            : 'Has terminado las dos fases del estudio. Ya puedes cerrar esta ventana.'}
        </p>
        <div className="mx-auto mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate(RUTAS.inicio)}>Volver al inicio</Button>
          <Button variante="secundario" onClick={salir}>
            Cerrar sesión
          </Button>
        </div>
      </main>
    </div>
  );
}
