#!/usr/bin/env node
/**
 * El cobalto de foco (#4D8DF0 / var(--mv-foco) / var(--color-foco)) solo puede
 * aparecer en src/estilos/foco.css y dentro de src/componentes/arbol/.
 * Sin este control, en unos meses el cobalto termina siendo el color de los
 * botones primarios y la señal de "dónde estás" se pierde.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const RAIZ = join(import.meta.dirname, "..", "src");
const PERMITIDOS = [
  join(RAIZ, "estilos", "tema.css"), // define el token --mv-foco (fuente de verdad)
  join(RAIZ, "estilos", "foco.css"),
  join(RAIZ, "componentes", "arbol"),
];
const PATRON = /#4d8df0|--mv-foco|--color-foco/i;
const EXTENSIONES = new Set([".css", ".ts", ".tsx", ".js", ".jsx"]);

function estaPermitido(ruta) {
  return PERMITIDOS.some((p) => ruta === p || ruta.startsWith(p + "\\") || ruta.startsWith(p + "/"));
}

function recorrer(dir, hallazgos) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    const info = statSync(ruta);
    if (info.isDirectory()) {
      recorrer(ruta, hallazgos);
      continue;
    }
    if (!EXTENSIONES.has(extname(ruta))) continue;
    if (estaPermitido(ruta)) continue;
    const contenido = readFileSync(ruta, "utf-8");
    if (PATRON.test(contenido)) {
      hallazgos.push(relative(process.cwd(), ruta));
    }
  }
}

const hallazgos = [];
recorrer(RAIZ, hallazgos);

if (hallazgos.length > 0) {
  console.error("El cobalto de foco se filtró fuera de estilos/foco.css y componentes/arbol/:");
  for (const h of hallazgos) console.error(`  - ${h}`);
  process.exit(1);
}

console.log("verificar:color OK — el cobalto sigue reservado a foco y al árbol.");
