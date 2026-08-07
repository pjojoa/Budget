"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES: { href: string; etiqueta: string; icono: ReactNode }[] = [
  {
    href: "/presupuestos",
    etiqueta: "Presupuestos",
    icono: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <circle cx="8" cy="8" r="5.5" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.2 6.2C9.8 5.5 9 5.1 8 5.1c-1.4 0-2.3.7-2.3 1.7S6.6 8.3 8 8.3s2.3.5 2.3 1.5S9.4 11.4 8 11.4c-1 0-1.8-.4-2.2-1.1M8 3.8v1.3M8 11.4v1.3"
        />
      </svg>
    ),
  },
  {
    href: "/comparar",
    etiqueta: "Comparador",
    icono: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.5H12M9.5 2.5 12.5 5.5 9.5 8.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 10.5H4M6.5 7.5 3.5 10.5 6.5 13.5" />
      </svg>
    ),
  },
  {
    href: "/maestros/articulos",
    etiqueta: "Maestros",
    icono: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path
          strokeLinejoin="round"
          d="M3.2 8.2c0-1.2.5-2.3 1.5-3.1C5.5 4.4 6.7 4 8 4s2.5.4 3.3 1.1c1 .8 1.5 1.9 1.5 3.1v.3H3.2v-.3Z"
        />
        <path strokeLinecap="round" d="M2.5 8.5h11" />
        <path strokeLinejoin="round" d="M5.2 8.5v2.2a.8.8 0 0 0 .8.8h.4M10.8 8.5v2.2a.8.8 0 0 1-.8.8h-.4" />
        <path strokeLinecap="round" d="M8 4V2.8" />
      </svg>
    ),
  },
  {
    href: "/documentacion",
    etiqueta: "Documentación",
    icono: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path
          strokeLinejoin="round"
          d="M8 3.2c-1.2-.7-2.6-1-4.2-.9v9.2c1.6-.1 3 .2 4.2.9 1.2-.7 2.6-1 4.2-.9V2.3c-1.6-.1-3 .2-4.2.9Z"
        />
        <path strokeLinecap="round" d="M8 3.2v9.2" />
      </svg>
    ),
  },
  {
    href: "/modelo-datos",
    etiqueta: "Modelo de datos",
    icono: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="2" y="2.5" width="5" height="4" rx="0.8" />
        <rect x="9" y="2.5" width="5" height="4" rx="0.8" />
        <rect x="5.5" y="9.5" width="5" height="4" rx="0.8" />
        <path strokeLinecap="round" d="M4.5 6.5v1.5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V6.5M8 9v-1" />
      </svg>
    ),
  },
];

const ICONO_LAB = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <path strokeLinejoin="round" d="M6.5 2.5h3M8 2.5v4.2L11.8 13a1 1 0 0 1-.85 1.5H5.05A1 1 0 0 1 4.2 13L8 6.7" />
  </svg>
);

interface Props {
  colapsada?: boolean;
}

export function NavegacionLateral({ colapsada = false }: Props) {
  const ruta = usePathname();
  return (
    <nav id="nav-principal" className="flex flex-col gap-0.5 p-1.5" aria-label="Navegación principal">
      {ENLACES.map((e) => {
        const activo = ruta.startsWith(e.href.split("/").slice(0, 2).join("/"));
        return (
          <Link
            key={e.href}
            href={e.href}
            title={e.etiqueta}
            aria-label={e.etiqueta}
            className={`flex items-center rounded-sm text-xs transition-colors ${
              colapsada ? "justify-center size-8 mx-auto" : "gap-2 px-2.5 py-1.5"
            } ${activo ? "bg-fila text-tinta" : "text-tinta-2 hover:bg-fila hover:text-tinta"}`}
          >
            <span className="shrink-0 [&_svg]:size-3.5">{e.icono}</span>
            {!colapsada && <span className="truncate">{e.etiqueta}</span>}
          </Link>
        );
      })}
      {process.env.NODE_ENV !== "production" && (
        <Link
          href="/laboratorio"
          title="Laboratorio"
          aria-label="Laboratorio"
          className={`mt-4 flex items-center rounded-sm font-condensada text-[11px] uppercase tracking-wide transition-colors ${
            colapsada ? "justify-center size-8 mx-auto" : "gap-2 px-2.5 py-1.5"
          } ${ruta === "/laboratorio" ? "bg-fila text-tinta" : "text-tinta-3 hover:bg-fila hover:text-tinta-2"}`}
        >
          <span className="shrink-0 [&_svg]:size-3.5">{ICONO_LAB}</span>
          {!colapsada && <span>Laboratorio</span>}
        </Link>
      )}
    </nav>
  );
}
