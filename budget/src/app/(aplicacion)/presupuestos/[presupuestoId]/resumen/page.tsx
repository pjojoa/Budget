import { repositorioAnalisis } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { TablaResumen } from "./TablaResumen";

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
        <TablaResumen filas={filas} />
      )}
    </div>
  );
}
