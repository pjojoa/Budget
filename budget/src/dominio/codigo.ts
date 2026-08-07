/**
 * Puerto TypeScript de la codificación de cuentas de `presupuesto_core.py`
 * (files/presupuesto-obra-skill/presupuesto-obra/scripts/presupuesto_core.py).
 *
 * La jerarquía del presupuesto se deriva ÍNTEGRAMENTE del código de cuenta —
 * no existe un campo "padre" editable. Esta es la TERCERA implementación de
 * estas reglas (Python / Deluge en references/zoho-creator.md / esta) y debe
 * mantenerse sincronizada al carácter con el oráculo. Cubierta por
 * __tests__/codigo.test.ts contra los códigos reales de BAIKAL.
 */

export type Nivel = 4 | 5 | 8 | 10;

export type Plantilla =
  | "EDIFICACION"
  | "URBANISMO_INTERNO"
  | "URBANISMO_EXTERNO"
  | "ESPECIAL";

const RE_N10 = /^(\d{8})\.(\d{4})$/;
const RE_N8 = /^(\d{2})(\d{3})(\d{3})$/;
export const RE_ART = /^((MO|TC|EQ) )?\d+$/;

const RANGOS_PLANTILLA: Array<[Plantilla, number, number]> = [
  ["EDIFICACION", 1, 21],
  ["URBANISMO_INTERNO", 22, 28],
  ["URBANISMO_EXTERNO", 29, 39],
];

/** '1001001' -> '01001001'; conserva el sufijo .SSSS y los prefijos MO/TC/EQ/MAT. */
export function normalizaCodigo(codigoCrudo: string | number): string {
  let s = String(codigoCrudo).trim().toUpperCase();
  if (s.endsWith(".0")) s = s.slice(0, -2);

  const conPrefijo = /^(MO|TC|EQ|MAT)\s*[-_ ]?\s*(.+)$/.exec(s);
  if (conPrefijo) {
    return `${conPrefijo[1]} ${conPrefijo[2].trim()}`;
  }
  if (s.includes(".")) {
    const [izq, der] = s.split(".", 2);
    return `${izq.padStart(8, "0")}.${der.padEnd(4, "0").slice(0, 4)}`;
  }
  if (/^\d+$/.test(s) && (s.length === 7 || s.length === 8)) {
    return s.padStart(8, "0");
  }
  return s;
}

/** Devuelve 4, 5, 8 o 10 según la forma del código de cuenta; null si no es una cuenta válida. */
export function nivelDe(codigo: string): Nivel | null {
  const c = normalizaCodigo(codigo);
  if (RE_N10.test(c)) return 10;
  const m = RE_N8.exec(c);
  if (!m) return null;
  const [, , sub, act] = m;
  if (sub === "000" && act === "000") return 4;
  if (act === "000") return 5;
  return 8;
}

/** Código del nivel inmediatamente superior; null si es raíz (N4) o inválido. */
export function padreDe(codigo: string): string | null {
  const c = normalizaCodigo(codigo);
  const n = nivelDe(c);
  if (n === 10) return c.split(".")[0];
  if (n === 8) return c.slice(0, 5) + "000";
  if (n === 5) return c.slice(0, 2) + "000000";
  return null;
}

/** Cadena completa de ancestros, del más cercano al más lejano. */
export function cadenaPadres(codigo: string): string[] {
  const out: string[] = [];
  let actual = padreDe(codigo);
  while (actual) {
    out.push(actual);
    actual = padreDe(actual);
  }
  return out;
}

/**
 * null cuando el capítulo no cae en ninguno de los tres rangos conocidos
 * (p. ej. 40+) — igual que el oráculo Python. Quien consuma esto y necesite
 * un valor por defecto debe sustituirlo explícitamente por "ESPECIAL", como
 * hace `migrar.py` al escribir el CSV de cuentas.
 */
export function plantillaDe(codigo: string): Plantilla | null {
  const c = normalizaCodigo(codigo);
  if (!/^\d{2}/.test(c)) return null;
  const cap = Number(c.slice(0, 2));
  for (const [nombre, desde, hasta] of RANGOS_PLANTILLA) {
    if (cap >= desde && cap <= hasta) return nombre;
  }
  return null;
}

/** Deriva el tipo de recurso del prefijo del código de insumo. */
export function tipoRecursoDe(codigoArticulo: string): "MAT" | "MO" | "EQ" | "TC" {
  const c = normalizaCodigo(codigoArticulo);
  for (const p of ["MO", "TC", "EQ"] as const) {
    if (c.startsWith(p + " ")) return p;
  }
  return "MAT";
}

/** 'MO 60133' -> '60133'; '152001' -> '152001'. Clave de búsqueda de precio. */
export function claveCatalogo(codigoArticulo: string): string {
  const c = normalizaCodigo(codigoArticulo);
  const idx = c.indexOf(" ");
  return idx === -1 ? c : c.slice(idx + 1).trim();
}
