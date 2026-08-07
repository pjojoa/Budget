import { repositorioMaestros } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";

export default async function PaginaSucursales() {
  const ctx = await obtenerContextoActual();
  const sucursales = await repositorioMaestros.listarSucursales(ctx);

  return (
    <div className="p-4">
      <h1 className="mb-3 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Sucursales <span className="text-tinta-3">({sucursales.length})</span>
      </h1>
      <ul className="max-w-sm space-y-1 text-xs">
        {sucursales.map((s) => (
          <li key={s} className="border-b border-hairline py-1.5 text-tinta-2">
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
