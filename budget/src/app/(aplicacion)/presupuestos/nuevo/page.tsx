import { repositorioSesion } from "@/datos";
import { obtenerContextoActual, obtenerContextoPrecioActual } from "@/datos/simulado/sesion";
import { Boton } from "@/componentes/ui/Boton";

const PLANTILLAS = [
  { valor: "EDIFICACION", etiqueta: "Edificación (cap. 01–21)" },
  { valor: "URBANISMO_INTERNO", etiqueta: "Urbanismo interno (cap. 22–28)" },
  { valor: "URBANISMO_EXTERNO", etiqueta: "Urbanismo externo (cap. 29–39)" },
] as const;

export default async function PaginaNuevoPresupuesto() {
  const ctx = await obtenerContextoActual();
  const { sucursal, anio } = await obtenerContextoPrecioActual();
  // Igual que en /contexto: aquí se elige DÓNDE se crea el presupuesto, así
  // que se restringe a las sucursales del usuario, no al maestro completo.
  const sucursales = await repositorioSesion.sucursalesPermitidas(ctx);

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-1 font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">
        Nuevo presupuesto
      </h1>
      <p className="mb-4 text-xs text-tinta-2">
        Sin sucursal y año de precios no se puede precificar nada — por eso se piden primero.
      </p>

      <form className="space-y-3 rounded-md border border-hairline bg-panel p-4">
        <Campo etiqueta="Proyecto">
          <input
            name="proyecto"
            required
            placeholder="p. ej. TORRE 4 ETAPA II"
            className="w-full rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-xs text-tinta"
          />
        </Campo>
        <Campo etiqueta="Sucursal">
          <select
            name="sucursal"
            defaultValue={sucursal ?? sucursales[0]}
            className="w-full rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-xs text-tinta"
          >
            {sucursales.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Año de precios">
          <input
            name="anio"
            type="number"
            defaultValue={anio ?? 2025}
            className="w-full rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-xs text-tinta"
          />
        </Campo>
        <Campo etiqueta="Plantilla">
          <select name="plantilla" className="w-full rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-xs text-tinta">
            {PLANTILLAS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="N.° de inmuebles">
            <input
              name="nInmuebles"
              type="number"
              defaultValue={1}
              className="w-full rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-xs text-tinta"
            />
          </Campo>
          <Campo etiqueta="Área promedio (m²)">
            <input
              name="areaInmuebleM2"
              type="number"
              step="0.01"
              className="w-full rounded-sm border border-hairline bg-lienzo px-2 py-1.5 text-xs text-tinta"
            />
          </Campo>
        </div>

        <p className="rounded-sm border border-dashed border-hairline p-2 text-[11px] text-tinta-3">
          En este esqueleto, crear un presupuesto en blanco todavía no persiste — el flujo real (con el motor de
          cálculo conectado) llega en la Fase 1. Puedes explorar las dos obras reales ya cargadas desde la lista.
        </p>

        <Boton variante="primario" type="submit" disabled className="w-full">
          Crear presupuesto (Fase 1)
        </Boton>
      </form>
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-tinta-2">
      {etiqueta}
      <div className="mt-1">{children}</div>
    </label>
  );
}
