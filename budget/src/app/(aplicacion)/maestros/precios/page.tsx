import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual, obtenerContextoPrecioActual } from "@/datos/simulado/sesion";
import { Moneda } from "@/componentes/dominio/Moneda";
import { BadgeOrigenPrecio } from "@/componentes/dominio/Insignias";

export default async function PaginaPrecios({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const { codigo } = await searchParams;
  const ctx = await obtenerContextoActual();
  const { anio } = await obtenerContextoPrecioActual();
  const anioConsulta = anio ?? 2025;
  const sucursales = await repositorioMaestros.listarSucursales(ctx);

  return (
    <div className="p-4">
      <h1 className="mb-1 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Catálogo de precios
      </h1>
      <p className="mb-3 text-[11px] text-tinta-3">
        Formato ancho: un registro por (artículo, sucursal). Año consultado: {anioConsulta}.
      </p>
      <form method="GET" className="mb-4">
        <input
          name="codigo"
          defaultValue={codigo}
          placeholder="Código de artículo (p. ej. 61001)"
          className="w-72 rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta"
        />
      </form>

      {codigo && (
        <table className="tabla max-w-md">
          <thead>
            <tr>
              <th>Sucursal</th>
              <th data-alinear="der">Precio</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            {await Promise.all(
              sucursales.map(async (s) => {
                const resuelto = await repositorioMaestros.resolverPrecio(ctx, codigo, s, anioConsulta);
                return (
                  <tr key={s}>
                    <td className="text-tinta-2">{s}</td>
                    <td data-alinear="der">
                      <Moneda valor={resuelto?.origen === "SIN_PRECIO" ? null : (resuelto?.precio ?? null)} decimales={2} />
                    </td>
                    <td>
                      <BadgeOrigenPrecio origen={resuelto?.origen ?? "SIN_PRECIO"} />
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
