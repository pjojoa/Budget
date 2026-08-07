"use client";

import { useTema } from "./ProveedorTema";

const OPCIONES = [
  { valor: "claro", etiqueta: "Claro" },
  { valor: "oscuro", etiqueta: "Oscuro" },
  { valor: "sistema", etiqueta: "Sistema" },
] as const;

export function SelectorTema() {
  const { tema, establecerTema } = useTema();
  return (
    <div className="flex items-center gap-0.5 rounded-sm border border-hairline p-0.5" role="group" aria-label="Tema">
      {OPCIONES.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => establecerTema(o.valor)}
          aria-pressed={tema === o.valor}
          className={`rounded-sm px-2 py-1 text-[11px] font-condensada uppercase tracking-wide transition-colors ${
            tema === o.valor ? "bg-fila text-tinta" : "text-tinta-3 hover:text-tinta-2"
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}
