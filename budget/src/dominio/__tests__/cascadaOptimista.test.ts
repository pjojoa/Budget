import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { recalcularCascadaOptimista } from "../cascada";
import { comparar, d, multiplicar } from "../decimal";
import type { Obra } from "../tipos";

const rutaFixture = path.resolve(import.meta.dirname, "..", "..", "..", "datos-mock", "obra-baikal-t3-v01.json");
const obra: Obra = JSON.parse(readFileSync(rutaFixture, "utf-8"));

/** Simula lo que realmente recibe el árbol del navegador: SIN insumos. */
const lineasSinInsumos = obra.lineas.map((l) => ({ ...l, insumos: undefined }));

describe("recalcularCascadaOptimista — con insumos ya despojados (como llegan al árbol del navegador)", () => {
  it("reproduce el total exacto cuando no hay cambios (regresión del bug real: VU(N10) no debe depender de insumos)", () => {
    const { total } = recalcularCascadaOptimista(lineasSinInsumos);
    // Los vu/vt de entrada YA vienen redondeados a 2 decimales (moneda, ver
    // scripts/prepararMock.ts); re-sumarlos en cascada puede diferir del
    // total "exacto" del fixture en unos pocos pesos por el redondeo
    // intermedio ya aplicado a la entrada — misma tolerancia del test dorado.
    expect(Math.abs(Number(total) - 28399232614.23)).toBeLessThan(50);
  });

  it("cambiar la cantidad de un N10 solo afecta su rama, no el resto del árbol", () => {
    const codigoObjetivo = "01001001.1002"; // PREL COMISION TOPOGRAFICA, cantidad original 220
    const original = lineasSinInsumos.find((l) => l.codigo === codigoObjetivo)!;
    const otraLinea = lineasSinInsumos.find((l) => l.codigo === "02001001.1002")!; // rama distinta

    const modificadas = lineasSinInsumos.map((l) => (l.codigo === codigoObjetivo ? { ...l, cantidad: d("500") } : l));
    const { lineas: recalculadas, total } = recalcularCascadaOptimista(modificadas);

    const nuevaLinea = recalculadas.find((l) => l.codigo === codigoObjetivo)!;
    const nuevaOtraLinea = recalculadas.find((l) => l.codigo === otraLinea.codigo)!;

    // VU no cambia (el precio no cambió); VT sí, proporcional a la nueva cantidad
    expect(comparar(nuevaLinea.valorUnitario, original.valorUnitario)).toBe(0);
    expect(comparar(nuevaLinea.valorTotal, multiplicar(d("500"), original.valorUnitario))).toBe(0);

    // una rama sin relación no debe cambiar
    expect(comparar(nuevaOtraLinea.valorTotal, otraLinea.valorTotal)).toBe(0);

    // el total cambió, pero sigue siendo un número real (no se fue a cero)
    expect(comparar(total, d("0"))).toBeGreaterThan(0);
    expect(comparar(total, obra.meta.total)).not.toBe(0);
  });
});
