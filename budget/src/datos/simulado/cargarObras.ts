import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Obra, FilaExplosion } from "@/dominio/tipos";
import type { Hallazgo } from "../tipos";

const RAIZ_MOCK = path.join(process.cwd(), "datos-mock");

function leerJson<T>(nombreArchivo: string): T {
  return JSON.parse(readFileSync(path.join(RAIZ_MOCK, nombreArchivo), "utf-8")) as T;
}

export interface ObraMock {
  id: string;
  obra: Obra;
  hallazgos: Hallazgo[];
}

let cache: ObraMock[] | null = null;

/**
 * Las dos obras reales (BAIKAL V01 aprobada, V02 repreciada a Bogotá en
 * borrador) son las únicas fuentes de datos de presupuesto del esqueleto —
 * ver scripts/oraculo/README.md sobre por qué no se inventan datos.
 */
export function cargarObras(): ObraMock[] {
  if (cache) return cache;

  const v01 = leerJson<Obra>("obra-baikal-t3-v01.json");
  const v02 = leerJson<Obra>("obra-baikal-t3-v02-bogota-2027.json");
  const hallazgosV01 = leerJson<Hallazgo[]>("hallazgos-baikal-t3-v01.json");

  cache = [
    { id: "baikal-t3-v01", obra: v01, hallazgos: hallazgosV01 },
    { id: "baikal-t3-v02-bogota-2027", obra: v02, hallazgos: [] },
  ];
  return cache;
}

export function cargarExplosionBaikal(): FilaExplosion[] {
  return leerJson<FilaExplosion[]>("explosion-baikal-t3-v01.json");
}

export function cargarObraSintetica(): Obra {
  return leerJson<Obra>("obra-sintetica-1500.json");
}
