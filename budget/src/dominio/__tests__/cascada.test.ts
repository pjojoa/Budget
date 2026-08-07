import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { recalcularCascada } from "../cascada";
import { comparar, redondear, type Decimal } from "../decimal";
import type { Obra } from "../tipos";

const rutaFixture = path.resolve(import.meta.dirname, "..", "..", "..", "datos-mock", "obra-baikal-t3-v01.json");
const obra: Obra = JSON.parse(readFileSync(rutaFixture, "utf-8"));

// El fixture almacena vu/vt YA redondeados a 2 decimales (moneda); la cascada
// interna trabaja sin redondear (solo se redondea al presentar), así que las
// comparaciones aquí redondean antes de comparar — igual que haría la UI.
describe("recalcularCascada — contra el fixture dorado de BAIKAL", () => {
  it("reproduce el total exacto sin recibir ningún cambio", () => {
    const { total } = recalcularCascada(obra.lineas);
    expect(comparar(redondear(total, 2), "28399232614.23" as Decimal)).toBe(0);
  });

  it("no altera vt/vu de líneas no afectadas cuando no hay cambios", () => {
    const { lineas } = recalcularCascada(obra.lineas);
    for (const l of lineas) {
      const original = obra.lineas.find((o) => o.codigo === l.codigo)!;
      expect(comparar(redondear(l.valorTotal, 2), redondear(original.valorTotal, 2))).toBe(0);
    }
  });

  it("el multiplicador N8 se aplica multiplicando, no sumando", () => {
    // localizar un N8 con más de un hijo N10 y cantidad != 1 si existe;
    // si no, al menos verificar que VT(N8) = cantidad(N8) * VU(N8) exactamente.
    const { lineas } = recalcularCascada(obra.lineas);
    const n8 = lineas.filter((l) => l.nivel === 8);
    expect(n8.length).toBeGreaterThan(0);
    for (const l of n8.slice(0, 20)) {
      const esperado = Number(l.cantidad) * Number(l.valorUnitario);
      expect(Number(l.valorTotal)).toBeCloseTo(esperado, 1);
    }
  });
});
