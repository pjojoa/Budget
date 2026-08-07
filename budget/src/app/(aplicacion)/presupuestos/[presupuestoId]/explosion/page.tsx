import { repositorioAnalisis } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { Moneda } from "@/componentes/dominio/Moneda";
import { formatearRendimiento } from "@/dominio/decimal";

export default async function PaginaExplosion({ params }: { params: Promise<{ presupuestoId: string }> }) {
  const { presupuestoId } = await params;
  const ctx = await obtenerContextoActual();
  const { filas, corteParetoIndice } = await repositorioAnalisis.explosion(ctx, presupuestoId, {});

  return (
    <div className="p-4">
      <div className="mb-3">
        <h1 className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
          Explosión de insumos
        </h1>
        <p className="text-[11px] text-tinta-3">
          {filas.length === 0
            ? "Este presupuesto todavía no tiene insumos."
            : `${filas.length} insumos distintos. ${corteParetoIndice} concentran el 80% del costo (${((corteParetoIndice / filas.length) * 100).toFixed(1)}% del catálogo).`}
        </p>
      </div>
      {filas.length > 0 && (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
              <th className="py-1.5 pr-3 font-medium">Código</th>
              <th className="py-1.5 pr-3 font-medium">Descripción</th>
              <th className="py-1.5 pr-3 font-medium">UM</th>
              <th className="py-1.5 pr-3 text-right font-medium">Cantidad</th>
              <th className="py-1.5 pr-3 text-right font-medium">Importe</th>
              <th className="py-1.5 pr-3 text-right font-medium">%</th>
              <th className="py-1.5 pr-3 text-right font-medium">Acum.%</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr
                key={f.codigo}
                className={`border-b border-hairline hover:bg-fila ${i === corteParetoIndice - 1 ? "border-b-2 border-b-tinta" : ""}`}
              >
                <td className="py-1.5 pr-3 font-mono text-tinta">{f.codigo}</td>
                <td className="py-1.5 pr-3 text-tinta-2" title={f.descripcion}>
                  {f.descripcion}
                </td>
                <td className="py-1.5 pr-3 text-tinta-3">{f.unidad}</td>
                <td className="cifra py-1.5 pr-3">{formatearRendimiento(f.cantidad, 2)}</td>
                <td className="py-1.5 pr-3 text-right">
                  <Moneda valor={f.importe} />
                </td>
                <td className={`cifra py-1.5 pr-3 ${i < corteParetoIndice ? "text-tinta" : "text-tinta-2"}`}>
                  {f.incidenciaPct}
                </td>
                <td className="cifra py-1.5 pr-3 text-tinta-2">{f.acumuladoPct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
