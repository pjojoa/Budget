import Link from "next/link";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";

const POR_PAGINA = 50;

export default async function PaginaArticulos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  const { q, pagina: paginaTexto } = await searchParams;
  const pagina = Number(paginaTexto ?? 1);
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.buscarArticulos(ctx, {
    texto: q,
    pagina,
    porPagina: POR_PAGINA,
  });

  const totalPaginas = Math.ceil(resultado.total / POR_PAGINA);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
          Artículos <span className="text-tinta-3">({resultado.total.toLocaleString("es-CO")})</span>
        </h1>
        <form method="GET" className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por código o descripción…"
            className="w-72 rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta"
          />
        </form>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
            <th className="py-1.5 pr-3 font-medium">Código</th>
            <th className="py-1.5 pr-3 font-medium">Descripción</th>
            <th className="py-1.5 pr-3 font-medium">UM</th>
            <th className="py-1.5 pr-3 font-medium">Familia</th>
            <th className="py-1.5 pr-3 font-medium">Activo</th>
            <th className="py-1.5 pr-3 text-right font-medium">Sucursales c/precio</th>
          </tr>
        </thead>
        <tbody>
          {resultado.filas.map((a) => (
            <tr key={a.codigo} className="border-b border-hairline hover:bg-fila">
              <td className="py-1.5 pr-3">
                <Link href={`/maestros/articulos/${a.codigo}`} className="font-mono text-tinta hover:underline">
                  {a.codigo}
                </Link>
              </td>
              <td className="py-1.5 pr-3 text-tinta-2" title={a.descripcion}>
                {a.descripcion}
              </td>
              <td className="py-1.5 pr-3 text-tinta-3">{a.unidadMedida}</td>
              <td className="py-1.5 pr-3 text-tinta-3">{a.familiaNombre}</td>
              <td className="py-1.5 pr-3">
                {a.activo ? <span className="text-tinta-2">Sí</span> : <span className="text-tinta-3">No</span>}
              </td>
              <td className="cifra py-1.5 pr-3">{a.nSucursalesConPrecio}</td>
            </tr>
          ))}
          {resultado.filas.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-tinta-3">
                Sin resultados para esta búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 flex items-center gap-3 text-xs text-tinta-2">
        {pagina > 1 && (
          <Link
            href={`/maestros/articulos?${new URLSearchParams({ q: q ?? "", pagina: String(pagina - 1) })}`}
            className="hover:text-tinta hover:underline"
          >
            ← Anterior
          </Link>
        )}
        <span>
          Página {pagina} de {totalPaginas.toLocaleString("es-CO")}
        </span>
        {pagina < totalPaginas && (
          <Link
            href={`/maestros/articulos?${new URLSearchParams({ q: q ?? "", pagina: String(pagina + 1) })}`}
            className="hover:text-tinta hover:underline"
          >
            Siguiente →
          </Link>
        )}
      </div>
    </div>
  );
}
