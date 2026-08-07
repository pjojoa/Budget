"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { FiltroColumnaExcel } from "./FiltroColumnaExcel";

export type ColumnaTabla<T> = {
  id: string;
  encabezado: string;
  /** Valor plano para buscar, filtrar y ordenar. */
  valor: (fila: T) => string | number | boolean | null | undefined;
  celda?: (fila: T) => ReactNode;
  alinear?: "izq" | "der";
  filtrable?: boolean;
  ordenable?: boolean;
  cifra?: boolean;
  clase?: string;
};

interface Props<T> {
  datos: T[];
  columnas: ColumnaTabla<T>[];
  obtenerId: (fila: T) => string;
  seleccionable?: boolean;
  placeholderBusqueda?: string;
  /** Contenido a la derecha de la barra de búsqueda (p. ej. paginación). */
  acciones?: ReactNode;
  claseTabla?: string;
  claseFila?: (fila: T) => string | undefined;
  /** Mensaje cuando no hay filas tras filtrar. */
  vacio?: string;
}

function textoValor(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

export function TablaDatos<T>({
  datos,
  columnas,
  obtenerId,
  seleccionable = true,
  placeholderBusqueda = "Buscar en la tabla…",
  acciones,
  claseTabla = "",
  claseFila,
  vacio = "Sin resultados para los filtros actuales.",
}: Props<T>) {
  const [busqueda, setBusqueda] = useState("");
  const [filtrosColumna, setFiltrosColumna] = useState<ColumnFiltersState>([]);
  const [orden, setOrden] = useState<SortingState>([]);
  const [seleccion, setSeleccion] = useState<RowSelectionState>({});

  const defs = useMemo<ColumnDef<T, string>[]>(() => {
    const cols: ColumnDef<T, string>[] = [];

    if (seleccionable) {
      cols.push({
        id: "__sel",
        enableSorting: false,
        enableColumnFilter: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            className="accent-[var(--color-foco)]"
            aria-label="Seleccionar todas las filas visibles"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="accent-[var(--color-foco)]"
            aria-label="Seleccionar fila"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 32,
      });
    }

    for (const c of columnas) {
      cols.push({
        id: c.id,
        accessorFn: (fila) => textoValor(c.valor(fila)),
        header: c.encabezado,
        cell: ({ row }) => (c.celda ? c.celda(row.original) : textoValor(c.valor(row.original))),
        enableColumnFilter: c.filtrable !== false,
        enableSorting: c.ordenable !== false,
        filterFn: (row, columnId, filterValue: string[] | undefined) => {
          if (!filterValue || filterValue.length === 0) return true;
          return filterValue.includes(textoValor(row.getValue(columnId)));
        },
        meta: { alinear: c.alinear ?? "izq", cifra: !!c.cifra, clase: c.clase ?? "" },
      });
    }
    return cols;
  }, [columnas, seleccionable]);

  const tabla = useReactTable({
    data: datos,
    columns: defs,
    state: {
      globalFilter: busqueda,
      columnFilters: filtrosColumna,
      sorting: orden,
      rowSelection: seleccion,
    },
    getRowId: (fila) => obtenerId(fila),
    enableRowSelection: seleccionable,
    onGlobalFilterChange: setBusqueda,
    onColumnFiltersChange: setFiltrosColumna,
    onSortingChange: setOrden,
    onRowSelectionChange: setSeleccion,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const q = filterValue.trim().toLowerCase();
      if (!q) return true;
      return row.getVisibleCells().some((cell) => {
        if (cell.column.id === "__sel") return false;
        return String(cell.getValue() ?? "")
          .toLowerCase()
          .includes(q);
      });
    },
  });

  const unicosPorColumna = useMemo(() => {
    const mapa: Record<string, string[]> = {};
    for (const c of columnas) {
      if (c.filtrable === false) continue;
      const set = new Set<string>();
      for (const fila of datos) set.add(textoValor(c.valor(fila)));
      mapa[c.id] = [...set].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
    }
    return mapa;
  }, [datos, columnas]);

  const nSeleccionados = Object.keys(seleccion).filter((k) => seleccion[k]).length;
  const nVisibles = tabla.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={placeholderBusqueda}
          className="w-72 max-w-full rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta outline-none focus:border-foco"
        />
        <span className="text-[11px] text-tinta-3">
          {nVisibles.toLocaleString("es-CO")}
          {nVisibles !== datos.length ? ` de ${datos.length.toLocaleString("es-CO")}` : ""} filas
          {nSeleccionados > 0 && (
            <>
              {" · "}
              <span className="text-tinta">{nSeleccionados.toLocaleString("es-CO")} seleccionadas</span>
            </>
          )}
        </span>
        <div className="ml-auto flex items-center gap-2">{acciones}</div>
      </div>

      <div className="overflow-auto rounded-sm border border-hairline">
        <table className={`tabla ${claseTabla}`}>
          <thead>
            {tabla.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const meta = h.column.columnDef.meta as
                    | { alinear?: "izq" | "der"; cifra?: boolean; clase?: string }
                    | undefined;
                  const esSel = h.column.id === "__sel";
                  const filtro = h.column.getFilterValue() as string[] | undefined;
                  return (
                    <th
                      key={h.id}
                      className={`${esSel ? "tabla-checkbox" : ""} ${meta?.clase ?? ""}`}
                      data-alinear={esSel ? undefined : meta?.alinear}
                      style={h.column.getCanSort() && !esSel ? { cursor: "pointer", userSelect: "none" } : undefined}
                      onClick={esSel ? undefined : h.column.getToggleSortingHandler()}
                    >
                      {esSel ? (
                        flexRender(h.column.columnDef.header, h.getContext())
                      ) : (
                        <span className="inline-flex items-center">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {{
                            asc: " ↑",
                            desc: " ↓",
                          }[h.column.getIsSorted() as string] ?? null}
                          {h.column.getCanFilter() && (
                            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                              <FiltroColumnaExcel
                                etiqueta={String(h.column.columnDef.header)}
                                valoresUnicos={unicosPorColumna[h.column.id] ?? []}
                                seleccionados={filtro}
                                onCambiar={(valores) => h.column.setFilterValue(valores)}
                              />
                            </span>
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {tabla.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-seleccionada={row.getIsSelected() ? "true" : "false"}
                onClick={seleccionable ? row.getToggleSelectedHandler() : undefined}
                className={[seleccionable ? "cursor-pointer" : "", claseFila?.(row.original) ?? ""]
                  .filter(Boolean)
                  .join(" ") || undefined}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as
                    | { alinear?: "izq" | "der"; cifra?: boolean; clase?: string }
                    | undefined;
                  const esSel = cell.column.id === "__sel";
                  return (
                    <td
                      key={cell.id}
                      className={`${esSel ? "tabla-checkbox" : ""} ${meta?.cifra ? "cifra" : ""} ${meta?.clase ?? ""}`}
                      data-alinear={esSel ? undefined : meta?.alinear}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
            {nVisibles === 0 && (
              <tr>
                <td colSpan={defs.length} className="py-6 text-center text-tinta-3">
                  {vacio}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
