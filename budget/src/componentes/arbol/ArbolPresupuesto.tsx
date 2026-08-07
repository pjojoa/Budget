"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ExpandedState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { LineaPresupuesto } from "@/dominio/tipos";
import { comparar, d, esCero, sumar, type Decimal } from "@/dominio/decimal";
import { recalcularCascadaOptimista } from "@/dominio/cascada";
import { parsearNumeroColombiano } from "@/dominio/numeroColombiano";
import { parsearTsv } from "@/dominio/portapapeles";
import { anunciar } from "@/dominio/anunciador";
import { useModeloArbol, type LineaNodo } from "./useModeloArbol";
import { columnas, ALTURA_FILA, type ColumnaEditable } from "./columnas";
import { FilaArbol } from "./FilaArbol";
import { useNavegacionTeclado } from "./useNavegacionTeclado";
import { evaluarPegado, type ResultadoCeldaPegado } from "./evaluarPegado";
import { DialogoPrevisualizacionPegado } from "./DialogoPrevisualizacionPegado";
import { PanelApu } from "./PanelApu";
import { guardarCambiosArbol } from "@/datos/simulado/accionesPresupuesto";
import { Moneda } from "@/componentes/dominio/Moneda";
import { Boton } from "@/componentes/ui/Boton";
import { BuscadorArticulos } from "@/componentes/dominio/BuscadorArticulos";
import type { LoteCambios } from "@/datos/tipos";

interface Props {
  presupuestoId: string;
  lineas: LineaPresupuesto[];
  marcaVersionInicial: string;
  editable: boolean;
}

interface EntradaHistorial {
  codigo: string;
  anterior: Decimal;
  nuevo: Decimal;
}

/** Una transacción agrupa 1+ celdas (un pegado de rango cuenta como UNA sola entrada de deshacer). */
type Transaccion = EntradaHistorial[];

function coincide(nodo: LineaNodo, texto: string): boolean {
  const t = texto.toLowerCase();
  return nodo.codigo.toLowerCase().includes(t) || nodo.descripcion.toLowerCase().includes(t);
}

