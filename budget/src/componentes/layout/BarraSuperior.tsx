import { cerrarSesion } from "@/datos/simulado/acciones";
import { ChipSucursalAnio } from "@/componentes/dominio/ChipSucursalAnio";
import { SelectorTema } from "./SelectorTema";
import type { ContextoAcceso } from "@/datos/contexto";

interface Props {
  ctx: ContextoAcceso;
  sucursalActiva: string | null;
  anioActivo: number | null;
}

export function BarraSuperior({ ctx, sucursalActiva, anioActivo }: Props) {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-hairline bg-panel px-3">
      <div className="flex items-center gap-3">
        <span className="font-condensada text-sm font-semibold uppercase tracking-wide text-tinta">Budget</span>
        <ChipSucursalAnio sucursal={sucursalActiva} anio={anioActivo} />
      </div>
      <div className="flex items-center gap-3">
        <SelectorTema />
        <span className="text-xs text-tinta-2">{ctx.nombre}</span>
        <form action={cerrarSesion}>
          <button type="submit" className="text-xs text-tinta-3 hover:text-tinta">
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
