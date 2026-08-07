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
      <table className="tabla">
        <thead>
          <tr>
            <th>Insumo</th>
            <th>Descripción</th>
            <th>UM</th>
            <th data-alinear="der">Rendimiento</th>
            <th data-alinear="der">Precio</th>
            <th data-alinear="der">Parcial</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          {insumos.map((i) => (
            <tr key={i.codigo}>
              <td className="font-mono text-tinta">{i.codigo}</td>
              <td className="text-tinta-2" title={i.descripcionObra}>
                {i.descripcionObra}
              </td>
              <td className="text-tinta-3">{i.unidad}</td>
              <td className="cifra">{formatearRendimiento(i.rendimiento)}</td>
              <td data-alinear="der">
                <Moneda valor={i.precio} decimales={2} />
              </td>
              <td data-alinear="der">
                <Moneda valor={i.parcial} />
              </td>
              <td>
                <BadgeOrigenPrecio origen={i.origenPrecio} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
