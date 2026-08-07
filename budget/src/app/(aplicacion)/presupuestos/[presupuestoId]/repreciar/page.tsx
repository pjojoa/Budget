import { redirect } from "next/navigation";
import { repositorioAnalisis, repositorioMaestros, repositorioPresupuestos } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";
import { Moneda } from "@/componentes/dominio/Moneda";
import { Delta } from "@/componentes/dominio/Delta";
import type { Sucursal } from "@/dominio/tipos";

export default async function PaginaRepreciar({
  params,
  searchParams,
}: {
  params: Promise<{ presupuestoId: string }>;
  searchParams: Promise<{ sucursal?: string; anio?: string }>;
}) {
  const { presupuestoId } = await params;
  const { sucursal, anio } = await searchParams;
  const ctx = await obtenerContextoActual();
  const sucursales = await repositorioMaestros.listarSucursales(ctx);

  const destino = sucursal && anio ? { sucursal: sucursal as Sucursal, anio: Number(anio) } : null;
  const resultado = destino ? await repositorioAnalisis.previsualizarRepricing(ctx, presupuestoId, destino) : null;

  async function generarVersion(formData: FormData) {
    "use server";
    const contexto = await obtenerContextoActual();
    const destinoForm = {
      sucursal: String(formData.get("sucursal")) as Sucursal,
      anio: Number(formData.get("anio")),
    };
    const nuevoId = await repositorioPresupuestos.generarVersionRepreciada(contexto, presupuestoId, destinoForm);
    redirect(`/presupuestos/${nuevoId}/resumen`);
  }

  return (
    <div className="p-4">
      <h1 className="mb-1 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">Repreciar</h1>
      <p className="mb-3 text-[11px] text-tinta-2">
        Repreciar genera una versión nueva — nunca edita en sitio. Esta pantalla solo previsualiza el impacto.
      </p>

      <form className="mb-4 flex items-end gap-3 rounded-sm border border-hairline bg-panel p-3 text-xs">
        <label className="block text-tinta-2">
          Sucursal destino
          <select
            name="sucursal"
            defaultValue={sucursal ?? sucursales[0]}
            className="mt-1 block rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-tinta"
          >
            {sucursales.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-tinta-2">
          Año destino
          <input
            name="anio"
            type="number"
            defaultValue={anio ?? 2027}
            className="mt-1 block w-24 rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-tinta"
          />
        </label>
        <button type="submit" className="rounded-sm bg-tinta px-3 py-1.5 text-xs font-medium text-lienzo">
          Previsualizar
        </button>
      </form>

      {resultado && (
        <div className="grid max-w-md grid-cols-2 gap-x-6 gap-y-2 rounded-sm border border-hairline bg-panel p-4 text-xs">
          <span className="text-tinta-2">Insumos actualizados</span>
          <span className="cifra text-tinta">{resultado.insumosActualizados}</span>
          <span className="text-tinta-2">Insumos sin precio</span>
          <span className="cifra text-aviso">{resultado.sinPrecio}</span>
          <span className="text-tinta-2">Total anterior</span>
          <Moneda valor={resultado.totalAnterior} />
          <span className="text-tinta-2">Total nuevo</span>
          <Moneda valor={resultado.totalNuevo} />
          <span className="text-tinta-2">Variación</span>
          <Delta anterior={resultado.totalAnterior} nuevo={resultado.totalNuevo} />
        </div>
      )}

      {resultado && destino && (
        <form action={generarVersion} className="mt-4">
          <input type="hidden" name="sucursal" value={destino.sucursal} />
          <input type="hidden" name="anio" value={destino.anio} />
          <button type="submit" className="rounded-sm bg-tinta px-3 py-1.5 text-xs font-medium text-lienzo">
            Generar versión con estos precios
          </button>
          <p className="mt-1 text-[11px] text-tinta-3">
            Crea una versión nueva en borrador — esta no se modifica.
          </p>
        </form>
      )}
    </div>
  );
}
