import Link from "next/link";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { RailIndentacion } from "@/componentes/dominio/RailIndentacion";

const POR_PAGINA = 100;

export default async function PaginaCuentas({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  const { q, pagina: paginaTexto } = await searchParams;
  const pagina = Number(paginaTexto ?? 1);
  const ctx = await obtenerContextoActual();
  const resultado = await repositorioMaestros.listarCuentas(ctx, { texto: q, pagina, porPagina: POR_PAGINA });
  const totalPaginas = Math.ceil(resultado.total / POR_PAGINA);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
          Cuentas <span className="text-tinta-3">({resultado.total.toLocaleString("es-CO")})</span>
        </h1>
        <form method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por código o descripción…"
            className="w-72 rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta"
          />
        </form>
      </div>
      <div className="text-xs">
        {resultado.filas.map((c) => (
          <div key={c.codigo} className="flex items-center gap-2 border-b border-hairline py-1 hover:bg-fila">
            <RailIndentacion nivel={c.nivel} />
            <CodigoCuenta codigo={c.codigo} />
            <span className="flex-1 truncate text-tinta-2" title={c.descripcion}>
              {c.descripcion}
            </span>
            <span className="text-tinta-3">{c.plantilla}</span>
            {!c.activa && <span className="text-tinta-3">(inactiva)</span>}
          </div>
        ))}
        {resultado.filas.length === 0 && (
          <p className="py-4 text-center text-tinta-3">Sin resultados para esta búsqueda.</p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-tinta-2">
        {pagina > 1 && (
          <Link
            href={`/maestros/cuentas?${new URLSearchParams({ q: q ?? "", pagina: String(pagina - 1) })}`}
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
            href={`/maestros/cuentas?${new URLSearchParams({ q: q ?? "", pagina: String(pagina + 1) })}`}
            className="hover:text-tinta hover:underline"
          >
            Siguiente →
          </Link>
        )}
      </div>
    </div>
  );
}
