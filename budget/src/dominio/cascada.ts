/**
 * Recálculo en cascada — puerto acotado de `Obra.recalcular()` en
 * presupuesto_core.py. NO es el motor completo (explosión, validación,
 * repricing quedan para la Fase 1); es solo la cascada N10 -> N8 -> N5 -> N4
 * que necesita el repositorio simulado para que `guardarCambios` devuelva
 * totales reales en vez de un eco. Cubierto por __tests__/cascada.test.ts
 * contra el fixture dorado de BAIKAL.
 *
 *   VU(N10) = Σ(rendimiento_i × precio_i)     sobre sus insumos
 *   VT(N10) = cantidad(N10) × VU(N10)
 *   VU(N8)  = Σ(VT de sus hijos N10)           VT(N8) = cantidad(N8) × VU(N8)  <- multiplicador
 *   VU(N5)  = Σ(VT hijos N8)                   VT(N5) = cantidad(N5) × VU(N5)
 *   VU(N4)  = Σ(VT hijos N5)                   VT(N4) = cantidad(N4) × VU(N4)
 *   TOTAL   = Σ VT(N4)
 */
import { CERO, d, dividir, esCero, multiplicar, redondear, sumar, type Decimal } from "./decimal";
import { padreDe } from "./codigo";
import type { LineaPresupuesto } from "./tipos";

export function recalcularCascada(lineasEntrada: LineaPresupuesto[]): {
  lineas: LineaPresupuesto[];
  total: Decimal;
} {
  const porCodigo = new Map(lineasEntrada.map((l) => [l.codigo, { ...l }]));
  const hijosDe = new Map<string, string[]>();
  for (const l of lineasEntrada) {
    const p = padreDe(l.codigo);
    if (p && porCodigo.has(p)) {
      hijosDe.set(p, [...(hijosDe.get(p) ?? []), l.codigo]);
    }
  }

  // N10: VU = suma de insumos (rendimiento * precio). SIN redondear: el
  // redondeo intermedio es justo lo que "redondear solo al presentar" prohíbe
  // — con 130 N8 y 67 N5 en cascada, el error se nota en el total.
  for (const l of porCodigo.values()) {
    if (l.nivel !== 10) continue;
    const vu = sumar(...(l.insumos ?? []).map((i) => multiplicar(i.rendimiento, i.precio)));
    l.valorUnitario = vu;
    l.valorTotal = multiplicar(l.cantidad, vu);
  }

  // cascada 8 -> 5 -> 4. La cantidad del padre MULTIPLICA.
  for (const nivel of [8, 5, 4] as const) {
    for (const l of porCodigo.values()) {
      if (l.nivel !== nivel) continue;
      const hijos = hijosDe.get(l.codigo) ?? [];
      const vu = sumar(...hijos.map((h) => porCodigo.get(h)?.valorTotal ?? CERO));
      l.valorUnitario = vu;
      l.valorTotal = multiplicar(l.cantidad, vu);
    }
  }

  const total = sumar(...[...porCodigo.values()].filter((l) => l.nivel === 4).map((l) => l.valorTotal));

  const lineas = [...porCodigo.values()].map((l) => ({
    ...l,
    incidenciaPct: esCero(total) ? d(0) : redondear(multiplicar(dividir(l.valorTotal, total), d(100)), 4),
  }));

  return { lineas, total };
}

/**
 * Recálculo optimista de rama, para el cliente. A propósito NO recalcula
 * VU(N10) desde insumos: el árbol del navegador nunca carga los insumos
 * (viajan solo cuando se abre el panel APU de esa línea, ver
 * `obtenerApu()`), así que reusar `recalcularCascada` aquí pondría VU(N10)
 * en cero para toda la obra apenas hubiera un cambio — bug real, detectado
 * al probar la edición. Aquí VU(N10) se toma tal cual llega (el precio no
 * cambió, solo la cantidad), y solo se recalcula VT(N10) y la cascada
 * 8→5→4 hacia arriba — exactamente lo que el plan describe como "recálculo
 * optimista de rama", no el motor completo.
 */
export function recalcularCascadaOptimista(lineasEntrada: LineaPresupuesto[]): {
  lineas: LineaPresupuesto[];
  total: Decimal;
} {
  const porCodigo = new Map(lineasEntrada.map((l) => [l.codigo, { ...l }]));
  const hijosDe = new Map<string, string[]>();
  for (const l of lineasEntrada) {
    const p = padreDe(l.codigo);
    if (p && porCodigo.has(p)) {
      hijosDe.set(p, [...(hijosDe.get(p) ?? []), l.codigo]);
    }
  }

  for (const l of porCodigo.values()) {
    if (l.nivel !== 10) continue;
    l.valorTotal = multiplicar(l.cantidad, l.valorUnitario);
  }

  for (const nivel of [8, 5, 4] as const) {
    for (const l of porCodigo.values()) {
      if (l.nivel !== nivel) continue;
      const hijos = hijosDe.get(l.codigo) ?? [];
      const vu = sumar(...hijos.map((h) => porCodigo.get(h)?.valorTotal ?? CERO));
      l.valorUnitario = vu;
      l.valorTotal = multiplicar(l.cantidad, vu);
    }
  }

  const total = sumar(...[...porCodigo.values()].filter((l) => l.nivel === 4).map((l) => l.valorTotal));

  const lineas = [...porCodigo.values()].map((l) => ({
    ...l,
    incidenciaPct: esCero(total) ? d(0) : redondear(multiplicar(dividir(l.valorTotal, total), d(100)), 4),
  }));

  return { lineas, total };
}
