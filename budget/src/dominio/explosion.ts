/**
 * Puerto acotado de `Obra.explosion_insumos()` en presupuesto_core.py.
 * Consolida todos los insumos de la obra con su cantidad total:
 *
 *   cantidad_total = rendimiento × cantidad(N10) × Π(cantidades de ancestros)
 *
 * Ordenado por importe descendente con % acumulado, para el corte de Pareto.
 * Cubierto contra el fixture dorado (446 insumos, 66 concentran el 80%).
 */
import { CERO, comparar, d, dividir, esCero, multiplicar, redondear, sumar, type Decimal } from "./decimal";
import { padreDe } from "./codigo";
import type { FilaExplosion, LineaPresupuesto } from "./tipos";

export function explosionDeInsumos(lineas: LineaPresupuesto[]): FilaExplosion[] {
  const porCodigo = new Map(lineas.map((l) => [l.codigo, l]));
  const total = sumar(...lineas.filter((l) => l.nivel === 4).map((l) => l.valorTotal));

  type Acumulador = {
    codigo: string;
    descripcion: string;
    unidad: string;
    tipo: FilaExplosion["tipo"];
    cantidad: Decimal;
    precio: Decimal;
    importe: Decimal;
    apariciones: number;
    preciosDistintos: Set<string>;
  };
  const acumulado = new Map<string, Acumulador>();

  for (const linea of lineas) {
    if (linea.nivel !== 10 || !linea.insumos || linea.insumos.length === 0) continue;

    let factor = linea.cantidad;
    let actual = padreDe(linea.codigo);
    while (actual) {
      const padre = porCodigo.get(actual);
      if (padre) factor = multiplicar(factor, padre.cantidad);
      actual = padreDe(actual);
    }

    for (const insumo of linea.insumos) {
      const cantidad = multiplicar(insumo.rendimiento, factor);
      const importe = multiplicar(cantidad, insumo.precio);
      const existente = acumulado.get(insumo.codigo);
      if (existente) {
        existente.cantidad = sumar(existente.cantidad, cantidad);
        existente.importe = sumar(existente.importe, importe);
        existente.apariciones += 1;
        existente.preciosDistintos.add(insumo.precio);
      } else {
        acumulado.set(insumo.codigo, {
          codigo: insumo.codigo,
          descripcion: insumo.descripcionObra,
          unidad: insumo.unidad,
          tipo: insumo.tipo,
          cantidad,
          precio: insumo.precio,
          importe,
          apariciones: 1,
          preciosDistintos: new Set([insumo.precio]),
        });
      }
    }
  }

  const filas: FilaExplosion[] = [...acumulado.values()].map((a) => ({
    codigo: a.codigo,
    descripcion: a.descripcion,
    unidad: a.unidad,
    tipo: a.tipo,
    cantidad: a.cantidad,
    precio: a.precio,
    importe: a.importe,
    incidenciaPct: esCero(total) ? d(0) : redondear(multiplicar(dividir(a.importe, total), d(100)), 4),
    acumuladoPct: d(0),
    apariciones: a.apariciones,
    preciosDistintos: [...a.preciosDistintos].sort((x, y) => comparar(x as Decimal, y as Decimal)),
  }));

  filas.sort((a, b) => comparar(b.importe, a.importe));

  let acumuladoImporte = CERO;
  for (const f of filas) {
    acumuladoImporte = sumar(acumuladoImporte, f.importe);
    f.acumuladoPct = esCero(total) ? d(0) : redondear(multiplicar(dividir(acumuladoImporte, total), d(100)), 4);
  }

  return filas;
}

/** Índice (0-based) de la primera fila cuyo acumulado alcanza el 80%. */
export function corteParetoIndice(filas: FilaExplosion[]): number {
  const idx = filas.findIndex((f) => Number(f.acumuladoPct) >= 80);
  return idx === -1 ? filas.length : idx + 1;
}
