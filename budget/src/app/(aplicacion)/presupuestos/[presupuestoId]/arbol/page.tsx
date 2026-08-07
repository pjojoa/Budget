import { notFound } from "next/navigation";
import { repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { ArbolPresupuesto } from "@/componentes/arbol/ArbolPresupuesto";

export default async function PaginaArbol({ params }: { params: Promise<{ presupuestoId: string }> }) {
  const { presupuestoId } = await params;
  const ctx = await obtenerContextoActual();
  const [resultado, cabecera] = await Promise.all([
    repositorioPresupuestos.obtenerArbol(ctx, presupuestoId),
    repositorioPresupuestos.obtenerCabecera(ctx, presupuestoId),
  ]);
  if (!resultado || !cabecera) notFound();

  const editable = ctx.roles.includes("PRESUPUESTADOR") && cabecera.estado === "BORRADOR";

  return (
    <div className="h-full">
      <ArbolPresupuesto
        presupuestoId={presupuestoId}
        lineas={resultado.lineas}
        marcaVersionInicial={resultado.marcaVersion}
        editable={editable}
      />
    </div>
  );
}
