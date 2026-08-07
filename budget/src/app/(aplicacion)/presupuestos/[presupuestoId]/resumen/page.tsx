import { repositorioAnalisis } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { Moneda } from "@/componentes/dominio/Moneda";
import { BarraIncidencia } from "@/componentes/dominio/BarraIncidencia";
import { comparar } from "@/dominio/decimal";

export default async function PaginaResumen({ params }: { params: Promise<{ presupuestoId: string }> }) {
  const { presupuestoId } = await params;
  const ctx = await obtenerContextoActual();
  const filas = await repositorioAnalisis.resumen(ctx, presupuestoId, 4);

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Resumen ejecutivo por capítulo
      </h1>
      {filas.length === 0 ? (
        <p className="text-xs text-tinta-3">Este presupuesto todavía no tiene capítulos.</p>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
              <th className="py-1.5 pr-3 font-medium">Capítulo</th>
              <th className="py-1.5 pr-3 font-medium">Descripción</th>
              <th className="py-1.5 pr-3 text-right font-medium">Valor total</th>
              <th className="py-1.5 pr-3 font-medium">Incidencia</th>
              <th className="py-1.5 pr-3 text-right font-medium">$/m²</th>
            </tr>
          </thead>
          <tbody>
            {filas
              .slice()
              .sort((a, b) => comparar(b.valorTotal, a.valorTotal))
              .map((f) => (
                <tr key={f.codigo} className="border-b border-hairline hover:bg-fila">
                  <td className="py-1.5 pr-3">
                    <CodigoCuenta codigo={f.codigo} />
                  </td>
                  <td className="py-1.5 pr-3 font-condensada uppercase text-tinta">{f.descripcion}</td>
                  <td className="py-1.5 pr-3 text-right">
                    <Moneda valor={f.valorTotal} />
                  </td>
                  <td className="py-1.5 pr-3" style={{ width: 160 }}>
                    <BarraIncidencia pct={f.incidenciaPct} destacada />
                  </td>
                  <td className="py-1.5 pr-3 text-right">
                    <Moneda valor={f.valorM2} decimales={2} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
