"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import { Moneda } from "@/componentes/dominio/Moneda";
import type { Sucursal } from "@/dominio/tipos";
import type { ActividadManoObra } from "@/datos/tipos";

type Nivel = 1 | 2 | 3;

interface NodoManoObra {
  id: string;
  nivel: Nivel;
  codigo: string;
  etiqueta: string;
  nActividades: number;
  actividad?: ActividadManoObra;
  subRows: NodoManoObra[];
}

const SUCURSALES: { clave: Sucursal; etiqueta: string }[] = [
  { clave: "BARRANQUILLA", etiqueta: "Barranquilla" },
  { clave: "BOGOTA", etiqueta: "Bogotá" },
  { clave: "BUCARAMANGA", etiqueta: "Bucaramanga" },
  { clave: "CALI", etiqueta: "Cali" },
  { clave: "CARTAGENA", etiqueta: "Cartagena" },
  { clave: "RICAURTE", etiqueta: "Ricaurte" },
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
    a[0].localeCompare(b[0]),
  )) {
    const hijosCap: NodoManoObra[] = [];
    let totalCap = 0;
    for (const [familia, actividadesFam] of [...subcaps.entries()].sort((a, b) =>
      a[0].localeCompare(b[0], "es"),
    )) {
      const hojas = [...actividadesFam]
        .sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true }))
        .map(
          (a): NodoManoObra => ({
            id: a.codigo,
            nivel: 3,
            codigo: a.codigo,
            etiqueta: a.descripcion,
            nActividades: 1,
            actividad: a,
            subRows: [],
          }),
        );
      hijosCap.push({
        id: `${codigoCap}::${familia}`,
        nivel: 2,
        codigo: "",
        etiqueta: familia,
        nActividades: hojas.length,
        subRows: hojas,
      });
      totalCap += hojas.length;
    }
    raices.push({
      id: codigoCap,
      nivel: 1,
      codigo: codigoCap,
      etiqueta: nombre,
      nActividades: totalCap,
      subRows: hijosCap,
    });
  }
  return raices;
}

function coincide(nodo: NodoManoObra, texto: string): boolean {
  const t = texto.toLowerCase();
  if (nodo.etiqueta.toLowerCase().includes(t) || nodo.codigo.toLowerCase().includes(t)) return true;
  const a = nodo.actividad;
  if (!a) return false;
  return (
    (a.noInventariable ?? "").toLowerCase().includes(t) ||
    (a.articuloVinculado?.descripcion ?? "").toLowerCase().includes(t) ||
    (a.articuloVinculado?.familiaNombre ?? "").toLowerCase().includes(t) ||
    (a.articuloVinculado?.familiaCodigo ?? "").toLowerCase().includes(t)
  );
}

function contarHojas(nodos: NodoManoObra[]): number {
  return nodos.reduce((acc, n) => acc + (n.subRows.length === 0 ? 1 : contarHojas(n.subRows)), 0);
}

/**
 * Poda el árbol en JS puro en vez de usar `getFilteredRowModel` de
 * TanStack: con datos de árbol vía `getSubRows`, el filtrado global de
 * TanStack no recorre bien los niveles intermedios (probado — con
 * `filterFromLeafRows` + `globalFilterFn` el predicado nunca se invoca).
 * Si el nodo mismo hace match (p. ej. el nombre del subcapítulo), se
 * conserva completo; si no, se conserva solo si algún descendiente matchea.
 */
