import { useState } from 'react';
import { DisposicionNoticiaAnalisis } from '../components/analisis/NoticiaConAnalisis';
import { PanelVeredicto } from '../components/feed/PanelVeredicto';
import { BarraProgreso } from '../components/ui/BarraProgreso';
import { ESTADOS_DEMO, NOTICIA_DEMO } from '../mocks/analisis';
import type { Categoria } from '../types/api';

const CATEGORIAS: Categoria[] = [
  { id: 1, nombre: 'VERDADERA' },
  { id: 2, nombre: 'ENGANOSA' },
  { id: 3, nombre: 'NO_VERIFICABLE' },
  { id: 4, nombre: 'FALSA' },
];

/**
 * SOLO DESARROLLO (/demo/analisis): la pantalla del post test con informes de
 * ejemplo, para revisar el diseño de cada estado sin backend ni AletheIA.
 */
export function DemoAnalisisPage() {
  const [indice, setIndice] = useState(2);
  const [seleccion, setSeleccion] = useState<Categoria>();
  const actual = ESTADOS_DEMO[indice] ?? ESTADOS_DEMO[0];

  return (
    <div className="flex h-dvh flex-col bg-papel">
      <header className="z-10 border-b border-borde bg-superficie px-4 pt-3 pb-3">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-dashed border-borde-fuerte px-2.5 py-1 text-xs font-semibold text-tinta-tenue">
              Demo · datos ficticios
            </span>
            <label className="flex items-center gap-2 text-sm text-tinta-suave">
              Estado del análisis:
              <select
                value={indice}
                onChange={(e) => setIndice(Number(e.target.value))}
                className="rounded-lg border border-borde-fuerte bg-superficie px-2 py-1 text-sm font-semibold text-tinta"
              >
                {ESTADOS_DEMO.map((e, i) => (
                  <option key={e.nombre} value={i}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <BarraProgreso actual={3} total={14} />
        </div>
      </header>

      <main className="min-h-0 flex-1">
        {actual && (
          <DisposicionNoticiaAnalisis
            key={actual.nombre}
            noticia={NOTICIA_DEMO}
            prioridadImagen
            estado={actual.estado}
            onSolicitar={() => setIndice(1)}
          />
        )}
      </main>

      <PanelVeredicto
        categorias={CATEGORIAS}
        seleccion={seleccion}
        enviando={false}
        error={undefined}
        deshabilitado={false}
        onElegirVeredicto={setSeleccion}
        onElegirConfianza={() => setSeleccion(undefined)}
        onCambiarVeredicto={() => setSeleccion(undefined)}
      />
    </div>
  );
}
