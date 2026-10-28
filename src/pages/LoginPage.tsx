import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/services';
import { mensajeDeError } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AuthLayout } from '../components/layout/AuthLayout';
import { TextField } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { RUTAS } from '../lib/constants';
import { destinoTrasLogin } from '../components/routing/Guardias';

const esquema = z.object({
  correo: z.string().trim().min(1, 'Ingresa tu correo.').email('Ingresa un correo válido.'),
  contrasena: z.string().min(1, 'Ingresa tu contraseña.'),
});

type Valores = z.infer<typeof esquema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const iniciarSesion = useAuthStore((s) => s.iniciarSesion);
  const sesionExpirada = useAuthStore((s) => s.sesionExpirada);
  const [errorServidor, setErrorServidor] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(esquema) });

  const onSubmit = async (v: Valores) => {
    setErrorServidor(undefined);
    try {
      const respuesta = await authApi.login({ correo: v.correo.trim(), contrasena: v.contrasena });
      iniciarSesion(respuesta);
      // Vuelve a la fase que el participante eligió en la Home (o a la Home).
      navigate(destinoTrasLogin(location), { replace: true });
    } catch (e) {
      setErrorServidor(mensajeDeError(e));
    }
  };

  return (
    <AuthLayout
      titulo="Iniciar sesión"
      subtitulo="Ingresa para continuar con el estudio desde donde lo dejaste."
      pie={
        <>
          ¿Aún no te registras?{' '}
          <Link to={RUTAS.registro} state={location.state} className="font-semibold text-marca-700 hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {sesionExpirada && !errorServidor && (
          <Alert tipo="info">Tu sesión expiró. Vuelve a iniciar sesión para continuar.</Alert>
        )}
        {errorServidor && <Alert>{errorServidor}</Alert>}
        <TextField
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.correo?.message}
          {...register('correo')}
        />
        <TextField
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.contrasena?.message}
          {...register('contrasena')}
        />
        <Button type="submit" anchoCompleto cargando={isSubmitting}>
          Ingresar
        </Button>
      </form>
    </AuthLayout>
  );
}
