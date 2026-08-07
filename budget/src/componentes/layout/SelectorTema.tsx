"use client";

import type { ReactNode } from "react";
import { useTema, type Tema } from "./ProveedorTema";

const CICLO: Tema[] = ["claro", "oscuro", "sistema"];

const ICONOS: Record<Tema, { etiqueta: string; icono: ReactNode }> = {
  claro: {
    etiqueta: "Tema claro",
    icono: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <circle cx="8" cy="8" r="2.75" />
        <path
          strokeLinecap="round"
          d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"
        />
      </svg>
    ),
  },
  oscuro: {
    etiqueta: "Tema oscuro",
    icono: (
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M9.6 1.4A6.2 6.2 0 0 0 2.8 10.8 6.4 6.4 0 0 0 13.2 5.2c-1 .4-2 .5-3.1.3A5 5 0 0 1 9.6 1.4Z" />
      </svg>
    ),
  },
  sistema: {
    etiqueta: "Tema sistema",
    icono: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="2.5" y="3" width="11" height="8" rx="1.2" />
        <path strokeLinecap="round" d="M5.5 13.5h5M8 11v2.5" />
      </svg>
    ),
  },
};

export function SelectorTema() {
  const { tema, establecerTema } = useTema();
  const actual = ICONOS[tema];
  const siguiente = CICLO[(CICLO.indexOf(tema) + 1) % CICLO.length];

  return (
    <button
      type="button"
      onClick={() => establecerTema(siguiente)}
      aria-label={`${actual.etiqueta}. Clic para cambiar a ${ICONOS[siguiente].etiqueta.toLowerCase()}`}
      title={`${actual.etiqueta} → ${ICONOS[siguiente].etiqueta}`}
      className="flex size-7 items-center justify-center rounded-sm text-tinta-3 transition-colors hover:bg-fila hover:text-tinta [&_svg]:size-3.5"
    >
      {actual.icono}
    </button>
  );
}
