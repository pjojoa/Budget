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
import { RailIndentacion } from "@/componentes/dominio/RailIndentacion";
import { InsigniaNivel, claseTextoNivel } from "@/componentes/dominio/Insignias";
import { Boton } from "@/componentes/ui/Boton";
import { CeldaEditorTexto } from "@/componentes/ui/CeldaEditorTexto";
import { FiltroColumnaExcel } from "@/componentes/ui/FiltroColumnaExcel";
import {
  actualizarCuentaAccion,
  crearCuentaAccion,
  eliminarCuentaAccion,
} from "@/datos/simulado/accionesMaestros";
import type { Nivel } from "@/dominio/codigo";
import type { Cuenta } from "@/datos/tipos";

interface CuentaNodo extends Cuenta {
  subRows: CuentaNodo[];
}

/** Escala de profundidad visible: cada clic avanza o retrocede un peldaño. */
const ESCALONES: Nivel[] = [4, 5, 8, 10];

function construirArbol(cuentas: Cuenta[]): CuentaNodo[] {
  const porCodigo = new Map<string, CuentaNodo>();
  for (const c of cuentas) porCodigo.set(c.codigo, { ...c, subRows: [] });
  const raices: CuentaNodo[] = [];
  for (const c of cuentas) {
    const nodo = porCodigo.get(c.codigo)!;
    const padre = c.codigoPadre ? porCodigo.get(c.codigoPadre) : undefined;
    if (padre) padre.subRows.push(nodo);
    else raices.push(nodo);
  }
  return raices;
}

/** Expande nodos cuya profundidad es estrictamente menor que `nivelMax`. */
function expandidoHasta(nodos: CuentaNodo[], nivelMax: Nivel): ExpandedState {
  if (nivelMax <= 4) return {};
  if (nivelMax >= 10) return true;
  const estado: Record<string, boolean> = {};
  const recorrer = (lista: CuentaNodo[]) => {
    for (const n of lista) {
      if (n.nivel < nivelMax && n.subRows.length > 0) {
        estado[n.codigo] = true;
        recorrer(n.subRows);
      }
    }
  };
  recorrer(nodos);
  return estado;
}

function indiceEscalon(nivel: Nivel): number {
  return ESCALONES.indexOf(nivel);
}

