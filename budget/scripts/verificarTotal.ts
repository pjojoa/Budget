#!/usr/bin/env tsx
/**
 * Criterio de verdad del esqueleto: si esto no imprime exactamente
 * 28399232614.23, algo se rompió en la conversión de datos mock y hay que
 * arreglarlo antes de seguir construyendo pantallas sobre él.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { comparar, redondear, sumar, type Decimal } from "../src/dominio/decimal";
import type { Obra } from "../src/dominio/tipos";

const ESPERADO = "28399232614.23" as Decimal;

const rutaObra = path.resolve(import.meta.dirname, "..", "datos-mock", "obra-baikal-t3-v01.json");
const obra: Obra = JSON.parse(readFileSync(rutaObra, "utf-8"));

// valorTotal se guarda a precisión completa (sin redondear — ver
// prepararMock.ts); se redondea aquí solo para comparar, igual que haría
// Moneda al presentar.
const totalDesdeLineas = redondear(
  sumar(...obra.lineas.filter((l) => l.nivel === 4).map((l) => l.valorTotal)),
  2,
);

console.log(`meta.total          : ${obra.meta.total}`);
console.log(`suma de N4 (recalc.): ${totalDesdeLineas}`);
console.log(`esperado            : ${ESPERADO}`);

if (comparar(obra.meta.total, ESPERADO) !== 0) {
  console.error(`\nFALLO: meta.total (${obra.meta.total}) != esperado (${ESPERADO})`);
  process.exit(1);
}
if (comparar(totalDesdeLineas, ESPERADO) !== 0) {
  console.error(`\nFALLO: la suma de los N4 (${totalDesdeLineas}) != esperado (${ESPERADO})`);
  process.exit(1);
}

const n = { 4: 0, 5: 0, 8: 0, 10: 0 } as Record<4 | 5 | 8 | 10, number>;
for (const l of obra.lineas) n[l.nivel]++;
const insumos = obra.lineas.reduce((acc, l) => acc + (l.insumos?.length ?? 0), 0);

if (n[4] !== 20 || n[5] !== 67 || n[8] !== 130 || n[10] !== 170 || insumos !== 733) {
  console.error(
    `\nFALLO: conteo de líneas no coincide. N4=${n[4]} N5=${n[5]} N8=${n[8]} N10=${n[10]} insumos=${insumos}`,
  );
  process.exit(1);
}

console.log(
  `\nOK — verificar:total pasa. N4=${n[4]} N5=${n[5]} N8=${n[8]} N10=${n[10]} insumos=${insumos}`,
);
