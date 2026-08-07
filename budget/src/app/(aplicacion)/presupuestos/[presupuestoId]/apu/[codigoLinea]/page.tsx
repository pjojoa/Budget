import { notFound } from "next/navigation";
import { repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { Moneda } from "@/componentes/dominio/Moneda";
import { BadgeOrigenPrecio } from "@/componentes/dominio/Insignias";
import { formatearRendimiento } from "@/dominio/decimal";

export default async function PaginaApu({
  params,
}: {
  params: Promise<{ presupuestoId: string; codigoLinea: string }>;
}) {
  const { presupuestoId, codigoLinea } = await params;
  const codigo = decodeURIComponent(codigoLinea);
  const ctx = await obtenerContextoActual();
  const insumos = await repositorioPresupuestos.obtenerApu(ctx, presupuestoId, codigo);
  if (insumos.length === 0) notFound();

  return (
    <div className="p-4">
      <h1 className="mb-3 flex items-center gap-2 font-condensada text-sm uppercase tracking-wide text-tinta">
        APU <CodigoCuenta codigo={codigo} />
      </h1>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
            <th className="py-1.5 pr-3 font-medium">Insumo</th>
            <th className="py-1.5 pr-3 font-medium">Descripción</th>
            <th className="py-1.5 pr-3 font-medium">UM</th>
            <th className="py-1.5 pr-3 text-right font-medium">Rendimiento</th>
            <th className="py-1.5 pr-3 text-right font-medium">Precio</th>
            <th className="py-1.5 pr-3 text-right font-medium">Parcial</th>
            <th className="py-1.5 pr-3 font-medium">Origen</th>
          </tr>
        </thead>
        <tbody>
          {insumos.map((i) => (
            <tr key={i.codigo} className="border-b border-hairline hover:bg-fila">
              <td className="py-1.5 pr-3 font-mono text-tinta">{i.codigo}</td>
              <td className="py-1.5 pr-3 text-tinta-2" title={i.descripcionObra}>
                {i.descripcionObra}
              </td>
              <td className="py-1.5 pr-3 text-tinta-3">{i.unidad}</td>
              <td className="cifra py-1.5 pr-3">{formatearRendimiento(i.rendimiento)}</td>
              <td className="py-1.5 pr-3 text-right">
                <Moneda valor={i.precio} decimales={2} />
              </td>
              <td className="py-1.5 pr-3 text-right">
                <Moneda valor={i.parcial} />
              </td>
              <td className="py-1.5 pr-3">
                <BadgeOrigenPrecio origen={i.origenPrecio} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
