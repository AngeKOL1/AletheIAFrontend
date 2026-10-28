import { useState } from 'react';
import type { NoticiaFeed } from '../../types/api';

function Parrafos({ texto, className }: { texto: string; className: string }) {
  return (
    <>
      {texto
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}

/**
 * Presentación de una noticia. Solo muestra los campos no nulos.
 * Componente puramente visual: no conoce (ni recibe) la categoría real.
 */
export function NoticiaCard({ noticia, prioridadImagen }: { noticia: NoticiaFeed; prioridadImagen: boolean }) {
  const [imagenFallo, setImagenFallo] = useState(false);
  const { titular, epigrafe, subtitulo, entradilla, cuerpo, cierre, img, fuente } = noticia;

  return (
    <article className="mx-auto w-full max-w-2xl">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-borde sm:rounded-2xl">
        {img && !imagenFallo ? (
          <img
            src={img}
            alt=""
            loading={prioridadImagen ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => setImagenFallo(true)}
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-tinta-tenue">
            Imagen no disponible
          </div>
        )}
      </div>

      <div className="px-5 pt-5 pb-6 sm:px-1">
        {epigrafe && (
          <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-marca-600 uppercase">
            {epigrafe}
          </p>
        )}
        <h2 className="font-serif text-[26px] leading-[1.18] font-semibold tracking-tight text-tinta sm:text-[32px]">
          {titular}
        </h2>
        {subtitulo && (
          <p className="mt-3 font-serif text-[19px] leading-snug text-tinta-suave">{subtitulo}</p>
        )}
        {entradilla && (
          <div className="mt-5">
            <Parrafos texto={entradilla} className="mb-3 text-[17px] leading-relaxed font-medium text-tinta" />
          </div>
        )}
        {cuerpo && (
          <div className="mt-3">
            <Parrafos texto={cuerpo} className="mb-4 text-[17px] leading-[1.7] text-tinta-suave" />
          </div>
        )}
        {cierre && (
          <div className="mt-2 border-t border-borde pt-4">
            <Parrafos texto={cierre} className="mb-3 text-[16px] leading-relaxed text-tinta-suave italic" />
          </div>
        )}
        {fuente && (
          <p className="mt-4 text-sm text-tinta-tenue">
            Fuente: <span className="font-medium text-tinta-suave">{fuente}</span>
          </p>
        )}
      </div>
    </article>
  );
}
