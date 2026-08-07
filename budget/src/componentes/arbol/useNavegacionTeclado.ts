import { useCallback, type KeyboardEvent } from "react";
import type { Row } from "@tanstack/react-table";
import type { LineaNodo } from "./useModeloArbol";
import { ORDEN_COLUMNAS, type ColumnaEditable } from "./columnas";

const COLUMNAS_EDITABLES = new Set<string>(["cantidad", "repeticiones"]);
const SALTO_PAGINA = 20;

interface Params {
  filas: Row<LineaNodo>[];
  codigoActivo: string | null;
  columnaActiva: string;
  modo: "navegacion" | "edicion";
  editable: boolean;
  onMover: (codigo: string, columna: string, indice: number) => void;
  onEntrarEdicion: (codigo: string, columna: ColumnaEditable, prefill?: string) => void;
  onLimpiarCelda: (codigo: string, columna: ColumnaEditable) => void;
  onDeshacer: () => void;
  onRehacer: () => void;
  onGuardar: () => void;
  onAlternarExpandido: (codigo: string) => void;
  onAlternarExpandirTodo: () => void;
  onEnfocarFiltro: () => void;
  onAbrirApu: (codigo: string) => void;
  onAbrirBuscador: () => void;
}

/**
 * Único onKeyDown del árbol, por delegación en el contenedor — nada de
 * manejadores por celda. Solo actúa en modo "navegación"; en modo "edición"
 * el propio <input> maneja sus teclas con stopPropagation.
 */
export function useNavegacionTeclado(params: Params) {
  const {
    filas,
    codigoActivo,
    columnaActiva,
    modo,
    editable,
    onMover,
    onEntrarEdicion,
    onLimpiarCelda,
    onDeshacer,
    onRehacer,
    onGuardar,
    onAlternarExpandido,
    onAlternarExpandirTodo,
    onEnfocarFiltro,
    onAbrirApu,
    onAbrirBuscador,
  } = params;

  return useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Ctrl+S / Ctrl+F / Ctrl+B funcionan incluso sin fila activa.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onGuardar();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onEnfocarFiltro();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        onAbrirBuscador();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onDeshacer();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        onRehacer();
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        onAlternarExpandirTodo();
        return;
      }

      if (modo === "edicion") return; // el input ya está manejando sus teclas

      const idx = filas.findIndex((f) => f.original.codigo === codigoActivo);
      if (idx === -1 || !codigoActivo) return;
      const fila = filas[idx];
      const colIdx = ORDEN_COLUMNAS.indexOf(columnaActiva as (typeof ORDEN_COLUMNAS)[number]);

      const moverFila = (nuevoIdx: number, columna = columnaActiva) => {
        const objetivo = filas[Math.max(0, Math.min(filas.length - 1, nuevoIdx))];
        onMover(objetivo.original.codigo, columna, Math.max(0, Math.min(filas.length - 1, nuevoIdx)));
      };

      if (e.ctrlKey && e.key === "ArrowRight") {
        e.preventDefault();
        if (fila.getCanExpand() && !fila.getIsExpanded()) onAlternarExpandido(codigoActivo);
        return;
      }
      if (e.ctrlKey && e.key === "ArrowLeft") {
        e.preventDefault();
        if (fila.getCanExpand() && fila.getIsExpanded()) onAlternarExpandido(codigoActivo);
        else if (fila.parentId) onMover(fila.parentId, columnaActiva, filas.findIndex((f) => f.original.codigo === fila.parentId));
        return;
      }
      if (e.ctrlKey && e.key === "Home") {
        e.preventDefault();
        moverFila(0, ORDEN_COLUMNAS[0]);
        return;
      }
      if (e.ctrlKey && e.key === "End") {
        e.preventDefault();
        moverFila(filas.length - 1, ORDEN_COLUMNAS[0]);
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          moverFila(idx + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          moverFila(idx - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (colIdx < ORDEN_COLUMNAS.length - 1) onMover(codigoActivo, ORDEN_COLUMNAS[colIdx + 1], idx);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (colIdx > 0) onMover(codigoActivo, ORDEN_COLUMNAS[colIdx - 1], idx);
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            if (colIdx > 0) onMover(codigoActivo, ORDEN_COLUMNAS[colIdx - 1], idx);
            else moverFila(idx - 1, ORDEN_COLUMNAS[ORDEN_COLUMNAS.length - 1]);
          } else {
            if (colIdx < ORDEN_COLUMNAS.length - 1) onMover(codigoActivo, ORDEN_COLUMNAS[colIdx + 1], idx);
            else moverFila(idx + 1, ORDEN_COLUMNAS[0]);
          }
          break;
        case "Home":
          e.preventDefault();
          onMover(codigoActivo, ORDEN_COLUMNAS[0], idx);
          break;
        case "End":
          e.preventDefault();
          onMover(codigoActivo, ORDEN_COLUMNAS[ORDEN_COLUMNAS.length - 1], idx);
          break;
        case "PageDown":
          e.preventDefault();
          moverFila(idx + SALTO_PAGINA);
          break;
        case "PageUp":
          e.preventDefault();
          moverFila(idx - SALTO_PAGINA);
          break;
        case "Enter":
        case "F2":
          e.preventDefault();
          if (editable && COLUMNAS_EDITABLES.has(columnaActiva)) {
            onEntrarEdicion(codigoActivo, columnaActiva as ColumnaEditable);
          } else if (fila.original.nivel === 10) {
            onAbrirApu(codigoActivo);
          } else if (fila.getCanExpand()) {
            onAlternarExpandido(codigoActivo);
          }
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          if (editable && COLUMNAS_EDITABLES.has(columnaActiva)) {
            onLimpiarCelda(codigoActivo, columnaActiva as ColumnaEditable);
          }
          break;
        case "Escape":
          (document.activeElement as HTMLElement | null)?.blur();
          break;
        default:
          if (
            editable &&
            COLUMNAS_EDITABLES.has(columnaActiva) &&
            e.key.length === 1 &&
            /[0-9.,-]/.test(e.key) &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            e.preventDefault();
            onEntrarEdicion(codigoActivo, columnaActiva as ColumnaEditable, e.key);
          }
      }
    },
    [
      filas,
      codigoActivo,
      columnaActiva,
      modo,
      editable,
      onMover,
      onEntrarEdicion,
      onLimpiarCelda,
      onDeshacer,
      onRehacer,
      onGuardar,
      onAlternarExpandido,
      onAlternarExpandirTodo,
      onEnfocarFiltro,
      onAbrirApu,
      onAbrirBuscador,
    ],
  );
}
