import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { corteParetoIndice, explosionDeInsumos } from "../explosion";
import type { Obra } from "../tipos";

const rutaFixture = path.resolve(import.meta.dirname, "..", "..", "..", "datos-mock", "obra-baikal-t3-v01.json");
const obra: Obra = JSON.parse(readFileSync(rutaFixture, "utf-8"));

describe("explosionDeInsumos — contra el fixture dorado de BAIKAL", () => {
  const filas = explosionDeInsumos(obra.lineas);

  it("consolida exactamente 446 insumos distintos", () => {
    expect(filas.length).toBe(446);
  });

  it("el corte de Pareto (80%) cae en 66 insumos", () => {
    expect(corteParetoIndice(filas)).toBe(66);
  });

  it("queda ordenado por importe descendente", () => {
    for (let i = 1; i < filas.length; i++) {
      expect(Number(filas[i - 1].importe)).toBeGreaterThanOrEqual(Number(filas[i].importe));
    }
  });

  it("el top 1 es MO 71196 (EST PLACA H>12 PISOS)", () => {
    expect(filas[0].codigo).toBe("MO 71196");
  });
});