export function ArbolPresupuesto({ presupuestoId, lineas, marcaVersionInicial, editable }: Props) {
  const [lineasBase, setLineasBase] = useState(lineas);
  const [cambios, setCambios] = useState<Map<string, Decimal>>(new Map());
  const [pilaDeshacer, setPilaDeshacer] = useState<Transaccion[]>([]);
  const [pilaRehacer, setPilaRehacer] = useState<Transaccion[]>([]);
  const [marcaVersion, setMarcaVersion] = useState(marcaVersionInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const emitirMensaje = useCallback((texto: string) => {
    setMensaje(texto);
    anunciar(texto);
  }, []);
  const [previsualizacion, setPrevisualizacion] = useState<{
    resultados: ResultadoCeldaPegado[];
    filasRecortadas: number;
    columnasRecortadas: number;
  } | null>(null);
  const [codigoApuAbierto, setCodigoApuAbierto] = useState<string | null>(null);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);

  const [expandido, setExpandido] = useState<ExpandedState>(true);
  const [filtro, setFiltro] = useState("");
  const [seleccion, setSeleccion] = useState<{
    codigo: string | null;
    columna: string;
    modo: "navegacion" | "edicion";
  }>({ codigo: lineas[0]?.codigo ?? null, columna: "codigo", modo: "navegacion" });
  const [valorEdicionInicial, setValorEdicionInicial] = useState("");

  const contenedorRef = useRef<HTMLDivElement>(null);
  const filtroRef = useRef<HTMLInputElement>(null);

  // Presupuesto distinto (navegación cliente entre obras): el estado no debe filtrarse.
  useEffect(() => {
    setLineasBase(lineas);
    setCambios(new Map());
    setPilaDeshacer([]);
    setPilaRehacer([]);
    setMarcaVersion(marcaVersionInicial);
    setSeleccion({ codigo: lineas[0]?.codigo ?? null, columna: "codigo", modo: "navegacion" });
    setMensaje(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuestoId]);

  useEffect(() => {
    if (cambios.size === 0) return;
    const manejador = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", manejador);
    return () => window.removeEventListener("beforeunload", manejador);
  }, [cambios.size]);

  const cantidadOriginalDe = useCallback(
    (codigo: string): Decimal => lineasBase.find((l) => l.codigo === codigo)?.cantidad ?? d(0),
    [lineasBase],
  );

  const lineasCalculadas = useMemo(() => {
    if (cambios.size === 0) return lineasBase;
    const conCambios = lineasBase.map((l) => (cambios.has(l.codigo) ? { ...l, cantidad: cambios.get(l.codigo)! } : l));
    // Sin redondear: Moneda redondea solo al presentar. Redondear aquí
    // desalinearía este recálculo del total que devuelva el servidor al guardar.
    const { lineas: recalculadas } = recalcularCascadaOptimista(conCambios);
    return recalculadas;
  }, [lineasBase, cambios]);

  const totalProvisional = useMemo(
    () => sumar(...lineasCalculadas.filter((l) => l.nivel === 4).map((l) => l.valorTotal)),
    [lineasCalculadas],
  );
  const totalOriginal = useMemo(
    () => sumar(...lineasBase.filter((l) => l.nivel === 4).map((l) => l.valorTotal)),
    [lineasBase],
  );

  /** Líneas cuyo valor total cambió: la editada directamente y toda su cadena de ancestros. */
  const codigosAfectados = useMemo(() => {
    if (cambios.size === 0) return new Set<string>();
    const originalPorCodigo = new Map(lineasBase.map((l) => [l.codigo, l.valorTotal]));
    const afectados = new Set<string>();
    for (const l of lineasCalculadas) {
      const original = originalPorCodigo.get(l.codigo);
      if (original !== undefined && comparar(l.valorTotal, original) !== 0) afectados.add(l.codigo);
    }
    return afectados;
  }, [cambios, lineasBase, lineasCalculadas]);

  const datos = useModeloArbol(lineasCalculadas);

  // ---- edición --------------------------------------------------------

  // Nota: cada función de abajo lee su estado (`cambios`, `pilaDeshacer`,
  // `pilaRehacer`) DIRECTO del cierre, no desde un actualizador funcional de
  // `setState` anidado dentro de otro — React (Strict Mode) invoca dos veces
  // el actualizador de un `setState` para detectar impurezas, y si ese
  // actualizador dispara OTROS `setState` como efecto secundario, esos
  // efectos se duplican. Esto causó un bug real: el segundo Ctrl+Z de una
  // secuencia no deshacía nada. Por eso estas funciones van en las
  // dependencias de sus propios `useCallback`.
  const valorActualDe = useCallback(
    (codigo: string): Decimal => cambios.get(codigo) ?? cantidadOriginalDe(codigo),
    [cambios, cantidadOriginalDe],
  );

  /** Aplica 1+ cambios como UNA sola transacción de deshacer/rehacer. */
  const aplicarTransaccion = useCallback(
    (entradas: Transaccion) => {
      if (entradas.length === 0) return;
      setPilaDeshacer((pd) => [...pd, entradas]);
      setPilaRehacer([]);
      setCambios((prev) => {
        const siguiente = new Map(prev);
        for (const { codigo, nuevo } of entradas) {
          const original = cantidadOriginalDe(codigo);
          if (comparar(nuevo, original) === 0) siguiente.delete(codigo);
          else siguiente.set(codigo, nuevo);
        }
        return siguiente;
      });
    },
    [cantidadOriginalDe],
  );

  const establecerValor = useCallback(
    (codigo: string, valorFinal: Decimal) => {
      const valorPrevio = valorActualDe(codigo);
      if (comparar(valorFinal, valorPrevio) === 0) return;
      aplicarTransaccion([{ codigo, anterior: valorPrevio, nuevo: valorFinal }]);
    },
    [valorActualDe, aplicarTransaccion],
  );

  const confirmarEdicionCelda = useCallback(
    (texto: string) => {
      const { codigo, columna } = seleccion;
      setSeleccion((s) => ({ ...s, modo: "navegacion" }));
      if (!codigo) return;
      const parsed = parsearNumeroColombiano(texto);
      if (parsed === null) {
        emitirMensaje("Valor no reconocido — se conservó el anterior.");
        return;
      }
      // Repeticiones nunca en cero (anula la rama en silencio); Cantidad sí puede.
      const valorFinal = columna === "repeticiones" && esCero(parsed) ? d(1) : parsed;
      establecerValor(codigo, valorFinal);
    },
    [seleccion, establecerValor, emitirMensaje],
  );

  const entrarEdicion = useCallback(
    (codigo: string, columna: ColumnaEditable, prefill?: string) => {
      if (!editable) return;
      const linea = lineasCalculadas.find((l) => l.codigo === codigo);
      setValorEdicionInicial(prefill ?? String(linea?.cantidad ?? "0"));
      setSeleccion({ codigo, columna, modo: "edicion" });
    },
    [editable, lineasCalculadas],
  );

  const limpiarCelda = useCallback(
    (codigo: string, columna: ColumnaEditable) => {
      establecerValor(codigo, columna === "repeticiones" ? d(1) : d(0));
    },
    [establecerValor],
  );

  const deshacer = useCallback(() => {
    if (pilaDeshacer.length === 0) return;
    const transaccion = pilaDeshacer[pilaDeshacer.length - 1];
    setPilaDeshacer((pd) => pd.slice(0, -1));
    setPilaRehacer((pr) => [...pr, transaccion]);
    setCambios((prev) => {
      const siguiente = new Map(prev);
      for (const { codigo, anterior } of transaccion) {
        const original = cantidadOriginalDe(codigo);
        if (comparar(anterior, original) === 0) siguiente.delete(codigo);
        else siguiente.set(codigo, anterior);
      }
      return siguiente;
    });
  }, [pilaDeshacer, cantidadOriginalDe]);

  const rehacer = useCallback(() => {
    if (pilaRehacer.length === 0) return;
    const transaccion = pilaRehacer[pilaRehacer.length - 1];
    setPilaRehacer((pr) => pr.slice(0, -1));
    setPilaDeshacer((pd) => [...pd, transaccion]);
    setCambios((prev) => {
      const siguiente = new Map(prev);
      for (const { codigo, nuevo } of transaccion) siguiente.set(codigo, nuevo);
      return siguiente;
    });
  }, [pilaRehacer]);

  const descartarTodo = useCallback(() => {
    setCambios(new Map());
    setPilaDeshacer([]);
    setPilaRehacer([]);
    setMensaje(null);
  }, []);

  const guardar = useCallback(async () => {
    if (cambios.size === 0 || guardando) return;
    setGuardando(true);
    setMensaje(null);
    const lote: LoteCambios = {
      marcaVersion,
      cambios: [...cambios.entries()].map(([codigo, cantidad]) => ({
        op: "actualizar_cantidad",
        codigo,
        cantidad,
      })),
    };
    const resultado = await guardarCambiosArbol(presupuestoId, lote);
    setGuardando(false);
    if (resultado.ok) {
      setLineasBase((prev) =>
        prev.map((l) => {
          const actualizada = resultado.lineas.find((r) => r.codigo === l.codigo);
          return actualizada
            ? {
                ...l,
                cantidad: actualizada.cantidad,
                valorUnitario: actualizada.valorUnitario,
                valorTotal: actualizada.valorTotal,
                incidenciaPct: actualizada.incidenciaPct,
              }
            : l;
        }),
      );
      setCambios(new Map());
      setPilaDeshacer([]);
      setPilaRehacer([]);
      setMarcaVersion(resultado.marcaVersion);
      emitirMensaje(`${lote.cambios.length} cambio(s) guardado(s).`);
    } else {
      const textos: Record<string, string> = {
        CONFLICTO_VERSION: "El presupuesto cambió en otra sesión — recargue la página antes de seguir editando.",
        PRESUPUESTO_INMUTABLE: "Este presupuesto ya no admite ediciones (no está en borrador).",
        SIN_PERMISO: "No tiene permiso para editar este presupuesto.",
      };
      emitirMensaje(textos[resultado.motivo] ?? "No se pudo guardar.");
    }
  }, [cambios, marcaVersion, presupuestoId, guardando, emitirMensaje]);

  // ---- tabla + virtualización -----------------------------------------

  const table = useReactTable({
    data: datos,
    columns: columnas,
    getRowId: (row) => row.codigo,
    getSubRows: (row) => row.subRows,
    state: { expanded: expandido, globalFilter: filtro },
    onExpandedChange: setExpandido,
    onGlobalFilterChange: setFiltro,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFromLeafRows: true,
    globalFilterFn: (row, _colId, texto) => coincide(row.original, texto),
    meta: {
      codigoActivo: seleccion.codigo,
      columnaActiva: seleccion.columna,
      modo: seleccion.modo,
      codigosConCambios: codigosAfectados,
      editable,
      onClicCelda: (codigo, columna) => setSeleccion({ codigo, columna, modo: "navegacion" }),
      onIniciarEdicion: entrarEdicion,
      onConfirmarEdicion: confirmarEdicionCelda,
      onCancelarEdicion: () => setSeleccion((s) => ({ ...s, modo: "navegacion" })),
      valorEdicionInicial,
    },
  });

  const filas = table.getRowModel().rows;

  // ---- pegado desde Excel ----------------------------------------------

  const manejarPegado = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!editable || seleccion.modo === "edicion" || !seleccion.codigo) return;
      const texto = e.clipboardData.getData("text/plain");
      if (!texto) return;
      e.preventDefault();

      const matriz = parsearTsv(texto);
      const indiceAncla = filas.findIndex((f) => f.original.codigo === seleccion.codigo);
      if (indiceAncla === -1) return;

      const filasVisibles = filas.map((f) => ({ codigo: f.original.codigo, nivel: f.original.nivel }));
      const { resultados, filasRecortadas, columnasRecortadas } = evaluarPegado({
        matriz,
        filasVisibles,
        indiceFilaAncla: indiceAncla,
        columnaAncla: seleccion.columna,
        obtenerCantidadActual: valorActualDe,
      });

      const esUnaSolaCelda = matriz.length === 1 && matriz[0]?.length === 1;
      if (esUnaSolaCelda) {
        const r = resultados[0];
        if (r?.estado === "aplicable") {
          aplicarTransaccion([{ codigo: r.codigo, anterior: r.valorAnterior, nuevo: r.valorNuevo! }]);
        } else if (r?.estado === "valor_invalido") {
          emitirMensaje("Valor no reconocido — se conservó el anterior.");
        }
        return;
      }

      if (resultados.length === 0) return;
      const aplicables = resultados.filter((r) => r.estado === "aplicable").length;
      anunciar(
        `Pegado: ${aplicables} celda(s) aplicables de ${resultados.length}. Revise la previsualización antes de confirmar.`,
      );
      setPrevisualizacion({ resultados, filasRecortadas, columnasRecortadas });
    },
    [editable, seleccion, filas, valorActualDe, aplicarTransaccion, emitirMensaje],
  );

  const confirmarPegado = useCallback(() => {
    if (!previsualizacion) return;
    const entradas: Transaccion = previsualizacion.resultados
      .filter((r) => r.estado === "aplicable")
      .map((r) => ({ codigo: r.codigo, anterior: r.valorAnterior, nuevo: r.valorNuevo! }));
    aplicarTransaccion(entradas);
    anunciar(`${entradas.length} celda(s) actualizadas por pegado.`);
    setPrevisualizacion(null);
  }, [previsualizacion, aplicarTransaccion]);

  const virtualizador = useVirtualizer({
    count: filas.length,
    getScrollElement: () => contenedorRef.current,
    estimateSize: () => ALTURA_FILA,
    overscan: 12,
  });
  const itemsVirtuales = virtualizador.getVirtualItems();

  const manejarTeclado = useNavegacionTeclado({
    filas,
    codigoActivo: seleccion.codigo,
    columnaActiva: seleccion.columna,
    modo: seleccion.modo,
    editable,
    onMover: (codigo, columna, indice) => {
      setSeleccion({ codigo, columna, modo: "navegacion" });
      virtualizador.scrollToIndex(indice, { align: "auto" });
    },
    onEntrarEdicion: entrarEdicion,
    onLimpiarCelda: limpiarCelda,
    onDeshacer: deshacer,
    onRehacer: rehacer,
    onGuardar: guardar,
    onAlternarExpandido: (codigo) => table.getRow(codigo)?.toggleExpanded(),
    onAlternarExpandirTodo: () => setExpandido((prev) => (prev === true ? {} : true)),
    onEnfocarFiltro: () => filtroRef.current?.focus(),
    onAbrirApu: (codigo) => setCodigoApuAbierto(codigo),
    onAbrirBuscador: () => setBuscadorAbierto(true),
  });

  // Restaura el foco DOM en la celda activa tras cada movimiento (incluido
  // el scroll de la virtualización, que puede tardar un frame en montar la fila).
  useEffect(() => {
    if (!seleccion.codigo || seleccion.modo === "edicion") return;
    const clave = `${seleccion.codigo}|${seleccion.columna}`;
    const el = contenedorRef.current?.querySelector<HTMLElement>(
      `[data-celda="${CSS.escape(clave)}"]`,
    );
    el?.focus({ preventScroll: true });
  }, [seleccion.codigo, seleccion.columna, seleccion.modo, itemsVirtuales]);

  const totalLineasN10Visibles = useMemo(() => filas.filter((f) => f.original.nivel === 10).length, [filas]);
  const hayCambiosSinGuardar = cambios.size > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-hairline px-3 py-1.5">
        <input
          ref={filtroRef}
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por código o descripción… (Ctrl+F)"
          className="w-72 rounded-sm border border-hairline bg-panel px-2 py-1 text-xs text-tinta"
          aria-label="Filtrar árbol de presupuesto"
        />
        <button
          type="button"
          onClick={() => setExpandido(true)}
          aria-label="Expandir todo"
          title="Expandir todo"
          className="flex size-7 items-center justify-center rounded-sm text-tinta-3 transition-colors hover:bg-fila hover:text-tinta"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-3.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6.5 5 4l2.5 2.5M5 4v8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 9.5 11 12 8.5 9.5M11 12V4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setExpandido({})}
          aria-label="Colapsar todo"
          title="Colapsar todo"
          className="flex size-7 items-center justify-center rounded-sm text-tinta-3 transition-colors hover:bg-fila hover:text-tinta"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-3.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 5.5 5 8l2.5-2.5M5 8V3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5 11 8 8.5 10.5M11 8v5" />
          </svg>
        </button>
        {editable && (
          <>
            <span className="mx-1 h-3 w-px bg-hairline" aria-hidden />
            <button
              type="button"
              onClick={deshacer}
              disabled={pilaDeshacer.length === 0}
              className="text-[11px] text-tinta-2 hover:text-tinta hover:underline disabled:pointer-events-none disabled:text-tinta-3"
            >
              Deshacer (Ctrl+Z)
            </button>
            <button
              type="button"
              onClick={rehacer}
              disabled={pilaRehacer.length === 0}
              className="text-[11px] text-tinta-2 hover:text-tinta hover:underline disabled:pointer-events-none disabled:text-tinta-3"
            >
              Rehacer
            </button>
          </>
        )}
        {!editable && (
          <span className="text-[11px] text-tinta-3">Solo lectura — cree una versión nueva para editar.</span>
        )}
        <span className="ml-auto text-[11px] text-tinta-3">
          {filas.length} líneas visibles · {totalLineasN10Visibles} subactividades
        </span>
      </div>
      <p id="ayuda-arbol" className="sr-only">
        Use las flechas, Tab e Inicio/Fin para moverse. Enter o F2 edita cantidad y repeticiones. Escape cancela.
      </p>

      <div
        role="treegrid"
        aria-label="Árbol de presupuesto"
        aria-rowcount={lineas.length}
        aria-describedby="ayuda-arbol"
        ref={contenedorRef}
        onKeyDown={manejarTeclado}
        onPaste={manejarPegado}
        className="min-h-0 flex-1 overflow-auto text-xs outline-none"
      >
        <div
          role="row"
          className="sticky top-0 z-10 flex gap-2 border-b border-hairline bg-lienzo px-1 py-1 font-condensada uppercase tracking-wide text-tinta-3"
        >
          {table.getHeaderGroups()[0].headers.map((header) => {
            const ancho = (columnas.find((c) => c.id === header.column.id) as { size?: number } | undefined)?.size;
            return (
              <div
                key={header.id}
                className={
                  ancho
                    ? `shrink-0 ${["cantidad", "repeticiones", "valorTotal"].includes(header.column.id) ? "text-right" : ""}`
                    : "min-w-0 flex-1"
                }
                style={ancho ? { width: ancho } : undefined}
              >
                {typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : null}
              </div>
            );
          })}
        </div>

        <div style={{ height: virtualizador.getTotalSize(), position: "relative" }}>
          {itemsVirtuales.map((item) => {
            const fila = filas[item.index];
            const activa = seleccion.codigo === fila.original.codigo;
            return (
              <FilaArbol
                key={fila.id}
                row={fila}
                rowIndex={item.index}
                start={item.start}
                activa={activa}
                columnaActiva={activa ? seleccion.columna : ""}
                conCambios={codigosAfectados.has(fila.original.codigo)}
                onClicCelda={(columna) => setSeleccion({ codigo: fila.original.codigo, columna, modo: "navegacion" })}
              />
            );
          })}
        </div>
      </div>

      {codigoApuAbierto && (
        <PanelApu
          presupuestoId={presupuestoId}
          codigo={codigoApuAbierto}
          descripcion={lineasCalculadas.find((l) => l.codigo === codigoApuAbierto)?.descripcion ?? ""}
          onCerrar={() => setCodigoApuAbierto(null)}
          onBuscarArticulo={() => setBuscadorAbierto(true)}
        />
      )}

      {(hayCambiosSinGuardar || mensaje) && (
        <div className="flex shrink-0 items-center gap-3 border-t border-hairline bg-panel px-3 py-2 text-xs">
          {hayCambiosSinGuardar && (
            <>
              <span className="text-tinta-2">{cambios.size} cambio(s) sin guardar</span>
              <span className="text-tinta-3">Total provisional</span>
              <Moneda valor={totalProvisional} provisional />
              {comparar(totalProvisional, totalOriginal) !== 0 && (
                <span className={comparar(totalProvisional, totalOriginal) > 0 ? "text-aumento" : "text-disminucion"}>
                  ({comparar(totalProvisional, totalOriginal) > 0 ? "▲" : "▼"})
                </span>
              )}
              <Boton variante="primario" tamano="sm" onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando…" : "Guardar (Ctrl+S)"}
              </Boton>
              <Boton variante="fantasma" tamano="sm" onClick={descartarTodo} disabled={guardando}>
                Descartar
              </Boton>
            </>
          )}
          {mensaje && <span className="text-tinta-2">{mensaje}</span>}
        </div>
      )}

      {previsualizacion && (
        <DialogoPrevisualizacionPegado
          resultados={previsualizacion.resultados}
          filasRecortadas={previsualizacion.filasRecortadas}
          columnasRecortadas={previsualizacion.columnasRecortadas}
          onAplicar={confirmarPegado}
          onCancelar={() => setPrevisualizacion(null)}
        />
      )}

      <BuscadorArticulos abierto={buscadorAbierto} onCerrar={() => setBuscadorAbierto(false)} />
    </div>
  );
}
