interface Props {
  sucursal: string | null;
  anio: number | null;
}

/**
 * Siempre visible en el shell: es la restricción que congela el catálogo de
 * precios de toda la sesión de trabajo (una obra usa una sola sucursal y un
 * solo año).
 */
export function ChipSucursalAnio({ sucursal, anio }: Props) {
  if (!sucursal || !anio) {
    return (
      <a
        href="/contexto"
        className="rounded-sm border border-dashed border-hairline px-2 py-1 font-condensada text-[11px] uppercase tracking-wide text-tinta-2 hover:text-tinta"
      >
        Elegir sucursal/año
      </a>
    );
  }
  return (
    <a
      href="/contexto"
      className="rounded-sm border border-hairline px-2 py-1 font-condensada text-[11px] uppercase tracking-wide text-tinta hover:bg-fila"
      title="Sucursal y año de precios activos — cambia el catálogo de toda la sesión"
    >
      {sucursal} · {anio}
    </a>
  );
}
