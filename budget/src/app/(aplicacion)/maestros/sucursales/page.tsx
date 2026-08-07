import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { puedeEditarMaestros } from "@/datos/contexto";
import { TablaSucursales } from "./TablaSucursales";

export default async function PaginaSucursales() {
  const ctx = await obtenerContextoActual();
  const sucursales = await repositorioMaestros.listarCatalogoSucursales(ctx);
  const editable = puedeEditarMaestros(ctx);

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Sucursales <span className="text-tinta-3">({sucursales.length})</span>
        {!editable && <span className="ml-2 text-[11px] font-normal normal-case text-tinta-3">solo lectura</span>}
      </h1>
      <TablaSucursales filas={sucursales} editable={editable} />
    </div>
  );
}
