import { describe, expect, it } from "vitest";
import { evaluarPegado, type FilaVisible } from "../evaluarPegado";
import { d } from "@/dominio/decimal";

// Simula el orden visual real: N4 -> N5 -> N8 -> N10 -> N10 -> N8...
const FILAS: FilaVisible[] = [
  { codigo: "01000000", nivel: 4 },
  { codigo: "01001000", nivel: 5 },
  { codigo: "01001001", nivel: 8 },
  { codigo: "01001001.1001", nivel: 10 },
  { codigo: "01001001.1002", nivel: 10 },
  { codigo: "02000000", nivel: 4 },
];

function cantidadActual(codigo: string) {
  const valores: Record<string, string> = {
    "01001001.1001": "100",
    "01001001.1002": "220",
    "01001001": "1",
  };
  return d(valores[codigo] ?? "0");
}

describe("evaluarPegado", () => {
  it("pega una sola columna de cantidades sobre varias filas N10 consecutivas", () => {
    const { resultados, filasRecortadas, columnasRecortadas } = evaluarPegado({
      matriz: [["150"], ["300"]],
      filasVisibles: FILAS,
      indiceFilaAncla: 3, // 01001001.1001
      columnaAncla: "cantidad",
      obtenerCantidadActual: cantidadActual,
    });
    expect(filasRecortadas).toBe(0);
    expect(columnasRecortadas).toBe(0);
    expect(resultados).toEqual([
      { codigo: "01001001.1001", columna: "cantidad", estado: "aplicable", valorAnterior: d("100"), valorNuevo: d("150") },
      { codigo: "01001001.1002", columna: "cantidad", estado: "aplicable", valorAnterior: d("220"), valorNuevo: d("300") },
    ]);
  });

  it("una columna de cantidades que atraviesa una cabecera de capítulo marca esa celda no_editable, no la convierte en multiplicador", () => {
    const { resultados } = evaluarPegado({
      matriz: [["100"], ["200"], ["300"]], // 01001001.1002 (N10), luego 02000000 (N4, no aplica 'cantidad')
      filasVisibles: FILAS,
      indiceFilaAncla: 4,
      columnaAncla: "cantidad",
      obtenerCantidadActual: cantidadActual,
    });
    expect(resultados[0].estado).toBe("aplicable");
    expect(resultados[1].estado).toBe("no_editable");
    expect(resultados[1].motivo).toBe("columna_no_editable_en_este_nivel");
  });

  it("recorta al final de las filas visibles y reporta cuánto se recortó", () => {
    const { resultados, filasRecortadas } = evaluarPegado({
      matriz: [["10"], ["20"], ["30"]],
      filasVisibles: FILAS,
      indiceFilaAncla: 4, // solo quedan 2 filas desde aquí (índices 4 y 5)
      columnaAncla: "cantidad",
      obtenerCantidadActual: cantidadActual,
    });
    expect(resultados.length).toBe(2);
    expect(filasRecortadas).toBe(1);
  });

  it("un valor no numérico se marca valor_invalido y conserva el anterior", () => {
    const { resultados } = evaluarPegado({
      matriz: [["abc"]],
      filasVisibles: FILAS,
      indiceFilaAncla: 3,
      columnaAncla: "cantidad",
      obtenerCantidadActual: cantidadActual,
    });
    expect(resultados[0]).toMatchObject({ estado: "valor_invalido", motivo: "no_numerico", valorNuevo: null });
  });

  it("pegar 0 en repeticiones lo sustituye por 1 (nunca anula la rama en silencio)", () => {
    const { resultados } = evaluarPegado({
      matriz: [["0"]],
      filasVisibles: FILAS,
      indiceFilaAncla: 0, // 01000000, nivel 4 — cantidad actual mockeada en 0
      columnaAncla: "repeticiones",
      obtenerCantidadActual: cantidadActual,
    });
    expect(resultados[0]).toMatchObject({ estado: "aplicable", valorNuevo: d("1") });
  });

  it("sin cambio real se marca sin_cambio", () => {
    const { resultados } = evaluarPegado({
      matriz: [["220"]],
      filasVisibles: FILAS,
      indiceFilaAncla: 4,
      columnaAncla: "cantidad",
      obtenerCantidadActual: cantidadActual,
    });
    expect(resultados[0].estado).toBe("sin_cambio");
  });
});
