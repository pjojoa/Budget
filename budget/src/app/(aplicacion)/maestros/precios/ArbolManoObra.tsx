"use client";

import { useCallback, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
} from "@tanstack/react-table";
import { Moneda } from "@/componentes/dominio/Moneda";
import { FiltroColumnaExcel } from "@/componentes/ui/FiltroColumnaExcel";
import type { Sucursal } from "@/dominio/tipos";
import type { ActividadManoObra } from "@/datos/tipos";

type Nivel = 1 | 2 | 3;

/** Escala de profundidad visible: cada clic avanza o retrocede un peldaño. */
const ESCALONES: Nivel[] = [1, 2, 3];

function compararCodigo(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

function indiceEscalon(nivel: Nivel): number {
  return ESCALONES.indexOf(nivel);
}

function filtroValores(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: string[] | undefined,
): boolean {
  if (!filterValue || filterValue.length === 0) return true;
  return filterValue.includes(String(row.getValue(columnId) ?? ""));
}

function unicos(valores: string[]): string[] {
  return [...new Set(valores)].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

interface NodoManoObra {
  id: string;
  nivel: Nivel;
  codigo: string;
  etiqueta: string;
  actividad?: ActividadManoObra;
  subRows: NodoManoObra[];
}

const SUCURSALES: { clave: Sucursal; etiqueta: string }[] = [
  { clave: "BARRANQUILLA", etiqueta: "Barranquilla" },
  { clave: "BOGOTA", etiqueta: "Bogotá" },
  { clave: "BUCARAMANGA", etiqueta: "Bucaramanga" },
  { clave: "CALI", etiqueta: "Cali" },
  { clave: "CARTAGENA", etiqueta: "Cartagena" },
  { clave: "SANTA_MARTA", etiqueta: "Santa Marta" },
  { clave: "ZIPAQUIRA", etiqueta: "Zipaquira" },
];

function construirArbol(actividades: ActividadManoObra[]): NodoManoObra[] {
  const porCapitulo = new Map<string, { nombre: string; subcaps: Map<string, ActividadManoObra[]> }>();
  for (const a of actividades) {
    if (!porCapitulo.has(a.capituloCodigo)) {
      porCapitulo.set(a.capituloCodigo, { nombre: a.capitulo, subcaps: new Map() });
    }
    const cap = porCapitulo.get(a.capituloCodigo)!;
    if (!cap.subcaps.has(a.familia)) cap.subcaps.set(a.familia, []);
    cap.subcaps.get(a.familia)!.push(a);
  }

  const raices: NodoManoObra[] = [];
  for (const [codigoCap, { nombre, subcaps }] of [...porCapitulo.entries()].sort((a, b) =>
    compararCodigo(a[0], b[0]),
  )) {
    const hijosCap: NodoManoObra[] = [];
    // Familias ordenadas por el menor código de actividad (A→Z), no por nombre.
    const familiasOrdenadas = [...subcaps.entries()].sort((a, b) => {
      const minA = a[1].reduce((m, act) => (compararCodigo(act.codigo, m) < 0 ? act.codigo : m), a[1][0].codigo);
      const minB = b[1].reduce((m, act) => (compararCodigo(act.codigo, m) < 0 ? act.codigo : m), b[1][0].codigo);
      const porCodigo = compararCodigo(minA, minB);
      return porCodigo !== 0 ? porCodigo : a[0].localeCompare(b[0], "es");
    });
    for (const [familia, actividadesFam] of familiasOrdenadas) {
      const hojas = [...actividadesFam]
        .sort((a, b) => compararCodigo(a.codigo, b.codigo))
        .map(
          (a): NodoManoObra => ({
            id: a.codigo,
            nivel: 3,
            codigo: a.codigo,
            etiqueta: a.descripcion,
            actividad: a,
            subRows: [],
          }),
        );
      hijosCap.push({
        id: `${codigoCap}::${familia}`,
        nivel: 2,
        codigo: "",
        etiqueta: familia,
        subRows: hojas,
      });
    }
    raices.push({
      id: codigoCap,
      nivel: 1,
      codigo: codigoCap,
      etiqueta: nombre,
      subRows: hijosCap,
    });
  }
  return raices;
}

function expandidoHasta(nodos: NodoManoObra[], nivelMax: Nivel): ExpandedState {
  const estado: Record<string, boolean> = {};
  const recorrer = (lista: NodoManoObra[]) => {
    for (const n of lista) {
      if (n.subRows.length === 0) continue;
      estado[n.id] = n.nivel < nivelMax;
      recorrer(n.subRows);
    }
  };
  recorrer(nodos);
  return estado;
}

function textoPrecio(valor: string | undefined): string {
  return valor && valor.trim() !== "" ? valor.trim() : "";
}

export function ArbolManoObra({ filas }: { filas: ActividadManoObra[] }) {
  const [nivelVisible, setNivelVisible] = useState<Nivel>(2);
  const [expandido, setExpandido] = useState<ExpandedState>(() => expandidoHasta(construirArbol(filas), 2));
  const [filtrosColumna, setFiltrosColumna] = useState<ColumnFiltersState>([]);

  const datos = useMemo(() => construirArbol(filas), [filas]);
  const anio = filas[0]?.anio;

  const unicosPorColumna = useMemo(() => {
    const precios: Record<string, string[]> = {};
    for (const { clave } of SUCURSALES) {
      precios[`precio_${clave}`] = unicos(filas.map((a) => textoPrecio(a.precios[clave] as string | undefined)));
    }
    return {
      codigo: unicos(filas.flatMap((a) => [a.capituloCodigo, a.codigo])),
      estructura: unicos(filas.flatMap((a) => [a.capitulo, a.familia, a.descripcion])),
      unidad: unicos(filas.map((a) => a.unidad || "")),
      noInventariable: unicos(filas.map((a) => a.noInventariable ?? "Sin vínculo")),
      descripcionArticulo: unicos(filas.map((a) => a.articuloVinculado?.descripcion ?? "")),
      familiaMaestro: unicos(filas.map((a) => a.articuloVinculado?.familiaCodigo ?? "")),
      ...precios,
    };
  }, [filas]);

  const puedeExpandir = nivelVisible < 3;
  const puedeColapsar = nivelVisible > 1;
  const iActual = indiceEscalon(nivelVisible);
  const siguienteNivel = ESCALONES[Math.min(iActual + 1, ESCALONES.length - 1)];
  const anteriorNivel = ESCALONES[Math.max(iActual - 1, 0)];

  const aplicarNivelVisible = useCallback(
    (nivel: Nivel) => {
      setNivelVisible(nivel);
      setExpandido(expandidoHasta(datos, nivel));
    },
    [datos],
  );

  const columnas = useMemo<ColumnDef<NodoManoObra, string>[]>(
    () => [
      {
        id: "codigo",
        accessorFn: (n) => n.codigo,
        header: "Código",
        filterFn: filtroValores,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs text-tinta-2">{row.original.codigo}</span>
        ),
      },
      {
        id: "estructura",
        accessorFn: (n) => n.etiqueta,
        header: "Capítulo / Subcapítulo / Actividad",
        filterFn: filtroValores,
        cell: ({ row }) => {
          const n = row.original;
          const pesoTexto =
            n.nivel === 1
              ? "font-condensada uppercase font-semibold text-tinta"
              : n.nivel === 2
                ? "font-condensada uppercase text-tinta-2"
                : "text-tinta-2";
          return (
            <div className="flex min-w-0 items-center gap-1.5" style={{ paddingLeft: (n.nivel - 1) * 18 }}>
              {row.getCanExpand() ? (
                <button
                  type="button"
                  onClick={row.getToggleExpandedHandler()}
                  aria-label={row.getIsExpanded() ? "Colapsar" : "Expandir"}
                  className="flex size-4 shrink-0 items-center justify-center rounded-sm text-tinta-3 hover:bg-fila hover:text-tinta"
                >
                  <svg viewBox="0 0 12 12" fill="currentColor" className="size-2.5" aria-hidden>
                    {row.getIsExpanded() ? <path d="M2 4.5h8L6 9 2 4.5Z" /> : <path d="M4.5 2v8L9 6 4.5 2Z" />}
                  </svg>
                </button>
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
              <span className={`min-w-0 truncate ${pesoTexto}`} title={n.etiqueta}>
                {n.etiqueta}
              </span>
            </div>
          );
        },
      },
      {
        id: "unidad",
        accessorFn: (n) => n.actividad?.unidad ?? "",
        header: "UM",
        filterFn: filtroValores,
        cell: ({ row }) => row.original.actividad?.unidad ?? "",
      },
      {
        id: "noInventariable",
        accessorFn: (n) => {
          const a = n.actividad;
          if (!a) return "";
          return a.noInventariable ?? "Sin vínculo";
        },
        header: "N Inventariable",
        filterFn: filtroValores,
        cell: ({ row }) => {
          const a = row.original.actividad;
          if (!a) return "";
          if (!a.noInventariable) return <span className="text-tinta-3">Sin vínculo</span>;
          const vinculo = a.articuloVinculado;
          return (
            <span
              className="font-mono text-xs"
              title={vinculo ? undefined : "No existe hoy en el maestro de artículos"}
            >
              {a.noInventariable}
              {!vinculo && <span className="ml-1 text-error">·</span>}
            </span>
          );
        },
      },
      {
        id: "descripcionArticulo",
        accessorFn: (n) => n.actividad?.articuloVinculado?.descripcion ?? "",
        header: "Descripción artículo",
        filterFn: filtroValores,
        cell: ({ row }) => {
          const a = row.original.actividad;
          if (!a) return "";
          const desc = a.articuloVinculado?.descripcion;
          if (desc) {
            return (
              <span className="block max-w-xs truncate text-xs text-tinta-2" title={desc}>
                {desc}
              </span>
            );
          }
          if (a.noInventariable) {
            return <span className="text-[11px] text-error">Sin artículo en maestro</span>;
          }
          return "";
        },
      },
      {
        id: "familiaMaestro",
        accessorFn: (n) => n.actividad?.articuloVinculado?.familiaCodigo ?? "",
        header: "Familia",
        filterFn: filtroValores,
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.actividad?.articuloVinculado?.familiaCodigo ?? ""}</span>
        ),
      },
      ...SUCURSALES.map(
        ({ clave, etiqueta }): ColumnDef<NodoManoObra, string> => ({
          id: `precio_${clave}`,
          accessorFn: (n) => textoPrecio(n.actividad?.precios[clave] as string | undefined),
          header: etiqueta,
          filterFn: filtroValores,
          cell: ({ row }) => {
            const precio = row.original.actividad?.precios[clave];
            return row.original.nivel === 3 ? <Moneda valor={precio ?? null} decimales={2} /> : "";
          },
          meta: { alinear: "der" as const, cifra: true },
        }),
      ),
    ],
    [],
  );

  const table = useReactTable({
    data: datos,
    columns: columnas,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.subRows,
    state: { expanded: expandido, columnFilters: filtrosColumna },
    onExpandedChange: setExpandido,
    onColumnFiltersChange: setFiltrosColumna,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFromLeafRows: true,
  });

  const filasVisibles = table.getRowModel().rows;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => aplicarNivelVisible(siguienteNivel)}
          disabled={!puedeExpandir}
          aria-label={`Expandir hasta nivel ${siguienteNivel}`}
          title={puedeExpandir ? `Expandir hasta nivel ${siguienteNivel}` : "Máximo de expansión"}
          className="flex size-7 items-center justify-center rounded-sm text-tinta-3 transition-colors hover:bg-fila hover:text-tinta disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-3.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6.5 5 4l2.5 2.5M5 4v8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 9.5 11 12 8.5 9.5M11 12V4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => aplicarNivelVisible(anteriorNivel)}
          disabled={!puedeColapsar}
          aria-label={`Colapsar hasta nivel ${anteriorNivel}`}
          title={puedeColapsar ? `Colapsar hasta nivel ${anteriorNivel}` : "Mínimo de colapso"}
          className="flex size-7 items-center justify-center rounded-sm text-tinta-3 transition-colors hover:bg-fila hover:text-tinta disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-3.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 5.5 5 8l2.5-2.5M5 8V3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5 11 8 8.5 10.5M11 8v5" />
          </svg>
        </button>
        <span className="font-condensada text-[11px] uppercase tracking-wide text-tinta-3">
          Hasta N{nivelVisible}
        </span>
        <span className="text-[11px] text-tinta-3">
          {filasVisibles.length.toLocaleString("es-CO")} visibles · {filas.length.toLocaleString("es-CO")} actividades
          · precios con IVA
          {anio ? `, año ${anio}` : ""}.
        </span>
      </div>

      <div className="tabla-marco flex-1">
        <table className="tabla" role="treegrid">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const meta = h.column.columnDef.meta as { alinear?: "izq" | "der" } | undefined;
                  const filtroCol = h.column.getFilterValue() as string[] | undefined;
                  const id = h.column.id as keyof typeof unicosPorColumna;
                  return (
                    <th key={h.id} data-alinear={meta?.alinear}>
                      <span className="inline-flex items-center">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getCanFilter() && (
                          <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <FiltroColumnaExcel
                              etiqueta={String(h.column.columnDef.header)}
                              valoresUnicos={unicosPorColumna[id] ?? []}
                              seleccionados={filtroCol}
                              onCambiar={(valores) => h.column.setFilterValue(valores)}
                            />
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {filasVisibles.map((row) => (
              <tr key={row.id} role="row" aria-level={row.original.nivel}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as { alinear?: "izq" | "der"; cifra?: boolean } | undefined;
                  return (
                    <td key={cell.id} data-alinear={meta?.alinear} className={meta?.cifra ? "cifra" : ""}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filasVisibles.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="py-6 text-center text-tinta-3">
                  Sin resultados para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
