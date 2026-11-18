import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/services';
import { esApiError, mensajeDeError } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AuthLayout } from '../components/layout/AuthLayout';
import { SelectField, TextField } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import {
  EDAD_MAXIMA,
  EDAD_MINIMA,
  OPCIONES_FRECUENCIA_NOTICIAS,
  OPCIONES_GENERO,
  OPCIONES_NIVEL_EDUCATIVO,
  RUTAS,
} from '../lib/constants';
import type { RegisterRequest } from '../types/api';
import { destinoTrasLogin } from '../components/routing/Guardias';

/** Opcional, pero si se elige debe ser exactamente uno de los valores que acepta el backend. */
const opcionDe = (opciones: readonly string[]) =>
  z.string().refine((v) => v === '' || opciones.includes(v), 'Elige una opción de la lista.');

/** Límites alineados con las validaciones del backend (guía 4.3). */
const esquema = z
  .object({
    nombres: z.string().trim().min(1, 'Ingresa tus nombres.').max(255, 'Máximo 255 caracteres.'),
    apellidos: z.string().trim().min(1, 'Ingresa tus apellidos.').max(255, 'Máximo 255 caracteres.'),
    correo: z
      .string()
      .trim()
      .min(1, 'Ingresa tu correo.')
      .max(255, 'Máximo 255 caracteres.')
      .email('Ingresa un correo válido, con dominio (p. ej. nombre@medio.com).'),
    contrasena: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .max(72, 'La contraseña puede tener como máximo 72 caracteres.'),
    confirmarContrasena: z.string().min(1, 'Repite tu contraseña.'),
    edad: z
      .string()
      .trim()
      .refine(
        (v) => v === '' || (/^\d+$/.test(v) && +v >= EDAD_MINIMA && +v <= EDAD_MAXIMA),
        `Ingresa una edad entre ${EDAD_MINIMA} y ${EDAD_MAXIMA} años.`,
      ),
    genero: opcionDe(OPCIONES_GENERO),
    nivelEducativo: opcionDe(OPCIONES_NIVEL_EDUCATIVO),
    frecuenciaConsumoNoticias: opcionDe(OPCIONES_FRECUENCIA_NOTICIAS),
    medioComunicacion: z.string().trim().max(255, 'Máximo 255 caracteres.'),
    cargo: z.string().trim().max(255, 'Máximo 255 caracteres.'),
    consentimiento: z.boolean().refine((v) => v, 'Debes aceptar participar para continuar.'),
  })
  .refine((d) => d.contrasena === d.confirmarContrasena, {
    path: ['confirmarContrasena'],
    message: 'Las contraseñas no coinciden.',
  });

type Valores = z.infer<typeof esquema>;

/** Campos del formulario que el backend puede marcar en `campos` (mismo nombre que en el request). */
const CAMPOS_SERVIDOR = [
  'nombres',
  'apellidos',
  'correo',
  'contrasena',
  'edad',
  'genero',
  'nivelEducativo',
  'frecuenciaConsumoNoticias',
  'medioComunicacion',
  'cargo',
] as const satisfies readonly (keyof Valores)[];

type CampoServidor = (typeof CAMPOS_SERVIDOR)[number];

const campoDelFormulario = (clave: string): CampoServidor | undefined => CAMPOS_SERVIDOR.find((c) => c === clave);

