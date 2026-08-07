"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  valoresUnicos: string[];
  seleccionados: string[] | undefined;
  onCambiar: (valores: string[] | undefined) => void;
  etiqueta: string;
}

export function FiltroColumnaExcel({ valoresUnicos, seleccionados, onCambiar, etiqueta }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const raiz = useRef<HTMLDivElement>(null);
  const activo = seleccionados !== undefined;

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return valoresUnicos;
    return valoresUnicos.filter((v) => v.toLowerCase().includes(q));
  }, [valoresUnicos, busqueda]);

  const setActual = useMemo(
    () => new Set(seleccionados ?? valoresUnicos),
    [seleccionados, valoresUnicos],
  );

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const aplicar = (siguiente: Set<string>) => {
    if (siguiente.size === valoresUnicos.length) onCambiar(undefined);
    else onCambiar([...siguiente]);
  };

  const todosVisiblesMarcados = visibles.length > 0 && visibles.every((v) => setActual.has(v));

  return (
    <div className="relative inline-flex" ref={raiz}>
      <button
        type="button"
        aria-label={`Filtrar ${etiqueta}`}
        aria-expanded={abierto}
        title={`Filtrar ${etiqueta}`}
        onClick={(e) => {
          e.stopPropagation();
          setAbierto((a) => !a);
        }}
        className={`ml-1 inline-flex size-4 items-center justify-center rounded-sm transition-colors ${
          activo ? "text-foco" : "text-tinta-3 hover:text-tinta"
        }`}
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden>
          <path d="M2.2 3.2A.8.8 0 0 1 3 2.5h10a.8.8 0 0 1 .6 1.3L9.8 8.2v3.7a.8.8 0 0 1-1.2.7l-1.6-.9a.8.8 0 0 1-.4-.7V8.2L2.4 3.8a.8.8 0 0 1-.2-.6Z" />
        </svg>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label={`Filtro de ${etiqueta}`}
          className="absolute left-0 top-full z-30 mt-1 flex w-56 flex-col rounded-sm border border-hairline bg-panel shadow-lg"
        >
          <div className="border-b border-hairline p-1.5">
            <input
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded-sm border border-hairline bg-lienzo px-2 py-1 text-[11px] text-tinta outline-none focus:border-foco"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 border-b border-hairline px-2 py-1.5 text-[11px] text-tinta hover:bg-fila">
            <input
              type="checkbox"
              className="accent-[var(--color-foco)]"
              checked={todosVisiblesMarcados}
              onChange={() => {
                const siguiente = new Set(setActual);
                if (todosVisiblesMarcados) visibles.forEach((v) => siguiente.delete(v));
                else visibles.forEach((v) => siguiente.add(v));
                aplicar(siguiente);
              }}
            />
            (Seleccionar todo)
          </label>

          <ul className="max-h-48 overflow-auto py-0.5">
            {visibles.map((v) => (
              <li key={v}>
                <label className="flex cursor-pointer items-center gap-2 px-2 py-1 text-[11px] text-tinta hover:bg-fila">
                  <input
                    type="checkbox"
                    className="accent-[var(--color-foco)]"
                    checked={setActual.has(v)}
                    onChange={() => {
                      const siguiente = new Set(setActual);
                      if (siguiente.has(v)) siguiente.delete(v);
                      else siguiente.add(v);
                      aplicar(siguiente);
                    }}
                  />
                  <span className="truncate" title={v}>
                    {v || "(vacío)"}
                  </span>
                </label>
              </li>
            ))}
            {visibles.length === 0 && (
              <li className="px-2 py-2 text-center text-[11px] text-tinta-3">Sin coincidencias</li>
            )}
          </ul>

          <div className="flex items-center justify-between border-t border-hairline p-1.5">
            <button
              type="button"
              className="text-[11px] text-tinta-3 hover:text-tinta"
              onClick={() => {
                onCambiar(undefined);
                setBusqueda("");
              }}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="rounded-sm bg-fila px-2 py-0.5 text-[11px] text-tinta hover:opacity-90"
              onClick={() => setAbierto(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
