import Link from "next/link";
import { repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { Moneda } from "@/componentes/dominio/Moneda";
import { InsigniaEstadoPresupuesto } from "@/componentes/dominio/Insignias";
import { Boton } from "@/componentes/ui/Boton";

export default async function PaginaPresupuestos() {
  const ctx = await obtenerContextoActual();
  const pagina = await repositorioPresupuestos.listar(ctx, {});

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">Presupuestos</h1>
        <Link href="/presupuestos/nuevo">
          <Boton variante="primario">Nuevo presupuesto</Boton>
        </Link>
      </div>

      {pagina.filas.length === 0 ? (
        <div className="rounded-md border border-dashed border-hairline p-8 text-center text-xs text-tinta-2">
          No hay presupuestos visibles para tu sucursal todavía.
        </div>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
              <th className="py-1.5 pr-3 font-medium">Proyecto</th>
              <th className="py-1.5 pr-3 font-medium">Versión</th>
              <th className="py-1.5 pr-3 font-medium">Estado</th>
              <th className="py-1.5 pr-3 font-medium">Sucursal</th>
              <th className="py-1.5 pr-3 font-medium">Año</th>
              <th className="py-1.5 pr-3 text-right font-medium">Total</th>
              <th className="py-1.5 pr-3 text-right font-medium">$/m²</th>
            </tr>
          </thead>
          <tbody>
            {pagina.filas.map((f) => (
              <tr key={f.id} className="border-b border-hairline hover:bg-fila">
                <td className="py-1.5 pr-3">
                  <Link href={`/presupuestos/${f.id}/arbol`} className="text-tinta hover:underline">
                    {f.proyecto}
                  </Link>
                </td>
                <td className="py-1.5 pr-3 text-tinta-2">{f.version}</td>
                <td className="py-1.5 pr-3">
                  <InsigniaEstadoPresupuesto estado={f.estado} />
                </td>
                <td className="py-1.5 pr-3 text-tinta-2">{f.sucursal}</td>
                <td className="py-1.5 pr-3 text-tinta-2">{f.anioPrecios}</td>
                <td className="py-1.5 pr-3 text-right">
                  <Moneda valor={f.total} />
                </td>
                <td className="py-1.5 pr-3 text-right">
                  <Moneda valor={f.valorM2} decimales={0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
