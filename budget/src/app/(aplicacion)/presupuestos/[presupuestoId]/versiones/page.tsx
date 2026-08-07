import Link from "next/link";
import { repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { InsigniaEstadoPresupuesto } from "@/componentes/dominio/Insignias";
import { Moneda } from "@/componentes/dominio/Moneda";

export default async function PaginaVersiones({ params }: { params: Promise<{ presupuestoId: string }> }) {
  const { presupuestoId } = await params;
  const ctx = await obtenerContextoActual();
  const cabecera = await repositorioPresupuestos.obtenerCabecera(ctx, presupuestoId);
  const { filas } = await repositorioPresupuestos.listar(ctx, {});
  const versiones = filas
    .filter((f) => f.proyecto === cabecera?.proyecto)
    .sort((a, b) => a.version.localeCompare(b.version));

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Historial de versiones
      </h1>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
            <th className="py-1.5 pr-3 font-medium">Versión</th>
            <th className="py-1.5 pr-3 font-medium">Estado</th>
            <th className="py-1.5 pr-3 font-medium">Sucursal / año</th>
            <th className="py-1.5 pr-3 text-right font-medium">Total</th>
            <th className="py-1.5 pr-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {versiones.map((v) => (
            <tr key={v.id} className="border-b border-hairline hover:bg-fila">
              <td className="py-1.5 pr-3 text-tinta">v{v.version}</td>
              <td className="py-1.5 pr-3">
                <InsigniaEstadoPresupuesto estado={v.estado} />
              </td>
              <td className="py-1.5 pr-3 text-tinta-2">
                {v.sucursal} · {v.anioPrecios}
              </td>
              <td className="py-1.5 pr-3 text-right">
                <Moneda valor={v.total} />
              </td>
              <td className="py-1.5 pr-3">
                {v.id !== presupuestoId && (
                  <Link
                    href={`/presupuestos/${presupuestoId}/comparar?contra=${v.id}`}
                    className="text-[11px] text-tinta-2 hover:text-tinta hover:underline"
                  >
                    Comparar con esta
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
