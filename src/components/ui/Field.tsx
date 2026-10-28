import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

const claseControl =
  'block w-full min-h-12 rounded-xl border bg-superficie px-4 text-[16px] text-tinta placeholder:text-tinta-tenue transition-colors focus:outline-none focus:ring-2 focus:ring-marca-500/30 focus:border-marca-500';

function claseBorde(error?: string) {
  return error ? 'border-peligro-600' : 'border-borde-fuerte';
}

interface BaseProps {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  opcional?: boolean;
}

function Etiqueta({ htmlFor, texto, opcional }: { htmlFor: string; texto: string; opcional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-tinta">
      {texto}
      {opcional && <span className="ml-1 font-normal text-tinta-tenue">(opcional)</span>}
    </label>
  );
}

function Mensajes({ id, error, ayuda }: { id: string; error?: string; ayuda?: string }) {
  if (error) {
    return (
      <p id={`${id}-msg`} className="mt-1.5 text-sm text-peligro-600">
        {error}
      </p>
    );
  }
  if (ayuda) {
    return (
      <p id={`${id}-msg`} className="mt-1.5 text-sm text-tinta-tenue">
        {ayuda}
      </p>
    );
  }
  return null;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { etiqueta, error, ayuda, opcional, id, className = '', ...resto },
  ref,
) {
  const autoId = useId();
  const campoId = id ?? autoId;
  return (
    <div className={className}>
      <Etiqueta htmlFor={campoId} texto={etiqueta} opcional={opcional} />
      <input
        ref={ref}
        id={campoId}
        aria-invalid={!!error || undefined}
        aria-describedby={error || ayuda ? `${campoId}-msg` : undefined}
        className={`${claseControl} ${claseBorde(error)}`}
        {...resto}
      />
      <Mensajes id={campoId} error={error} ayuda={ayuda} />
    </div>
  );
});

type SelectProps = BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & { opciones: string[]; placeholder?: string };

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { etiqueta, error, ayuda, opcional, id, opciones, placeholder = 'Selecciona una opción', className = '', ...resto },
  ref,
) {
  const autoId = useId();
  const campoId = id ?? autoId;
  return (
    <div className={className}>
      <Etiqueta htmlFor={campoId} texto={etiqueta} opcional={opcional} />
      <select
        ref={ref}
        id={campoId}
        aria-invalid={!!error || undefined}
        aria-describedby={error || ayuda ? `${campoId}-msg` : undefined}
        className={`${claseControl} ${claseBorde(error)} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%237b7f88'%3E%3Cpath d='M5.5 7.5 10 12l4.5-4.5'/%3E%3C/svg%3E")] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10`}
        {...resto}
      >
        <option value="">{placeholder}</option>
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Mensajes id={campoId} error={error} ayuda={ayuda} />
    </div>
  );
});
