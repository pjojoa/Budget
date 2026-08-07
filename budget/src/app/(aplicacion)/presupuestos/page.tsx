import Link from "next/link";
import { repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { Boton } from "@/componentes/ui/Boton";
import { TablaPresupuestos } from "./TablaPresupuestos";

export default async function PaginaPresupuestos() {
  const ctx = await obtenerContextoActual();
  const pagina = await repositorioPresupuestos.listar(ctx, {});

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">Presupuestos</h1>
        <Link href="/presupuestos/nuevo">
          <Boton variante="primario">Nuevo presupuesto</Boton>
        </Link>
      </div>

      {pagina.filas.length === 0 ? (
        <div className="rounded-md border border-dashed border-hairline p-8 text-center text-xs text-tinta-2">
          No hay presupuestos visibles para tu sucursal todavía.
        </div>
      ) : (
        <TablaPresupuestos filas={pagina.filas} />
      )}
    </div>
  );
}
