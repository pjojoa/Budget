import Big from "big.js";

/**
 * Todo importe y cantidad del dominio viaja como string decimal, nunca como
 * `number`. Un presupuesto de $28.000 millones acumula centavos rápido si se
 * usa float; y PostgREST/JSON.parse convierten `numeric` en float64 apenas
 * cruza una frontera de red. Esta marca de tipo hace que pasar un `number`
 * donde se espera un importe sea un error de compilación, no uno de redondeo
 * descubierto en producción.
 */
export type Decimal = string & { readonly __decimal: unique symbol };

Big.DP = 20;
Big.RM = Big.roundHalfUp;

function comoBig(valor: Decimal | number | string): Big {
  return new Big(valor);
}

/** Construye un Decimal validando que el valor de entrada es numérico. */
export function d(valor: string | number): Decimal {
  return new Big(valor).toString() as Decimal;
}

export const CERO = d(0);
export const UNO = d(1);

export function sumar(...valores: Decimal[]): Decimal {
  return valores.reduce((acc, v) => acc.plus(comoBig(v)), new Big(0)).toString() as Decimal;
}

export function restar(a: Decimal, b: Decimal): Decimal {
  return comoBig(a).minus(comoBig(b)).toString() as Decimal;
}

export function multiplicar(a: Decimal, b: Decimal): Decimal {
  return comoBig(a).times(comoBig(b)).toString() as Decimal;
}

export function dividir(a: Decimal, b: Decimal): Decimal {
  if (esCero(b)) return CERO;
  return comoBig(a).div(comoBig(b)).toString() as Decimal;
}

export function comparar(a: Decimal, b: Decimal): -1 | 0 | 1 {
  return comoBig(a).cmp(comoBig(b)) as -1 | 0 | 1;
}

export function esCero(valor: Decimal): boolean {
  return comoBig(valor).eq(0);
}

export function esMayorQue(a: Decimal, b: Decimal): boolean {
  return comoBig(a).gt(comoBig(b));
}

export function esMenorQue(a: Decimal, b: Decimal): boolean {
  return comoBig(a).lt(comoBig(b));
}

export function redondear(valor: Decimal, decimales: number): Decimal {
  return comoBig(valor).round(decimales, Big.roundHalfUp).toString() as Decimal;
}

/** `1234567.89` -> `1.234.567,89` (es-CO). Solo se redondea aquí, al presentar. */
export function formatearCOP(valor: Decimal | null, decimales: 0 | 2 = 0): string {
  if (valor === null) return "—";
  const numero = Number(redondear(valor, decimales));
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(numero);
}

/** Formatea un decimal sin agrupar miles, para rendimientos (6 decimales). */
export function formatearRendimiento(valor: Decimal, decimales = 6): string {
  const numero = Number(redondear(valor, decimales));
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  }).format(numero);
}

export function porcentaje(parte: Decimal, total: Decimal, decimales = 2): string {
  if (esCero(total)) return "0";
  const pct = comoBig(parte).div(comoBig(total)).times(100);
  return pct.round(decimales, Big.roundHalfUp).toString();
}
