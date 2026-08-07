import Link from "next/link";

const SECCIONES = [
  { href: "/maestros/articulos", etiqueta: "Artículos" },
  { href: "/maestros/cuentas", etiqueta: "Cuentas" },
  { href: "/maestros/familias", etiqueta: "Familias" },
  { href: "/maestros/precios", etiqueta: "Precios" },
  { href: "/maestros/sucursales", etiqueta: "Sucursales" },
] as const;

export default function LayoutMaestros({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex gap-1 border-b border-hairline bg-panel px-3" aria-label="Maestros">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="border-b-2 border-transparent px-2 py-2 font-condensada text-[11px] uppercase tracking-wide text-tinta-3 hover:border-tinta-3 hover:text-tinta-2"
          >
            {s.etiqueta}
          </Link>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
