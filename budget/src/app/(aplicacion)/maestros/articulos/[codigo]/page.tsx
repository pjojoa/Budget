import { notFound } from "next/navigation";
import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual, obtenerContextoPrecioActual } from "@/datos/simulado/sesion";
import { Moneda } from "@/componentes/dominio/Moneda";
import { BadgeOrigenPrecio } from "@/componentes/dominio/Insignias";

export default async function PaginaArticulo({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const ctx = await obtenerContextoActual();
  const { anio } = await obtenerContextoPrecioActual();
  const anioConsulta = anio ?? 2025;

  const { filas } = await repositorioMaestros.buscarArticulos(ctx, { texto: codigo, porPagina: 5 });
  const articulo = filas.find((a) => a.codigo === codigo);
  if (!articulo) notFound();

  const sucursales = await repositorioMaestros.listarSucursales(ctx);
  const precios = await Promise.all(
    sucursales.map(async (s) => ({ sucursal: s, resuelto: await repositorioMaestros.resolverPrecio(ctx, codigo, s, anioConsulta) })),
  );

  return (
    <div className="p-4">
      <h1 className="font-mono text-sm text-tinta">{articulo.codigo}</h1>
      <p className="mb-4 text-xs text-tinta-2">
        {articulo.descripcion} · {articulo.unidadMedida} · familia {articulo.familiaNombre}
      </p>

      <h2 className="mb-2 font-condensada text-[11px] uppercase tracking-wide text-tinta-3">
        Precios por sucursal ({anioConsulta})
      </h2>
      <table className="w-full max-w-md border-collapse text-xs">
        <thead>
          <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
            <th className="py-1.5 pr-3 font-medium">Sucursal</th>
            <th className="py-1.5 pr-3 text-right font-medium">Precio</th>
            <th className="py-1.5 pr-3 font-medium">Origen</th>
          </tr>
        </thead>
        <tbody>
          {precios.map(({ sucursal, resuelto }) => (
            <tr key={sucursal} className="border-b border-hairline">
              <td className="py-1.5 pr-3 text-tinta-2">{sucursal}</td>
              <td className="py-1.5 pr-3 text-right">
                <Moneda valor={resuelto?.origen === "SIN_PRECIO" ? null : (resuelto?.precio ?? null)} decimales={2} />
              </td>
              <td className="py-1.5 pr-3">
                <BadgeOrigenPrecio origen={resuelto?.origen ?? "SIN_PRECIO"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