function coincide(nodo: CuentaNodo, texto: string): boolean {
  const t = texto.toLowerCase();
  return nodo.codigo.toLowerCase().includes(t) || nodo.descripcion.toLowerCase().includes(t);
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

interface Props {
  cuentas: Cuenta[];
  editable: boolean;
}

type Campo = "descripcion" | "unidadMedida";

const CUENTA_MOTIVOS: Record<string, string> = {
  SIN_PERMISO: "No tiene permiso para editar el maestro de cuentas.",
  CODIGO_INVALIDO: "El código no tiene una forma válida de cuenta (N4/N5/N8/N10).",
  CODIGO_DUPLICADO: "Ya existe una cuenta con ese código.",
  PADRE_INEXISTENTE: "La cuenta padre de ese código no existe en el maestro.",
  CUENTA_INEXISTENTE: "La cuenta ya no existe.",
  TIENE_HIJOS: "No se puede eliminar: tiene cuentas hijas en el maestro.",
  EN_USO: "No se puede eliminar: está referenciada por un presupuesto cargado.",
};

export function ArbolCuentas({ cuentas, editable }: Props) {
  const [cuentasLocal, setCuentasLocal] = useState(cuentas);
  const [nivelVisible, setNivelVisible] = useState<Nivel>(10);
  const [filtro, setFiltro] = useState("");
  const [filtrosColumna, setFiltrosColumna] = useState<ColumnFiltersState>([]);
  const [edicion, setEdicion] = useState<{ codigo: string; campo: Campo } | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("");
  const [creando, setCreando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);

  const datos = useMemo(() => construirArbol(cuentasLocal), [cuentasLocal]);
  const expandido = useMemo(() => expandidoHasta(datos, nivelVisible), [datos, nivelVisible]);

  const unicosPorColumna = useMemo(
    () => ({
      nivel: unicos(cuentasLocal.map((c) => `N${c.nivel}`)),
      codigo: unicos(cuentasLocal.map((c) => c.codigo)),
      descripcion: unicos(cuentasLocal.map((c) => c.descripcion)),
      unidad: unicos(cuentasLocal.map((c) => c.unidadMedida || "")),
    }),
    [cuentasLocal],
  );

  const puedeExpandir = nivelVisible < 10;
  const puedeColapsar = nivelVisible > 4;
  const iActual = indiceEscalon(nivelVisible);
  const siguienteNivel = ESCALONES[Math.min(iActual + 1, ESCALONES.length - 1)];
  const anteriorNivel = ESCALONES[Math.max(iActual - 1, 0)];

  const guardarCampo = useCallback(async (codigo: string, campo: Campo, valor: string) => {
    setEdicion(null);
    const anterior = cuentasLocal.find((c) => c.codigo === codigo)?.[campo];
    if (anterior === valor) return;
    setCuentasLocal((prev) => prev.map((c) => (c.codigo === codigo ? { ...c, [campo]: valor } : c)));
    const resultado = await actualizarCuentaAccion(codigo, { [campo]: valor });
    if (!resultado.ok) {
      setCuentasLocal((prev) => prev.map((c) => (c.codigo === codigo ? { ...c, [campo]: anterior } : c)));
      setMensaje(
        resultado.motivo === "SIN_PERMISO"
          ? "No tiene permiso para editar el maestro de cuentas."
          : "No se pudo guardar el cambio.",
      );
    }
  }, [cuentasLocal]);

  const crearCuenta = useCallback(async () => {
    setCreando(true);
    setMensaje(null);
    const resultado = await crearCuentaAccion({
      codigo: nuevoCodigo.trim(),
      descripcion: nuevaDescripcion.trim(),
      unidadMedida: nuevaUnidad.trim(),
    });
    setCreando(false);
    if (resultado.ok) {
      setCuentasLocal((prev) => [...prev, resultado.cuenta]);
      setNuevoCodigo("");
      setNuevaDescripcion("");
      setNuevaUnidad("");
      setFormAbierto(false);
    } else {
      setMensaje(CUENTA_MOTIVOS[resultado.motivo] ?? "No se pudo crear la cuenta.");
    }
  }, [nuevoCodigo, nuevaDescripcion, nuevaUnidad]);

  const eliminar = useCallback(async (codigo: string) => {
    setConfirmarBorrado(null);
    const anterior = cuentasLocal;
    setCuentasLocal((prev) => prev.filter((c) => c.codigo !== codigo));
    const resultado = await eliminarCuentaAccion(codigo);
    if (!resultado.ok) {
      setCuentasLocal(anterior);
      setMensaje(CUENTA_MOTIVOS[resultado.motivo] ?? "No se pudo eliminar la cuenta.");
    }
  }, [cuentasLocal]);

  const columnas = useMemo<ColumnDef<CuentaNodo, string>[]>(
    () => [
      {
        id: "nivel",
        accessorFn: (n) => `N${n.nivel}`,
        header: "Nivel",
        filterFn: filtroValores,
        cell: ({ row }) => {
          const tinta = claseTextoNivel(row.original.nivel);
          const expandidoFila = row.getIsExpanded();
          return (
            <div className={`flex items-center gap-1 ${tinta}`}>
              {row.getCanExpand() ? (
                <button
                  type="button"
                  onClick={() => {
                    const n = row.original.nivel;
                    if (expandidoFila) setNivelVisible(n);
                    else {
                      const i = indiceEscalon(n);
                      setNivelVisible(ESCALONES[Math.min(i + 1, ESCALONES.length - 1)]);
                    }
                  }}
                  aria-label={expandidoFila ? "Colapsar" : "Expandir"}
                  className="flex size-4 shrink-0 items-center justify-center rounded-sm opacity-80 hover:bg-fila hover:opacity-100"
                >
                  <svg viewBox="0 0 12 12" fill="currentColor" className="size-2.5" aria-hidden>
                    {expandidoFila ? <path d="M2 4.5h8L6 9 2 4.5Z" /> : <path d="M4.5 2v8L9 6 4.5 2Z" />}
                  </svg>
                </button>
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
              <InsigniaNivel nivel={row.original.nivel} />
            </div>
          );
        },
      },
      {
        id: "codigo",
        accessorFn: (n) => n.codigo,
        header: "Código",
        filterFn: filtroValores,
        cell: ({ row }) => (
          <span className={`font-mono text-xs whitespace-nowrap ${claseTextoNivel(row.original.nivel)}`}>
            {row.original.codigo}
          </span>
        ),
      },
      {
        id: "descripcion",
        accessorFn: (n) => n.descripcion,
        header: "Descripción",
        filterFn: filtroValores,
        cell: ({ row }) => {
          const c = row.original;
          const tinta = claseTextoNivel(c.nivel);
          const enEdicion = edicion?.codigo === c.codigo && edicion.campo === "descripcion";
          if (enEdicion) {
            return (
              <div className="flex items-center gap-1.5">
                <RailIndentacion nivel={c.nivel} />
                <CeldaEditorTexto
                  valorInicial={c.descripcion}
                  onConfirmar={(v) => guardarCampo(c.codigo, "descripcion", v)}
                  onCancelar={() => setEdicion(null)}
                />
              </div>
            );
          }
          return (
            <div className={`flex min-w-0 items-center gap-1.5 ${tinta}`}>
              <RailIndentacion nivel={c.nivel} />
              <span
                className={`block min-w-0 truncate ${
                  c.nivel <= 5 ? "font-condensada uppercase" : ""
                } ${editable ? "cursor-text hover:underline" : ""}`}
                title={c.descripcion}
                onClick={() => editable && setEdicion({ codigo: c.codigo, campo: "descripcion" })}
              >
                {c.descripcion}
              </span>
            </div>
          );
        },
      },
      {
        id: "unidad",
        accessorFn: (n) => n.unidadMedida || "",
        header: "UM",
        filterFn: filtroValores,
        cell: ({ row }) => {
          const c = row.original;
          const tinta = claseTextoNivel(c.nivel);
          const enEdicion = edicion?.codigo === c.codigo && edicion.campo === "unidadMedida";
          if (enEdicion) {
            return (
              <CeldaEditorTexto
                valorInicial={c.unidadMedida}
                onConfirmar={(v) => guardarCampo(c.codigo, "unidadMedida", v)}
                onCancelar={() => setEdicion(null)}
              />
            );
          }
          return (
            <span
              className={`${tinta} ${editable ? "cursor-text hover:underline" : ""}`}
              onClick={() => editable && setEdicion({ codigo: c.codigo, campo: "unidadMedida" })}
            >
              {c.unidadMedida || ""}
            </span>
          );
        },
      },
      ...(editable
        ? [
            {
              id: "acciones",
              header: "",
              enableColumnFilter: false,
              cell: ({ row }: { row: { original: CuentaNodo } }) => {
                const c = row.original;
                if (confirmarBorrado === c.codigo) {
                  return (
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Boton variante="peligro" tamano="sm" onClick={() => eliminar(c.codigo)}>
                        Confirmar
                      </Boton>
                      <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmarBorrado(null)}>
                        Cancelar
                      </Boton>
                    </span>
                  );
                }
                return (
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => setConfirmarBorrado(c.codigo)}
                    aria-label={`Eliminar cuenta ${c.codigo}`}
                    title="Eliminar cuenta"
                    className="px-1.5 hover:text-error"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-3.5" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 5h9M6.5 5V3.5h3V5M4.5 5l.5 8.5a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.5-8.5" />
                    </svg>
                  </Boton>
                );
              },
            } satisfies ColumnDef<CuentaNodo, string>,
          ]
        : []),
    ],
    [edicion, editable, guardarCampo, confirmarBorrado, eliminar],
  );

  const table = useReactTable({
    data: datos,
    columns: columnas,
    getRowId: (row) => row.codigo,
    getSubRows: (row) => row.subRows,
    state: { expanded: expandido, globalFilter: filtro, columnFilters: filtrosColumna },
    onGlobalFilterChange: setFiltro,
    onColumnFiltersChange: setFiltrosColumna,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFromLeafRows: true,
    globalFilterFn: (row, _colId, texto) => coincide(row.original, texto),
  });

  const filas = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por código o descripción…"
          className="w-72 max-w-full rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-tinta outline-none focus:border-foco"
        />
        <button
          type="button"
          onClick={() => setNivelVisible(siguienteNivel)}
          disabled={!puedeExpandir}
          aria-label={`Expandir hasta N${siguienteNivel}`}
          title={puedeExpandir ? `Expandir hasta N${siguienteNivel}` : "Máximo de expansión (N10)"}
          className="flex size-7 items-center justify-center rounded-sm text-tinta-3 transition-colors hover:bg-fila hover:text-tinta disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-3.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6.5 5 4l2.5 2.5M5 4v8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 9.5 11 12 8.5 9.5M11 12V4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setNivelVisible(anteriorNivel)}
          disabled={!puedeColapsar}
          aria-label={`Colapsar hasta N${anteriorNivel}`}
          title={puedeColapsar ? `Colapsar hasta N${anteriorNivel}` : "Mínimo de colapso (N4)"}
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
          {filas.length.toLocaleString("es-CO")} visibles · {cuentasLocal.length.toLocaleString("es-CO")} cuentas
          {!editable && " · solo lectura"}
        </span>
        {editable && (
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setFormAbierto((v) => !v)}
            className="ml-auto"
          >
            {formAbierto ? "Cancelar" : "+ Nueva cuenta"}
          </Boton>
        )}
        {mensaje && <span className="text-[11px] text-error">{mensaje}</span>}
      </div>

      {editable && formAbierto && (
        <div className="flex flex-wrap items-end gap-2 rounded-sm border border-hairline bg-panel p-2">
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Código (N4/N5/N8/N10)
            <input
              value={nuevoCodigo}
              onChange={(e) => setNuevoCodigo(e.target.value)}
              placeholder="p. ej. 22001000"
              className="w-40 rounded-sm border border-hairline bg-panel px-2 py-1 font-mono text-xs text-tinta outline-none focus:border-foco"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Descripción
            <input
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              className="w-64 rounded-sm border border-hairline bg-panel px-2 py-1 text-xs text-tinta outline-none focus:border-foco"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[11px] text-tinta-3">
            Unidad
            <input
              value={nuevaUnidad}
              onChange={(e) => setNuevaUnidad(e.target.value)}
              className="w-24 rounded-sm border border-hairline bg-panel px-2 py-1 text-xs text-tinta outline-none focus:border-foco"
            />
          </label>
          <Boton
            variante="primario"
            tamano="sm"
            onClick={crearCuenta}
            disabled={creando || !nuevoCodigo.trim() || !nuevaDescripcion.trim()}
          >
            {creando ? "Creando…" : "Crear"}
          </Boton>
          <span className="text-[11px] text-tinta-3">
            El nivel, la plantilla y la cuenta padre se derivan del código.
          </span>
        </div>
      )}

      <div className="overflow-auto rounded-sm border border-hairline">
        <table className="tabla" role="treegrid" aria-rowcount={cuentasLocal.length}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const filtroCol = h.column.getFilterValue() as string[] | undefined;
                  const id = h.column.id as keyof typeof unicosPorColumna;
                  return (
                    <th key={h.id}>
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
            {filas.map((row, i) => (
              <tr
                key={row.id}
                role="row"
                data-nivel={row.original.nivel}
                aria-level={{ 4: 1, 5: 2, 8: 3, 10: 4 }[row.original.nivel]}
                aria-rowindex={i + 1}
                aria-expanded={row.getCanExpand() ? row.getIsExpanded() : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} role="gridcell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {filas.length === 0 && (
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
