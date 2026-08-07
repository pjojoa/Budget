import { repositorioAnalisis } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { TablaExplosion } from "./TablaExplosion";

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
      {filas.length > 0 && <TablaExplosion filas={filas} corteParetoIndice={corteParetoIndice} />}
    </div>
  );
}
