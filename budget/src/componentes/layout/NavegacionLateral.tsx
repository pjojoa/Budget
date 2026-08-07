"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/presupuestos", etiqueta: "Presupuestos" },
  { href: "/comparar", etiqueta: "Comparador" },
  { href: "/maestros/articulos", etiqueta: "Maestros" },
] as const;

export function NavegacionLateral() {
  const ruta = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-2" aria-label="Navegación principal">
      {ENLACES.map((e) => {
        const activo = ruta.startsWith(e.href.split("/").slice(0, 2).join("/"));
        return (
          <Link
            key={e.href}
            href={e.href}
            className={`rounded-sm px-2.5 py-1.5 text-xs transition-colors ${
              activo ? "bg-fila text-tinta" : "text-tinta-2 hover:bg-fila hover:text-tinta"
            }`}
          >
            {e.etiqueta}
          </Link>
        );
      })}
      {process.env.NODE_ENV !== "production" && (
        <Link
          href="/laboratorio"
          className={`mt-4 rounded-sm px-2.5 py-1.5 font-condensada text-[11px] uppercase tracking-wide transition-colors ${
            ruta === "/laboratorio" ? "bg-fila text-tinta" : "text-tinta-3 hover:text-tinta-2"
          }`}
        >
          Laboratorio
        </Link>
      )}
    </nav>
  );
}
