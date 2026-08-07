"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/documentacion/introduccion", etiqueta: "Introducción" },
  { href: "/documentacion/arbol-presupuesto", etiqueta: "Árbol de presupuesto" },
  { href: "/documentacion/analisis", etiqueta: "Análisis" },
  { href: "/documentacion/versionado", etiqueta: "Versionado y aprobación" },
  { href: "/documentacion/maestros", etiqueta: "Maestros" },
  { href: "/documentacion/roles-permisos", etiqueta: "Roles y permisos" },
  { href: "/documentacion/atajos-teclado", etiqueta: "Atajos de teclado" },
] as const;

export function NavegacionDocumentacion() {
  const ruta = usePathname();
  return (
    <nav className="w-56 shrink-0 border-r border-hairline p-2" aria-label="Secciones de documentación">
      <p className="mb-1.5 px-2 font-condensada text-[11px] uppercase tracking-wide text-tinta-3">Manual de uso</p>
      <ul className="space-y-0.5">
        {SECCIONES.map((s) => {
          const activo = ruta === s.href;
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={activo ? "page" : undefined}
                className={`block rounded-sm px-2 py-1.5 text-xs transition-colors ${
                  activo ? "bg-fila text-tinta" : "text-tinta-2 hover:bg-fila hover:text-tinta"
                }`}
              >
                {s.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
