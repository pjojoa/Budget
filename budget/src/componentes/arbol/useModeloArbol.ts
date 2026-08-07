import { useMemo } from "react";
import type { LineaPresupuesto } from "@/dominio/tipos";

export interface LineaNodo extends LineaPresupuesto {
  subRows: LineaNodo[];
}

/**
 * Construye el árbol jerárquico a partir de las líneas planas del backend
 * (que ya traen `padre`, derivado del código — nunca digitado). Una pasada
 * O(n) memoizada; el resultado alimenta el sub-row model nativo de
 * TanStack Table, que a cambio regala `row.depth`, `getExpandedRowModel()` y
 * `filterFromLeafRows` — reimplementar esto a mano es donde estas
 * migraciones se atascan.
 */
export function construirArbol(lineas: LineaPresupuesto[]): LineaNodo[] {
  const porCodigo = new Map<string, LineaNodo>();
  for (const l of lineas) {
    porCodigo.set(l.codigo, { ...l, subRows: [] });
  }
  const raices: LineaNodo[] = [];
  for (const l of lineas) {
    const nodo = porCodigo.get(l.codigo)!;
    const padre = l.padre ? porCodigo.get(l.padre) : undefined;
    if (padre) {
      padre.subRows.push(nodo);
    } else {
      raices.push(nodo);
    }
  }
  return raices;
}

export function useModeloArbol(lineas: LineaPresupuesto[]): LineaNodo[] {
  return useMemo(() => construirArbol(lineas), [lineas]);
}
