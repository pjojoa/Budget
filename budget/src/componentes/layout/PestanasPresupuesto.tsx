"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  id: string;
}

const PESTANAS = [
  { segmento: "arbol", etiqueta: "Árbol" },
  { segmento: "explosion", etiqueta: "Explosión" },
  { segmento: "resumen", etiqueta: "Resumen" },
  { segmento: "hallazgos", etiqueta: "Hallazgos" },
  { segmento: "versiones", etiqueta: "Versiones" },
  { segmento: "repreciar", etiqueta: "Repreciar" },
] as const;

export function PestanasPresupuesto({ id }: Props) {
  const ruta = usePathname();
  return (
    <nav className="flex gap-1 border-b border-hairline px-3" aria-label="Secciones del presupuesto">
      {PESTANAS.map((p) => {
        const href = `/presupuestos/${id}/${p.segmento}`;
        const activo = ruta.startsWith(href);
        return (
          <Link
            key={p.segmento}
            href={href}
            className={`border-b-2 px-2 py-2 font-condensada text-[11px] uppercase tracking-wide transition-colors ${
              activo ? "border-tinta text-tinta" : "border-transparent text-tinta-3 hover:text-tinta-2"
            }`}
          >
            {p.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
