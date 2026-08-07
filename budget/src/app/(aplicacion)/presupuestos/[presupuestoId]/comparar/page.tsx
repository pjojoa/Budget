import { repositorioAnalisis, repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { CodigoCuenta } from "@/componentes/dominio/CodigoCuenta";
import { Moneda } from "@/componentes/dominio/Moneda";
import { Delta } from "@/componentes/dominio/Delta";

export default async function PaginaComparar({
  params,
  searchParams,
}: {
  params: Promise<{ presupuestoId: string }>;
  searchParams: Promise<{ contra?: string }>;
}) {
  const { presupuestoId } = await params;
  const { contra } = await searchParams;
  const ctx = await obtenerContextoActual();

  if (!contra) {
    const { filas } = await repositorioPresupuestos.listar(ctx, {});
    return (
      <div className="p-4 text-xs text-tinta-2">
        Elige una versión desde la pestaña{" "}
        <a href={`/presupuestos/${presupuestoId}/versiones`} className="text-tinta hover:underline">
          Versiones
        </a>{" "}
        para comparar. Disponibles: {filas.map((f) => f.proyecto).join(", ")}
      </div>
    );
  }

  const filas = await repositorioAnalisis.comparar(ctx, presupuestoId, contra, 5);
  const cabA = await repositorioPresupuestos.obtenerCabecera(ctx, presupuestoId);
  const cabB = await repositorioPresupuestos.obtenerCabecera(ctx, contra);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
          Comparar versiones
        </h1>
        <p className="text-[11px] text-tinta-2">
          A: v{cabA?.version} ({cabA?.sucursal} {cabA?.anioPrecios}) · B: v{cabB?.version} ({cabB?.sucursal}{" "}
          {cabB?.anioPrecios})
        </p>
      </div>
      {cabA && cabB && (
        <div className="mb-3 flex items-center gap-4 rounded-sm border border-hairline bg-panel px-3 py-2 text-xs">
          <span className="text-tinta-2">Total A</span>
          <Moneda valor={cabA.total} />
          <span className="text-tinta-2">Total B</span>
          <Moneda valor={cabB.total} />
          <span className="text-tinta-2">Delta</span>
          <Delta anterior={cabA.total} nuevo={cabB.total} />
        </div>
      )}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-hairline text-left font-condensada uppercase tracking-wide text-tinta-3">
            <th className="py-1.5 pr-3 font-medium">Código</th>
            <th className="py-1.5 pr-3 font-medium">Descripción</th>
            <th className="py-1.5 pr-3 text-right font-medium">Valor A</th>
            <th className="py-1.5 pr-3 text-right font-medium">Valor B</th>
            <th className="py-1.5 pr-3 text-right font-medium">Delta</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.codigo} className="border-b border-hairline hover:bg-fila">
              <td className="py-1.5 pr-3">
                <CodigoCuenta codigo={f.codigo} />
              </td>
              <td className="py-1.5 pr-3 text-tinta-2">{f.descripcion}</td>
              <td className="py-1.5 pr-3 text-right">
                <Moneda valor={f.valorA} />
              </td>
              <td className="py-1.5 pr-3 text-right">
                <Moneda valor={f.valorB} />
              </td>
              <td className="py-1.5 pr-3 text-right">
                <Delta anterior={f.valorA} nuevo={f.valorB} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
