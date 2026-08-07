"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { iniciarSesionComo } from "@/datos/simulado/acciones";
import { USUARIOS_DEMO } from "@/datos/simulado/usuarios";

const ETIQUETA_ROL: Record<string, string> = {
  DIRECTOR_NACIONAL_CPC: "Director Nacional CPC",
  DIRECTOR_SUCURSAL_CPC: "Director Sucursal CPC",
  PRESUPUESTADOR: "Presupuestador",
  ADMIN_MAESTROS: "Admin Maestros",
};

interface Props {
  usuarioIdActual: string;
  nombreActual: string;
}

/**
 * No hay autenticación real todavía (Fase 2+): este selector deja cambiar de
 * perfil sin volver a /ingresar, para explorar rápido qué ve y qué puede
 * hacer cada rol.
 */
export function SelectorUsuarioDemo({ usuarioIdActual, nombreActual }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alClicFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  function cambiarA(usuarioId: string) {
    setAbierto(false);
    if (usuarioId === usuarioIdActual) return;
    iniciarTransicion(() => iniciarSesionComo(usuarioId));
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        disabled={pendiente}
        className="flex items-center gap-1.5 rounded-sm border border-hairline px-2 py-1 text-xs text-tinta hover:bg-fila disabled:opacity-60"
      >
        <span>{pendiente ? "Cambiando…" : nombreActual}</span>
        <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-2.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1.5 5 5 9 1.5" />
        </svg>
      </button>
      {abierto && (
        <ul
          role="listbox"
          aria-label="Cambiar de perfil"
          className="absolute right-0 top-full z-20 mt-1 w-64 rounded-sm border border-hairline bg-panel py-1 shadow-lg"
        >
          {USUARIOS_DEMO.map((u) => {
            const activo = u.usuarioId === usuarioIdActual;
            return (
              <li key={u.usuarioId} role="option" aria-selected={activo}>
                <button
                  type="button"
                  onClick={() => cambiarA(u.usuarioId)}
                  className={`flex w-full flex-col items-start gap-0 px-3 py-1.5 text-left text-xs transition-colors ${
                    activo ? "bg-fila text-tinta" : "text-tinta-2 hover:bg-fila hover:text-tinta"
                  }`}
                >
                  <span>{u.nombre}</span>
                  <span className="font-condensada text-[10px] uppercase tracking-wide text-tinta-3">
                    {u.roles.map((r) => ETIQUETA_ROL[r] ?? r).join(", ")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
