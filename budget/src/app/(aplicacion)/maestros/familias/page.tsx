import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { TablaFamilias } from "./TablaFamilias";

export default async function PaginaFamilias() {
  const ctx = await obtenerContextoActual();
  const familias = await repositorioMaestros.listarFamilias(ctx);

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Familias <span className="text-tinta-3">({familias.length})</span>
      </h1>
      <TablaFamilias filas={familias} />
    </div>
  );
}