/** Convierte cadenas vacías de campos opcionales en `undefined`. */
function aRequest(v: Valores): RegisterRequest {
  const opcional = (s: string) => (s.trim() === '' ? undefined : s.trim());
  return {
    nombres: v.nombres.trim(),
    apellidos: v.apellidos.trim(),
    correo: v.correo.trim(),
    contrasena: v.contrasena,
    edad: v.edad.trim() === '' ? undefined : Number(v.edad),
    genero: opcional(v.genero),
    nivelEducativo: opcional(v.nivelEducativo),
    frecuenciaConsumoNoticias: opcional(v.frecuenciaConsumoNoticias),
    medioComunicacion: opcional(v.medioComunicacion),
    cargo: opcional(v.cargo),
  };
}

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const iniciarSesion = useAuthStore((s) => s.iniciarSesion);
  const [errorServidor, setErrorServidor] = useState<string>();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
      edad: '',
      genero: '',
      nivelEducativo: '',
      frecuenciaConsumoNoticias: '',
      medioComunicacion: '',
      cargo: '',
      consentimiento: false,
    },
  });

  const onSubmit = async (v: Valores) => {
    setErrorServidor(undefined);
    const body = aRequest(v);
    try {
      await authApi.register(body);
    } catch (e) {
      if (esApiError(e)) {
        // Errores de validación por campo: se muestran junto a cada input.
        const sinCampo: string[] = [];
        for (const [clave, mensaje] of Object.entries(e.campos)) {
          const campo = campoDelFormulario(clave);
          if (campo) setError(campo, { message: mensaje });
          else sinCampo.push(mensaje);
        }
        // 409: correo ya registrado.
        if (e.status === 409) setError('correo', { message: e.detail });
        else setErrorServidor(sinCampo.length > 0 ? `${e.detail}: ${sinCampo.join(' ')}` : e.detail);
        return;
      }
      setErrorServidor(mensajeDeError(e));
      return;
    }
    try {
      // El registro no devuelve token: iniciamos sesión automáticamente.
      const sesion = await authApi.login({ correo: body.correo, contrasena: body.contrasena });
      iniciarSesion(sesion);
      navigate(destinoTrasLogin(location), { replace: true });
    } catch {
      navigate(RUTAS.login, { replace: true, state: location.state });
    }
  };

  return (
    <AuthLayout
      titulo="Participa en el estudio"
      subtitulo="Leerás una serie de noticias, indicarás si te parecen verdaderas, engañosas, no verificables o falsas, y al final responderás un breve cuestionario."
      pie={
        <>
          ¿Ya tienes una cuenta?{' '}
          <Link to={RUTAS.login} state={location.state} className="font-semibold text-marca-700 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {errorServidor && <Alert>{errorServidor}</Alert>}

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField etiqueta="Nombres" autoComplete="given-name" error={errors.nombres?.message} {...register('nombres')} />
          <TextField etiqueta="Apellidos" autoComplete="family-name" error={errors.apellidos?.message} {...register('apellidos')} />
        </div>
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
          autoComplete="new-password"
          ayuda="Entre 8 y 72 caracteres."
          error={errors.contrasena?.message}
          {...register('contrasena')}
        />
        <TextField
          etiqueta="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmarContrasena?.message}
          {...register('confirmarContrasena')}
        />

        <div className="border-t border-borde pt-5">
          <p className="mb-4 text-sm font-semibold text-tinta">Datos sociodemográficos</p>
          <div className="space-y-5">
            <TextField
              etiqueta="Edad"
              opcional
              inputMode="numeric"
              maxLength={2}
              error={errors.edad?.message}
              {...register('edad')}
            />
            <SelectField
              etiqueta="Género"
              opcional
              opciones={OPCIONES_GENERO}
              error={errors.genero?.message}
              {...register('genero')}
            />
            <SelectField
              etiqueta="Nivel educativo"
              opcional
              opciones={OPCIONES_NIVEL_EDUCATIVO}
              error={errors.nivelEducativo?.message}
              {...register('nivelEducativo')}
            />
            <SelectField
              etiqueta="¿Con qué frecuencia consumes noticias?"
              opcional
              opciones={OPCIONES_FRECUENCIA_NOTICIAS}
              error={errors.frecuenciaConsumoNoticias?.message}
              {...register('frecuenciaConsumoNoticias')}
            />
          </div>
        </div>

        <div className="border-t border-borde pt-5">
          <p className="mb-4 text-sm font-semibold text-tinta">Datos profesionales</p>
          <div className="space-y-5">
            <TextField
              etiqueta="Medio de comunicación"
              opcional
              autoComplete="organization"
              error={errors.medioComunicacion?.message}
              {...register('medioComunicacion')}
            />
            <TextField
              etiqueta="Cargo"
              opcional
              autoComplete="organization-title"
              error={errors.cargo?.message}
              {...register('cargo')}
            />
          </div>
        </div>

        <div className="rounded-xl bg-papel p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 size-5 shrink-0 accent-marca-700"
              aria-invalid={!!errors.consentimiento || undefined}
              {...register('consentimiento')}
            />
            <span className="text-sm leading-relaxed text-tinta-suave">
              Acepto participar voluntariamente en este estudio académico. Entiendo que mis respuestas se
              usarán solo con fines de investigación, de forma confidencial, y que puedo retirarme en
              cualquier momento.
            </span>
          </label>
          {errors.consentimiento && (
            <p className="mt-2 text-sm text-peligro-600">{errors.consentimiento.message}</p>
          )}
        </div>

        <Button type="submit" anchoCompleto cargando={isSubmitting}>
          Registrarme y comenzar
        </Button>
      </form>
    </AuthLayout>
  );
}
