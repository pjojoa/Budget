/**
 * Parser de TSV tal como lo produce Excel al copiar un rango de celdas.
 * Excel entrecomilla cualquier celda que contenga un tabulador o un salto de
 * línea, y escapa las comillas internas como `""` — un split ingenuo por
 * `\t`/`\n` corrompe descripciones que traigan cualquiera de los dos.
 */
export function parsearTsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let dentroComillas = false;
  let i = 0;
  const n = texto.length;

  while (i < n) {
    const c = texto[i];
    if (dentroComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i += 2;
          continue;
        }
        dentroComillas = false;
        i++;
        continue;
      }
      celda += c;
      i++;
      continue;
    }
    if (c === '"' && celda === "") {
      dentroComillas = true;
      i++;
      continue;
    }
    if (c === "\t") {
      fila.push(celda);
      celda = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
      i++;
      continue;
    }
    celda += c;
    i++;
  }
  fila.push(celda);
  filas.push(fila);

  // Excel deja un salto de línea final -> una última fila de una sola celda vacía.
  if (filas.length > 1) {
    const ultima = filas[filas.length - 1];
    if (ultima.length === 1 && ultima[0] === "") filas.pop();
  }

  return filas;
}
