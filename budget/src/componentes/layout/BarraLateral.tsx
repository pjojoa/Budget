"use client";

import { useCallback, useEffect, useState } from "react";
import { NavegacionLateral } from "./NavegacionLateral";

const CLAVE_ALMACENAMIENTO = "budget.nav-colapsada";

export function BarraLateral() {
  const [colapsada, setColapsada] = useState(false);

  useEffect(() => {
    setColapsada(localStorage.getItem(CLAVE_ALMACENAMIENTO) === "1");
  }, []);

  const alternar = useCallback(() => {
    setColapsada((prev) => {
      const siguiente = !prev;
      localStorage.setItem(CLAVE_ALMACENAMIENTO, siguiente ? "1" : "0");
      return siguiente;
    });
  }, []);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-hairline bg-panel transition-[width] duration-[var(--mv-duracion-base)] ${
        colapsada ? "w-12" : "w-48"
      }`}
    >
      <div className={`flex items-center border-b border-hairline p-1.5 ${colapsada ? "justify-center" : "justify-end"}`}>
        <button
          type="button"
          onClick={alternar}
          aria-expanded={!colapsada}
          aria-controls="nav-principal"
          aria-label={colapsada ? "Expandir menú" : "Colapsar menú"}
          title={colapsada ? "Expandir menú" : "Colapsar menú"}
          className="flex size-7 items-center justify-center rounded-sm text-tinta-3 transition-colors hover:bg-fila hover:text-tinta"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-3.5" aria-hidden>
            {colapsada ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5 10.5 8 6 12.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5 5.5 8 10 12.5" />
            )}
          </svg>
        </button>
      </div>
      <NavegacionLateral colapsada={colapsada} />
    </aside>
  );
}
