import { memo } from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import type { LineaNodo } from "./useModeloArbol";
import { ANCHO_COLUMNA, ALTURA_FILA } from "./columnas";

interface Props {
  row: Row<LineaNodo>;
  rowIndex: number;
  start: number;
  activa: boolean;
  columnaActiva: string;
  conCambios: boolean;
  onClicCelda: (columna: string) => void;
}

const NIVEL_A_ARIA: Record<LineaNodo["nivel"], number> = { 4: 1, 5: 2, 8: 3, 10: 4 };

/**
 * React.memo a propósito: con 1.500 líneas, un componente de fila que
 * consuma contexto de React re-renderizaría todas las filas al mover el
 * foco. Esta fila solo depende de sus props — nada de contexto, nada de
 * store completo. Roving tabindex: solo la celda activa es alcanzable con
 * Tab/foco programático; el resto queda en -1.
 */
export const FilaArbol = memo(function FilaArbol({
  row,
  rowIndex,
  start,
  activa,
  columnaActiva,
  conCambios,
  onClicCelda,
}: Props) {
  return (
    <div
      role="row"
      data-codigo={row.original.codigo}
      aria-level={NIVEL_A_ARIA[row.original.nivel]}
      aria-rowindex={rowIndex + 1}
      aria-expanded={row.getCanExpand() ? row.getIsExpanded() : undefined}
      className={`absolute left-0 top-0 flex w-full items-center gap-2 border-b border-hairline pl-1 pr-2 ${
        activa ? "bg-fila" : "hover:bg-fila"
      }`}
      style={{ height: ALTURA_FILA, transform: `translateY(${start}px)` }}
    >
      {conCambios && <span aria-hidden className="absolute left-0 top-0 h-full w-0.5 bg-tinta" />}
      {row.getVisibleCells().map((cell) => {
        const ancho = ANCHO_COLUMNA[cell.column.id as keyof typeof ANCHO_COLUMNA];
        const esCeldaActiva = activa && columnaActiva === cell.column.id;
        return (
          <div
            key={cell.id}
            role="gridcell"
            tabIndex={esCeldaActiva ? 0 : -1}
            data-celda={`${row.original.codigo}|${cell.column.id}`}
            onClick={() => onClicCelda(cell.column.id)}
            className={`${ancho ? "shrink-0 overflow-hidden" : "min-w-0 flex-1 overflow-hidden"}`}
            style={ancho ? { width: ancho } : undefined}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        );
      })}
    </div>
  );
});