function filtrarArbol(nodos: NodoManoObra[], texto: string): NodoManoObra[] {
  const resultado: NodoManoObra[] = [];
  for (const n of nodos) {
    if (n.subRows.length === 0) {
      if (coincide(n, texto)) resultado.push(n);
      continue;
    }
    if (coincide(n, texto)) {
      resultado.push(n);
      continue;
    }
    const hijosFiltrados = filtrarArbol(n.subRows, texto);
    if (hijosFiltrados.length > 0) {
      resultado.push({ ...n, subRows: hijosFiltrados, nActividades: contarHojas(hijosFiltrados) });
    }
  }
  return resultado;
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

export function ArbolManoObra({ filas }: { filas: ActividadManoObra[] }) {
  const [filtro, setFiltro] = useState("");
  const [expandido, setExpandido] = useState<ExpandedState>(() => expandidoHasta(construirArbol(filas), 2));

  const datos = useMemo(() => construirArbol(filas), [filas]);
  const textoFiltro = filtro.trim();
  const datosVisibles = useMemo(
    () => (textoFiltro ? filtrarArbol(datos, textoFiltro) : datos),
    [datos, textoFiltro],
  );
  const anio = filas[0]?.anio;

  const columnas = useMemo<ColumnDef<NodoManoObra, string>[]>(
    () => [
      {
        id: "codigo",
        header: "Código",
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs text-tinta-2">{row.original.codigo}</span>
        ),
      },
      {
        id: "estructura",
        header: "Capítulo / Subcapítulo / Actividad",
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
              {n.nivel < 3 && (
                <span className="shrink-0 text-[11px] text-tinta-3">
                  ({n.nActividades.toLocaleString("es-CO")})
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "unidad",
        header: "UM",
        cell: ({ row }) => row.original.actividad?.unidad ?? "",
      },
      {
        id: "noInventariable",
        header: "N Inventariable",
        cell: ({ row }) => {
          const a = row.original.actividad;
          if (!a) return "";
          if (!a.noInventariable) return <span className="text-tinta-3">Sin vínculo</span>;
          const vinculo = a.articuloVinculado;
          return (
            <span
              className="font-mono text-xs"
              title={vinculo ? `${vinculo.descripcion} · familia ${vinculo.familiaNombre}` : "No existe hoy en el maestro de artículos"}
            >
              {a.noInventariable}
              {!vinculo && <span className="ml-1 text-error">·</span>}
            </span>
          );
        },
      },
      {
        id: "familiaMaestro",
        header: "Familia",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.actividad?.articuloVinculado?.familiaCodigo ?? ""}</span>
        ),
      },
      ...SUCURSALES.map(
        ({ clave, etiqueta }): ColumnDef<NodoManoObra, string> => ({
          id: `precio_${clave}`,
          header: etiqueta,
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
    data: datosVisibles,
    columns: columnas,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.subRows,
    // Mientras hay una búsqueda activa el árbol ya viene podado (ver
    // filtrarArbol) y se fuerza todo expandido para que los resultados se
    // vean; al borrar la búsqueda se restaura el estado manual del usuario.
    state: { expanded: textoFiltro ? true : expandido },
    onExpandedChange: setExpandido,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const filasVisibles = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar actividad, código, capítulo, familia o N inventariable…"
          className="w-96 max-w-full rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta outline-none focus:border-foco"
        />
        <button
          type="button"
          onClick={() => setExpandido(expandidoHasta(datos, 3))}
          className="rounded-sm border border-hairline px-2 py-1 text-[11px] text-tinta-2 hover:border-foco hover:text-tinta"
        >
          Expandir todo
        </button>
        <button
          type="button"
          onClick={() => setExpandido({})}
          className="rounded-sm border border-hairline px-2 py-1 text-[11px] text-tinta-2 hover:border-foco hover:text-tinta"
        >
          Colapsar todo
        </button>
        <span className="text-[11px] text-tinta-3">
          {filas.length.toLocaleString("es-CO")} actividades no inventariables · precios con IVA
          {anio ? `, año ${anio}` : ""}.
        </span>
      </div>

      <div className="overflow-auto rounded-sm border border-hairline">
        {/* ancho de contenido, no 100%: con pocas columnas o filtros muy
            restrictivos no debe estirarse a ocupar toda la página */}
        <table className="tabla" style={{ width: "auto" }} role="treegrid">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const meta = h.column.columnDef.meta as { alinear?: "izq" | "der" } | undefined;
                  return (
                    <th key={h.id} data-alinear={meta?.alinear}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
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
