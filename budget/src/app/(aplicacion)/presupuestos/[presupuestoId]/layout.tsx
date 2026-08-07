import { notFound } from "next/navigation";
import { repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { CabeceraPresupuesto } from "@/componentes/layout/CabeceraPresupuesto";
import { PestanasPresupuesto } from "@/componentes/layout/PestanasPresupuesto";

export default async function LayoutPresupuesto({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ presupuestoId: string }>;
}) {
  const { presupuestoId } = await params;
  const ctx = await obtenerContextoActual();
  const cabecera = await repositorioPresupuestos.obtenerCabecera(ctx, presupuestoId);
  if (!cabecera) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-hairline bg-panel">
        <CabeceraPresupuesto cabecera={cabecera} />
        <PestanasPresupuesto id={presupuestoId} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
