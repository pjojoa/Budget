import { comparar, d, esCero, type Decimal } from "@/dominio/decimal";
import { parsearNumeroColombiano } from "@/dominio/numeroColombiano";
import { ORDEN_COLUMNAS, type ColumnaEditable } from "./tiposColumnas";

export interface FilaVisible {
  codigo: string;
  nivel: 4 | 5 | 8 | 10;
}

export type EstadoCeldaPegado = "aplicable" | "sin_cambio" | "no_editable" | "valor_invalido";

export interface ResultadoCeldaPegado {
  codigo: string;
  columna: ColumnaEditable;
  estado: EstadoCeldaPegado;
  valorAnterior: Decimal;
  valorNuevo: Decimal | null;
  motivo?: "columna_no_editable_en_este_nivel" | "no_numerico" | "negativo";
}

const COLUMNAS_EDITABLES = new Set<string>(["cantidad", "repeticiones"]);

function columnaAplicaAlNivel(columna: string, nivel: FilaVisible["nivel"]): columna is ColumnaEditable {
  if (columna === "cantidad") return nivel === 10;
  if (columna === "repeticiones") return nivel !== 10;
  return false;
}

/**
 * Mapea el bloque pegado sobre las filas VISIBLES a partir de la celda
 * ancla — nunca se pega en algo que el usuario no ve (una fila colapsada
 * simplemente no está en `filasVisibles`). Se recorta al borde de la tabla
 * y al final de las columnas editables; lo recortado se reporta aparte.
 */
export function evaluarPegado(params: {
  matriz: string[][];
  filasVisibles: FilaVisible[];
  indiceFilaAncla: number;
  columnaAncla: string;
  obtenerCantidadActual: (codigo: string) => Decimal;
}): { resultados: ResultadoCeldaPegado[]; filasRecortadas: number; columnasRecortadas: number } {
  const { matriz, filasVisibles, indiceFilaAncla, columnaAncla, obtenerCantidadActual } = params;

  const colIdxAncla = ORDEN_COLUMNAS.indexOf(columnaAncla as (typeof ORDEN_COLUMNAS)[number]);
  const nFilasPedidas = matriz.length;
  const nColsPedidas = Math.max(...matriz.map((f) => f.length));

  const nFilasDisponibles = Math.max(0, filasVisibles.length - indiceFilaAncla);
  const nColsDisponibles = colIdxAncla === -1 ? 0 : Math.max(0, ORDEN_COLUMNAS.length - colIdxAncla);

  const nFilas = Math.min(nFilasPedidas, nFilasDisponibles);
  const nCols = Math.min(nColsPedidas, nColsDisponibles);

  const resultados: ResultadoCeldaPegado[] = [];

  for (let r = 0; r < nFilas; r++) {
    const fila = filasVisibles[indiceFilaAncla + r];
    for (let c = 0; c < nCols; c++) {
      const columna = ORDEN_COLUMNAS[colIdxAncla + c];
      const texto = matriz[r]?.[c] ?? "";
      if (!COLUMNAS_EDITABLES.has(columna)) continue; // columnas de solo lectura: ni se cuentan

      const valorAnterior = obtenerCantidadActual(fila.codigo);

      if (!columnaAplicaAlNivel(columna, fila.nivel)) {
        resultados.push({
          codigo: fila.codigo,
          columna: columna as ColumnaEditable,
          estado: "no_editable",
          valorAnterior,
          valorNuevo: null,
          motivo: "columna_no_editable_en_este_nivel",
        });
        continue;
      }

      const parsed = parsearNumeroColombiano(texto);
      if (parsed === null) {
        resultados.push({
          codigo: fila.codigo,
          columna,
          estado: "valor_invalido",
          valorAnterior,
          valorNuevo: null,
          motivo: "no_numerico",
        });
        continue;
      }
      if (comparar(parsed, d(0)) < 0) {
        resultados.push({
          codigo: fila.codigo,
          columna,
          estado: "valor_invalido",
          valorAnterior,
          valorNuevo: null,
          motivo: "negativo",
        });
        continue;
      }

      // Repeticiones nunca en cero (anula la rama en silencio) — igual que la edición manual.
      const valorNuevo = columna === "repeticiones" && esCero(parsed) ? d(1) : parsed;
      const estado: EstadoCeldaPegado = comparar(valorNuevo, valorAnterior) === 0 ? "sin_cambio" : "aplicable";
      resultados.push({ codigo: fila.codigo, columna, estado, valorAnterior, valorNuevo });
    }
  }

  return {
    resultados,
    filasRecortadas: Math.max(0, nFilasPedidas - nFilas),
    columnasRecortadas: Math.max(0, nColsPedidas - nCols),
  };
}
