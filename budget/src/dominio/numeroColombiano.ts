import type { Decimal } from "./decimal";

/**
 * Convierte un número escrito por teclado o pegado desde Excel en formato
 * colombiano ("1.234.567,89") — o en formato en-US si así viene el Excel de
 * origen — a un string decimal (punto decimal, sin separador de miles).
 * Nunca devuelve `number`: el resultado se pasa directo a `d()`.
 *
 * Devuelve `null` si el texto no es un número reconocible (la celda de
 * destino conserva su valor anterior).
 */
export function parsearNumeroColombiano(textoCrudo: string): Decimal | null {
  let s = textoCrudo.trim();
  if (s === "") return null;

  // símbolos de moneda y espacios (normales y NBSP)
  s = s.replace(/[$\s ]/g, "");
  if (s === "") return null;

  const tieneComa = s.includes(",");
  const tienePunto = s.includes(".");

  if (tieneComa && tienePunto) {
    // gana el separador que aparece más a la derecha (es el decimal)
    const ultimaComa = s.lastIndexOf(",");
    const ultimoPunto = s.lastIndexOf(".");
    s = ultimaComa > ultimoPunto ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (tieneComa) {
    // una sola coma: decimal (es-CO). Varias comas: miles sin decimal (raro, se descarta igual abajo si no matchea).
    s = s.replace(",", ".");
  }
  // con dos o más puntos: si el último grupo tiene 3 dígitos, son todos
  // separadores de miles (p. ej. "1.234.567"); si no, el último es el decimal
  // (p. ej. "1.234.56"). Con un solo punto se asume decimal (es-CO): "1.007"
  // como cantidad real de esta obra significa 1,007 m³, no mil siete.
  if (!tieneComa && tienePunto) {
    const partes = s.split(".");
    if (partes.length > 2) {
      const ultima = partes[partes.length - 1];
      if (ultima.length === 3) {
        s = partes.join("");
      } else {
        const decimales = partes.pop()!;
        s = partes.join("") + "." + decimales;
      }
    }
  }

  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return s as Decimal;
}
