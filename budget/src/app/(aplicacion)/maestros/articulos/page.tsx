import Link from "next/link";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { TablaArticulos } from "./TablaArticulos";

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
  const params = new URLSearchParams({ q: q ?? "" });

  const paginacion = (
    <div className="flex items-center gap-3 text-xs text-tinta-2">
      {pagina > 1 && (
        <Link
          key="anterior"
          href={`/maestros/articulos?${new URLSearchParams({ ...Object.fromEntries(params), pagina: String(pagina - 1) })}`}
          className="hover:text-tinta hover:underline"
        >
          ← Anterior
        </Link>
      )}
      <span key="contador">
        Página {pagina} de {totalPaginas.toLocaleString("es-CO")}
      </span>
      {pagina < totalPaginas && (
        <Link
          key="siguiente"
          href={`/maestros/articulos?${new URLSearchParams({ ...Object.fromEntries(params), pagina: String(pagina + 1) })}`}
          className="hover:text-tinta hover:underline"
        >
          Siguiente →
        </Link>
      )}
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Artículos <span className="text-tinta-3">({resultado.total.toLocaleString("es-CO")})</span>
      </h1>
      <TablaArticulos filas={resultado.filas} busquedaServidor={q} acciones={paginacion} />
    </div>
  );
}
