import { repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { TablaVersiones } from "./TablaVersiones";

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
      <TablaVersiones versiones={versiones} presupuestoId={presupuestoId} />
    </div>
  );
}
