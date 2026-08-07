import { establecerContextoPrecio } from "@/datos/simulado/acciones";
import { repositorioSesion } from "@/datos";
import { obtenerContextoActual } from "@/datos/simulado/sesion";

const ANIOS = [2025, 2026, 2027, 2028];

export default async function PaginaContexto() {
  const ctx = await obtenerContextoActual();
  // sucursalesPermitidas, NO listarSucursales: aquí se elige en qué sucursal
  // trabaja la sesión, y eso debe restringirse a las del usuario — listarSucursales
  // es el maestro completo (correcto para /maestros, incorrecto aquí).
  const sucursales = await repositorioSesion.sucursalesPermitidas(ctx);

  return (
    <div className="space-y-4 rounded-md border border-hairline bg-panel p-5">
      <div>
        <p className="text-xs text-tinta">Hola, {ctx.nombre}.</p>
        <p className="mt-1 text-xs text-tinta-2">
          Elige la sucursal y el año de precios. Esta es la restricción que congela el catálogo — una obra usa una
          sola sucursal y un solo año, nunca se mezclan.
        </p>
      </div>
      <FormularioContexto sucursales={sucursales} />
    </div>
  );
}

function FormularioContexto({ sucursales }: { sucursales: string[] }) {
  async function accion(formData: FormData) {
    "use server";
    const sucursal = String(formData.get("sucursal"));
    const anio = Number(formData.get("anio"));
    await establecerContextoPrecio(sucursal, anio);
  }

  return (
    <form action={accion} className="space-y-3">
      <label className="block text-xs text-tinta-2">
        Sucursal
        <select
          name="sucursal"
          required
          defaultValue={sucursales[0]}
          className="mt-1 block w-full rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-xs text-tinta"
        >
          {sucursales.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-tinta-2">
        Año de precios
        <select
          name="anio"
          required
          defaultValue={2025}
          className="mt-1 block w-full rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-xs text-tinta"
        >
          {ANIOS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="w-full rounded-sm bg-tinta px-3 py-2 text-xs font-medium text-lienzo hover:opacity-90"
      >
        Continuar
      </button>
    </form>
  );
}
