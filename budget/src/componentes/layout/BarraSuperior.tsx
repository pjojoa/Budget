import { cerrarSesion } from "@/datos/simulado/acciones";
import { ChipSucursalAnio } from "@/componentes/dominio/ChipSucursalAnio";
import { SelectorTema } from "./SelectorTema";
import { SelectorUsuarioDemo } from "./SelectorUsuarioDemo";
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
        <SelectorUsuarioDemo usuarioIdActual={ctx.usuarioId} nombreActual={ctx.nombre} />
        <form action={cerrarSesion}>
          <button
            type="submit"
            aria-label="Salir"
            title="Salir"
            className="flex size-7 items-center justify-center rounded-sm text-tinta-3 transition-colors hover:bg-fila hover:text-tinta"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-3.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13H6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h7m0 0-2.5-2.5M14 8l-2.5 2.5" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
