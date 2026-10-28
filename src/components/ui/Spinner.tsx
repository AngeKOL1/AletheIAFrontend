interface Props {
  tamano?: 'sm' | 'md' | 'lg';
  className?: string;
}

const tamanos = { sm: 'size-4 border-2', md: 'size-6 border-2', lg: 'size-9 border-[3px]' };

export function Spinner({ tamano = 'md', className = '' }: Props) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-current border-r-transparent ${tamanos[tamano]} ${className}`}
    />
  );
}
