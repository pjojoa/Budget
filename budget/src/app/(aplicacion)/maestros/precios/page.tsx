import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual, obtenerContextoPrecioActual } from "@/datos/simulado/sesion";
import { puedeEditarMaestros } from "@/datos/contexto";
import { TablaPrecios } from "./TablaPrecios";

export default async function PaginaPrecios({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const { codigo } = await searchParams;
  const ctx = await obtenerContextoActual();
  const editable = puedeEditarMaestros(ctx);
  const { anio } = await obtenerContextoPrecioActual();
  const anioConsulta = anio ?? 2025;
  const sucursales = await repositorioMaestros.listarSucursales(ctx);

  const filas = codigo
    ? await Promise.all(
        sucursales.map(async (s) => ({ sucursal: s, resuelto: await repositorioMaestros.resolverPrecio(ctx, codigo, s, anioConsulta) })),
      )
    : [];

  return (
    <div className="p-4">
      <h1 className="mb-1 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Catálogo de precios
      </h1>
      <p className="mb-3 text-[11px] text-tinta-3">
        Formato ancho: un registro por (artículo, sucursal). Año consultado: {anioConsulta}.
        {editable && " Haga clic en un precio para fijar un valor manual."}
      </p>
      <form method="GET" className="mb-4">
        <input
          name="codigo"
          defaultValue={codigo}
          placeholder="Código de artículo (p. ej. 61001)"
          className="w-72 rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta"
        />
      </form>

      {codigo && <TablaPrecios codigo={codigo} anio={anioConsulta} editable={editable} filas={filas} />}
    </div>
  );
}
