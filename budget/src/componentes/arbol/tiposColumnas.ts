/**
 * Constantes y tipos puros de las columnas del árbol — sin JSX, para que
 * la lógica de pegado/teclado (testeada sin React) pueda importarlos sin
 * arrastrar `columnas.tsx`.
 */

/** Las dos únicas columnas editables comparten el mismo campo subyacente (`cantidad`). */
export type ColumnaEditable = "cantidad" | "repeticiones";

/** Prioridad de columna para el colapso responsive (ver plan §6, breakpoints). */
export const PRIORIDAD_COLUMNA: Record<string, 1 | 2 | 3> = {
  codigo: 1,
  descripcion: 1,
  unidad: 3,
  cantidad: 2,
  repeticiones: 2,
  valorTotal: 1,
  incidencia: 2,
};

export const ANCHO_COLUMNA = {
  codigo: 220,
  unidad: 56,
  cantidad: 90,
  repeticiones: 76,
  valorTotal: 140,
  incidencia: 160,
} as const;

export const ALTURA_FILA = 28;

/** Orden de navegación por teclado (Tab/flechas izq-der) entre columnas. */
export const ORDEN_COLUMNAS = [
  "codigo",
  "descripcion",
  "unidad",
  "cantidad",
  "repeticiones",
  "valorTotal",
  "incidencia",
] as const;
